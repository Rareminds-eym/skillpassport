import { getContextUser, getServiceClient } from '../../../lib/auth';
import { apiError, apiSuccess } from '../../../lib/response';
import { getCorsHeaders } from '../../../lib/cors';
import type { PagesEnv } from '../../../lib/types';
import { requireCourseAccess } from '../utils/course-index';
import { pcmWave, speechParts, voiceModel } from '../utils/voice-model';

type Context = { request: Request; env: PagesEnv; data?: Parameters<typeof getContextUser>[0]['data'] };
const ROOT = 'https://openrouter.ai/api/v1/audio';
const MAX_UPLOAD = 8 * 1024 * 1024;

export async function handleVoice(context: Context) {
  const { request, env } = context; const user = getContextUser(context);
  if (request.method === 'GET') return apiSuccess({ available: Boolean(env.OPENROUTER_API_KEY) }, request);
  if (!env.OPENROUTER_API_KEY) return apiError(503, 'VOICE_UNAVAILABLE', 'Voice conversation is currently unavailable.', request);
  const model = voiceModel(env); const db = getServiceClient(env);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60000)]);
  const authorization = { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` };
  try {
    if (new URL(request.url).pathname.endsWith('/transcribe')) {
      if (Number(request.headers.get('Content-Length')) > MAX_UPLOAD + 10000) return apiError(413, 'VOICE_INPUT', 'Please ask a shorter question.', request);
      const form = await request.formData(); const courseId = form.get('courseId'); const file = form.get('audio');
      if (typeof courseId !== 'string' || !courseId || !(file instanceof File) || !file.size || file.size > MAX_UPLOAD ||
          !['audio/webm','audio/ogg','audio/mp4','audio/wav','audio/mpeg'].includes(file.type.split(';')[0])) return apiError(400, 'VOICE_INPUT', 'Please record a short audio question.', request);
      if (!await requireCourseAccess(db, user.id, courseId)) return apiError(403, 'FORBIDDEN', 'Course access denied.', request);
      const upstream = new FormData(); upstream.set('file', file, file.name); upstream.set('model', model.transcriptionModel);
      const response = await fetch(`${ROOT}/transcriptions`, { method: 'POST', headers: authorization, body: upstream, signal });
      if (!response.ok) return providerError(response.status, request);
      const result = await response.json() as { text?: unknown };
      if (typeof result.text !== 'string' || !result.text.trim() || result.text.length > 20000) return apiError(422, 'VOICE_INPUT', 'I could not hear a clear question. Please try again.', request);
      return apiSuccess({ text: result.text.trim() }, request);
    }
    const body = await request.json() as { conversationId?: unknown; messageId?: unknown; part?: unknown } | null;
    if (!body || typeof body.conversationId !== 'string' || typeof body.messageId !== 'string' || body.conversationId.length > 100 || body.messageId.length > 100) return apiError(400, 'VOICE_INPUT', 'Choose a saved reply.', request);
    const { data: conversation, error } = await db.from('tutor_conversations').select('course_id,messages').eq('id',body.conversationId).eq('learner_id',user.id).maybeSingle();
    if (error) throw new Error('Conversation unavailable');
    if (!conversation || !await requireCourseAccess(db,user.id,conversation.course_id)) return apiError(404,'NOT_FOUND','Conversation not found or access denied.',request);
    const message = Array.isArray(conversation.messages) ? conversation.messages.find((item: {id?: string} | null) => item?.id === body.messageId) : undefined;
    if (message?.role !== 'assistant' || typeof message.content !== 'string' || ['streaming','failed','stopped'].includes(message.status)) return apiError(400,'VOICE_INPUT','Choose a completed reply.',request);
    if (message.content.length > 30000) return apiError(400,'VOICE_INPUT','This reply is too long for voice. Ask for a shorter explanation.',request);
    const parts = speechParts(message.content); const part = body.part ?? 0;
    if (typeof part !== 'number' || !Number.isInteger(part) || part < 0 || part >= parts.length) return apiError(400,'VOICE_INPUT','No readable reply is available.',request);
    const payload=JSON.stringify({model:model.model,input:parts[part],voice:model.voice,response_format:model.format});
    let response:Response|undefined;
    for(let attempt=1;attempt<=2;attempt++) {
      const started=Date.now();
      response=await fetch(`${ROOT}/speech`,{method:'POST',headers:{...authorization,'Content-Type':'application/json'},signal,body:payload});
      if(response.ok)break;
      // Never log provider bodies, credentials or course/conversation content.
      console.warn('Voice speech provider rejected request',{status:response.status,attempt,durationMs:Date.now()-started,model:model.model,providerRequestId:response.headers.get('x-request-id')});
      if(attempt===2||![502,503,504].includes(response.status)||signal.aborted)break;
      await response.body?.cancel();
    }
    if(!response)throw new Error('Missing speech response');
    if (!response.ok) return providerError(response.status, request);
    if (!response.headers.get('Content-Type')?.startsWith('audio/')) throw new Error('Invalid audio response');
    const audio = await response.arrayBuffer(); if (!audio.byteLength || audio.byteLength > 24*1024*1024) throw new Error('Invalid audio size');
    const content = model.format === 'pcm' ? pcmWave(audio,model.sampleRate) : audio;
    return new Response(content,{headers:{...getCorsHeaders(request.headers.get('Origin')),'Content-Type':model.format==='pcm'?'audio/wav':'audio/mpeg','Cache-Control':'private, no-store','X-Voice-Parts':String(parts.length),'Access-Control-Expose-Headers':'X-Voice-Parts','X-Content-Type-Options':'nosniff'}});
  } catch(error) {
    console.warn('Voice request failed',{operation:new URL(request.url).pathname.endsWith('/speak')?'speech':'transcription',errorType:error instanceof Error?error.name:'UnknownError'});
    return apiError(503,'VOICE_UNAVAILABLE','Voice could not complete. Please try again or continue in text chat.',request);
  }
}

function providerError(status: number, request: Request) {
  return apiError(status===429?429:502,'VOICE_UNAVAILABLE',status===429?'Voice service is busy. Please try again shortly.':[401,402,403].includes(status)?'Voice provider access is unavailable. Check the server API key and provider account.':'The voice provider is temporarily unavailable. Retry audio to hear the saved answer, or continue in text chat.',request);
}
