import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { audio, healthCheck } = body;
    
    // Handle health check pings from system status page
    if (healthCheck === true) {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Transcribe audio function is healthy' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'No audio data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received audio data, length:', audio.length);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Try OpenAI Whisper first if available (best for file uploads)
    if (OPENAI_API_KEY) {
      console.log('Using OpenAI Whisper for transcription...');
      
      // Process base64 audio in chunks
      const binaryAudio = processBase64Chunks(audio);
      
      // Prepare form data for Whisper
      const formData = new FormData();
      const arrayBuffer = binaryAudio.buffer.slice(binaryAudio.byteOffset, binaryAudio.byteOffset + binaryAudio.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
      formData.append('response_format', 'text');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Whisper error:', response.status, errorText);
        throw new Error(`Whisper API error: ${errorText}`);
      }

      const transcribedText = await response.text();
      console.log('Whisper transcription successful');

      return new Response(
        JSON.stringify({ text: transcribedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to Lovable AI if no OpenAI key
    if (LOVABLE_API_KEY) {
      console.log('Using Lovable AI (Gemini) for transcription...');

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

Tu ÚNICA tarea: Escribe EXACTAMENTE lo que oyes, palabra por palabra, sin cambiar NADA.`;

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
          temperature: 0.0,
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
      
      console.log('Lovable AI transcription successful');

      return new Response(
        JSON.stringify({ text: transcribedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('No API key configured for transcription (OPENAI_API_KEY or LOVABLE_API_KEY)');

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
