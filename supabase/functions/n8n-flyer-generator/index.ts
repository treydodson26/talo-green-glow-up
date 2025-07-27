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

    const N8N_WEBHOOK_URL = "https://treydodson26.app.n8n.cloud/webhook-test/3cf6de19-b9d9-4add-a085-56884822ea36";
    
    console.log('Using webhook URL:', N8N_WEBHOOK_URL);

    // Call n8n webhook with detailed logging
    console.log('Sending payload:', JSON.stringify({ prompt, title }, null, 2));
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify({
        prompt: prompt,
        title: title
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error response:', errorText);
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Get the response from n8n (should be the Google Drive link)
    const result = await response.text();
    console.log('n8n webhook success response:', result);

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