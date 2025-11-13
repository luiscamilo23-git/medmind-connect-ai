import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    
    if (!transcript || transcript.trim().length < 50) {
      // No hay suficiente texto para analizar
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing transcript for missing information...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // System prompt para analizar y sugerir preguntas
    const systemPrompt = `Eres un asistente médico especializado en ayudar a completar historias clínicas.

Tu ÚNICA tarea es ANALIZAR la transcripción literal de una consulta médica y SUGERIR preguntas que el doctor podría hacer para completar la información.

IMPORTANTE:
- NO modifiques ni cambies la transcripción original
- SOLO analiza qué información falta
- Sugiere preguntas específicas y relevantes
- Máximo 3-4 sugerencias por análisis
- Prioriza información médica crítica

INFORMACIÓN ESENCIAL que debe tener una historia clínica completa:
1. Motivo de consulta / Síntoma principal
2. Tiempo de evolución del síntoma
3. Intensidad del dolor (si aplica, escala 1-10)
4. Factores que mejoran/empeoran
5. Síntomas asociados
6. Antecedentes médicos relevantes
7. Medicación actual
8. Alergias conocidas
9. Signos vitales (si es consulta física)

FORMATO DE RESPUESTA (JSON):
{
  "suggestions": [
    {
      "question": "¿Desde cuándo presenta el síntoma?",
      "reason": "Falta tiempo de evolución",
      "priority": "high"
    }
  ]
}

PRIORIDADES:
- high: Información crítica para diagnóstico
- medium: Información importante pero no urgente
- low: Información complementaria`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analiza esta transcripción literal de consulta médica y sugiere preguntas para completar la historia clínica:\n\n"${transcript}"\n\nResponde en JSON con el formato especificado.`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Límite de uso excedido.');
      }
      if (response.status === 402) {
        throw new Error('Créditos agotados.');
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON response:', content);
      parsed = { suggestions: [] };
    }
    
    console.log('Analysis complete, suggestions:', parsed.suggestions?.length || 0);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-clinical-transcript:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
