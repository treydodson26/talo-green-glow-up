import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlyerRequest {
  prompt: string;
  title: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, title }: FlyerRequest = await req.json();

    console.log('Calling n8n webhook with:', { prompt, title });

    const N8N_WEBHOOK_URL = "https://treydodson26.app.n8n.cloud/webhook/20bd4317-eabe-4e69-8932-0199a7e60418";
    
    console.log('Using webhook URL:', N8N_WEBHOOK_URL);

    // Call n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        title: title
      }),
    });

    if (!response.ok) {
      console.error('n8n webhook error:', response.status, response.statusText);
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    // Get the response from n8n (should be the Google Drive link)
    const result = await response.text();
    console.log('n8n webhook response:', result);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: result.trim(),
        message: 'Flyer generated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in n8n-flyer-generator function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate flyer',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});