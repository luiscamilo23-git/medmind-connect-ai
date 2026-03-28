import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { plan_id, plan_name } = await req.json();
    if (!plan_id || !plan_name) throw new Error("plan_id y plan_name son requeridos");

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Obtener usuario autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Usuario no autenticado");

    // Obtener plan de BD
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();
    if (planError || !plan) throw new Error("Plan no encontrado");

    // Obtener perfil del doctor
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Crear preferencia de pago en MercadoPago
    const preferenceBody = {
      items: [
        {
          id: plan.id,
          title: `MEDMIND ${plan.display_name}`,
          description: `Suscripción mensual MEDMIND Plan ${plan.display_name}`,
          quantity: 1,
          unit_price: plan.price_cop / 100, // MercadoPago Colombia usa pesos
          currency_id: "COP",
        },
      ],
      payer: {
        name: profile?.full_name || "",
        email: user.email || "",
      },
      back_urls: {
        success: `${Deno.env.get("FRONTEND_URL") || "https://medmind-connect-ai.lovable.app"}/billing/subscription?status=success&plan=${plan.name}`,
        failure: `${Deno.env.get("FRONTEND_URL") || "https://medmind-connect-ai.lovable.app"}/pricing?status=error`,
        pending: `${Deno.env.get("FRONTEND_URL") || "https://medmind-connect-ai.lovable.app"}/billing/subscription?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
      metadata: {
        doctor_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
      },
      statement_descriptor: "MEDMIND",
      external_reference: `${user.id}|${plan.id}`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.text();
      throw new Error(`MercadoPago error: ${err}`);
    }

    const preference = await mpResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        init_point: preference.init_point,        // Producción
        sandbox_init_point: preference.sandbox_init_point, // Sandbox para pruebas
        preference_id: preference.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
