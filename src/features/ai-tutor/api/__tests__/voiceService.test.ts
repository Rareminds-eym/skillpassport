import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{fetch:mocks.fetch}}));
vi.mock('@/shared/api/apiUtils',()=>({getApiUrl:()=>'/api/ai-tutor'}));
import { transcribeVoice, voiceReply } from '../voiceService';
beforeEach(()=>vi.clearAllMocks());
it('sends microphone audio through authenticated requests and validates the transcript',async()=>{
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({data:{text:'A question'}})));
  expect(await transcribeVoice('course',new Blob(['audio'],{type:'audio/webm'}),new AbortController().signal)).toBe('A question');
  expect(mocks.fetch.mock.calls[0][1].body.get('courseId')).toBe('course');
});
it('requests saved reply identifiers and validates audio metadata',async()=>{
  mocks.fetch.mockResolvedValue(new Response('audio',{headers:{'Content-Type':'audio/wav','X-Voice-Parts':'2'}}));
  expect((await voiceReply({conversationId:'chat',messageId:'reply'},1,new AbortController().signal)).parts).toBe(2);
  expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({conversationId:'chat',messageId:'reply',part:1});
});
it('rejects empty transcripts and hides unknown error messages',async()=>{
  mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({data:{text:''}})));
  await expect(transcribeVoice('course',new Blob(['audio']),new AbortController().signal)).rejects.toThrow();
  mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({error:{code:'SECRET',message:'private error'}}),{status:500}));
  await expect(voiceReply({conversationId:'chat',messageId:'reply'},0,new AbortController().signal)).rejects.toThrow('Voice could not complete.');
});
