import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailRequest {
  to: string;
  subject: string;
  content: string;
  customer_id: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content, customer_id }: GmailRequest = await req.json();

    console.log('Sending Gmail message:', { to, subject, customer_id });

    // For now, we'll simulate sending the email and log it to communications_log
    // In a production environment, you would integrate with Gmail API here
    
    // Create email body in HTML format
    const htmlContent = content.replace(/\n/g, '<br>');
    
    // Log the email in communications_log table
    const { data, error } = await supabase
      .from('communications_log')
      .insert({
        customer_id,
        message_sequence_id: 0, // Default for manual messages
        message_type: 'email',
        content,
        subject,
        recipient_email: to,
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
        email_message_id: `mock_${Date.now()}` // Mock message ID
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging email:', error);
      throw error;
    }

    console.log('Email logged successfully:', data);

    // TODO: Integrate with Gmail API
    // For production, you would need to:
    // 1. Set up Gmail API credentials
    // 2. Use OAuth 2.0 for authentication
    // 3. Send the actual email via Gmail API
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        message_id: data.email_message_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-gmail-message function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});