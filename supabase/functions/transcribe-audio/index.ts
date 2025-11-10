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

    // Use Lovable AI with Gemini for audio transcription
    const systemPrompt = `Eres un transcriptor profesional. Tu ÚNICA tarea es transcribir EXACTAMENTE lo que dice el paciente en el audio.

REGLAS CRÍTICAS:
- Transcribe LITERALMENTE palabra por palabra lo que escuchas
- NO agregues interpretaciones médicas
- NO estructures la información
- NO corrijas gramática o formas de hablar
- Mantén muletillas, pausas naturales y formas coloquiales
- Captura TODO lo que dice el paciente tal cual lo dice

Ejemplo:
Si el paciente dice: "Ehh... me duele la cabeza desde hace como... tres días, y también tengo náuseas"
Transcribes EXACTAMENTE: "Ehh... me duele la cabeza desde hace como... tres días, y también tengo náuseas"

Devuelve SOLO la transcripción literal del audio, sin comentarios adicionales.`;

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