import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIQueryRequest {
  question?: string;
  action?:
    | "top_customers_month"
    | "attendance_trends"
    | "revenue_summary"
    | "churn_risk";
}

interface TableResult {
  type: "table";
  title: string;
  columns: string[];
  rows: any[][];
}

interface TextResult {
  type: "text";
  title: string;
  text: string;
}

type AIQueryResponse = TableResult | TextResult;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed", requestId }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AIQueryRequest = await req.json().catch(() => ({}));
    const question = (body.question || "").toLowerCase();

    // Simple intent detection if action not provided
    const action = body.action ||
      (question.includes("top") && question.includes("customer")
        ? "top_customers_month"
        : question.includes("attendance") || question.includes("class")
        ? "attendance_trends"
        : question.includes("revenue") || question.includes("income")
        ? "revenue_summary"
        : question.includes("churn") || question.includes("inactive") || question.includes("at risk")
        ? "churn_risk"
        : undefined);

    if (!action) {
      const hint: TextResult = {
        type: "text",
        title: "I need a bit more detail",
        text: "Try one of these: 'Show top customers this month', 'Class attendance trends', 'Revenue summary', or 'Customers at risk of churning'.",
      };
      return new Response(JSON.stringify(hint), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: AIQueryResponse | null = null;

    if (action === "top_customers_month") {
      // Customers active this month by last_seen, ordered by total_lifetime_value
      const { data, error } = await supabase
        .from("customers")
        .select("first_name,last_name,client_email,total_lifetime_value,last_seen")
        .gte("last_seen", startOfMonthISO())
        .order("total_lifetime_value", { ascending: false })
        .limit(10);

      if (error) throw new Error(`top_customers_month query failed: ${error.message}`);

      result = {
        type: "table",
        title: "Top customers this month",
        columns: ["Name", "Email", "Last Seen", "Lifetime Value"],
        rows: (data || []).map((c) => [
          `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
          c.client_email ?? "",
          c.last_seen ?? "",
          c.total_lifetime_value ?? 0,
        ]),
      };
    }

    if (action === "attendance_trends") {
      // Basic 30-day bookings count by date
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
      const rows = Object.entries(counts)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => [date, count]);

      result = {
        type: "table",
        title: "Class attendance (last 30 days)",
        columns: ["Date", "Bookings"],
        rows,
      };
    }

    if (action === "revenue_summary") {
      // Use dashboard_metrics if available
      const { data, error } = await supabase
        .from("dashboard_metrics")
        .select("revenue_this_month,revenue_last_month,bookings_this_week,new_leads_week")
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`revenue_summary query failed: ${error.message}`);

      result = data
        ? {
            type: "table",
            title: "Revenue summary",
            columns: ["Metric", "Value"],
            rows: [
              ["Revenue this month", data.revenue_this_month ?? 0],
              ["Revenue last month", data.revenue_last_month ?? 0],
              ["Bookings this week", data.bookings_this_week ?? 0],
              ["New leads this week", data.new_leads_week ?? 0],
            ],
          }
        : { type: "text", title: "Revenue summary", text: "No revenue metrics available." };
    }

    if (action === "churn_risk") {
      // At risk: last_seen > 30 days ago and total_lifetime_value < 200 (arbitrary heuristic)
      const cutoff = daysAgoISO(30);
      const { data, error } = await supabase
        .from("customers")
        .select("first_name,last_name,client_email,last_seen,total_lifetime_value,status")
        .lt("last_seen", cutoff)
        .order("last_seen", { ascending: true })
        .limit(20);

      if (error) throw new Error(`churn_risk query failed: ${error.message}`);

      const rows = (data || [])
        .filter((c) => (c.total_lifetime_value ?? 0) < 200)
        .map((c) => [
          `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
          c.client_email ?? "",
          c.status ?? "",
          c.last_seen ?? "",
          c.total_lifetime_value ?? 0,
        ]);

      result = {
        type: "table",
        title: "Customers at risk of churning",
        columns: ["Name", "Email", "Status", "Last Seen", "Lifetime Value"],
        rows,
      };
    }

    if (!result) {
      result = {
        type: "text",
        title: "No results",
        text: "I couldn't match your question to a known report. Try a quick action on the left.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ai-query] Uncaught error", { requestId, error });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", requestId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
