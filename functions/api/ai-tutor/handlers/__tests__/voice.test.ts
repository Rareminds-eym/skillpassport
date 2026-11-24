// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),access:vi.fn()}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'owner'}),getServiceClient:()=>({from:mocks.from})}));
vi.mock('../../utils/course-index',()=>({requireCourseAccess:mocks.access}));
import { handleVoice } from '../voice';
let saved:any;let eq:ReturnType<typeof vi.fn>;
const env={OPENROUTER_API_KEY:'test-private-key'};
beforeEach(()=>{
  vi.clearAllMocks();saved={data:{course_id:'course',messages:[{id:'reply',role:'assistant',content:'The grounded answer.'}]},error:null};
  const query:any={select:vi.fn(()=>query),eq:vi.fn(()=>query),maybeSingle:vi.fn(async()=>saved)};eq=query.eq;mocks.from.mockReturnValue(query);mocks.access.mockResolvedValue(true);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new Uint8Array([1,2,3,4]),{headers:{'Content-Type':'audio/pcm;rate=44100;channels=1'}})));
});
afterEach(()=>vi.unstubAllGlobals());
const speak=(body:unknown={conversationId:'chat',messageId:'reply'})=>handleVoice({request:new Request('https://example.test/api/ai-tutor/voice/speak',{method:'POST',body:JSON.stringify(body)}),env});
const transcribe=()=>{const form=new FormData();form.set('courseId','course');form.set('audio',new File(['recorded audio'],'question.webm',{type:'audio/webm'}));return handleVoice({request:new Request('https://example.test/api/ai-tutor/voice/transcribe',{method:'POST',body:form}),env});};
it('loads owned saved replies, checks course access and uses the server voice model',async()=>{
  const response=await speak({conversationId:'chat',messageId:'reply',text:'client injection',model:'different'});
  expect(response.status).toBe(200);expect(eq).toHaveBeenCalledWith('learner_id','owner');expect(mocks.access).toHaveBeenCalledWith(expect.anything(),'owner','course');expect(response.headers.get('Content-Type')).toBe('audio/wav');expect(response.headers.get('X-Voice-Parts')).toBe('1');
  const payload=JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));expect(payload).toMatchObject({input:'The grounded answer.',model:'heygen/heygen-voice-1-turbo:free',voice:'nadine',response_format:'pcm'});
});
it('transcribes permitted microphone recordings using the same server key',async()=>{
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({text:' Why do we divide by efficiency? '})));
  const response=await transcribe();expect(response.status).toBe(200);expect(await response.text()).toContain('Why do we divide by efficiency?');
  const [url,options]=vi.mocked(fetch).mock.calls[0];expect(url).toContain('/audio/transcriptions');expect((options?.body as FormData).get('model')).toBe('openai/whisper-large-v3-turbo');
});
it('denies inaccessible course audio before contacting OpenRouter',async()=>{mocks.access.mockResolvedValue(false);expect((await transcribe()).status).toBe(403);expect((await speak()).status).toBe(404);expect(fetch).not.toHaveBeenCalled();});
it('denies missing conversations',async()=>{saved.data=null;expect((await speak()).status).toBe(404);expect(fetch).not.toHaveBeenCalled();});
it.each(['user','streaming','failed','stopped'])('rejects non-completed reply %s',async status=>{
  saved.data.messages[0]={id:'reply',role:status==='user'?'user':'assistant',status,content:'text'};expect((await speak()).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
});
it('supports explicit ordered parts without silently truncating',async()=>{
  saved.data.messages[0].content='Source topic. '.repeat(500)+'Last explanation.';
  const response=await speak({conversationId:'chat',messageId:'reply',part:1});expect(response.status).toBe(200);expect(response.headers.get('X-Voice-Parts')).toBe('2');
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).input).toContain('Last explanation.');
});
it.each([429,401,500])('returns safe provider errors for %s',async status=>{vi.mocked(fetch).mockResolvedValue(new Response('provider-private-details',{status}));const response=await speak();expect(response.status).toBe(status===429?429:502);expect(await response.text()).not.toContain('provider-private-details');});
it('handles silence without generating a chat response',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({text:''})));expect((await transcribe()).status).toBe(422);});

it('retries temporary speech provider failures once using the same saved answer',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(new Response('temporary upstream failure',{status:502})).mockResolvedValueOnce(new Response(new Uint8Array([1,2,3,4]),{headers:{'Content-Type':'audio/pcm'}}));
  const response=await speak();expect(response.status).toBe(200);expect(fetch).toHaveBeenCalledTimes(2);
  expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe(vi.mocked(fetch).mock.calls[1][1]?.body);
});
it('bounds transient retries and does not retry account or rate-limit errors',async()=>{
  vi.mocked(fetch).mockResolvedValue(new Response(null,{status:503}));expect((await speak()).status).toBe(502);expect(fetch).toHaveBeenCalledTimes(2);
  for(const status of [401,402,403,429]){
    vi.mocked(fetch).mockClear().mockResolvedValue(new Response(null,{status}));
    expect((await speak()).status).toBe(status===429?429:502);expect(fetch).toHaveBeenCalledTimes(1);
  }
});
