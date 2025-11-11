import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Generating medical record from transcript...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Eres un asistente médico especializado en organizar consultas médicas transcritas.

TAREA: Analiza esta transcripción LITERAL de una consulta médica y organízala en una historia clínica profesional.

CONTEXTO CRÍTICO:
- La transcripción contiene diálogo entre MÉDICO y PACIENTE
- Puede incluir preguntas del médico y respuestas del paciente
- Tu trabajo es identificar quién habla (médico vs paciente) y extraer la información médica relevante

IDENTIFICACIÓN DE INTERLOCUTORES:
- El MÉDICO hace preguntas, guía la consulta: "¿Desde cuándo?", "¿Dónde le duele?", "¿Ha tomado algo?"
- El PACIENTE describe síntomas, responde: "Me duele...", "Desde hace...", "Siento que..."
- Si no está claro quién habla, infiere por el contexto

EXTRACCIÓN DE INFORMACIÓN:
- Síntomas: TODO lo que el paciente describe que siente/padece
- Motivo de consulta: La razón principal por la que vino
- Antecedentes: Cualquier mención de medicamentos previos, condiciones, alergias
- Evolución: Duración, progresión, factores agravantes/atenuantes

IMPORTANTE: 
- NO inventes información que no esté en la transcripción
- Si el médico preguntó algo pero el paciente no respondió claramente, anótalo en "notes"
- Usa terminología médica profesional pero mantén la fidelidad a lo dicho

RESPONDE CON ESTE JSON:
{
  "chief_complaint": "Motivo principal de consulta en términos médicos",
  "symptoms": ["síntoma 1 con detalles", "síntoma 2", "síntoma 3"],
  "diagnosis": "Impresión diagnóstica basada en síntomas (o 'Pendiente de evaluación')",
  "treatment_plan": "Plan terapéutico sugerido o implementado",
  "medications": ["medicamento - dosis - vía - frecuencia"],
  "notes": "Información adicional: preguntas sin respuesta clara, observaciones del médico, antecedentes mencionados, seguimiento requerido"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza y organiza esta transcripción literal de consulta médica:

TRANSCRIPCIÓN COMPLETA:
${transcript}

Genera la historia clínica en formato JSON identificando claramente quién dice qué (médico vs paciente) y extrayendo la información médica relevante.` }
        ],
        temperature: 0.3, // Balance entre precisión y comprensión contextual
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de uso excedido. Por favor intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos agotados. Por favor agrega fondos en Settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('Generated text:', generatedText);

    // Parse the JSON from the AI response
    let medicalRecord;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedText;
      medicalRecord = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', generatedText);
      throw new Error('Failed to parse medical record. Please try again.');
    }

    console.log('Successfully generated medical record');

    return new Response(
      JSON.stringify({ medicalRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-medical-record:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});