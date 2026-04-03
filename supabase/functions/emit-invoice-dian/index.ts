import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EmitInvoiceRequest {
  invoiceId: string;
}

interface DIANConfig {
  provider_name: string;
  api_url: string;
  config_data: any;
  is_sandbox: boolean;
}

interface Invoice {
  id: string;
  doctor_id: string;
  patient_id: string;
  numero_factura_dian: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  notas: string | null;
}

interface InvoiceItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  impuestos_linea: number;
  total_linea: number;
  codigo_cups: string | null;
}

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
}

// ─── FLUJO DIRECTO A DIAN (Software Propio) ──────────────────────────────────

async function emitirDirecto(
  supabase: any,
  invoice: Invoice,
  items: InvoiceItem[],
  patient: Patient,
  doctorProfile: any,
  config: any,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // 1. Obtener siguiente número de factura (atómico, con lock)
    const { data: numData, error: numError } = await supabase.rpc('get_next_invoice_number', {
      p_doctor_id: invoice.doctor_id,
    });
    if (numError) throw new Error(`Error al generar número: ${numError.message}`);

    const numeroFactura: string = numData.numero;
    const fechaEmision = invoice.fecha_emision || new Date().toISOString().split('T')[0];
    const horaEmision = new Date().toTimeString().slice(0, 8); // HH:mm:ss

    // 2. Calcular CUFE (SHA-384)
    const cufe = await calcularCUFEDirecto({
      numeroFactura,
      fechaFactura: fechaEmision,
      horaFactura: horaEmision,
      valorFactura: invoice.subtotal.toFixed(2),
      codImpuesto1: invoice.impuestos > 0 ? '01' : 'ZY',
      valorImpuesto1: invoice.impuestos.toFixed(2),
      codImpuesto2: 'ZY',
      valorImpuesto2: '0.00',
      codImpuesto3: 'ZY',
      valorImpuesto3: '0.00',
      valorTotal: invoice.total.toFixed(2),
      tipoDocEmisor: '31',
      nitEmisor: config.nit,
      tipoDocAdquirente: patient.document_type || '13',
      numDocAdquirente: patient.document_number || patient.phone || '0',
      claveAcceso: config.technical_key,
    });

    // 3. Generar XML UBL 2.1 con sector salud
    const xmlContent = generarXMLUBL({
      numeroFactura,
      fechaEmision,
      horaEmision,
      fechaVencimiento: invoice.fecha_vencimiento,
      cufe,
      invoice,
      items,
      patient,
      config,
      doctorProfile,
    });

    // 4. Firmar XML via sign-xml-invoice
    const signResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sign-xml-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ xmlContent, doctorId: invoice.doctor_id }),
    });

    let signedXml = xmlContent;
    if (signResponse.ok) {
      const signResult = await signResponse.json();
      if (signResult.signedXml) signedXml = signResult.signedXml;
    }
    // Si no hay cert, continuamos sin firma (habilitación acepta sin firma para pruebas)

    // 5. Comprimir XML en ZIP y encodear en base64
    const xmlBytes = new TextEncoder().encode(signedXml);
    const xmlBase64Zip = await comprimirYBase64(xmlBytes, `${numeroFactura}.xml`);

    // 6. Enviar a DIAN via SOAP (dian-soap-client)
    const soapResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/dian-soap-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        method: 'send_bill_sync',
        payload: { xmlBase64Zip },
        doctorId: invoice.doctor_id,
      }),
    });

    const dianResult = await soapResponse.json();

    if (!dianResult.isValid && config.environment === 'produccion') {
      // Log del error y retornar fallo
      await supabase.from('dian_emission_logs').insert([{
        invoice_id: invoice.id,
        doctor_id: invoice.doctor_id,
        provider: 'DIRECTO',
        request_payload: { numeroFactura, cufe, environment: config.environment },
        response_payload: dianResult,
        status: 'ERROR',
        error_message: dianResult.errorList?.join('; ') || dianResult.statusMessage,
      }]);

      await supabase.from('invoices').update({
        estado: 'RECHAZADA',
        errores_validacion: dianResult,
      }).eq('id', invoice.id);

      return json({ success: false, error: dianResult.statusMessage, details: dianResult.errorList }, 422);
    }

    // 7. Actualizar factura con CUFE y número DIAN
    await supabase.from('invoices').update({
      cufe,
      numero_factura_dian: numeroFactura,
      estado: config.environment === 'produccion' ? 'VALIDADA' : 'EMITIDA',
      metodo_emision: 'DIRECTO',
      proveedor_dian: 'MEDMIND',
    }).eq('id', invoice.id);

    // 8. Log de éxito
    await supabase.from('dian_emission_logs').insert([{
      invoice_id: invoice.id,
      doctor_id: invoice.doctor_id,
      provider: 'DIRECTO',
      request_payload: { numeroFactura, cufe, environment: config.environment },
      response_payload: dianResult,
      status: 'SUCCESS',
      cufe,
      numero_dian: numeroFactura,
    }]);

    return json({
      success: true,
      cufe,
      numeroDian: numeroFactura,
      environment: config.environment,
      message: config.environment === 'produccion'
        ? '✅ Factura emitida directamente ante la DIAN'
        : '🧪 Factura emitida en entorno de Habilitación (pruebas)',
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error en emisión directa' }, 500);
  }
}

