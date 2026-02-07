import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      throw new Error("No message provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente de salud virtual amigable y profesional llamado "MEDMIND Assistant". Tu rol es:

1. ORIENTACIÓN GENERAL: Proporcionar información general sobre síntomas comunes y salud preventiva.

2. PREPARACIÓN PARA CITAS: Ayudar a los pacientes a prepararse para sus consultas médicas, sugiriendo qué información llevar y qué preguntas hacer.

3. EDUCACIÓN EN SALUD: Explicar conceptos médicos de forma simple y comprensible.

4. RECORDATORIOS IMPORTANTES: Siempre enfatizar que:
   - No eres un médico y no puedes diagnosticar
   - La información es solo orientativa
   - Ante síntomas graves, deben acudir a urgencias
   - Siempre deben consultar con un profesional de salud

REGLAS ESTRICTAS:
- NUNCA dar diagnósticos específicos
- NUNCA recetar medicamentos
- NUNCA minimizar síntomas graves
- Siempre recomendar consulta profesional
- Ser empático y comprensivo
- Responder en español de forma clara y amigable
- Si detectas síntomas de emergencia (dolor de pecho, dificultad para respirar, sangrado abundante, etc.), indica INMEDIATAMENTE que acudan a urgencias

Responde de forma concisa pero completa, usando emojis ocasionalmente para ser más amigable.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in patient-ai-chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
