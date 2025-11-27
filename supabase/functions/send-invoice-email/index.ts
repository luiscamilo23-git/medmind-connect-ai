import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { InvoiceNotificationEmail } from './_templates/invoice-notification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  webhookEventId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { webhookEventId }: SendEmailRequest = await req.json();

    if (!webhookEventId) {
      return new Response(
        JSON.stringify({ error: "webhookEventId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get webhook event
    const { data: webhookEvent, error: webhookError } = await supabaseClient
      .from('dian_webhook_events')
      .select('*')
      .eq('id', webhookEventId)
      .single();

    if (webhookError || !webhookEvent) {
      throw new Error('Webhook event not found');
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        patients(full_name, email)
      `)
      .eq('id', webhookEvent.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Check if patient has email
    if (!invoice.patients?.email) {
      console.log('Patient does not have email configured');
      return new Response(
        JSON.stringify({ message: 'Patient does not have email' }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine email status
    const isApproved = webhookEvent.event_type === 'approved' || 
                       webhookEvent.event_type === 'invoice.approved' ||
                       invoice.estado === 'VALIDADA';

    // Render email template
    const html = await renderAsync(
      React.createElement(InvoiceNotificationEmail, {
        patient_name: invoice.patients.full_name,
        invoice_number: invoice.numero_factura_dian || `INV-${invoice.id.slice(0, 8)}`,
        invoice_status: isApproved ? 'approved' : 'rejected',
        cufe: invoice.cufe,
        error_message: webhookEvent.error_message,
        total_amount: invoice.total,
        pdf_url: invoice.pdf_url,
        xml_url: invoice.xml_url,
      })
    );

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'MEDMIND Facturación <facturacion@resend.dev>',
      to: [invoice.patients.email],
      subject: isApproved 
        ? `✅ Factura ${invoice.numero_factura_dian || invoice.id.slice(0, 8)} Aprobada por DIAN`
        : `⚠️ Actualización Factura ${invoice.numero_factura_dian || invoice.id.slice(0, 8)}`,
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: emailData.id,
        message: 'Email sent successfully'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
