import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-alanube-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Alanube webhook received');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('Alanube payload:', JSON.stringify(payload, null, 2));

    // Validate webhook signature (Alanube specific)
    const signature = req.headers.get('x-alanube-signature');
    if (signature) {
      console.log('Alanube signature:', signature);
    }

    // Extract event data
    const eventType = payload.event || payload.tipo || payload.type || 'unknown';
    const invoiceReference = payload.numero || payload.data?.numero || payload.factura_id;

    console.log('Event type:', eventType, 'Invoice ref:', invoiceReference);

    // Log webhook event
    const { data: webhookEvent, error: webhookError } = await supabaseAdmin
      .from('dian_webhook_events')
      .insert({
        provider: 'ALANUBE',
        event_type: eventType,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error logging webhook:', webhookError);
    }

    // Process based on event type
    let invoiceUpdates: any = {};
    let shouldUpdate = false;

    if (eventType.includes('approved') || eventType.includes('aceptada') || payload.estado === 'ACEPTADA') {
      console.log('Invoice approved');
      invoiceUpdates.estado = 'VALIDADA';
      shouldUpdate = true;

      // Extract CUFE and DIAN number if present
      if (payload.cufe || payload.data?.cufe) {
        invoiceUpdates.cufe = payload.cufe || payload.data?.cufe;
      }
      if (payload.numero || payload.data?.numero) {
        invoiceUpdates.numero_factura_dian = payload.numero || payload.data?.numero;
      }
    } else if (eventType.includes('rejected') || eventType.includes('rechazada') || payload.estado === 'RECHAZADA') {
      console.log('Invoice rejected');
      invoiceUpdates.estado = 'RECHAZADA';
      invoiceUpdates.errores_validacion = {
        error: payload.error || payload.mensaje_error || payload.message || 'Rechazada por DIAN',
        timestamp: new Date().toISOString(),
      };
      shouldUpdate = true;
    }

    // Try to find and update invoice
    if (shouldUpdate && invoiceReference) {
      // Try to find invoice by DIAN number or ID
      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('id, doctor_id')
        .or(`numero_factura_dian.ilike.%${invoiceReference}%,id.eq.${invoiceReference}`)
        .limit(5);

      console.log('Found invoices:', invoices?.length);

      if (invoices && invoices.length > 0) {
        const invoice = invoices[0];
        
        // Update invoice
        const { error: updateError } = await supabaseAdmin
          .from('invoices')
          .update(invoiceUpdates)
          .eq('id', invoice.id);

        if (updateError) {
          console.error('Error updating invoice:', updateError);
        } else {
          console.log('Invoice updated successfully:', invoice.id);
        }

        // Mark webhook as processed
        if (webhookEvent) {
          await supabaseAdmin
            .from('dian_webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              invoice_id: invoice.id,
            })
            .eq('id', webhookEvent.id);
        }

        // Update emission log
        const { error: logUpdateError } = await supabaseAdmin
          .from('dian_emission_logs')
          .update({
            status: invoiceUpdates.estado === 'VALIDADA' ? 'SUCCESS' : 'ERROR',
            response_payload: payload,
            cufe: invoiceUpdates.cufe,
            numero_dian: invoiceUpdates.numero_factura_dian,
          })
          .eq('invoice_id', invoice.id)
          .eq('provider', 'ALANUBE')
          .order('created_at', { ascending: false })
          .limit(1);

        if (logUpdateError) {
          console.error('Error updating emission log:', logUpdateError);
        }
      } else {
        console.warn('No invoice found for reference:', invoiceReference);
        
        // Mark webhook as processed with error
        if (webhookEvent) {
          await supabaseAdmin
            .from('dian_webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              error_message: 'Invoice not found for reference: ' + invoiceReference,
            })
            .eq('id', webhookEvent.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
