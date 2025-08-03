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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Generating flyer with OpenAI:', { prompt, title });

    // Create a detailed prompt for flyer generation
    const flyerPrompt = `Create a professional marketing flyer with the title "${title}". ${prompt}. 
    Make it visually appealing with modern design, appropriate colors, and professional typography. 
    Include space for contact information and make it suitable for a yoga studio or wellness business.`;

    console.log('Sending request to OpenAI with prompt:', flyerPrompt);

    // Call OpenAI Image Generation API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: flyerPrompt,
        n: 1,
        size: '1024x1536', // Portrait orientation good for flyers
        quality: 'high',
        output_format: 'png'
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');

    // gpt-image-1 returns base64 data directly
    const imageData = data.data[0];
    const base64Image = imageData.b64_json;

    if (!base64Image) {
      throw new Error('No image data received from OpenAI');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageData: `data:image/png;base64,${base64Image}`,
        message: 'Flyer generated successfully with OpenAI'
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