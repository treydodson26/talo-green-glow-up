import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Normalize inputs
    const model = body.model || "claude-3-5-sonnet-20240620"; // stable default
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

    const payload = {
      model,
      system,
      messages,
      max_tokens,
      temperature,
    } as const;

    console.log("[anthropic-generate] Request", { requestId, model, max_tokens, temperature });

    let resp: Response | undefined;
    let lastErrBody: string | undefined;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          resp = r;
          break;
        }
        lastErrBody = await r.text().catch(() => "");
        console.warn("[anthropic-generate] Non-200 from Anthropic", { requestId, status: r.status, attempt, body: lastErrBody });
        await new Promise((res) => setTimeout(res, 300 * attempt));
      } catch (e) {
        console.warn("[anthropic-generate] Network error to Anthropic", { requestId, attempt, error: String(e) });
        await new Promise((res) => setTimeout(res, 300 * attempt));
      }
    }

    if (!resp) {
      return new Response(
        JSON.stringify({
          error: "Anthropic API error",
          status: 502,
          details: lastErrBody || "No response",
          requestId,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[anthropic-generate] Upstream error", { requestId, status: resp.status, body: errText });
      return new Response(
        JSON.stringify({
          error: "Anthropic API error",
          status: resp.status,
          details: safeParse(errText),
          requestId,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();

    // Extract plain text convenience field
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((c: any) => c?.type === "text")
          .map((c: any) => c?.text ?? "")
          .join("\n")
      : "";

    const result = {
      model: data?.model ?? model,
      usage: data?.usage ?? null,
      stop_reason: data?.stop_reason ?? null,
      content: data?.content ?? null,
      text,
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
