import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function guessAudioFormat(mimeType?: string, fileName?: string): 'webm' | 'wav' | 'mp3' | 'm4a' | 'ogg' {
  const name = (fileName || 'audio.webm').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (mime.includes('wav') || name.endsWith('.wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3') || name.endsWith('.mp3')) return 'mp3';
  if (mime.includes('mp4') || mime.includes('m4a') || name.endsWith('.m4a') || name.endsWith('.mp4')) return 'm4a';
  if (mime.includes('ogg') || name.endsWith('.ogg')) return 'ogg';
  return 'webm';
}

async function transcribeWithGemini(params: {
  audioBase64: string;
  format: 'webm' | 'wav' | 'mp3' | 'm4a' | 'ogg';
  apiKey: string;
}): Promise<string> {
  const { audioBase64, format, apiKey } = params;

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

  let response: Response;
  try {
    response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              // OpenAI-compatible multimodal format expected by the gateway
              { type: 'text', text: 'Transcribe este audio PALABRA POR PALABRA sin cambiar nada:' },
              { type: 'input_audio', input_audio: { data: audioBase64, format } },
            ],
          },
        ],
        temperature: 0.0,
        max_tokens: 16384, // Allow long transcriptions without truncation
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('abort')) {
      throw new Error('Timeout transcribiendo audio. Intenta de nuevo.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('Límite de uso excedido. Por favor intenta más tarde.');
    if (response.status === 402) throw new Error('Créditos agotados. Agrega créditos en Settings → Workspace → Usage.');
    throw new Error(`Error de transcripción: ${errorText}`);
  }

  const result = await response.json();
  const transcribedText = result?.choices?.[0]?.message?.content;
  if (!transcribedText) throw new Error('No se recibió transcripción del modelo.');

  // Guardrail: if the model replies asking for audio/text, it means it didn't receive/understand the audio payload.
  const normalized = String(transcribedText).toLowerCase();
  const looksLikeNoAudio =
    normalized.includes('proporciona el audio') ||
    normalized.includes('proporciona el texto') ||
    normalized.includes('envíame el audio') ||
    normalized.includes('enviame el audio') ||
    normalized.includes('no recib') && normalized.includes('audio');
  if (looksLikeNoAudio) {
    throw new Error('No se pudo procesar el audio (formato no soportado o audio vacío). Intenta con WAV/MP3 o vuelve a grabar.');
  }
  
  return transcribedText;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType, fileName } = await req.json();

    if (!audio) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se recibió audio' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reject audio larger than 10MB (base64 → ~75% of original binary size)
    const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
    const estimatedBytes = Math.floor((audio.length * 3) / 4);
    if (estimatedBytes > MAX_AUDIO_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Audio demasiado grande (máximo 10MB). Divide la grabación en partes más cortas.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY no configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const format = guessAudioFormat(mimeType, fileName);
    
    const transcribedText = await transcribeWithGemini({
      audioBase64: audio,
      format,
      apiKey: LOVABLE_API_KEY,
    });

    return new Response(
      JSON.stringify({ success: true, text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