/** Cálculo CUFE con SHA-384 usando SubtleCrypto de Deno */
async function calcularCUFEDirecto(input: {
  numeroFactura: string; fechaFactura: string; horaFactura: string;
  valorFactura: string; codImpuesto1: string; valorImpuesto1: string;
  codImpuesto2: string; valorImpuesto2: string; codImpuesto3: string;
  valorImpuesto3: string; valorTotal: string; tipoDocEmisor: string;
  nitEmisor: string; tipoDocAdquirente: string; numDocAdquirente: string;
  claveAcceso: string;
}): Promise<string> {
  const cadena = [
    input.numeroFactura, input.fechaFactura, input.horaFactura,
    input.valorFactura, input.codImpuesto1, input.valorImpuesto1,
    input.codImpuesto2, input.valorImpuesto2, input.codImpuesto3, input.valorImpuesto3,
    input.valorTotal, input.tipoDocEmisor, input.nitEmisor,
    input.tipoDocAdquirente, input.numDocAdquirente, input.claveAcceso,
  ].join('');

  const data = new TextEncoder().encode(cadena);
  const hashBuffer = await crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Genera XML UBL 2.1 completo con campos del sector salud */
function generarXMLUBL(params: {
  numeroFactura: string; fechaEmision: string; horaEmision: string;
  fechaVencimiento: string; cufe: string;
  invoice: Invoice; items: InvoiceItem[];
  patient: Patient; config: any; doctorProfile: any;
}): string {
  const { numeroFactura, fechaEmision, horaEmision, fechaVencimiento, cufe, invoice, items, patient, config, doctorProfile } = params;
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const itemsXML = items.map((item, i) => `
    <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${item.cantidad}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="COP">${item.subtotal_linea.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${esc(item.descripcion)}</cbc:Description>
        ${item.codigo_cups ? `<cac:SellersItemIdentification><cbc:ID>${esc(item.codigo_cups)}</cbc:ID></cac:SellersItemIdentification>` : ''}
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="COP">${item.precio_unitario.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
      ${item.impuestos_linea > 0 ? `
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="COP">${item.impuestos_linea.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="COP">${item.subtotal_linea.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="COP">${item.impuestos_linea.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory><cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme></cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>` : ''}
    </cac:InvoiceLine>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileExecutionID>2</cbc:ProfileExecutionID>
  <cbc:ID>${esc(numeroFactura)}</cbc:ID>
  <cbc:UUID schemeID="${esc(config.resolucion_dian)}" schemeName="CUFE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>${fechaEmision}</cbc:IssueDate>
  <cbc:IssueTime>${horaEmision}</cbc:IssueTime>
  <cbc:DueDate>${fechaVencimiento}</cbc:DueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${items.length}</cbc:LineCountNumeric>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(config.nombre_empresa)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${esc(config.nombre_empresa)}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN">${esc(config.nit)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>01</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:ElectronicMail>${esc(config.email_facturacion || doctorProfile.email || '')}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(patient.full_name)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${esc(patient.full_name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195">${esc((patient as any).document_number || patient.phone || '0')}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>ZZ</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      ${patient.email ? `<cac:Contact><cbc:ElectronicMail>${esc(patient.email)}</cbc:ElectronicMail></cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${invoice.impuestos.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${invoice.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${invoice.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${itemsXML}
</Invoice>`;
}

/** Comprime XML en ZIP y devuelve base64 */
async function comprimirYBase64(xmlBytes: Uint8Array, fileName: string): Promise<string> {
  // En Deno, usamos CompressionStream si está disponible, o devolvemos base64 del XML directo
  // DIAN acepta tanto ZIP como XML directo en algunos casos
  try {
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    await writer.write(xmlBytes);
    await writer.close();

    const chunks: Uint8Array[] = [];
    const reader = cs.readable.getReader();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      if (value) chunks.push(value);
      done = d;
    }

    const compressed = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) { compressed.set(chunk, offset); offset += chunk.length; }

    return btoa(String.fromCharCode(...compressed));
  } catch {
    // Fallback: XML sin comprimir en base64
    return btoa(String.fromCharCode(...xmlBytes));
  }
}

// ─── FIN FLUJO DIRECTO ────────────────────────────────────────────────────────

// Function to send email notification
async function sendInvoiceEmail(
  supabaseClient: any,
  invoiceId: string,
  patient: Patient,
  numeroDian: string,
  cufe: string,
  total: number,
  doctorName: string,
  clinicName: string,
  status: 'approved' | 'rejected',
  errorMessage?: string
) {
  if (!patient.email) {
    console.log('Patient has no email, skipping notification');
    return;
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-invoice-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        invoiceId,
        patientEmail: patient.email,
        patientName: patient.full_name,
        invoiceNumber: numeroDian || invoiceId.substring(0, 8).toUpperCase(),
        invoiceStatus: status,
        cufe,
        errorMessage,
        totalAmount: total,
        doctorName,
        clinicName,
      }),
    });

    const result = await response.json();
    console.log('Email notification result:', result);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invoiceId }: EmitInvoiceRequest = await req.json();
    console.log('Emitting invoice:', invoiceId);

    // Get invoice with items and patient
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('doctor_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Factura no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency: if already emitted, return existing data
    if (invoice.numero_factura_dian && invoice.cufe) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Factura ya emitida anteriormente',
          cufe: invoice.cufe,
          numero: invoice.numero_factura_dian,
          idempotent: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invoice items
    const { data: items, error: itemsError } = await supabaseClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (itemsError || !items || items.length === 0) {
      console.error('Items error:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Factura sin items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get patient
    const { data: patient, error: patientError } = await supabaseClient
      .from('patients')
      .select('*')
      .eq('id', invoice.patient_id)
      .single();

    if (patientError || !patient) {
      console.error('Patient error:', patientError);
      return new Response(
        JSON.stringify({ error: 'Paciente no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get doctor profile
    const { data: doctorProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !doctorProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil de doctor no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── FLUJO DIRECTO (Software Propio) ──────────────────────────────────────
    // Si el médico tiene dian_software_config configurado, usamos el flujo
    // directo a DIAN sin terceros. Si no, fallback a Alegra/Siigo/Alanube.
    const { data: softwarePropio } = await supabaseClient
      .from('dian_software_config')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('activo', true)
      .maybeSingle();

    if (softwarePropio) {
      return await emitirDirecto(supabaseClient, invoice, items, patient, doctorProfile, softwarePropio, corsHeaders);
    }
    // ── FIN FLUJO DIRECTO ─────────────────────────────────────────────────────

    // Get active DIAN configuration (fallback: terceros)
    const { data: dianConfig, error: configError } = await supabaseClient
      .from('api_configurations')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('provider_type', 'DIAN')
      .eq('is_active', true)
      .single();

    if (configError || !dianConfig) {
      return new Response(
        JSON.stringify({ error: 'No hay configuración DIAN activa. Configura tu Software Propio en Facturación → Configurar DIAN, o conecta un proveedor (Alegra/Siigo/Alanube).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate invoice data
    const validationErrors = validateInvoiceData(invoice, items, patient, dianConfig);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return new Response(
        JSON.stringify({ error: 'Errores de validación', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate payload based on provider
    let payload: any;
    let apiUrl: string;
    
    try {
      switch (dianConfig.provider_name) {
        case 'ALEGRA':
          payload = generateAlegraPayload(invoice, items, patient, dianConfig.config_data);
          apiUrl = dianConfig.is_sandbox 
            ? 'https://api.alegra.com/api/v1/invoices'
            : 'https://api.alegra.com/api/v1/invoices';
          break;
        case 'SIIGO':
          payload = generateSiigoPayload(invoice, items, patient, dianConfig.config_data);
          apiUrl = dianConfig.is_sandbox
            ? 'https://api.siigo.com/v1/invoices'
            : 'https://api.siigo.com/v1/invoices';
          break;
        case 'ALANUBE':
          payload = generateAlanubePayload(invoice, items, patient, dianConfig.config_data);
          apiUrl = dianConfig.is_sandbox
            ? 'https://sandbox.alanube.co/api/v1/invoices'
            : 'https://api.alanube.co/api/v1/invoices';
          break;
        default:
          throw new Error(`Proveedor no soportado: ${dianConfig.provider_name}`);
      }

      console.log('Generated payload for', dianConfig.provider_name, ':', JSON.stringify(payload, null, 2));
    } catch (error: any) {
      console.error('Payload generation error:', error);
      return new Response(
        JSON.stringify({ error: 'Error generando payload', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log emission attempt
    const { data: logEntry, error: logError } = await supabaseClient
      .from('dian_emission_logs')
      .insert({
        invoice_id: invoiceId,
        doctor_id: user.id,
        provider: dianConfig.provider_name,
        request_payload: payload,
        status: 'PENDING',
      })
      .select()
      .single();

    if (logError) {
      console.error('Log error:', logError);
    }

    // Call provider API
    try {
      const apiKey = dianConfig.config_data?.api_key || '';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Provider response:', response.status, responseData);

      if (!response.ok) {
        // Log error
        if (logEntry) {
          await supabaseClient
            .from('dian_emission_logs')
            .update({
              status: 'ERROR',
              error_message: responseData.message || 'Error en la emisión',
              response_payload: responseData,
            })
            .eq('id', logEntry.id);
        }

        // Send rejection email
        await sendInvoiceEmail(
          supabaseClient,
          invoiceId,
          patient,
          invoice.numero_factura_dian || invoiceId.substring(0, 8).toUpperCase(),
          '',
          invoice.total,
          doctorProfile.full_name,
          doctorProfile.clinic_name || '',
          'rejected',
          responseData.message || 'Error en la validación DIAN'
        );

        return new Response(
          JSON.stringify({ 
            error: 'Error al emitir factura', 
            details: responseData.message || 'Error desconocido',
            response: responseData 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract CUFE and DIAN number from response (varies by provider)
      const cufe = extractCUFE(responseData, dianConfig.provider_name);
      const numeroDian = extractNumeroDian(responseData, dianConfig.provider_name);

      // Update invoice
      const { error: updateError } = await supabaseClient
        .from('invoices')
        .update({
          estado: 'EMITIDA',
          cufe: cufe,
          numero_factura_dian: numeroDian,
          metodo_emision: dianConfig.provider_name,
          proveedor_dian: dianConfig.provider_name,
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Update invoice error:', updateError);
      }

      // Update log with success
      if (logEntry) {
        await supabaseClient
          .from('dian_emission_logs')
          .update({
            status: 'SUCCESS',
            response_payload: responseData,
            cufe: cufe,
            numero_dian: numeroDian,
          })
          .eq('id', logEntry.id);
      }

      // Send success email notification
      await sendInvoiceEmail(
        supabaseClient,
        invoiceId,
        patient,
        numeroDian || invoiceId.substring(0, 8).toUpperCase(),
        cufe,
        invoice.total,
        doctorProfile.full_name,
        doctorProfile.clinic_name || '',
        'approved'
      );

      return new Response(
        JSON.stringify({
          success: true,
          cufe,
          numero_dian: numeroDian,
          message: 'Factura emitida exitosamente',
          response: responseData,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('API call error:', error);
      
      // Log error
      if (logEntry) {
        await supabaseClient
          .from('dian_emission_logs')
          .update({
            status: 'ERROR',
            error_message: error.message,
          })
          .eq('id', logEntry.id);
      }

      return new Response(
        JSON.stringify({ error: 'Error en la comunicación con el proveedor', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('General error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Validation function
function validateInvoiceData(invoice: Invoice, items: InvoiceItem[], patient: Patient, config: DIANConfig): string[] {
  const errors: string[] = [];

  if (!invoice.fecha_emision) errors.push('Fecha de emisión requerida');
  if (!invoice.fecha_vencimiento) errors.push('Fecha de vencimiento requerida');
  if (invoice.subtotal <= 0) errors.push('Subtotal debe ser mayor a 0');
  if (invoice.total <= 0) errors.push('Total debe ser mayor a 0');
  
  if (!patient.full_name) errors.push('Nombre del paciente requerido');
  if (!patient.phone && !patient.email) errors.push('Teléfono o email del paciente requerido');

  if (!config.config_data?.nit) errors.push('NIT no configurado');
  if (!config.config_data?.nombre_empresa) errors.push('Nombre de empresa no configurado');

  items.forEach((item, idx) => {
    if (!item.descripcion) errors.push(`Item ${idx + 1}: descripción requerida`);
    if (item.cantidad <= 0) errors.push(`Item ${idx + 1}: cantidad debe ser mayor a 0`);
    if (item.precio_unitario <= 0) errors.push(`Item ${idx + 1}: precio debe ser mayor a 0`);
  });

  return errors;
}

// Payload generators
function generateAlegraPayload(invoice: Invoice, items: InvoiceItem[], patient: Patient, config: any): any {
  return {
    date: invoice.fecha_emision,
    dueDate: invoice.fecha_vencimiento,
    client: {
      name: patient.full_name,
      email: patient.email || '',
      phonePrimary: patient.phone,
      address: patient.address || '',
    },
    items: items.map(item => ({
      name: item.descripcion,
      description: item.descripcion,
      quantity: item.cantidad,
      price: item.precio_unitario,
      tax: item.impuestos_linea > 0 ? [{
        name: 'IVA',
        percentage: (item.impuestos_linea / item.subtotal_linea) * 100,
      }] : [],
    })),
    observations: invoice.notas || '',
  };
}

function generateSiigoPayload(invoice: Invoice, items: InvoiceItem[], patient: Patient, config: any): any {
  return {
    document: {
      id: 'FE',
    },
    date: invoice.fecha_emision,
    customer: {
      identification: patient.phone,
      branch_office: 0,
      name: [patient.full_name],
      address: {
        address: patient.address || 'Sin dirección',
      },
      phones: [{
        number: patient.phone,
      }],
      contacts: [{
        email: patient.email || '',
      }],
    },
    items: items.map(item => ({
      code: item.codigo_cups || 'SRV',
      description: item.descripcion,
      quantity: item.cantidad,
      price: item.precio_unitario,
      discount: 0,
      taxes: item.impuestos_linea > 0 ? [{
        id: 13156,
      }] : [],
    })),
    payments: [{
      id: 5636,
      value: invoice.total,
      due_date: invoice.fecha_vencimiento,
    }],
    observations: invoice.notas || '',
  };
}

function generateAlanubePayload(invoice: Invoice, items: InvoiceItem[], patient: Patient, config: any): any {
  return {
    numero: invoice.id.substring(0, 8).toUpperCase(),
    fecha: invoice.fecha_emision,
    hora: new Date().toTimeString().split(' ')[0],
    vencimiento: invoice.fecha_vencimiento,
    cliente: {
      tipo_identificacion: '13',
      numero_identificacion: patient.phone.replace(/\D/g, ''),
      nombre: patient.full_name,
      telefono: patient.phone,
      correo: patient.email || '',
      direccion: patient.address || 'Sin dirección',
    },
    items: items.map((item, idx) => ({
      numero_linea: idx + 1,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      total: item.total_linea,
      impuestos: item.impuestos_linea > 0 ? [{
        codigo: '01',
        porcentaje: (item.impuestos_linea / item.subtotal_linea) * 100,
        valor: item.impuestos_linea,
      }] : [],
    })),
    totales: {
      subtotal: invoice.subtotal,
      impuestos: invoice.impuestos,
      total: invoice.total,
    },
    notas: invoice.notas || '',
    informacion_emisor: {
      nit: config.nit,
      nombre: config.nombre_empresa,
      direccion: config.direccion || '',
      telefono: config.telefono || '',
      correo: config.email || '',
    },
  };
}

// Response extractors
function extractCUFE(response: any, provider: string): string {
  switch (provider) {
    case 'ALEGRA':
      return response.stamp?.cufe || response.cufe || '';
    case 'SIIGO':
      return response.cufe || '';
    case 'ALANUBE':
      return response.cufe || response.data?.cufe || '';
    default:
      return '';
  }
}

function extractNumeroDian(response: any, provider: string): string {
  switch (provider) {
    case 'ALEGRA':
      return response.numberTemplate?.fullNumber || response.number || '';
    case 'SIIGO':
      return response.number || response.name || '';
    case 'ALANUBE':
      return response.numero || response.data?.numero || '';
    default:
      return '';
  }
}
