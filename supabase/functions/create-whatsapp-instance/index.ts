import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de Preflight (CORS)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. OBTENER USUARIO
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado");

    // 2. PREPARAR DATOS
    // Limpiamos el nombre (quitamos guiones)
    const instanceName = user.id.replace(/-/g, "");
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK") || Deno.env.get("N8N_WEBHOOK_URL");

    if (!evoUrl || !evoKey || !webhookUrl) throw new Error("Faltan secretos");

    console.log(`Intentando crear instancia: ${instanceName}`);

    // ---------------------------------------------------------
    // PASO A: CREAR INSTANCIA (ULTRA-MINIMALISTA)
    // ---------------------------------------------------------
    // Quitamos 'integration' y 'webhook' para evitar el bug "reading length"
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
      }),
    });

    const createText = await createRes.text();

    // Si falla, revisamos si es porque ya existe
    if (!createRes.ok && !createText.includes("already exists")) {
      console.error("Error Crudo Evolution:", createText);
      throw new Error(`Evolution rechazó la creación: ${createText}`);
    }

    // Intentamos rescatar el QR del JSON (si se creó nueva)
    let qrCode = null;
    try {
      const json = JSON.parse(createText);
      qrCode = json.qrcode?.base64 || json.base64 || json.qr?.base64;
    } catch (e) {
      console.log("Instancia ya existía, no hay QR nuevo en respuesta inicial");
    }

    // ---------------------------------------------------------
    // PASO B: INYECTAR WEBHOOK Y CONFIGURACIÓN (DELAY DE SEGURIDAD)
    // ---------------------------------------------------------
    // Esperamos 2.5 segundos para que la base de datos de Evolution respire
    await new Promise((r) => setTimeout(r, 2500));

    console.log(`Configurando Webhook...`);

    // 1. Set Webhook
    const webhookRes = await fetch(`${evoUrl}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"],
      }),
    });

    // 2. Set Comportamiento
    await fetch(`${evoUrl}/settings/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        reject_call: true,
        msgCall: "No recibo llamadas, agenda por chat.",
        groups_ignore: true,
        always_online: true,
        read_messages: true,
        read_status: true,
      }),
    });

    // ---------------------------------------------------------
    // PASO C: ACTUALIZAR PERFIL SUPABASE
    // ---------------------------------------------------------
    await supabaseClient.from("profiles").update({ whatsapp_instance_name: instanceName }).eq("id", user.id);

    // Respuesta Final
    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrCode,
        instanceName: instanceName,
        webhookStatus: webhookRes.ok ? "Configurado" : "Pendiente",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
