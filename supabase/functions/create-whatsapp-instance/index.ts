import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Manejo de CORS (Permisos)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Conectar a Supabase para saber quién eres
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado");

    // 3. Preparar Datos (Usamos tu ID como nombre de instancia)
    const instanceName = user.id;
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    // IMPORTANTE: Asegúrate de que este secreto "MEDMIND_WEBHOOK" exista en Lovable
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK");

    if (!evoUrl || !evoKey || !webhookUrl) {
      throw new Error("Faltan secretos (EVOLUTION_API_URL, API_KEY o MEDMIND_WEBHOOK)");
    }

    console.log(`Creando instancia: ${instanceName} conectada a ${webhookUrl}`);

    // 4. CREAR INSTANCIA + CONFIGURAR WEBHOOK (Todo en uno)
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhook: webhookUrl, // ¡Aquí conectamos n8n de una vez!
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"],
      }),
    });

    // Si falla, revisamos por qué (si ya existe, seguimos adelante)
    if (!createRes.ok) {
      const errorText = await createRes.text();
      if (!errorText.includes("already exists")) {
        throw new Error(`Error Evolution API: ${errorText}`);
      }
    }

    const createData = await createRes.json();

    // 5. CONFIGURACIÓN EXTRA (Rechazar llamadas, Always Online, etc.)
    // Esperamos 1.5 seg para asegurar que la instancia cargó
    await new Promise((r) => setTimeout(r, 1500));

    await fetch(`${evoUrl}/settings/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        reject_call: true,
        msgCall: "No recibo llamadas, por favor escribe tu mensaje.",
        groups_ignore: true,
        always_online: true,
        read_messages: true,
        read_status: true,
      }),
    });

    // 6. GUARDAR EN BASE DE DATOS (Vital para tu n8n)
    const { error: dbError } = await supabaseClient
      .from("profiles")
      .update({ whatsapp_instance_name: instanceName })
      .eq("id", user.id);

    if (dbError) console.error("Error guardando en perfil:", dbError);

    // 7. DEVOLVER EL QR
    return new Response(
      JSON.stringify({
        qrcode: createData.qrcode?.base64 || createData.base64 || null,
        instanceName: instanceName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
