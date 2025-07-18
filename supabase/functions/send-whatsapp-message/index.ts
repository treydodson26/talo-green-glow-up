import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  customer_id: number;
  message_content: string;
  message_type: string;
  sequence_day?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_id, message_content, message_type }: WhatsAppRequest = await req.json();

    console.log('Received WhatsApp message request:', {
      customer_id,
      message_content: message_content.substring(0, 100) + '...',
      message_type
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('first_name, last_name, phone_number')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${customerError?.message}`);
    }

    console.log('Found customer:', customer.first_name, customer.last_name);

    // Simulate WhatsApp API call (replace with actual WhatsApp Business API)
    console.log('Simulating WhatsApp message send...');
    const mockWhatsAppMessageId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the communication in the database
    const { data: logData, error: logError } = await supabase
      .from('communications_log')
      .insert([
        {
          customer_id,
          message_sequence_id: 1, // Default sequence ID
          content: message_content,
          message_type: 'whatsapp',
          recipient_phone: customer.phone_number,
          delivery_status: 'sent',
          whatsapp_message_id: mockWhatsAppMessageId,
          sent_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (logError) {
      console.error('Error logging communication:', logError);
      throw new Error(`Failed to log communication: ${logError.message}`);
    }

    console.log('WhatsApp message logged successfully:', logData);

    return new Response(JSON.stringify({
      success: true,
      message: `WhatsApp message sent to ${customer.first_name} ${customer.last_name}`,
      whatsapp_message_id: mockWhatsAppMessageId,
      log_id: logData.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-whatsapp-message function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);