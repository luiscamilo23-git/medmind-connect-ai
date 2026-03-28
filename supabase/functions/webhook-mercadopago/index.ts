import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await req.json();
    console.log("MercadoPago webhook recibido:", JSON.stringify(body));

    // MercadoPago envía notificaciones tipo "payment"
    if (body.type !== "payment") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) throw new Error("No payment ID");

    // Consultar detalles del pago en MercadoPago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    if (!paymentResponse.ok) throw new Error("No se pudo obtener el pago de MP");
    const payment = await paymentResponse.json();

    console.log("Pago MP:", payment.status, payment.external_reference);

    // Parsear referencia externa: "doctor_id|plan_id"
    const [doctorId, planId] = (payment.external_reference || "").split("|");
    if (!doctorId || !planId) throw new Error("Referencia externa inválida");

    if (payment.status === "approved") {
      // Activar suscripción
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          doctor_id: doctorId,
          plan_id: planId,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          mercadopago_sub_id: String(paymentId),
          mercadopago_payer_id: String(payment.payer?.id || ""),
          updated_at: new Date().toISOString(),
        }, { onConflict: "doctor_id" });

      if (error) throw error;
      console.log(`✅ Suscripción activada para doctor ${doctorId}`);

    } else if (["rejected", "cancelled"].includes(payment.status)) {
      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("doctor_id", doctorId);

      console.log(`❌ Pago rechazado para doctor ${doctorId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Webhook error:", error);
    // Siempre devolver 200 a MP para que no reintente
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
