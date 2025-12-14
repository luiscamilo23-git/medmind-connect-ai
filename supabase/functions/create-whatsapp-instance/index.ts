import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. AUTENTICACIÓN Y DATOS
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado");

    const instanceName = user.id.replace(/-/g, ""); // Nombre limpio
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK") || Deno.env.get("N8N_WEBHOOK_URL");

    if (!evoUrl || !evoKey) throw new Error("Faltan secretos de Evolution API");

    console.log(`Iniciando proceso para: ${instanceName}`);

    // ---------------------------------------------------------
    // PASO 1: CREAR INSTANCIA (MODO SILENCIOSO)
    // ---------------------------------------------------------
    // Ponemos qrcode: false para que NO intente generarlo aquí y evite el error 'length'
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode: false,
      }),
    });

    const createText = await createRes.text();

    // Si falla y NO es porque ya existe, lanzamos error
    if (!createRes.ok && !createText.includes("already exists")) {
      throw new Error(`Error Creando Instancia: ${createText}`);
    }

    // ---------------------------------------------------------
    // PASO 2: OBTENER QR (ENDPOINT DEDICADO)
    // ---------------------------------------------------------
    // Aquí es donde usamos la doc que me pasaste: /instance/connect/{instance}
    // Esperamos 1.5s para asegurar que la instancia se creó
    await new Promise((r) => setTimeout(r, 1500));

    console.log("Generando QR desde endpoint Connect...");
    const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: { apikey: evoKey },
    });

    if (!connectRes.ok) {
      const err = await connectRes.text();
      throw new Error(`Error obteniendo QR: ${err}`);
    }

    // Extraemos el QR de este endpoint específico
    const connectData = await connectRes.json();
    // En el endpoint connect, el QR suele venir en 'code' o 'base64'
    const qrCode = connectData.code || connectData.base64 || connectData.qrcode?.base64;

    // ---------------------------------------------------------
    // PASO 3: CONFIGURAR WEBHOOK Y AJUSTES
    // ---------------------------------------------------------
    if (webhookUrl) {
      // Webhook
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

      // Settings (Reject Call, etc)
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
    }

    // Actualizar Perfil
    await supabaseClient.from("profiles").update({ whatsapp_instance_name: instanceName }).eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrCode, // Aquí va el QR real
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
