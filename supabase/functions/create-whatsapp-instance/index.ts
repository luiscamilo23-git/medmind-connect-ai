import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. AUTENTICACIÓN
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado");

    // 2. LIMPIAR NOMBRE (quitar guiones del UUID)
    const instanceName = user.id.replace(/-/g, "");
    
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK");

    if (!evoUrl || !evoKey) throw new Error("Faltan secretos de Evolution API");

    console.log(`[1/5] Creando instancia mínima: ${instanceName}`);

    // 3. CREAR INSTANCIA (SOLO CAMPOS MÍNIMOS - SIN WEBHOOK NI SETTINGS)
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      }),
    });

    const createData = await createRes.json();
    console.log(`[2/5] Respuesta create:`, JSON.stringify(createData));

    // Si falla y NO es porque ya existe, lanzar error
    if (!createRes.ok && !JSON.stringify(createData).includes("already exists")) {
      throw new Error(`Error creando instancia: ${JSON.stringify(createData)}`);
    }

    // Extraer QR del response de creación
    let qrCode = createData.qrcode?.base64 || createData.base64 || createData.code;

    // 4. ESPERAR para que la instancia se sincronice
    console.log(`[3/5] Esperando sincronización...`);
    await new Promise(r => setTimeout(r, 1500));

    // 5. CONFIGURAR WEBHOOK (llamada separada)
    if (webhookUrl) {
      console.log(`[4/5] Configurando webhook...`);
      const webhookRes = await fetch(`${evoUrl}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"]
        }),
      });
      const webhookData = await webhookRes.text();
      console.log(`Webhook response:`, webhookData);
    }

    // 6. CONFIGURAR SETTINGS (llamada separada)
    console.log(`[5/5] Configurando settings...`);
    const settingsRes = await fetch(`${evoUrl}/settings/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        rejectCall: true,
        msgCall: "No recibo llamadas, agenda por chat.",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false
      }),
    });
    const settingsData = await settingsRes.text();
    console.log(`Settings response:`, settingsData);

    // Si no obtuvimos QR en la creación, intentar obtenerlo del endpoint connect
    if (!qrCode) {
      console.log(`Obteniendo QR desde endpoint connect...`);
      const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: { apikey: evoKey },
      });
      if (connectRes.ok) {
        const connectData = await connectRes.json();
        qrCode = connectData.code || connectData.base64 || connectData.qrcode?.base64;
      }
    }

    // 7. GUARDAR EN PROFILES
    await supabaseClient
      .from("profiles")
      .update({ whatsapp_instance_name: instanceName })
      .eq("id", user.id);

    console.log(`Instancia ${instanceName} creada y configurada exitosamente`);

    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrCode,
        instanceName: instanceName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en create-whatsapp-instance:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
