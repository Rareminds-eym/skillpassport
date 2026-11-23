import { z } from 'zod';
import { ssoClient } from '@/shared/api/ssoClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import type { SavedVoiceReply } from '../model/useTutorChat';

async function check(response: Response) {
  if (response.ok) return;
  const parsed = z.object({error:z.object({code:z.string(),message:z.string()})}).safeParse(await response.json().catch(()=>null));
  throw new Error(parsed.success && ['VOICE_INPUT','VOICE_UNAVAILABLE'].includes(parsed.data.error.code)
    ? parsed.data.error.message : 'Voice could not complete. Please try again or continue in text chat.');
}
export async function transcribeVoice(courseId: string, audio: Blob, signal: AbortSignal): Promise<string> {
  const form=new FormData(); form.set('courseId',courseId);
  const type=audio.type.split(';')[0];const extension=type==='audio/mp4'?'m4a':type==='audio/ogg'?'ogg':'webm';
  form.set('audio',audio,`question.${extension}`);
  const response=await ssoClient.fetch(`${getApiUrl('ai-tutor')}/voice/transcribe`,{method:'POST',body:form,signal});await check(response);
  return z.object({data:z.object({text:z.string().trim().min(1).max(20000)})}).parse(await response.json()).data.text;
}
export async function voiceReply(reply: SavedVoiceReply, part: number, signal: AbortSignal): Promise<{audio:ArrayBuffer;parts:number}> {
  const response=await ssoClient.fetch(`${getApiUrl('ai-tutor')}/voice/speak`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...reply,part}),signal});await check(response);
  if (!response.headers.get('Content-Type')?.startsWith('audio/')) throw new Error('Audio playback is unavailable. Please try again.');
  const parts=z.coerce.number().int().min(1).max(12).parse(response.headers.get('X-Voice-Parts'));
  return {audio:await response.arrayBuffer(),parts};
}
