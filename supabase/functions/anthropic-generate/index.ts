import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";
import { supabase } from "../_shared/supabase.ts";

// CORS headers required for web calls
const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Read Anthropic API key from Supabase Edge Function secrets
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Basic request/response typings
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GenerateRequest {
  messages?: ChatMessage[];
  prompt?: string; // convenience field for simple calls
  question?: string; // natural language question about DB
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
  // Files API integration
  file_ids?: string[]; // Anthropic File IDs to attach
  use_file_search?: boolean; // enable Claude file_search tool
  // File management actions
  action?: "generate" | "list_files";
  list_limit?: number;
  list_order?: "asc" | "desc";
  // DB integration flags
  use_db?: boolean;
  student_id?: number | string;
  student_email?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    if (!ANTHROPIC_API_KEY) {
      console.error("[anthropic-generate] Missing ANTHROPIC_API_KEY", { requestId });
      return new Response(
        JSON.stringify({ error: "Missing ANTHROPIC_API_KEY secret", requestId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed", requestId }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

const body: GenerateRequest = await req.json().catch(() => ({} as GenerateRequest));

// Handle Files API listing
if (body.action === "list_files") {
  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY! });
    const params: Record<string, any> = {};
    if (typeof body.list_limit === "number") params.limit = Math.max(1, Math.min(100, body.list_limit));
    if (body.list_order === "asc" || body.list_order === "desc") params.order = body.list_order;
    const list = await client.files.list(params as any);
    // Map to minimal safe structure
    const files = (list?.data ?? []).map((f: any) => ({
      id: f.id,
      filename: f.filename ?? f.name ?? f.id,
      bytes: f.bytes ?? f.size ?? null,
      created_at: f.created_at ?? null,
      purpose: f.purpose ?? null,
      type: f.type ?? f.mime_type ?? null,
    }));
    return new Response(JSON.stringify({ files, requestId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    const errText = e?.message ? String(e.message) : String(e);
    console.error("[anthropic-generate] list_files error", { requestId, status, error: errText });
    return new Response(
      JSON.stringify({ error: "Failed to list files", details: errText, requestId }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

    // Normalize inputs
    const model = body.model || "claude-sonnet-4-20250514"; // latest default
    const max_tokens = body.max_tokens ?? 1024;
    const temperature = body.temperature ?? 0.7;

    let system = body.system || "You are a concise, helpful assistant.";

    // Build messages array compatible with Anthropic Messages API
    let messages: { role: "user" | "assistant"; content: string }[] = [];

    if (body.messages && body.messages.length > 0) {
      for (const m of body.messages) {
        if (m.role === "system") {
          system = `${system}\n\n${m.content}`.trim();
          continue;
        }
        if (m.role === "user" || m.role === "assistant") {
          messages.push({ role: m.role, content: m.content });
        }
      }
    } else if (body.prompt) {
      messages = [{ role: "user", content: body.prompt }];
    }

    if (messages.length === 0) {
      console.error("[anthropic-generate] Invalid request: no messages or prompt", { requestId });
      return new Response(
        JSON.stringify({ error: "Provide messages[] or prompt", requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If requested, fetch database context and append it to the system prompt
    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
      const questionText = (body.question && String(body.question)) || lastUserMsg;
      const wantsDb = !!body.use_db || !!body.student_id || !!body.student_email;
      if (wantsDb) {
        const dbContext = await buildDbContext(questionText, body.student_id, body.student_email);
        if (dbContext) {
          system = `${system}\n\nYou have access to fresh studio data. Use the following database context to answer precisely.\n\n<database_context>\n${dbContext}\n</database_context>`;
        }
      }
    } catch (e) {
      console.warn("[anthropic-generate] DB context generation failed, continuing without it", { requestId, error: String(e) });
    }

    // Build candidate models: selected first, then fallbacks
    const candidates = Array.from(new Set([
      model,
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-5-haiku-20241022",
    ]));

    let data: any | undefined;
    let lastErrBody: string | undefined;
    let usedModel = model;
    const attemptsLog: Array<{ model: string; attempt: number; status?: number; error?: string }> = [];

    for (const candidate of candidates) {
      usedModel = candidate;
const attachments = Array.isArray(body.file_ids) && body.file_ids.length > 0
  ? body.file_ids.map((id) => ({ file_id: id, ...(body.use_file_search !== false ? { tools: [{ type: "file_search" }] } : {}) }))
  : undefined;

const tools = body.use_file_search ? [{ type: "file_search" }] : undefined;

const payload = {
  model: candidate,
  system,
  messages,
  max_tokens,
  temperature,
  ...(attachments ? { attachments } : {}),
  ...(tools ? { tools } : {}),
} as const;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          // Create SDK client per attempt to avoid global state and ensure fresh config
          const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY! });
          const res = await client.messages.create(payload as any);
          data = res as any;
          break;
        } catch (e: any) {
          const status = typeof e?.status === "number" ? e.status : undefined;
          const errText = e?.message ? String(e.message) : String(e);
          lastErrBody = errText;
          attemptsLog.push({ model: candidate, attempt, status, error: errText?.slice(0, 500) });
          console.warn("[anthropic-generate] SDK error", { requestId, attempt, model: candidate, status, error: errText });
          await new Promise((res) => setTimeout(res, 300 * attempt));
        }
      }

      if (data) break; // stop if success
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: "Anthropic API error",
          status: 502,
          details: lastErrBody || "No response",
          attempts: attemptsLog,
          requestId,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


// Extract plain text convenience field
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((c: any) => c?.type === "text")
          .map((c: any) => c?.text ?? "")
          .join("\n")
      : (typeof data?.content?.[0]?.text === "string" ? data.content[0].text : "");

const result = {
      model: data?.model ?? model,
      usage: data?.usage ?? null,
      stop_reason: data?.stop_reason ?? null,
      content: data?.content ?? null,
      text,
      used_files: Array.isArray(body.file_ids) ? body.file_ids : [],
      requestId,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[anthropic-generate] Uncaught error", { requestId, error });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function startOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function short(val: any): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {}
  return String(val);
}

async function buildDbContext(question: string, student_id?: number | string, student_email?: string): Promise<string> {
  const lines: string[] = [];

  // Normalize student_id
  let sid: number | undefined = undefined;
  if (typeof student_id === "number") sid = student_id;
  if (typeof student_id === "string") {
    const n = parseInt(student_id, 10);
    if (!isNaN(n)) sid = n;
  }

  // If scoped to a specific student, provide their profile summary
  if (sid || (student_email && student_email.includes("@"))) {
    const baseSel = "id,first_name,last_name,client_email,phone_number,status,last_seen,total_lifetime_value,intro_start_date,intro_end_date,tags";
    let student: any | null = null;
    if (sid) {
      const { data } = await supabase.from("customers").select(baseSel).eq("id", sid).maybeSingle();
      student = data;
    }
    if (!student && student_email) {
      const { data } = await supabase.from("customers").select(baseSel).eq("client_email", student_email).maybeSingle();
      student = data;
    }
    if (student) {
      const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("booking_date")
        .eq("customer_id", student.id)
        .gte("booking_date", daysAgoISO(30));
      const recentCount = (recentBookings || []).length;

      lines.push(`Student: ${fullName} <${student.client_email || ""}>`);
      lines.push(`Status: ${student.status || "unknown"}, Last seen: ${short(student.last_seen)}, LTV: ${student.total_lifetime_value ?? 0}`);
      lines.push(`Intro: ${short(student.intro_start_date)} → ${short(student.intro_end_date)}, Tags: ${(student.tags || "").toString()}`);
      lines.push(`Bookings last 30d: ${recentCount}`);
      return lines.join("\n");
    }
  }

  const q = (question || "").toLowerCase();

  // Handle common intents
  if (q.includes("top") && q.includes("customer") && (q.includes("month") || q.includes("this month"))) {
    const { data, error } = await supabase
      .from("customers")
      .select("first_name,last_name,client_email,total_lifetime_value,last_seen")
      .gte("last_seen", startOfMonthISO())
      .order("total_lifetime_value", { ascending: false })
      .limit(10);
    if (error) throw new Error(`top_customers_month query failed: ${error.message}`);
    lines.push("Top customers this month:");
    for (const c of data || []) {
      lines.push(`- ${`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()} (${c.client_email || ""}) • LTV ${c.total_lifetime_value ?? 0} • Last seen ${short(c.last_seen)}`);
    }
    return lines.join("\n");
  }

  if (q.includes("churn") || q.includes("inactive") || q.includes("at risk") || q.includes("risk")) {
    const cutoff = daysAgoISO(30);
    const { data, error } = await supabase
      .from("customers")
      .select("first_name,last_name,client_email,last_seen,total_lifetime_value,status")
      .lt("last_seen", cutoff)
      .order("last_seen", { ascending: true })
      .limit(20);
    if (error) throw new Error(`churn_risk query failed: ${error.message}`);
    lines.push("Potential churn risk (last seen > 30d and LTV < 200):");
    for (const c of (data || []).filter((x) => (x.total_lifetime_value ?? 0) < 200)) {
      lines.push(`- ${`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()} • ${c.client_email || ""} • Status ${c.status || ""} • Last seen ${short(c.last_seen)} • LTV ${c.total_lifetime_value ?? 0}`);
    }
    return lines.join("\n");
  }

  if (q.includes("attendance") || q.includes("class")) {
    const since = daysAgoISO(30);
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_date")
      .gte("booking_date", since);
    if (error) throw new Error(`attendance_trends query failed: ${error.message}`);
    const counts: Record<string, number> = {};
    for (const b of data || []) {
      const d = new Date(b.booking_date).toISOString().slice(0, 10);
      counts[d] = (counts[d] || 0) + 1;
    }
    const entries = Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : 1)).slice(0, 10);
    lines.push("Attendance (last 30 days, top 10 days):");
    for (const [date, count] of entries) lines.push(`- ${date}: ${count}`);
    return lines.join("\n");
  }

  // Fallback: basic KPIs
  const { count: totalCustomers } = await supabase.from("customers").select("id", { count: "exact", head: true });
  const { count: new7d } = await supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", daysAgoISO(7));
  const { count: introsActive } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .not("intro_start_date", "is", null)
    .gte("intro_end_date", todayDate());

  lines.push("Studio snapshot:");
  lines.push(`- Total customers: ${totalCustomers ?? 0}`);
  lines.push(`- New in last 7 days: ${new7d ?? 0}`);
  lines.push(`- Active intro offers: ${introsActive ?? 0}`);

  return lines.join("\n");
}
