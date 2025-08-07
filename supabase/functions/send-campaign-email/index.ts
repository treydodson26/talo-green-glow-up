import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { supabase as admin } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaign_id: string;
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey || "");

async function getCampaign(campaign_id: string) {
  const { data, error } = await admin
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("campaign_not_found");
  return data as {
    id: string;
    name: string;
    type: string;
    status: string;
    subject: string | null;
    content: string | null;
    audience_type: string;
    scheduled_for: string | null;
  };
}

async function getRecipients(audience_type: string) {
  let query = admin
    .from("customers")
    .select("id, client_email")
    .not("client_email", "is", null)
    .neq("client_email", "")
    .eq("marketing_email_opt_in", true)
    .limit(100);

  switch (audience_type) {
    case "prospects":
      query = query.eq("status", "prospect");
      break;
    case "intro":
      query = query.eq("status", "intro_trial");
      break;
    case "active":
      query = query.eq("status", "active");
      break;
    case "inactive":
      query = query.eq("status", "inactive");
      break;
    default:
      // 'all' already covered by base query
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as { id: number; client_email: string }[];
}

function wrapHtml(subject: string, body: string) {
  const safeSubject = subject || "Talo Yoga Campaign";
  const safeBody = body || "";
  return `<!doctype html><html><head><meta charset=\"utf-8\"><title>${safeSubject}</title></head><body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height:1.6; color:#333;\"><div style=\"max-width: 640px; margin: 24px auto; padding: 16px;\"><h2 style=\"margin-top: 0;\">${safeSubject}</h2><div>${safeBody.replace(/\n/g, '<br/>')}</div><hr style=\"margin:24px 0; border:none; border-top:1px solid #eee;\"/><p style=\"font-size:12px; color:#888;\">Sent via Talo Yoga Marketing Hub</p></div></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    throw new Error("missing_resend_api_key");
  }
  const resp = await resend.emails.send({
    from: "Talo Yoga <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  } as any);
  return resp;
}

async function logCommunication(
  entries: Array<{
    customer_id: number;
    subject: string;
    content: string;
    recipient_email: string;
    delivery_status: string;
    email_message_id?: string | null;
    error_message?: string | null;
  }>
) {
  if (!entries.length) return;
  const { error } = await admin.from("communications_log").insert(
    entries.map((e) => ({
      customer_id: e.customer_id,
      message_sequence_id: 0,
      message_type: "email",
      subject: e.subject,
      content: e.content,
      recipient_email: e.recipient_email,
      delivery_status: e.delivery_status,
      email_message_id: e.email_message_id ?? null,
      error_message: e.error_message ?? null,
      sent_at: new Date().toISOString(),
    }))
  );
  if (error) throw error;
}

async function logEmailTracking(
  entries: Array<{
    customer_id: number;
    subject: string;
    content: string;
  }>
) {
  if (!entries.length) return;
  const { error } = await admin.from("email_tracking").insert(
    entries.map((e) => ({
      customer_id: e.customer_id,
      template_type: "campaign",
      email_subject: e.subject,
      email_content: e.content,
      sent_at: new Date().toISOString(),
    }))
  );
  if (error) throw error;
}

async function markCampaignCompleted(campaign_id: string, sentCount: number) {
  const { error } = await admin
    .from("campaigns")
    .update({ status: "completed", sent_count: sentCount, updated_at: new Date().toISOString() })
    .eq("id", campaign_id);
  if (error) throw error;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id } = (await req.json()) as SendCampaignRequest;
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "missing_campaign_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const campaign = await getCampaign(campaign_id);
    const subject = campaign.subject || campaign.name || "Talo Yoga Campaign";
    const html = wrapHtml(subject, campaign.content || "");

    const recipients = await getRecipients(campaign.audience_type || "all");
    if (!recipients.length) {
      return new Response(JSON.stringify({ success: false, error: "no_recipients_found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const successes: Array<{ customer_id: number; recipient_email: string; message_id?: string }>= [];
    const failures: Array<{ customer_id: number; recipient_email: string; error: string }>= [];

    for (const r of recipients) {
      try {
        const res = await sendEmail(r.client_email, subject, html);
        const messageId = (res as any)?.data?.id ?? null;
        successes.push({ customer_id: r.id, recipient_email: r.client_email, message_id: messageId || undefined });
      } catch (e: any) {
        failures.push({ customer_id: r.id, recipient_email: r.client_email, error: e?.message || "send_failed" });
      }
    }

    // Log communications
    await logCommunication(
      successes.map((s) => ({
        customer_id: s.customer_id,
        subject,
        content: campaign.content || "",
        recipient_email: s.recipient_email,
        delivery_status: "sent",
        email_message_id: s.message_id || null,
      }))
    );
    await logCommunication(
      failures.map((f) => ({
        customer_id: f.customer_id,
        subject,
        content: campaign.content || "",
        recipient_email: f.recipient_email,
        delivery_status: "failed",
        error_message: f.error,
      }))
    );

    // Tracking
    await logEmailTracking(
      successes.map((s) => ({ customer_id: s.customer_id, subject, content: campaign.content || "" }))
    );

    // Mark campaign completed
    await markCampaignCompleted(campaign.id, successes.length);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successes.length,
        failed: failures.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-campaign-email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "unknown_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});