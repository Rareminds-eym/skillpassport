import type { PagesEnv } from '../../../lib/types';

// Generic names keep model/provider choices out of the panel and session logic.
export function voiceModel(env: PagesEnv) {
  return {
    model: env.VOICE_MODEL || 'heygen/heygen-voice-1-turbo:free',
    transcriptionModel: env.VOICE_TRANSCRIPTION_MODEL || 'openai/whisper-large-v3-turbo',
    voice: env.VOICE_PRESET || 'nadine',
    format: env.VOICE_OUTPUT_FORMAT === 'mp3' ? 'mp3' as const : 'pcm' as const,
    sampleRate: Number(env.VOICE_SAMPLE_RATE) || 44100,
  };
}

export function speechParts(markdown: string): string[] {
  const text = markdown.replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, ' Code example is available in the transcript. ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\\[([]|\\[)\]]|\$\$/g, '').replace(/\\(?:text|mathrm|mathbf)\{([^{}]*)\}/g, '$1')
    .replace(/_\{([^{}]*)\}/g, ' $1').replace(/_([a-zA-Z])/g, ' $1')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 divided by $2 ')
    .replace(/\\(?:times|cdot)\b/g, ' times ').replace(/\\eta\b/g, ' efficiency ')
    .replace(/\\rho\b/g, ' density ').replace(/\\approx\b/g, ' approximately ')
    .replace(/\\[,;!]/g, ' ').replace(/\^\{?2\}?/g, ' squared ').replace(/\^\{?3\}?/g, ' cubed ')
    .replace(/\*\*|__|`/g, '').trim();
  const parts: string[] = [];
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + 4000, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(' ', end);
      if (boundary > start) end = boundary;
    }
    parts.push(text.slice(start, end).trim()); start = end;
  }
  return parts.filter(Boolean);
}

/** OpenRouter PCM output is signed 16-bit little-endian mono; wrap for browser decoding. */
export function pcmWave(pcm: ArrayBuffer, sampleRate: number): ArrayBuffer {
  if (!pcm.byteLength || pcm.byteLength % 2 || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 48000) throw new Error('Invalid voice audio');
  const buffer = new ArrayBuffer(44 + pcm.byteLength); const view = new DataView(buffer);
  const word = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  word(0, 'RIFF'); view.setUint32(4, 36 + pcm.byteLength, true); word(8, 'WAVE'); word(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  word(36, 'data'); view.setUint32(40, pcm.byteLength, true); new Uint8Array(buffer, 44).set(new Uint8Array(pcm)); return buffer;
}
