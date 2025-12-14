import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. CONEXIÓN A SUPABASE
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado");

    // 2. PREPARACIÓN DE DATOS
    // Usamos el ID limpio (sin guiones) para evitar problemas con Evolution
    const instanceName = user.id.replace(/-/g, "");
    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    // Busca ambos nombres de secreto por seguridad
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK") || Deno.env.get("N8N_WEBHOOK_URL");

    if (!evoUrl || !evoKey || !webhookUrl) throw new Error("Faltan secretos de configuración");

    console.log(`Procesando instancia: ${instanceName}`);

    // 3. CREAR INSTANCIA (Paso A)
    // Nota: Solo enviamos lo básico aquí para evitar Error 400
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhook: webhookUrl,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"],
      }),
    });

    const createText = await createRes.text();

    // Si falla pero NO es porque ya existe, lanzamos error
    if (!createRes.ok && !createText.includes("already exists")) {
      throw new Error(`Evolution Error: ${createText}`);
    }

    // Intentamos rescatar el QR
    let qrCode = null;
    try {
      const json = JSON.parse(createText);
      qrCode = json.qrcode?.base64 || json.base64 || json.qr?.base64;
    } catch (e) {
      console.log("No hay QR nuevo (instancia ya existía)");
    }

    // 4. CONFIGURAR AJUSTES (Paso B - Separado para evitar Error 400)
    await new Promise((r) => setTimeout(r, 1500)); // Pausa técnica

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

    // 5. GUARDAR ID EN PERFIL
    await supabaseClient.from("profiles").update({ whatsapp_instance_name: instanceName }).eq("id", user.id);

    // 6. ÉXITO
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
