// Utilities to convert any browser-decodable audio (webm/mp3/m4a/ogg/wav)
// into a 16-bit PCM WAV base64 payload.

function bufferToBase64ViaFileReader(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: mimeType });
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("No se pudo convertir el audio a base64"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIdx = result.indexOf(",");
      if (commaIdx === -1) return reject(new Error("Respuesta inválida al convertir a base64"));
      resolve(result.slice(commaIdx + 1));
    };

    reader.readAsDataURL(blob);
  });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav16BitPCMFromAudioBuffer(audioBuffer: AudioBuffer, opts?: { mono?: boolean }) {
  const mono = opts?.mono ?? true;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const numChannels = mono ? 1 : audioBuffer.numberOfChannels;
  const numFrames = audioBuffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  if (mono) {
    // Average all channels into 1
    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, ch) => audioBuffer.getChannelData(ch));
    for (let i = 0; i < numFrames; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels.length; ch++) sum += channels[ch][i] ?? 0;
      const sample = sum / Math.max(1, channels.length);
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  } else {
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = audioBuffer.getChannelData(ch)[i] ?? 0;
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
  }

  return buffer;
}

export async function blobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  // Yield to the event loop to reduce "Page unresponsive" likelihood for large files.
  await new Promise((r) => setTimeout(r, 0));

  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Este navegador no soporta conversión de audio. Usa Chrome/Edge.");
  }

  const audioCtx: AudioContext = new AudioCtx();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    // mono=true: smaller payload + faster + more compatible
    const wavBuffer = encodeWav16BitPCMFromAudioBuffer(decoded, { mono: true });
    return await bufferToBase64ViaFileReader(wavBuffer, "audio/wav");
  } catch (e) {
    // Common when the browser can't decode the codec inside webm/m4a.
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`No se pudo leer/convertir el audio (posible códec no soportado). Intenta exportar a WAV o MP3. Detalle: ${msg}`);
  } finally {
    try {
      await audioCtx.close();
    } catch {
      // ignore
    }
  }
}
