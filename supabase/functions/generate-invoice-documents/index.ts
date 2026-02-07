import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface Invoice {
  id: string
  numero_factura_dian: string | null
  cufe: string | null
  fecha_emision: string
  fecha_vencimiento: string
  subtotal: number
  impuestos: number
  total: number
  notas: string | null
  proveedor_dian: string | null
  doctor_id: string
  patient_id: string
}

interface InvoiceItem {
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal_linea: number
  impuestos_linea: number
  total_linea: number
  codigo_cups: string | null
}

interface Patient {
  full_name: string
  phone: string
  email: string | null
  address: string | null
}

interface DoctorProfile {
  full_name: string
  license_number: string | null
  phone: string | null
  clinic_name: string | null
  city: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { invoiceId, format } = await req.json()

    if (!invoiceId || !format || !['pdf', 'xml'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'invoiceId and format (pdf/xml) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch invoice
    const { data: invoice, error: invError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('doctor_id', user.id)
      .single()

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!invoice.numero_factura_dian || !invoice.cufe) {
      return new Response(
        JSON.stringify({ error: 'Invoice has not been emitted to DIAN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabaseClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (itemsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch invoice items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch patient
    const { data: patient, error: patientError } = await supabaseClient
      .from('patients')
      .select('full_name, phone, email, address')
      .eq('id', invoice.patient_id)
      .single()

    if (patientError || !patient) {
      return new Response(JSON.stringify({ error: 'Patient not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch doctor profile
    const { data: doctorProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, license_number, phone, clinic_name, city')
      .eq('id', user.id)
      .single()

    if (profileError || !doctorProfile) {
      return new Response(JSON.stringify({ error: 'Doctor profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'xml') {
      const xml = generateXML(invoice as Invoice, items as InvoiceItem[], patient as Patient, doctorProfile as DoctorProfile)
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="factura-${invoice.numero_factura_dian}.xml"`,
        },
      })
    } else {
      const pdfBase64 = await generatePDF(invoice as Invoice, items as InvoiceItem[], patient as Patient, doctorProfile as DoctorProfile)
      return new Response(JSON.stringify({ pdf: pdfBase64 }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    console.error('Error generating document:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateXML(
  invoice: Invoice,
  items: InvoiceItem[],
  patient: Patient,
  doctor: DoctorProfile
): string {
  const now = new Date().toISOString()
  
  // DIAN-compliant XML structure (simplified version)
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n'
  
  // UBL Version
  xml += '  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>\n'
  xml += `  <cbc:ID>${invoice.numero_factura_dian}</cbc:ID>\n`
  xml += `  <cbc:UUID>${invoice.cufe}</cbc:UUID>\n`
  xml += `  <cbc:IssueDate>${invoice.fecha_emision}</cbc:IssueDate>\n`
  xml += `  <cbc:IssueTime>${now.split('T')[1].split('.')[0]}</cbc:IssueTime>\n`
  xml += `  <cbc:DueDate>${invoice.fecha_vencimiento}</cbc:DueDate>\n`
  xml += '  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>\n'
  
  if (invoice.notas) {
    xml += `  <cbc:Note>${escapeXML(invoice.notas)}</cbc:Note>\n`
  }
  
  // Supplier (Doctor/Clinic)
  xml += '  <cac:AccountingSupplierParty>\n'
  xml += '    <cac:Party>\n'
  xml += '      <cac:PartyName>\n'
  xml += `        <cbc:Name>${escapeXML(doctor.clinic_name || doctor.full_name)}</cbc:Name>\n`
  xml += '      </cac:PartyName>\n'
  xml += '      <cac:PhysicalLocation>\n'
  xml += '        <cac:Address>\n'
  xml += `          <cbc:CityName>${escapeXML(doctor.city || 'N/A')}</cbc:CityName>\n`
  xml += '          <cac:Country>\n'
  xml += '            <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n'
  xml += '          </cac:Country>\n'
  xml += '        </cac:Address>\n'
  xml += '      </cac:PhysicalLocation>\n'
  xml += '      <cac:Contact>\n'
  xml += `        <cbc:Telephone>${escapeXML(doctor.phone || 'N/A')}</cbc:Telephone>\n`
  xml += '      </cac:Contact>\n'
  xml += '    </cac:Party>\n'
  xml += '  </cac:AccountingSupplierParty>\n'
  
  // Customer (Patient)
  xml += '  <cac:AccountingCustomerParty>\n'
  xml += '    <cac:Party>\n'
  xml += '      <cac:PartyName>\n'
  xml += `        <cbc:Name>${escapeXML(patient.full_name)}</cbc:Name>\n`
  xml += '      </cac:PartyName>\n'
  xml += '      <cac:PhysicalLocation>\n'
  xml += '        <cac:Address>\n'
  xml += `          <cbc:AddressLine>${escapeXML(patient.address || 'N/A')}</cbc:AddressLine>\n`
  xml += '          <cac:Country>\n'
  xml += '            <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n'
  xml += '          </cac:Country>\n'
  xml += '        </cac:Address>\n'
  xml += '      </cac:PhysicalLocation>\n'
  xml += '      <cac:Contact>\n'
  xml += `        <cbc:Telephone>${escapeXML(patient.phone)}</cbc:Telephone>\n`
  if (patient.email) {
    xml += `        <cbc:ElectronicMail>${escapeXML(patient.email)}</cbc:ElectronicMail>\n`
  }
  xml += '      </cac:Contact>\n'
  xml += '    </cac:Party>\n'
  xml += '  </cac:AccountingCustomerParty>\n'
  
  // Tax Total
  xml += '  <cac:TaxTotal>\n'
  xml += `    <cbc:TaxAmount currencyID="COP">${invoice.impuestos.toFixed(2)}</cbc:TaxAmount>\n`
  xml += '  </cac:TaxTotal>\n'
  
  // Legal Monetary Total
  xml += '  <cac:LegalMonetaryTotal>\n'
  xml += `    <cbc:LineExtensionAmount currencyID="COP">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>\n`
  xml += `    <cbc:TaxExclusiveAmount currencyID="COP">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>\n`
  xml += `    <cbc:TaxInclusiveAmount currencyID="COP">${invoice.total.toFixed(2)}</cbc:TaxInclusiveAmount>\n`
  xml += `    <cbc:PayableAmount currencyID="COP">${invoice.total.toFixed(2)}</cbc:PayableAmount>\n`
  xml += '  </cac:LegalMonetaryTotal>\n'
  
  // Invoice Lines
  items.forEach((item, index) => {
    xml += '  <cac:InvoiceLine>\n'
    xml += `    <cbc:ID>${index + 1}</cbc:ID>\n`
    xml += `    <cbc:InvoicedQuantity unitCode="EA">${item.cantidad}</cbc:InvoicedQuantity>\n`
    xml += `    <cbc:LineExtensionAmount currencyID="COP">${item.subtotal_linea.toFixed(2)}</cbc:LineExtensionAmount>\n`
    xml += '    <cac:Item>\n'
    xml += `      <cbc:Description>${escapeXML(item.descripcion)}</cbc:Description>\n`
    if (item.codigo_cups) {
      xml += '      <cac:StandardItemIdentification>\n'
      xml += `        <cbc:ID>${escapeXML(item.codigo_cups)}</cbc:ID>\n`
      xml += '      </cac:StandardItemIdentification>\n'
    }
    xml += '    </cac:Item>\n'
    xml += '    <cac:Price>\n'
    xml += `      <cbc:PriceAmount currencyID="COP">${item.precio_unitario.toFixed(2)}</cbc:PriceAmount>\n`
    xml += '    </cac:Price>\n'
    xml += '  </cac:InvoiceLine>\n'
  })
  
  xml += '</Invoice>'
  
  return xml
}

async function generatePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  patient: Patient,
  doctor: DoctorProfile
): Promise<string> {
  // For PDF generation, we'll return a simple structure that the frontend can use
  // with jspdf to generate the actual PDF (since jspdf works better in browser)
  const pdfData = {
    invoice,
    items,
    patient,
    doctor,
  }
  
  return btoa(JSON.stringify(pdfData))
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
