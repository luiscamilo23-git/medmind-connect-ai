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
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Received audio data, length:', audio.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Using Lovable AI (Gemini) for LITERAL word-by-word transcription...');

    // Ultra-strict prompt for LITERAL transcription only
    const systemPrompt = `Eres una máquina de transcripción de audio LITERAL.

REGLA ABSOLUTA: Transcribe EXACTAMENTE cada sonido y palabra que escuches, SIN CAMBIAR NADA.

LO QUE DEBES HACER:
✓ Transcribir cada palabra EXACTAMENTE como suena
✓ Incluir TODAS las muletillas: "eh", "este", "pues", "mmm", "ah"
✓ Incluir pausas largas: "..."
✓ Incluir repeticiones si el paciente repite
✓ Transcribir incluso si hay errores gramaticales
✓ Mantener el orden EXACTO de las palabras

LO QUE NO DEBES HACER:
✗ NO parafrasear ni cambiar palabras
✗ NO corregir gramática
✗ NO eliminar muletillas
✗ NO ordenar ni organizar la información
✗ NO agregar palabras que no se dijeron
✗ NO cambiar el orden de las frases
✗ NO interpretar lo que "quiso decir"
✗ NO usar lenguaje médico profesional

EJEMPLO CORRECTO:
Audio: "Eh... doctor pues es que me duele... me duele mucho la cabeza desde ayer"
Transcripción: "Eh... doctor pues es que me duele... me duele mucho la cabeza desde ayer"

EJEMPLO INCORRECTO:
Audio: "Eh... doctor pues es que me duele... me duele mucho la cabeza desde ayer"
Transcripción: "Doctor, tengo dolor de cabeza desde ayer" ❌ (esto está PROHIBIDO)

Tu ÚNICA tarea: Escribe EXACTAMENTE lo que oyes, palabra por palabra, sin cambiar NADA.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Flash is better for literal transcription
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcribe este audio PALABRA POR PALABRA sin cambiar nada:'
              },
              {
                type: 'audio',
                audio: audio,
                format: 'webm'
              }
            ]
          }
        ],
        temperature: 0.0, // Zero temperature for consistency
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Límite de uso excedido. Por favor intenta más tarde.');
      }
      if (response.status === 402) {
        throw new Error('Créditos agotados. Por favor agrega fondos en Settings.');
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const result = await response.json();
    const transcribedText = result.choices[0].message.content;
    
    console.log('Literal transcription successful:', transcribedText);

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
