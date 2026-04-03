import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_PER_HOUR = 100; // calls per hour per doctor

async function checkAndIncrementRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  endpoint: string,
): Promise<{ allowed: boolean; resetAt?: string }> {
  const now = new Date();

  // Fetch existing record
  const { data: existing } = await supabase
    .from("rate_limit_usage")
    .select("count, reset_at")
    .eq("doctor_id", userId)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (existing) {
    const resetAt = new Date(existing.reset_at);
    if (resetAt > now) {
      // Window still active
      if (existing.count >= RATE_LIMIT_PER_HOUR) {
        return { allowed: false, resetAt: existing.reset_at };
      }
      // Increment
      await supabase
        .from("rate_limit_usage")
        .update({ count: existing.count + 1 })
        .eq("doctor_id", userId)
        .eq("endpoint", endpoint);
      return { allowed: true };
    }
    // Window expired — reset
    await supabase
      .from("rate_limit_usage")
      .update({ count: 1, reset_at: new Date(now.getTime() + 3600_000).toISOString() })
      .eq("doctor_id", userId)
      .eq("endpoint", endpoint);
    return { allowed: true };
  }

  // First call ever
  await supabase.from("rate_limit_usage").insert({
    doctor_id: userId,
    endpoint,
    count: 1,
    reset_at: new Date(now.getTime() + 3600_000).toISOString(),
  });
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rate limiting
    const { allowed, resetAt } = await checkAndIncrementRateLimit(supabase, user.id, "doctor-ai-assistant");
    if (!allowed) {
      const resetTime = resetAt ? new Date(resetAt).toLocaleTimeString("es-CO") : "1 hora";
      return new Response(
        JSON.stringify({ error: `Límite de consultas IA alcanzado (${RATE_LIMIT_PER_HOUR}/hora). Se reinicia a las ${resetTime}.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
${doctorName ? `- Nombre: Dr./Dra. ${doctorName}` : ""}
${specialty ? `- Especialidad: ${specialty}` : ""}

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "No pude generar una respuesta.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
