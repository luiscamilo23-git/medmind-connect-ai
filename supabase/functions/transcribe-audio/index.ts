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

    console.log('Using Lovable AI (Gemini) for audio transcription...');

    // Use Lovable AI with Gemini for LITERAL audio transcription only
    const systemPrompt = `Eres un transcriptor de audio médico profesional.

TU ÚNICA FUNCIÓN: Transcribir EXACTAMENTE lo que escuchas en el audio, palabra por palabra.

REGLAS ABSOLUTAS:
1. Transcribe LITERALMENTE todo lo que el paciente dice
2. NO interpretes ni organices la información
3. NO corrijas el lenguaje coloquial del paciente
4. NO agregues puntuación excesiva ni estructura
5. Mantén las pausas naturales, repeticiones y muletillas
6. Si el paciente dice "eh", "mmm", "pues", transcríbelo tal cual
7. NO hagas ningún tipo de análisis médico
8. NO cambies palabras ni reformules nada

EJEMPLOS CORRECTOS:
Paciente dice: "Eh pues... me duele mucho la cabeza desde hace como tres días y también tengo náuseas"
Transcribes: "Eh pues... me duele mucho la cabeza desde hace como tres días y también tengo náuseas"

Paciente dice: "Doctor es que yo siento un dolor aquí en el estómago que me viene como desde ayer"
Transcribes: "Doctor es que yo siento un dolor aquí en el estómago que me viene como desde ayer"

Devuelve ÚNICAMENTE la transcripción literal, sin añadir ningún texto adicional, análisis o estructura.`;

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
            content: [
              {
                type: 'text',
                text: 'Transcribe EXACTAMENTE lo que dice el paciente en este audio:'
              },
              {
                type: 'audio',
                audio: audio, // Send base64 audio directly
                format: 'webm'
              }
            ]
          }
        ],
        temperature: 0.1, // Low temperature for accurate transcription
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
    
    console.log('Transcription successful with Gemini:', transcribedText);

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