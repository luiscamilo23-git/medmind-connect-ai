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
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header presente:", !!authHeader);
    
    if (!authHeader) {
      throw new Error("No se encontró token de autorización");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error("Error de autenticación:", userError.message);
      throw new Error(`Error de autenticación: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    console.log("Usuario autenticado:", user.id);

    // 2. LIMPIAR NOMBRE (quitar guiones del UUID)
    const instanceName = user.id.replace(/-/g, "");
    
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK");

    if (!evoUrl || !evoKey) {
      throw new Error("Faltan secretos de Evolution API");
    }

    console.log(`[1/5] Creando instancia mínima: ${instanceName}`);
    console.log(`Evolution URL: ${evoUrl}`);

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
    console.log("QR obtenido de create:", !!qrCode);

    // 4. ESPERAR para que la instancia se sincronice
    console.log(`[3/5] Esperando sincronización...`);
    await new Promise(r => setTimeout(r, 1500));

    // 5. CONFIGURAR WEBHOOK (llamada separada)
    if (webhookUrl) {
      console.log(`[4/5] Configurando webhook: ${webhookUrl}`);
      try {
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
      } catch (webhookError) {
        console.error("Error configurando webhook:", webhookError);
      }
    }

    // 6. CONFIGURAR SETTINGS (llamada separada)
    console.log(`[5/5] Configurando settings...`);
    try {
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
    } catch (settingsError) {
      console.error("Error configurando settings:", settingsError);
    }

    // Si no obtuvimos QR en la creación, intentar obtenerlo del endpoint connect
    if (!qrCode) {
      console.log(`Obteniendo QR desde endpoint connect...`);
      try {
        const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: { apikey: evoKey },
        });
        if (connectRes.ok) {
          const connectData = await connectRes.json();
          console.log("Connect response:", JSON.stringify(connectData));
          qrCode = connectData.code || connectData.base64 || connectData.qrcode?.base64;
        } else {
          console.log("Connect failed:", await connectRes.text());
        }
      } catch (connectError) {
        console.error("Error obteniendo QR:", connectError);
      }
    }

    // 7. GUARDAR EN PROFILES
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ whatsapp_instance_name: instanceName })
      .eq("id", user.id);
    
    if (updateError) {
      console.error("Error actualizando perfil:", updateError);
    }

    console.log(`Instancia ${instanceName} creada. QR disponible: ${!!qrCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: qrCode, // Nombre correcto para el frontend
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
