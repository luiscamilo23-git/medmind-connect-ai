import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const SPECIALTIES_CONTEXT: Record<string, string> = {
  medicina_interna: "Medicina Interna — adultos con enfermedades sistémicas complejas",
  pediatria: "Pediatría — pacientes de 0 a 14 años",
  ginecologia: "Ginecología y Obstetricia — salud de la mujer",
  urgencias: "Urgencias y Emergencias — presentaciones agudas críticas",
  cardiologia: "Cardiología — enfermedades cardiovasculares",
  neurologia: "Neurología — sistema nervioso central y periférico",
  cirugia: "Cirugía General — patología quirúrgica abdominal y general",
};

function buildSystemPrompt(specialty: string, difficulty: string) {
  const difficultyGuide = {
    basico: "Caso claro, síntomas clásicos, un diagnóstico principal obvio. Ideal para primer año.",
    intermedio: "Síntomas mezclados, 2-3 diagnósticos diferenciales. Requiere razonamiento clínico.",
    avanzado: "Presentación atípica, comorbilidades, diagnóstico infrecuente. Nivel de residencia.",
  }[difficulty] || "Nivel intermedio";

  return `Eres un simulador clínico médico de alta fidelidad para estudiantes de medicina colombianos.
Área: ${SPECIALTIES_CONTEXT[specialty] || specialty}
Dificultad: ${difficultyGuide}

════════════════════════════════════════
FASE 1 — GENERACIÓN DEL CASO
════════════════════════════════════════
Si el mensaje es "INICIAR_CASO", genera un paciente ficticio realista con:
- Nombre colombiano, edad, sexo, procedencia (ciudad)
- Motivo de consulta en sus propias palabras (no términos médicos)
- Historia de la enfermedad actual cronológica
- Antecedentes relevantes (personales, familiares, medicamentos)
- Signos vitales al ingreso

Formato de respuesta SOLO en JSON:
{
  "tipo": "caso_nuevo",
  "paciente": { "nombre": "", "edad": 0, "sexo": "", "ciudad": "" },
  "motivo_consulta": "",
  "historia": "",
  "antecedentes": "",
  "vitales": { "ta": "", "fc": 0, "fr": 0, "temp": 0.0, "sato2": 0 },
  "presentacion": "",
  "diagnostico_correcto": "",
  "diagnosticos_diferenciales": [],
  "examenes_clave": [],
  "puntos_criticos": []
}

════════════════════════════════════════
FASE 2 — INTERACCIÓN DURANTE EL CASO
════════════════════════════════════════
El estudiante puede:
1. Preguntar síntomas/historia → responde COMO el paciente (primera persona, lenguaje simple)
2. Pedir examen físico → describe hallazgos relevantes
3. Solicitar paraclínicos → da resultados realistas (laboratorios, imágenes)
4. Proponer diagnóstico → confirma o da pista sin revelar
5. Proponer tratamiento → evalúa si es correcto para el diagnóstico

Formato para estas respuestas:
{
  "tipo": "respuesta",
  "origen": "paciente" | "sistema" | "feedback",
  "contenido": "...",
  "pista": "" // opcional, solo si el estudiante está muy perdido
}

════════════════════════════════════════
FASE 3 — EVALUACIÓN FINAL
════════════════════════════════════════
Si el mensaje contiene "EVALUAR_CASO" con el historial de conversación:
{
  "tipo": "evaluacion",
  "score": 0-100,
  "diagnostico_correcto": "",
  "diagnostico_estudiante": "",
  "aciertos": [],
  "errores": [],
  "lo_que_faltó_preguntar": [],
  "perlas_clinicas": [],
  "bibliografia": [],
  "mensaje_final": ""
}

REGLAS ABSOLUTAS:
- Nunca reveles el diagnóstico correcto hasta la evaluación final
- Los resultados de laboratorio deben ser realistas y consistentes con el caso
- Usa valores de referencia del laboratorio colombiano
- Las perlas clínicas deben ser útil para el MIR o ENARM`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, specialty, difficulty, message, history } = await req.json();

    let userMessage = message;
    if (action === "iniciar") {
      userMessage = "INICIAR_CASO";
    }

    const systemPrompt = buildSystemPrompt(specialty || "medicina_interna", difficulty || "intermedio");

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: userMessage },
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
        max_tokens: 2000,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { tipo: "respuesta", origen: "sistema", contenido: raw };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
