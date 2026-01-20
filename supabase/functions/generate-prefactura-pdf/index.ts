import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total_linea: number;
}

interface PrefacturaData {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  patientEmail?: string;
  doctorName: string;
  clinicName?: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  services: ServiceItem[];
}

// Generate HTML for the PDF
function generatePdfHtml(data: PrefacturaData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const servicesHtml = data.services.map(service => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${service.descripcion}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${service.cantidad}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${formatCurrency(service.precio_unitario)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${formatCurrency(service.total_linea)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prefactura ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1f2937;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0d9488;
    }
    .logo-section h1 {
      margin: 0;
      color: #0d9488;
      font-size: 28px;
    }
    .logo-section p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 14px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      margin: 0;
      font-size: 24px;
      color: #0f172a;
    }
    .invoice-meta p {
      margin: 4px 0;
      color: #64748b;
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-box {
      flex: 1;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      margin-right: 16px;
    }
    .info-box:last-child {
      margin-right: 0;
    }
    .info-box h3 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #0f172a;
    }
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .services-table th {
      background: #0d9488;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
    }
    .services-table th:nth-child(2),
    .services-table th:nth-child(3),
    .services-table th:nth-child(4) {
      text-align: right;
    }
    .services-table th:nth-child(2) {
      text-align: center;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 280px;
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #0d9488;
      margin-top: 8px;
      padding-top: 16px;
      font-size: 20px;
      font-weight: bold;
      color: #0d9488;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin-top: 24px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <h1>${data.clinicName || data.doctorName}</h1>
      <p>${data.clinicName ? `Dr(a). ${data.doctorName}` : 'Servicios de Salud'}</p>
    </div>
    <div class="invoice-meta">
      <h2>PREFACTURA</h2>
      <p><strong>${data.invoiceNumber}</strong></p>
      <p>Emitida: ${formatDate(data.fechaEmision)}</p>
      <span class="badge">Pendiente de pago</span>
    </div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>Paciente</h3>
      <p><strong>${data.patientName}</strong></p>
      ${data.patientEmail ? `<p>${data.patientEmail}</p>` : ''}
    </div>
    <div class="info-box">
      <h3>Fecha de Emisión</h3>
      <p>${formatDate(data.fechaEmision)}</p>
    </div>
    ${data.fechaVencimiento ? `
    <div class="info-box">
      <h3>Vencimiento</h3>
      <p>${formatDate(data.fechaVencimiento)}</p>
    </div>
    ` : ''}
  </div>

  <table class="services-table">
    <thead>
      <tr>
        <th>Servicio</th>
        <th>Cant.</th>
        <th>Precio Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${servicesHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>$${formatCurrency(data.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span>IVA</span>
        <span>$${formatCurrency(data.impuestos)}</span>
      </div>
      <div class="totals-row total">
        <span>TOTAL</span>
        <span>$${formatCurrency(data.total)}</span>
      </div>
    </div>
  </div>

  <div class="note">
    <strong>📋 Nota:</strong> Este es un documento de prefactura. Una vez confirmado el pago, se generará la factura electrónica oficial validada por la DIAN.
  </div>

  <div class="footer">
    <p>Documento generado por MEDMIND · Sistema de Gestión Médica</p>
    <p>${data.clinicName || data.doctorName} · Colombia</p>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }

    console.log("Generating prefactura PDF for invoice:", invoiceId);

    // Fetch invoice with items and patient
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        patients(full_name, email),
        invoice_items(descripcion, cantidad, precio_unitario, total_linea)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Fetch doctor profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, clinic_name')
      .eq('id', invoice.doctor_id)
      .single();

    const prefacturaData: PrefacturaData = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`,
      patientName: invoice.patients?.full_name || 'Paciente',
      patientEmail: invoice.patients?.email || undefined,
      doctorName: profile?.full_name || 'Doctor',
      clinicName: profile?.clinic_name || undefined,
      fechaEmision: invoice.fecha_emision,
      fechaVencimiento: invoice.fecha_vencimiento,
      subtotal: invoice.subtotal || 0,
      impuestos: invoice.impuestos || 0,
      total: invoice.total || 0,
      services: invoice.invoice_items || []
    };

    // Generate HTML
    const htmlContent = generatePdfHtml(prefacturaData);

    // Convert to PDF using a simple HTML approach
    // For now, we'll store the HTML and provide a link that can be rendered
    const fileName = `prefactura-${invoice.id}.html`;
    const filePath = `invoices/${invoice.doctor_id}/${fileName}`;

    // Upload HTML to storage
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings') // Reusing existing bucket
      .upload(filePath, new Blob([htmlContent], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error('Error uploading prefactura');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(filePath);

    // Update invoice with PDF URL
    await supabase
      .from('invoices')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: urlData.publicUrl,
        prefacturaData
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating prefactura PDF:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
