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
    const { patientName, records } = await req.json();

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ summary: "No hay registros médicos disponibles para este paciente." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const recordsText = records.map((r: any, index: number) => 
      `Consulta ${index + 1} (${r.fecha}):
      - Tipo: ${r.tipo}
      - Motivo: ${r.motivo || 'No especificado'}
      - Diagnóstico: ${r.diagnostico || 'No especificado'}
      - Medicamentos: ${r.medicamentos?.join(', ') || 'Ninguno'}
      - Plan: ${r.plan || 'No especificado'}`
    ).join('\n\n');

    const systemPrompt = `Eres un asistente médico que genera resúmenes concisos del historial de pacientes.
Tu tarea es crear un resumen ejecutivo del historial médico del paciente que ayude al médico a recordar rápidamente la información relevante.

Instrucciones:
1. Resume en máximo 150 palabras
2. Destaca diagnósticos principales y patrones de consulta
3. Menciona medicamentos actuales o recurrentes
4. Señala cualquier aspecto que requiera seguimiento
5. Usa formato claro con viñetas o párrafos cortos
6. Sé profesional y conciso
7. Responde SIEMPRE en español`;

    const userMessage = `Genera un resumen del historial médico del paciente ${patientName}:

${recordsText}`;

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
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || "No se pudo generar el resumen.";

    console.log('Generated patient summary for:', patientName);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-patient-summary:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
