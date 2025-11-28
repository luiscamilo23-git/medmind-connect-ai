import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente médico experto. Tu tarea es analizar transcripciones de consultas médicas y extraer información estructurada para llenar una historia clínica.

Extrae la siguiente información de la transcripción:
- Nombre del paciente (si se menciona)
- Identificación del paciente (si se menciona)
- Motivo de consulta
- Enfermedad actual (historia detallada)
- Revisión por sistemas (ROS)
- Antecedentes médicos
- Examen físico (si se describe)
- Diagnóstico (si se menciona)
- Código CIE-10 (si es posible determinarlo)
- Plan de tratamiento
- Medicamentos prescritos
- Educación al paciente
- Seguimiento

IMPORTANTE: Solo extrae información que esté EXPLÍCITAMENTE mencionada en la transcripción. No inventes información. Si algo no está mencionado, déjalo vacío.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_clinical_data",
              description: "Extrae información estructurada de la transcripción médica",
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string", description: "Nombre completo del paciente" },
                  patientIdentification: { type: "string", description: "Número de identificación del paciente" },
                  chiefComplaint: { type: "string", description: "Motivo principal de consulta" },
                  currentIllness: { type: "string", description: "Historia detallada de la enfermedad actual" },
                  ros: { type: "string", description: "Revisión por sistemas" },
                  medicalHistory: { type: "string", description: "Antecedentes médicos, quirúrgicos, familiares" },
                  physicalExam: { type: "string", description: "Hallazgos del examen físico" },
                  diagnosticAids: { type: "string", description: "Resultados de laboratorio o estudios" },
                  diagnosis: { type: "string", description: "Diagnóstico o impresión diagnóstica" },
                  cie10Code: { type: "string", description: "Código CIE-10 si es identificable" },
                  treatment: { type: "string", description: "Plan de tratamiento" },
                  medications: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de medicamentos prescritos"
                  },
                  education: { type: "string", description: "Educación o recomendaciones al paciente" },
                  followup: { type: "string", description: "Plan de seguimiento" }
                },
                required: [],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_clinical_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso de IA excedido" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No se recibió respuesta estructurada de la IA");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-clinical-info:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});