import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  invoiceId: string;
  patientEmail: string;
  patientName: string;
  invoiceNumber: string;
  invoiceStatus: 'approved' | 'rejected';
  cufe?: string;
  errorMessage?: string;
  totalAmount: number;
  pdfUrl?: string;
  xmlUrl?: string;
  doctorName?: string;
  clinicName?: string;
}

const generateEmailHtml = (data: SendEmailRequest): string => {
  const isApproved = data.invoiceStatus === 'approved';
  const formattedAmount = data.totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 2 });
  
  if (isApproved) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #030712; padding: 24px 40px; text-align: center;">
              <h1 style="color: #14B8A6; font-size: 28px; margin: 0;">💚 MEDMIND</h1>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <h2 style="color: #1f2937; font-size: 22px; margin: 0;">✅ Factura Electrónica Aprobada</h2>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 16px 40px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0;">Hola ${data.patientName},</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 16px 40px;">
              <p style="color: #4b5563; font-size: 15px; line-height: 26px; margin: 0;">
                Nos complace informarte que tu factura electrónica ha sido <strong style="color: #14B8A6;">aprobada exitosamente</strong> por la DIAN (Dirección de Impuestos y Aduanas Nacionales de Colombia).
              </p>
            </td>
          </tr>
          
          <!-- Invoice Details Box -->
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" style="background-color: #f0fdfa; border: 1px solid #14B8A6; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #0d9488; font-size: 16px; font-weight: bold; margin: 0 0 16px;">📋 Detalles de la Factura</p>
                    <p style="color: #1f2937; font-size: 14px; margin: 8px 0;"><strong>Número de Factura:</strong> ${data.invoiceNumber}</p>
                    <p style="color: #1f2937; font-size: 14px; margin: 8px 0;"><strong>Valor Total:</strong> $${formattedAmount} COP</p>
                    ${data.cufe ? `<p style="color: #1f2937; font-size: 14px; margin: 8px 0;"><strong>CUFE:</strong><br/><span style="font-size: 11px; word-break: break-all;">${data.cufe}</span></p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Download Buttons -->
          <tr>
            <td style="padding: 16px 40px; text-align: center;">
              <p style="color: #4b5563; font-size: 15px; margin: 0 0 16px;">Puedes descargar tu factura en los siguientes formatos:</p>
              ${data.pdfUrl ? `<a href="${data.pdfUrl}" style="display: inline-block; background-color: #14B8A6; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px;">📄 Descargar PDF</a>` : ''}
              ${data.xmlUrl ? `<a href="${data.xmlUrl}" style="display: inline-block; background-color: #1f2937; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">📁 Descargar XML</a>` : ''}
            </td>
          </tr>
          
          <!-- Legal Info -->
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="color: #475569; font-size: 13px; font-weight: bold; margin: 0 0 8px;">📌 Información Legal</p>
                    <p style="color: #64748b; font-size: 12px; line-height: 18px; margin: 0;">
                      Esta factura electrónica cumple con los requisitos establecidos por la DIAN según la Resolución 000042 de 2020 y sus modificaciones. El CUFE (Código Único de Factura Electrónica) permite verificar la autenticidad del documento ante la DIAN.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
            </td>
          </tr>
          
          <!-- Support Section -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc;">
              <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 8px;">¿Tienes preguntas?</p>
              <p style="color: #6b7280; font-size: 13px; margin: 0;">Si tienes alguna duda sobre tu factura o necesitas asistencia, no dudes en contactar directamente con tu proveedor de servicios de salud.</p>
            </td>
          </tr>
          
          <!-- Footer Note -->
          <tr>
            <td style="padding: 16px 40px; text-align: center;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">Este es un correo automático generado por el sistema de facturación electrónica MEDMIND. Por favor, no respondas directamente a este mensaje.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #030712; padding: 24px 40px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px;"><strong>MEDMIND</strong><br/>Plataforma Inteligente para Médicos</p>
              <p style="color: #14B8A6; font-size: 11px; margin: 0;">Colombia · Cumplimiento DIAN · Facturación Electrónica</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  } else {
    // Rejected invoice email
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #030712; padding: 24px 40px; text-align: center;">
              <h1 style="color: #14B8A6; font-size: 28px; margin: 0;">💚 MEDMIND</h1>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <h2 style="color: #1f2937; font-size: 22px; margin: 0;">⚠️ Actualización de Factura</h2>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 16px 40px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0;">Hola ${data.patientName},</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 16px 40px;">
              <p style="color: #4b5563; font-size: 15px; line-height: 26px; margin: 0;">
                Queremos informarte que tu factura electrónica <strong>N° ${data.invoiceNumber}</strong> ha presentado un inconveniente en su validación ante la DIAN.
              </p>
            </td>
          </tr>
          
          <!-- Error Box -->
          ${data.errorMessage ? `
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" style="background-color: #fef2f2; border: 1px solid #f87171; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 0 0 12px;">❌ Motivo del rechazo:</p>
                    <p style="color: #991b1b; font-size: 14px; margin: 0;">${data.errorMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Resolution Message -->
          <tr>
            <td style="padding: 16px 40px;">
              <p style="color: #4b5563; font-size: 15px; line-height: 26px; margin: 0 0 16px;">
                Nuestro equipo está trabajando en corregir el problema. Te notificaremos por este medio cuando la factura sea reemitida y aprobada exitosamente.
              </p>
              <p style="color: #4b5563; font-size: 15px; line-height: 26px; margin: 0;">
                <strong>No te preocupes:</strong> Este tipo de situaciones son comunes y se resuelven rápidamente. Tu atención médica y los servicios prestados no se ven afectados.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            </td>
          </tr>
          
          <!-- Support Section -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc;">
              <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 8px;">¿Tienes preguntas?</p>
              <p style="color: #6b7280; font-size: 13px; margin: 0;">Si tienes alguna duda sobre tu factura o necesitas asistencia, no dudes en contactar directamente con tu proveedor de servicios de salud.</p>
            </td>
          </tr>
          
          <!-- Footer Note -->
          <tr>
            <td style="padding: 16px 40px; text-align: center;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">Este es un correo automático generado por el sistema de facturación electrónica MEDMIND. Por favor, no respondas directamente a este mensaje.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #030712; padding: 24px 40px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px;"><strong>MEDMIND</strong><br/>Plataforma Inteligente para Médicos</p>
              <p style="color: #14B8A6; font-size: 11px; margin: 0;">Colombia · Cumplimiento DIAN · Facturación Electrónica</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no configurada");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: SendEmailRequest = await req.json();
    
    console.log("Received email request:", {
      invoiceId: requestData.invoiceId,
      patientEmail: requestData.patientEmail,
      invoiceNumber: requestData.invoiceNumber,
      invoiceStatus: requestData.invoiceStatus
    });

    // Validate required fields
    if (!requestData.patientEmail || !requestData.invoiceNumber) {
      throw new Error('Missing required fields: patientEmail and invoiceNumber are required');
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(requestData);

    // Determine subject based on status
    const subject = requestData.invoiceStatus === 'approved'
      ? `✅ Factura ${requestData.invoiceNumber} - Aprobada por DIAN`
      : `⚠️ Actualización de Factura ${requestData.invoiceNumber}`;

    // Determine sender name
    const fromName = requestData.clinicName || requestData.doctorName || 'MEDMIND';

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <facturacion@medmindsystem.com>`,
        to: [requestData.patientEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    const emailResponse = await resendResponse.json();
    
    if (!resendResponse.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || 'Error al enviar email');
    }

    console.log("Email sent successfully:", emailResponse);

    // Log the email sending in database
    if (requestData.invoiceId) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('doctor_id')
        .eq('id', requestData.invoiceId)
        .single();

      if (invoice) {
        await supabase.from('dian_emission_logs').insert({
          invoice_id: requestData.invoiceId,
          doctor_id: invoice.doctor_id,
          provider: 'RESEND_EMAIL',
          status: 'EMAIL_SENT',
          response_payload: emailResponse,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully',
        emailId: emailResponse.id
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
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
