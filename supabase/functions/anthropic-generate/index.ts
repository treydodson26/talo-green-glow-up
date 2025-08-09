import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

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
