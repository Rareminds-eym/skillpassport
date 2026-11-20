import { expect, it } from 'vitest';
import { pcmWave, speechParts, voiceModel } from '../voice-model';
it('keeps model choices in generic configuration',()=>{
  expect(voiceModel({}).model).toBe('heygen/heygen-voice-1-turbo:free');
  expect(voiceModel({VOICE_MODEL:'other/voice',VOICE_PRESET:'new',VOICE_OUTPUT_FORMAT:'mp3'})).toMatchObject({model:'other/voice',voice:'new',format:'mp3'});
});
it('wraps PCM in a correctly sized mono WAV header',()=>{
  const wave=pcmWave(new Uint8Array([1,2,3,4]).buffer,44100);const view=new DataView(wave);
  expect(new TextDecoder().decode(wave.slice(0,4))).toBe('RIFF');expect(view.getUint32(24,true)).toBe(44100);expect(view.getUint32(40,true)).toBe(4);expect(wave.byteLength).toBe(48);
  expect(()=>pcmWave(new ArrayBuffer(3),44100)).toThrow();
});
it('splits long replies without losing later content',()=>{
  const text='Important topic. '.repeat(600)+'Final source example.';const parts=speechParts(text);
  expect(parts.length).toBeGreaterThan(1);expect(parts.every(part=>part.length<=4000)).toBe(true);expect(parts.join(' ')).toBe(text);
});
it('prepares Markdown and formulas for speech without changing stored text',()=>{
  expect(speechParts(String.raw`## Power
\(P_e = \frac{P_h}{\eta_{pump} \times \eta_{motor}}\)`)[0]).toContain('divided by');
  expect(speechParts('<!-- private -->**Answer** [source](https://example.test)')[0]).toBe('Answer source');
});
