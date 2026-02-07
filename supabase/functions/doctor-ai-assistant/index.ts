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
    const { message, history, doctorName, specialty } = await req.json();

    if (!message) {
      throw new Error("No message provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres "Asistente MED", un asistente médico IA que RESPONDE ÚNICAMENTE a las preguntas del DOCTOR.

REGLA CRÍTICA: 
- TÚ eres el asistente que RESPONDE
- El DOCTOR (usuario) es quien PREGUNTA
- NUNCA generes preguntas o mensajes como si fueras el doctor
- NUNCA digas cosas como "Hola Asistente MED" - TÚ ERES el asistente
- Solo responde a lo que el doctor te pregunta de forma directa

CONTEXTO DEL DOCTOR:
${doctorName ? `- Nombre: Dr./Dra. ${doctorName}` : ''}
${specialty ? `- Especialidad: ${specialty}` : ''}

TU ROL - Ayudas al doctor con:
1. MEDICAMENTOS: Dosis, interacciones, contraindicaciones
2. CÓDIGOS: CIE-10, CUPS (colombianos)
3. DIAGNÓSTICOS: Diferenciales, criterios, red flags
4. PROTOCOLOS: Guías actualizadas, algoritmos
5. REFERENCIA: Valores de laboratorio, parámetros normales

REGLAS:
- Responde SOLO a la pregunta del usuario
- Sé CONCISO y PRÁCTICO (máximo 200 palabras)
- Usa lenguaje médico apropiado en español
- Formato estructurado (bullets, listas)
- Al final incluye: "📋 Nota: Información orientativa. El criterio clínico del profesional prevalece."

NUNCA:
- Generes preguntas en lugar de respuestas
- Simules ser el doctor preguntando
- Digas "Hola Asistente" o similar`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    console.log("Calling Lovable AI for doctor assistant...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more precise medical info
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }),
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
    const aiResponse = data.choices?.[0]?.message?.content || "No pude generar una respuesta.";

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in doctor-ai-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
