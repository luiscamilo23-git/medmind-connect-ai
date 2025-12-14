import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. PREPARAR DATOS
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado");

    // Limpiamos el nombre (quitamos guiones)
    const instanceName = user.id.replace(/-/g, "");
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK") || Deno.env.get("N8N_WEBHOOK_URL");

    if (!evoUrl || !evoKey || !webhookUrl) throw new Error("Faltan secretos de configuración");

    console.log(`Creando instancia básica: ${instanceName}`);

    // 2. CREAR INSTANCIA (SOLO QR, SIN WEBHOOK AÚN)
    // Quitamos "webhook" de aquí para evitar el error "reading length"
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    const createText = await createRes.text();

    if (!createRes.ok && !createText.includes("already exists")) {
      throw new Error(`Evolution Error: ${createText}`);
    }

    // Rescatar QR
    let qrCode = null;
    try {
      const json = JSON.parse(createText);
      qrCode = json.qrcode?.base64 || json.base64 || json.qr?.base64;
    } catch (e) {}

    // 3. CONFIGURAR WEBHOOK (PASO SEPARADO)
    // Esperamos 2 segundos para asegurar que la instancia existe
    await new Promise((r) => setTimeout(r, 2000));

    console.log(`Configurando Webhook en: ${webhookUrl}`);
    await fetch(`${evoUrl}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"],
      }),
    });

    // 4. CONFIGURAR COMPORTAMIENTO
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

    // 5. ACTUALIZAR BASE DE DATOS
    await supabaseClient.from("profiles").update({ whatsapp_instance_name: instanceName }).eq("id", user.id);

    // FIN
    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrCode,
        instanceName: instanceName,
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
