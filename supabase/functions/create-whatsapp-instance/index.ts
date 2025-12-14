import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. AUTENTICACIÓN
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Usuario no autenticado en Lovable");

    // 2. PREPARAR DATOS (Saneamiento y Secretos)
    // Quitamos los guiones del ID para que sea un nombre limpio (ej: "a1b2c3d4")
    const cleanInstanceName = user.id.replace(/-/g, "");

    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");

    // INTENTO DOBLE: Buscamos el secreto con el nombre nuevo O el viejo
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK") || Deno.env.get("N8N_WEBHOOK_URL");

    // Validación estricta con mensajes claros
    if (!evoUrl) throw new Error("Falta el secreto EVOLUTION_API_URL");
    if (!evoKey) throw new Error("Falta el secreto EVOLUTION_API_KEY");
    if (!webhookUrl) throw new Error("Falta el secreto del Webhook (MEDMIND_WEBHOOK o N8N_WEBHOOK_URL)");

    console.log(`Intentando crear instancia: ${cleanInstanceName} conectada a ${webhookUrl}`);

    // 3. LLAMADA A EVOLUTION (Crear + Configurar)
    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        instanceName: cleanInstanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhook: webhookUrl,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"],
      }),
    });

    const createText = await createRes.text(); // Leemos texto por si falla el JSON

    if (!createRes.ok) {
      // Si el error es "ya existe", lo ignoramos y seguimos para re-configurar
      if (!createText.includes("already exists")) {
        console.error("Error Evolution Create:", createText);
        throw new Error(`Evolution rechazó la creación: ${createText}`);
      }
      console.log("La instancia ya existía, procediendo a re-configurar...");
    }

    // Intentamos parsear la respuesta (si fue exitosa o "ya existe" con datos)
    let qrCode = null;
    try {
      const jsonData = JSON.parse(createText);
      qrCode = jsonData.qrcode?.base64 || jsonData.base64 || jsonData.qr?.base64;
    } catch (e) {
      console.log("No se pudo extraer QR del JSON inicial, tal vez ya existía.");
    }

    // 4. FORZAR CONFIGURACIÓN (Settings)
    // Pausa de seguridad
    await new Promise((r) => setTimeout(r, 1000));

    const settingsRes = await fetch(`${evoUrl}/settings/set/${cleanInstanceName}`, {
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

    if (!settingsRes.ok) console.warn("Advertencia: No se pudieron aplicar los Settings extra.");

    // 5. GUARDAR EN BASE DE DATOS (Actualizar Perfil)
    const { error: dbError } = await supabaseClient
      .from("profiles")
      .update({ whatsapp_instance_name: cleanInstanceName })
      .eq("id", user.id);

    if (dbError) throw new Error(`Error DB: ${dbError.message}`);

    // 6. RESPUESTA FINAL
    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrCode,
        instanceName: cleanInstanceName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    // Devolvemos el error real para verlo en la consola
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
