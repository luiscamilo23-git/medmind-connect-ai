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

    const systemPrompt = `Eres un asistente médico experto en el sistema de salud colombiano. Tu tarea es analizar transcripciones de consultas médicas y extraer información estructurada para llenar una historia clínica completa según la normativa colombiana (Resolución 1995/1999).

CONTEXTO MÉDICO COLOMBIANO:
- Las historias clínicas deben cumplir con la normativa del Ministerio de Salud de Colombia
- Los diagnósticos deben asociarse con códigos CIE-10 cuando sea posible
- Los medicamentos deben incluir nombre genérico, dosis, vía y frecuencia

EXTRAE LA SIGUIENTE INFORMACIÓN (solo lo que esté EXPLÍCITAMENTE mencionado):

1. **IDENTIFICACIÓN**: Nombre completo del paciente, documento de identidad
2. **MOTIVO DE CONSULTA**: Síntoma o queja principal en palabras del paciente
3. **ENFERMEDAD ACTUAL**: Historia cronológica detallada del padecimiento actual
4. **REVISIÓN POR SISTEMAS (ROS)**: Síntomas por sistemas (cardiovascular, respiratorio, digestivo, etc.)
5. **ANTECEDENTES**: 
   - Personales patológicos (enfermedades previas)
   - Quirúrgicos (cirugías previas)
   - Farmacológicos (medicamentos actuales)
   - Alérgicos
   - Familiares
   - Tóxico-alérgicos
6. **EXAMEN FÍSICO**: Hallazgos del examen físico organizado por sistemas
7. **AYUDAS DIAGNÓSTICAS**: Resultados de laboratorios, imágenes, etc.
8. **DIAGNÓSTICO**: Impresión diagnóstica con código CIE-10 si es posible
9. **PLAN DE TRATAMIENTO**: Medicamentos, procedimientos, interconsultas
10. **EDUCACIÓN**: Recomendaciones y educación al paciente
11. **SEGUIMIENTO**: Plan de control y seguimiento

REGLAS CRÍTICAS:
- NUNCA inventes información que no esté en la transcripción
- Si algo no se menciona, déjalo VACÍO (no pongas "No se menciona" o similar)
- Sé PRECISO en la extracción, respeta las palabras exactas cuando sea posible
- Para CIE-10, sugiere el código más probable basado en el diagnóstico mencionado`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analiza esta transcripción de consulta médica y extrae la información clínica estructurada:\n\n${transcript}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_clinical_data",
              description: "Extrae información estructurada de la transcripción médica según normativa colombiana",
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string", description: "Nombre completo del paciente" },
                  patientIdentification: { type: "string", description: "Número de identificación (CC, TI, etc.)" },
                  chiefComplaint: { type: "string", description: "Motivo principal de consulta en palabras del paciente" },
                  currentIllness: { type: "string", description: "Historia detallada cronológica de la enfermedad actual" },
                  ros: { type: "string", description: "Revisión por sistemas - síntomas por aparatos" },
                  medicalHistory: { type: "string", description: "Antecedentes: personales, quirúrgicos, familiares, alérgicos, farmacológicos" },
                  physicalExam: { type: "string", description: "Hallazgos del examen físico por sistemas" },
                  diagnosticAids: { type: "string", description: "Resultados de laboratorios, imágenes u otros estudios" },
                  diagnosis: { type: "string", description: "Diagnóstico o impresión diagnóstica" },
                  cie10Code: { type: "string", description: "Código CIE-10 correspondiente al diagnóstico" },
                  treatment: { type: "string", description: "Plan de tratamiento: medicamentos con dosis, procedimientos" },
                  medications: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de medicamentos con nombre, dosis, vía y frecuencia"
                  },
                  education: { type: "string", description: "Educación y recomendaciones al paciente" },
                  followup: { type: "string", description: "Plan de seguimiento y control" }
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
        return new Response(JSON.stringify({ error: "Límite de uso de IA excedido. Intenta en unos minutos." }), {
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

    // Clean empty strings - don't include fields that are empty
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value && (typeof value !== 'string' || value.trim() !== '')) {
        cleanedData[key] = value;
      }
    }

    console.log("Extracted clinical data fields:", Object.keys(cleanedData).length);

    return new Response(JSON.stringify({ extractedData: cleanedData }), {
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