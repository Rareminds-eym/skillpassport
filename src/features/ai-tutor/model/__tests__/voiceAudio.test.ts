import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { VoiceAudio, audioTone } from '../voiceAudio';
let stopTrack:ReturnType<typeof vi.fn>;let samples=128;let recorder:any;
beforeEach(()=>{
  vi.useFakeTimers();stopTrack=vi.fn();samples=128;
  vi.stubGlobal('AudioContext',class{
    sampleRate=44100;destination={};resume=vi.fn(async()=>{});close=vi.fn(async()=>{});
    createMediaStreamSource=()=>({connect:vi.fn(),disconnect:vi.fn()});
    createAnalyser=()=>({fftSize:512,frequencyBinCount:256,getByteFrequencyData:(data:Uint8Array)=>data.fill(samples===128?0:90),getByteTimeDomainData:(data:Uint8Array)=>data.fill(samples),disconnect:vi.fn()});
  });
  vi.stubGlobal('MediaRecorder',class{
    static isTypeSupported=()=>true;state='inactive';mimeType='audio/webm';onstop:(()=>void)|null=null;ondataavailable:((event:{data:Blob})=>void)|null=null;onerror:(()=>void)|null=null;
    constructor(){recorder=this;}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['question'])});this.onstop?.();}
  });
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:vi.fn(async()=>({getTracks:()=>[{stop:stopTrack}]}))},configurable:true});
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('submits once after real measured speech followed by silence and releases the microphone',async()=>{
  const audio=new VoiceAudio();const question=vi.fn();await audio.listen(question,vi.fn(),vi.fn());
  samples=150;vi.advanceTimersByTime(400);samples=128;vi.advanceTimersByTime(1200);
  expect(question).toHaveBeenCalledTimes(1);expect(question.mock.calls[0][0]).toBeInstanceOf(Blob);expect(stopTrack).toHaveBeenCalled();audio.close();
});
it('does not send silence and stops the recorder on cancellation',async()=>{
  const audio=new VoiceAudio();const question=vi.fn();const error=vi.fn();await audio.listen(question,vi.fn(),error);vi.advanceTimersByTime(15100);
  expect(question).not.toHaveBeenCalled();expect(error).toHaveBeenCalledWith(expect.stringContaining('No clear speech'));expect(stopTrack).toHaveBeenCalled();
  await audio.listen(question,vi.fn(),error);audio.stop();expect(recorder.state).toBe('inactive');expect(question).not.toHaveBeenCalled();audio.close();
});
it('releases microphone permission granted after the session has ended',async()=>{
  let grant!:(stream:unknown)=>void;vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(()=>new Promise(resolve=>{grant=resolve;}));
  const audio=new VoiceAudio();const pending=audio.listen(vi.fn(),vi.fn(),vi.fn());audio.close();grant({getTracks:()=>[{stop:stopTrack}]});await pending;expect(stopTrack).toHaveBeenCalled();
});

it('measures independent low, mid and high frequency bands',()=>{
  const data=new Uint8Array(256);data.fill(180,1,5);
  const bands=audioTone(data,44100,512);expect(bands[0]).toBe(1);expect(bands[1]).toBe(0);expect(bands[2]).toBe(0);
});
it('reports live microphone tone and resets it when stopped',async()=>{
  const audio=new VoiceAudio();const tone=vi.fn();await audio.listen(vi.fn(),vi.fn(),vi.fn(),tone);samples=150;vi.advanceTimersByTime(100);
  expect(tone).toHaveBeenCalledWith([.5,.5,.5]);audio.stop();expect(tone).toHaveBeenLastCalledWith([0,0,0]);audio.close();
});

it('measures the AI playback bands and clears them on interruption',async()=>{
  const stop=vi.fn();vi.stubGlobal('AudioContext',class{
    sampleRate=44100;destination={};resume=vi.fn(async()=>{});close=vi.fn(async()=>{});decodeAudioData=vi.fn(async()=>({}));
    createBufferSource=()=>({buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop,onended:null});
    createAnalyser=()=>({fftSize:512,frequencyBinCount:256,connect:vi.fn(),disconnect:vi.fn(),getByteFrequencyData:(data:Uint8Array)=>data.fill(90)});
  });
  const audio=new VoiceAudio();const tone=vi.fn();const controller=new AbortController();
  const playing=audio.play(new ArrayBuffer(4),vi.fn(),controller.signal,tone);await Promise.resolve();await Promise.resolve();vi.advanceTimersByTime(100);
  expect(tone).toHaveBeenCalledWith([.5,.5,.5]);controller.abort();await expect(playing).rejects.toMatchObject({name:'AbortError'});expect(tone).toHaveBeenLastCalledWith([0,0,0]);expect(stop).toHaveBeenCalled();audio.close();
});
