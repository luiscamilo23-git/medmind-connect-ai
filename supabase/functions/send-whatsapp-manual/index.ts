import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Autenticar médico
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Usuario no autenticado");

    const { conversation_id, message } = await req.json();
    if (!conversation_id || !message?.trim()) throw new Error("conversation_id y message son requeridos");

    // Verificar que la conversación pertenece al doctor
    const { data: conv, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("id, patient_phone, doctor_id, is_bot_active")
      .eq("id", conversation_id)
      .eq("doctor_id", user.id)
      .single();

    if (convError || !conv) throw new Error("Conversación no encontrada");

    // Obtener instance_name del perfil del doctor
    const { data: profile } = await supabase
      .from("profiles")
      .select("whatsapp_instance_name")
      .eq("id", user.id)
      .single();

    if (!profile?.whatsapp_instance_name) throw new Error("WhatsApp no conectado");

    // Guardar mensaje en BD
    const { error: msgError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id,
        direction: "outbound",
        sender: "doctor",
        content: message.trim(),
        is_read: true,
      });

    if (msgError) throw msgError;

    // Actualizar conversación
    await supabase
      .from("whatsapp_conversations")
      .update({
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation_id);

    // Enviar vía Evolution API
    const phone = conv.patient_phone.replace(/\D/g, "");
    const evolutionRes = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${profile.whatsapp_instance_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: phone,
          textMessage: { text: message.trim() },
        }),
      }
    );

    if (!evolutionRes.ok) {
      const errText = await evolutionRes.text();
      console.error("Evolution API error:", errText);
      // No lanzar error — mensaje ya fue guardado en BD
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error send-whatsapp-manual:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
