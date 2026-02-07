import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ServiceItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total_linea: number;
}

interface SendEmailRequest {
  invoiceId: string;
  patientEmail: string;
  patientName: string;
  invoiceNumber: string;
  cufe?: string;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  impuestos?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  doctorName?: string;
  clinicName?: string;
  fechaEmision?: string;
  services?: ServiceItem[];
}

const generateEmailHtml = (data: SendEmailRequest): string => {
  const amount = data.totalAmount ?? data.total ?? 0;
  const formattedAmount = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  const clinicOrDoctor = data.clinicName || data.doctorName || 'Tu proveedor de salud';
  
  // Format date with time
  const fechaEmision = data.fechaEmision 
    ? new Date(data.fechaEmision).toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  // Generate services table HTML
  const servicesHtml = data.services && data.services.length > 0 
    ? `
          <!-- Services Table -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Detalle de servicios:</p>
              <table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: collapse;">
                <tr style="background-color: #0d9488;">
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase;">Servicio</td>
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600; text-align: center; text-transform: uppercase;">Cant.</td>
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600; text-align: right; text-transform: uppercase;">P. Unit.</td>
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600; text-align: right; text-transform: uppercase;">Total</td>
                </tr>
                ${data.services.map(service => `
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1f2937;">${service.descripcion}</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1f2937; text-align: center;">${service.cantidad}</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1f2937; text-align: right;">$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(service.precio_unitario)}</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0d9488; font-weight: 600; text-align: right;">$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(service.total_linea)}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
    `
    : '';

  // Subtotal and taxes if available
  const subtotalHtml = data.subtotal !== undefined && data.impuestos !== undefined
    ? `
                    <tr>
                      <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                        <table width="100%">
                          <tr>
                            <td style="color: #64748b; font-size: 13px;">Subtotal</td>
                            <td style="text-align: right; color: #0f172a; font-size: 14px;">$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(data.subtotal)}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; font-size: 13px; padding-top: 4px;">IVA</td>
                            <td style="text-align: right; color: #0f172a; font-size: 14px; padding-top: 4px;">$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(data.impuestos)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
    `
    : '';

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
            <td style="background: linear-gradient(135deg, #0d9488 0%, #14B8A6 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">📄 Prefactura</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${clinicOrDoctor}</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0;">Hola <strong>${data.patientName}</strong>,</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 8px 40px 24px;">
              <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0;">
                Adjunto encontrarás tu prefactura correspondiente a los servicios prestados. A continuación los detalles:
              </p>
            </td>
          </tr>
          
          <!-- Invoice Details Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Invoice Header -->
                    <table width="100%" style="margin-bottom: 20px;">
                      <tr>
                        <td>
                          <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 4px;">Número de Prefactura</p>
                          <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 0;">${data.invoiceNumber}</p>
                        </td>
                        <td style="text-align: right;">
                          <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 4px;">Fecha y Hora</p>
                          <p style="color: #0f172a; font-size: 14px; margin: 0;">${fechaEmision}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                    
                    ${subtotalHtml}
                    
                    <!-- Total -->
                    <table width="100%" style="margin-top: 16px;">
                      <tr>
                        <td>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Total a Pagar</p>
                        </td>
                        <td style="text-align: right;">
                          <p style="color: #0d9488; font-size: 28px; font-weight: bold; margin: 0;">$${formattedAmount}</p>
                          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">COP</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${servicesHtml}
          
          <!-- Download Buttons -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Descarga tu prefactura:</p>
              <table align="center" cellpadding="0" cellspacing="0">
                <tr>
                  ${data.pdfUrl ? `
                  <td style="padding-right: 12px;">
                    <a href="${data.pdfUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">📄 Descargar Prefactura PDF</a>
                  </td>
                  ` : `
                  <td style="padding-right: 12px;">
                    <span style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">📄 Prefactura disponible en tu portal</span>
                  </td>
                  `}
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Provider Info -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 4px;">Emitido por</p>
                    <p style="color: #0f172a; font-size: 15px; font-weight: 600; margin: 0;">${clinicOrDoctor}</p>
                    ${data.doctorName && data.clinicName ? `<p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Dr(a). ${data.doctorName}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>
          
          <!-- Support Section -->
          <tr>
            <td style="padding: 24px 40px;">
              <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">¿Tienes preguntas?</p>
              <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 0;">Si tienes alguna duda sobre esta prefactura o los servicios prestados, no dudes en contactar directamente con ${clinicOrDoctor}.</p>
            </td>
          </tr>
          
          <!-- Footer Note -->
          <tr>
            <td style="padding: 16px 40px 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">Este es un correo automático. Por favor, no respondas directamente a este mensaje.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 40px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 4px;"><strong>${clinicOrDoctor}</strong></p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Prefacturación · Colombia</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      servicesCount: requestData.services?.length || 0
    });

    // Validate required fields
    if (!requestData.patientEmail || !requestData.invoiceNumber) {
      throw new Error('Missing required fields: patientEmail and invoiceNumber are required');
    }

    // If no services provided, fetch them from database
    if (!requestData.services || requestData.services.length === 0) {
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('descripcion, cantidad, precio_unitario, total_linea')
        .eq('invoice_id', requestData.invoiceId);
      
      if (invoiceItems && invoiceItems.length > 0) {
        requestData.services = invoiceItems;
      }
    }

    // Fetch subtotal and taxes if not provided
    if (requestData.subtotal === undefined || requestData.impuestos === undefined) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('subtotal, impuestos, pdf_url')
        .eq('id', requestData.invoiceId)
        .single();
      
      if (invoice) {
        requestData.subtotal = invoice.subtotal || 0;
        requestData.impuestos = invoice.impuestos || 0;
        if (invoice.pdf_url && !requestData.pdfUrl) {
          requestData.pdfUrl = invoice.pdf_url;
        }
      }
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(requestData);

    // Simple subject - just the invoice
    const subject = `Prefactura ${requestData.invoiceNumber} - ${requestData.clinicName || requestData.doctorName || 'Tu proveedor de salud'}`;

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
