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

function guessAudioFormat(mimeType?: string, fileName?: string): {
  mimeType: string;
  fileName: string;
  lovableFormat: 'webm' | 'wav' | 'mp3' | 'm4a' | 'ogg';
} {
  const name = (fileName || 'audio.webm').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  const byExt = () => {
    if (name.endsWith('.wav')) return { mimeType: mimeType || 'audio/wav', fileName: fileName || 'audio.wav', lovableFormat: 'wav' as const };
    if (name.endsWith('.mp3')) return { mimeType: mimeType || 'audio/mpeg', fileName: fileName || 'audio.mp3', lovableFormat: 'mp3' as const };
    if (name.endsWith('.m4a') || name.endsWith('.mp4')) return { mimeType: mimeType || 'audio/mp4', fileName: fileName || 'audio.m4a', lovableFormat: 'm4a' as const };
    if (name.endsWith('.ogg')) return { mimeType: mimeType || 'audio/ogg', fileName: fileName || 'audio.ogg', lovableFormat: 'ogg' as const };
    return { mimeType: mimeType || 'audio/webm', fileName: fileName || 'audio.webm', lovableFormat: 'webm' as const };
  };

  // Prefer mime when present
  if (mime.includes('wav')) return { mimeType: mimeType || 'audio/wav', fileName: fileName || 'audio.wav', lovableFormat: 'wav' };
  if (mime.includes('mpeg') || mime.includes('mp3')) return { mimeType: mimeType || 'audio/mpeg', fileName: fileName || 'audio.mp3', lovableFormat: 'mp3' };
  if (mime.includes('mp4') || mime.includes('m4a')) return { mimeType: mimeType || 'audio/mp4', fileName: fileName || 'audio.m4a', lovableFormat: 'm4a' };
  if (mime.includes('ogg')) return { mimeType: mimeType || 'audio/ogg', fileName: fileName || 'audio.ogg', lovableFormat: 'ogg' };
  if (mime.includes('webm')) return { mimeType: mimeType || 'audio/webm', fileName: fileName || 'audio.webm', lovableFormat: 'webm' };
  return byExt();
}

async function transcribeWithLovableAI(params: {
  audioBase64: string;
  lovableFormat: 'webm' | 'wav' | 'mp3' | 'm4a' | 'ogg';
  lovableApiKey: string;
}): Promise<string> {
  const { audioBase64, lovableFormat, lovableApiKey } = params;
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Transcribe este audio PALABRA POR PALABRA sin cambiar nada:' },
            { type: 'audio', audio: audioBase64, format: lovableFormat },
          ],
        },
      ],
      temperature: 0.0,
    }),
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    if (response.status === 429) throw new Error('Límite de uso excedido. Por favor intenta más tarde.');
    if (response.status === 402) throw new Error('Créditos agotados.');
    throw new Error(`AI gateway error: ${errorText}`);
  }

  const result = await response.json();
  const transcribedText = result?.choices?.[0]?.message?.content;
  if (!transcribedText) throw new Error('Respuesta inválida del modelo de transcripción.');
  console.log('Lovable AI transcription successful');
  return transcribedText;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType, fileName } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Received audio data, length:', audio.length);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const inferred = guessAudioFormat(mimeType, fileName);

    // Prefer Lovable AI for reliability (OpenAI key may be out of quota)
    if (LOVABLE_API_KEY) {
      try {
        const transcribedText = await transcribeWithLovableAI({
          audioBase64: audio,
          lovableFormat: inferred.lovableFormat,
          lovableApiKey: LOVABLE_API_KEY,
        });
        return new Response(
          JSON.stringify({ success: true, text: transcribedText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('Lovable AI transcription failed, falling back to Whisper if available:', e);
        // continue to Whisper fallback below
      }
    }

    // Fallback to OpenAI Whisper if available
    if (OPENAI_API_KEY) {
      console.log('Using OpenAI Whisper for transcription...');
      
      try {
        // Process base64 audio in chunks
        const binaryAudio = processBase64Chunks(audio);
        
        // Prepare form data for Whisper
        const formData = new FormData();
        const arrayBuffer = binaryAudio.buffer.slice(binaryAudio.byteOffset, binaryAudio.byteOffset + binaryAudio.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: inferred.mimeType });
        formData.append('file', blob, inferred.fileName);
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

          // If OpenAI fails (quota, rate limit, etc.), fallback to Lovable AI when available
          if (LOVABLE_API_KEY) {
            console.log('Falling back to Lovable AI after Whisper failure...');
            const text = await transcribeWithLovableAI({
              audioBase64: audio,
              lovableFormat: inferred.lovableFormat,
              lovableApiKey: LOVABLE_API_KEY,
            });
            return new Response(
              JSON.stringify({ success: true, text }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: false, error: `Whisper API error: ${errorText}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const transcribedText = await response.text();
        console.log('Whisper transcription successful');

        return new Response(
          JSON.stringify({ success: true, text: transcribedText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        console.error('Whisper transcription threw error:', err);
        if (LOVABLE_API_KEY) {
          const text = await transcribeWithLovableAI({
            audioBase64: audio,
            lovableFormat: inferred.lovableFormat,
            lovableApiKey: LOVABLE_API_KEY,
          });
          return new Response(
            JSON.stringify({ success: true, text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If Lovable AI failed above and Whisper isn't available

    return new Response(
      JSON.stringify({ success: false, error: 'No API key configured for transcription (OPENAI_API_KEY or LOVABLE_API_KEY)' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
