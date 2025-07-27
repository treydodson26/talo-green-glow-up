import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, data, tableName } = await req.json();
    
    const webhookUrl = "https://treydodson26.app.n8n.cloud/webhook-test/3cf6de19-b9d9-4add-a085-56884822ea36";
    
    const payload = {
      eventType, // 'INSERT', 'UPDATE', 'DELETE'
      tableName,
      data,
      timestamp: new Date().toISOString(),
      source: 'crm-app'
    };

    console.log('Sending webhook to n8n:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log('Webhook sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending webhook:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});