import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    console.log('OpenAI API Key present:', !!openAIApiKey);
    console.log('OpenAI API Key length:', openAIApiKey?.length || 0);

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is missing');
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
        size: '1024x1536',
        quality: 'high',
        response_format: 'b64_json'
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
    console.log('Response structure:', JSON.stringify(data, null, 2));

    // Check if we have data array
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response structure from OpenAI');
    }

    const imageData = data.data[0];
    console.log('Image data keys:', Object.keys(imageData));
    
    // Handle both b64_json and url response formats
    let base64Image;
    if (imageData.b64_json) {
      base64Image = imageData.b64_json;
    } else if (imageData.url) {
      // If we get a URL, we need to fetch it and convert to base64
      console.log('Received URL, fetching image...');
      const imageResponse = await fetch(imageData.url);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      base64Image = btoa(String.fromCharCode.apply(null, uint8Array));
    } else {
      console.error('No image data found in response:', imageData);
      throw new Error('No image data received from OpenAI');
    }

    if (!base64Image) {
      throw new Error('Failed to get base64 image data');
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