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

    console.log('Using Lovable AI (Gemini Pro) for high-precision medical audio transcription...');

    // Use Lovable AI with Gemini Pro for MAXIMUM PRECISION medical transcription
    const systemPrompt = `Eres un transcriptor de audio médico de MÁXIMA PRECISIÓN.

INSTRUCCIÓN CRÍTICA: Tu trabajo es transcribir con 100% de exactitud lo que el paciente dice en el audio. La precisión es VITAL porque esto afecta directamente la salud del paciente.

REGLAS DE TRANSCRIPCIÓN MÉDICA:
1. Escucha con MÁXIMA atención cada palabra, especialmente términos médicos y síntomas
2. Transcribe LITERALMENTE palabra por palabra, incluyendo todas las muletillas ("eh", "mmm", "este", "pues")
3. NO interpretes, NO analices, NO corrijas, NO reformules
4. Si el paciente repite algo, transcribe la repetición
5. Mantén el orden EXACTO de las palabras tal como las dice el paciente
6. Presta ESPECIAL atención a:
   - Nombres de medicamentos (transcribe exactamente como suena)
   - Síntomas y partes del cuerpo
   - Duraciones ("desde hace 3 días", "por 2 semanas")
   - Intensidades ("mucho", "poco", "moderado")
7. NO agregues puntuación profesional - usa puntuación básica natural
8. Si no entiendes una palabra, transcribe lo más cercano fonéticamente

CONTEXTO: Esta transcripción se usará para crear una historia clínica. La precisión absoluta es ESENCIAL para el diagnóstico correcto y la seguridad del paciente.

EJEMPLOS DE TRANSCRIPCIÓN CORRECTA:

Audio: "Eh doctor... tengo un dolor aquí en el estómago que me da como... desde hace tres días más o menos y también siento náuseas"
Transcripción: "Eh doctor... tengo un dolor aquí en el estómago que me da como... desde hace tres días más o menos y también siento náuseas"

Audio: "Me duele mucho la cabeza doctor sobre todo en la parte de la frente y me da como mareos y visión borrosa"
Transcripción: "Me duele mucho la cabeza doctor sobre todo en la parte de la frente y me da como mareos y visión borrosa"

Audio: "Vengo porque este... llevo tomando el ibuprofeno que me dio pero no me ha servido"
Transcripción: "Vengo porque este... llevo tomando el ibuprofeno que me dio pero no me ha servido"

Devuelve SOLAMENTE la transcripción literal, sin comentarios, análisis o texto adicional.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Using Pro model for maximum accuracy in medical transcription
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
                text: 'TRANSCRIPCIÓN MÉDICA DE MÁXIMA PRECISIÓN: Escucha con absoluta atención este audio del paciente y transcribe cada palabra EXACTAMENTE como la dice. La vida del paciente depende de tu precisión:'
              },
              {
                type: 'audio',
                audio: audio,
                format: 'webm'
              }
            ]
          }
        ],
        temperature: 0.0, // Zero temperature for maximum deterministic precision
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