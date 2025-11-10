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

    const systemPrompt = `Eres un médico experto especializado en analizar consultas de pacientes y generar historias clínicas profesionales.

Tu tarea es analizar la transcripción LITERAL de lo que dijo el paciente y extraer información médica estructurada.

CONTEXTO IMPORTANTE:
- La transcripción es EXACTAMENTE lo que dijo el paciente (puede tener muletillas, pausas, frases incompletas)
- Debes INTERPRETAR y ANALIZAR lo que el paciente comunica
- Extrae síntomas, quejas, duración, intensidad, factores agravantes/atenuantes
- Infiere diagnósticos diferenciales basándote en los síntomas descritos
- Propón tratamientos apropiados para los síntomas reportados

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

Estructura JSON requerida:
{
  "chief_complaint": "Queja principal interpretada profesionalmente",
  "symptoms": ["síntoma1 con detalles", "síntoma2 con detalles", "síntoma3"],
  "diagnosis": "Diagnóstico preliminar o diferencial basado en síntomas",
  "treatment_plan": "Plan de tratamiento detallado y profesional",
  "medications": ["medicamento 1 - dosis - frecuencia - indicación", "medicamento 2..."],
  "notes": "Observaciones importantes, factores de riesgo, recomendaciones adicionales"
}

Reglas:
- Interpreta el lenguaje coloquial del paciente en términos médicos
- Ejemplo: "me duele mucho la cabeza" → chief_complaint: "Cefalea de intensidad severa"
- Si el paciente menciona duración, inclúyela: "desde hace 3 días" → "Cefalea de 3 días de evolución"
- Propón diagnósticos diferenciales basados en los síntomas
- Sugiere tratamiento apropiado incluso si el paciente no lo mencionó
- Si falta información crítica, indica en notes qué se debe investigar
- Usa terminología médica profesional en la historia clínica
- Mantén el formato JSON válido sin caracteres especiales que rompan el JSON`;


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
          { role: 'user', content: `Analiza esta transcripción LITERAL de lo que dijo el paciente y genera una historia clínica profesional:

TRANSCRIPCIÓN DEL PACIENTE:
${transcript}

Genera la historia clínica en formato JSON con interpretación médica profesional.` }
        ],
        temperature: 0.4, // Balanced for clinical reasoning while maintaining consistency
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