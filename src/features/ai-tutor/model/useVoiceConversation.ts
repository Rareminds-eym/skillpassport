import { useEffect, useRef, useState } from 'react';
import { transcribeVoice, voiceReply } from '../api/voiceService';
import type { SavedVoiceReply, SendOptions } from './useTutorChat';
import { VoiceAudio, type AudioTone } from './voiceAudio';

export type VoiceState='idle'|'listening'|'transcribing'|'thinking'|'compacting'|'preparing'|'speaking'|'paused'|'error';
export interface VoiceConversationOptions {
  courseId:string;
  sendMessage:(_text:string,_options?:SendOptions)=>Promise<void>;
  stopGeneration:()=>void;
}
export function useVoiceConversation(options:VoiceConversationOptions) {
  const latest=useRef(options);latest.current=options;
  const engine=useRef<VoiceAudio>();const active=useRef(false);const mutedRef=useRef(false);
  const turn=useRef(0);const request=useRef<AbortController>();const retry=useRef<{reply:SavedVoiceReply;part:number}>();
  const [tone,setTone]=useState<AudioTone>([0,0,0]);
  const [state,setState]=useState<VoiceState>('idle');const [level,setLevel]=useState(0);
  const [muted,setMuted]=useState(false);const [error,setError]=useState('');const [canRetryAudio,setCanRetryAudio]=useState(false);

  function cancel() {++turn.current;request.current?.abort();request.current=undefined;engine.current?.stop();latest.current.stopGeneration();setLevel(0);setTone([0,0,0]);}
  function fail(error:unknown,id:number) {
    if(!active.current||id!==turn.current)return;
    const denied=error instanceof DOMException&&['NotAllowedError','PermissionDeniedError'].includes(error.name);
    setError(denied?'Microphone access was denied. Allow it in your browser settings or continue in text chat.':error instanceof Error?error.message:'Voice could not complete. Please try again.');setState('error');setLevel(0);setTone([0,0,0]);setCanRetryAudio(Boolean(retry.current));
  }
  async function listen() {
    cancel();const id=turn.current;setError('');setCanRetryAudio(false);
    if(mutedRef.current){setState('paused');return;}
    setState('listening');
    try {await engine.current!.listen(audio=>{void answer(audio,id);},setLevel,message=>fail(new Error(message),id),setTone);}
    catch(error){fail(error,id);}
  }
  async function speak(reply:SavedVoiceReply,firstPart:number,id:number,controller:AbortController) {
    let count=firstPart+1;
    for(let part=firstPart;part<count;part++) {
      if(id!==turn.current||!active.current)return;
      retry.current={reply,part};setState('preparing');
      const result=await voiceReply(reply,part,controller.signal);count=result.parts;
      if(id!==turn.current||!active.current)return;
      setState('speaking');await engine.current!.play(result.audio,setLevel,controller.signal,setTone);
    }
    retry.current=undefined;setCanRetryAudio(false);
    if(active.current&&id===turn.current)await listen();
  }
  async function answer(audio:Blob,id:number) {
    const controller=new AbortController();request.current=controller;retry.current=undefined;
    try {
      setState('transcribing');const text=await transcribeVoice(latest.current.courseId,audio,controller.signal);
      if(id!==turn.current||!active.current)return;
      setState('thinking');let saved:SavedVoiceReply|undefined;
      await latest.current.sendMessage(text,{voice:true,onCompacting:()=>{if(active.current&&id===turn.current)setState('compacting');},onSaved:reply=>{saved=reply;}});
      if(id!==turn.current||!active.current)return;
      if(!saved)throw new Error('The answer could not be confirmed as saved. Check the text conversation before trying again.');
      await speak(saved,0,id,controller);
    }catch(error){fail(error,id);}
  }
  async function start() {
    active.current=true;mutedRef.current=false;setMuted(false);
    try {engine.current??=new VoiceAudio();await engine.current.resume();if(active.current)await listen();}
    catch(error){fail(error,turn.current);}
  }
  function end() {active.current=false;cancel();engine.current?.close();engine.current=undefined;setState('idle');setMuted(false);mutedRef.current=false;}
  function toggleMute() {
    mutedRef.current=!mutedRef.current;setMuted(mutedRef.current);
    if(mutedRef.current&&state==='listening'){cancel();setState('paused');}
    else if(!mutedRef.current&&state==='paused')void listen();
  }
  function interrupt() {mutedRef.current=false;setMuted(false);retry.current=undefined;void listen();}
  function stopSpeaking() {mutedRef.current=true;setMuted(true);retry.current=undefined;setCanRetryAudio(false);cancel();setState('paused');}
  async function retryAudio() {
    const saved=retry.current;if(!saved)return;cancel();const id=turn.current;const controller=new AbortController();request.current=controller;setError('');setCanRetryAudio(false);
    try{await speak(saved.reply,saved.part,id,controller);}catch(error){fail(error,id);}
  }
  useEffect(()=>()=>{const wasActive=active.current;active.current=false;++turn.current;request.current?.abort();engine.current?.close();if(wasActive)latest.current.stopGeneration();},[]);
  return {state,level,tone,muted,error,canRetryAudio,start,end,toggleMute,interrupt,stopSpeaking,retryAudio,finishQuestion:()=>engine.current?.finish()};
}
