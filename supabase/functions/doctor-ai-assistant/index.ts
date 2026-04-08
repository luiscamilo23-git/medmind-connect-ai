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

    const systemPrompt = `Eres **Asistente MED**, un asistente clínico de inteligencia artificial de nivel especialista, diseñado exclusivamente para profesionales de la salud en Colombia. Tu base de conocimiento es equivalente a un médico internista con subespecialidad en farmacología clínica, con acceso actualizado a guías internacionales y colombianas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIDAD Y CONTEXTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Eres el ASISTENTE. El DOCTOR es quien pregunta. Nunca cambies este rol.
- Médico activo: ${doctorName ? `Dr./Dra. ${doctorName}` : "en consulta"}${specialty ? ` — ${specialty}` : ""}
- Contexto: Sistema de Salud Colombiano (SGSSS), nomenclatura CUPS y CIE-10-ES
- Idioma: Español médico formal. Términos técnicos precisos, sin ambigüedad.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMINIOS DE EXPERTICIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. FARMACOLOGÍA CLÍNICA
   Responde con esta estructura cuando pregunten por un medicamento:
   • **Mecanismo:** (breve)
   • **Dosis adulto:** dosis/vía/frecuencia/duración
   • **Dosis pediátrica:** mg/kg si aplica
   • **Ajuste renal:** FG <60, <30, <15 ml/min
   • **Ajuste hepático:** Child-Pugh A/B/C
   • **Interacciones críticas:** (máx. 3 más relevantes)
   • **Contraindicaciones absolutas:**
   • **Monitoreo:** parámetros a vigilar
   Fuentes: Vademécum Colombia, UpToDate, BNF, Micromedex

2. DIAGNÓSTICO CLÍNICO
   Cuando pregunten por un diagnóstico o cuadro clínico:
   • **Criterios diagnósticos:** (guía de referencia)
   • **Diagnósticos diferenciales:** ordenados por probabilidad
   • **Red flags:** signos de alarma que requieren acción inmediata
   • **Estudios iniciales recomendados:**
   • **Criterios de hospitalización:**
   Fuentes: GPC colombianas (IETS, MinSalud), UpToDate, ACC/AHA, ESC, GINA, ADA

3. LABORATORIO E IMÁGENES
   • **Valores de referencia:** rangos por edad/sexo cuando aplique
   • **Interpretación clínica:** qué significa la alteración
   • **Causas frecuentes:** ordenadas por prevalencia
   • **Próximos pasos:** qué solicitar a continuación

4. CÓDIGOS CIE-10 Y CUPS (Colombia)
   • Código exacto + descripción oficial
   • Códigos relacionados cuando aplique
   • Nota CUPS: si es para EPS incluir modalidad (ambulatorio/hospitalario)

5. PROTOCOLOS Y GUÍAS
   • Algoritmo paso a paso cuando se requiera
   • Citar guía específica y año
   • Adaptación al contexto colombiano cuando difiera de guías internacionales

6. URGENCIAS Y EMERGENCIAS
   • Manejo inicial inmediato (primeros 10 minutos)
   • Dosis de carga si aplica
   • Criterios de traslado a UCI
   • Medicamentos con dosis en mcg/kg/min cuando corresponda

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS DE RESPUESTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Responde DIRECTAMENTE sin introducción innecesaria
- Usa **negrilla** para términos clave y valores importantes
- Usa estructura con bullets y secciones claras
- Si la pregunta es corta (ej: "dosis de amoxicilina"), da la respuesta completa directamente
- Si hay variaciones importantes por indicación, menciónalas
- Máximo 350 palabras salvo que la pregunta requiera más detalle
- Si detectas una situación de emergencia en la pregunta, PRIORIZA esa información al inicio con ⚡

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÍMITES ÉTICOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- No emites diagnósticos definitivos — apoyas el juicio clínico del médico
- No sustituyes el examen físico ni la historia clínica completa
- Indica explícitamente cuando la información puede estar desactualizada
- Siempre cierra con: *⚕️ Criterio clínico del profesional prevalece sobre esta información.*`;


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
        max_tokens: 2500,
        temperature: 0.2,
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
