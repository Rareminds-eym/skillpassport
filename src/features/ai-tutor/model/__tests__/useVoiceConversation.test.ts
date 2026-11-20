import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({transcribe:vi.fn(),reply:vi.fn(),resume:vi.fn(),listen:vi.fn(),play:vi.fn(),stop:vi.fn(),close:vi.fn(),finish:vi.fn()}));
vi.mock('../../api/voiceService',()=>({transcribeVoice:mocks.transcribe,voiceReply:mocks.reply}));
vi.mock('../voiceAudio',()=>({VoiceAudio:class{resume=mocks.resume;listen=mocks.listen;play=mocks.play;stop=mocks.stop;close=mocks.close;finish=mocks.finish;}}));
import { useVoiceConversation } from '../useVoiceConversation';
let send:ReturnType<typeof vi.fn>;let stop:ReturnType<typeof vi.fn>;let finishPlayback:()=>void;
beforeEach(()=>{
  vi.clearAllMocks();mocks.resume.mockResolvedValue(undefined);mocks.listen.mockResolvedValue(undefined);
  mocks.transcribe.mockResolvedValue('Why do we divide by efficiency?');mocks.reply.mockResolvedValue({audio:new ArrayBuffer(4),parts:1});
  mocks.play.mockImplementation(()=>new Promise<void>(resolve=>{finishPlayback=resolve;}));
  send=vi.fn(async(_text,options)=>{options.onSaved({conversationId:'chat',messageId:'reply'});});stop=vi.fn();
});
afterEach(cleanup);
function setup(){return renderHook(()=>useVoiceConversation({courseId:'course',sendMessage:send,stopGeneration:stop}));}
async function ask(){act(()=>{mocks.listen.mock.calls.at(-1)![0](new Blob(['question'],{type:'audio/webm'}));});}

it('transcribes, uses existing chat, speaks the saved reply and resumes listening',async()=>{
  const {result}=setup();await act(async()=>{await result.current.start();});expect(result.current.state).toBe('listening');
  await ask();await waitFor(()=>expect(result.current.state).toBe('speaking'));
  expect(send).toHaveBeenCalledWith('Why do we divide by efficiency?',expect.objectContaining({voice:true,onSaved:expect.any(Function)}));
  expect(mocks.reply).toHaveBeenCalledWith({conversationId:'chat',messageId:'reply'},0,expect.any(AbortSignal));
  await act(async()=>{finishPlayback();});await waitFor(()=>expect(result.current.state).toBe('listening'));expect(mocks.listen).toHaveBeenCalledTimes(2);
});
it('mutes the microphone and waits for unmute after the explanation',async()=>{
  const {result}=setup();await act(async()=>{await result.current.start();});await ask();await waitFor(()=>expect(result.current.state).toBe('speaking'));
  act(()=>result.current.toggleMute());await act(async()=>{finishPlayback();});await waitFor(()=>expect(result.current.state).toBe('paused'));
  act(()=>result.current.toggleMute());await waitFor(()=>expect(result.current.state).toBe('listening'));
});
it('discards late transcription when interrupted',async()=>{
  let resolve!:(text:string)=>void;mocks.transcribe.mockImplementation(()=>new Promise<string>(done=>{resolve=done;}));
  const {result}=setup();await act(async()=>{await result.current.start();});await ask();expect(result.current.state).toBe('transcribing');
  act(()=>result.current.interrupt());expect(mocks.transcribe.mock.calls[0][2].aborted).toBe(true);
  await act(async()=>resolve('Late question'));expect(send).not.toHaveBeenCalled();
});
it('retries failed audio without generating another answer',async()=>{
  mocks.reply.mockRejectedValueOnce(new Error('Voice temporarily unavailable'));
  const {result}=setup();await act(async()=>{await result.current.start();});await ask();await waitFor(()=>expect(result.current.state).toBe('error'));expect(result.current.canRetryAudio).toBe(true);
  act(()=>{void result.current.retryAudio();});await waitFor(()=>expect(result.current.state).toBe('speaking'));expect(send).toHaveBeenCalledTimes(1);
});
it('does not synthesize an answer that was not confirmed as saved',async()=>{
  send.mockResolvedValue(undefined);const {result}=setup();await act(async()=>{await result.current.start();});await ask();await waitFor(()=>expect(result.current.state).toBe('error'));expect(mocks.reply).not.toHaveBeenCalled();
});
it('explains microphone denial and releases resources on unmount',async()=>{
  mocks.listen.mockRejectedValueOnce(new DOMException('Denied','NotAllowedError'));const {result,unmount}=setup();
  await act(async()=>{await result.current.start();});expect(result.current.error).toContain('Microphone access was denied');unmount();expect(mocks.close).toHaveBeenCalled();expect(stop).toHaveBeenCalled();
});

it('stops speaking immediately and stays paused until unmuted without ending the call',async()=>{
  const {result}=setup();await act(async()=>{await result.current.start();});await ask();await waitFor(()=>expect(result.current.state).toBe('speaking'));
  const signal=mocks.play.mock.calls[0][2];mocks.stop.mockClear();
  act(()=>result.current.stopSpeaking());expect(signal.aborted).toBe(true);expect(mocks.stop).toHaveBeenCalled();expect(result.current.state).toBe('paused');expect(result.current.muted).toBe(true);
  await act(async()=>finishPlayback());expect(result.current.state).toBe('paused');expect(mocks.listen).toHaveBeenCalledTimes(1);
  act(()=>result.current.toggleMute());await waitFor(()=>expect(result.current.state).toBe('listening'));expect(send).toHaveBeenCalledTimes(1);
});
it('interrupts playback and listens for a new question without waiting for the old answer',async()=>{
  const {result}=setup();await act(async()=>{await result.current.start();});await ask();await waitFor(()=>expect(result.current.state).toBe('speaking'));
  const signal=mocks.play.mock.calls[0][2];act(()=>result.current.interrupt());expect(signal.aborted).toBe(true);expect(result.current.state).toBe('listening');expect(mocks.listen).toHaveBeenCalledTimes(2);
});
