import { useEffect, useRef, useState } from 'react';
import { Lightbulb, Maximize2, Keyboard, Mic, MicOff, Minus, PhoneOff, Square, Volume2 } from 'lucide-react';
import { useVoiceConversation, type VoiceConversationOptions, type VoiceState } from '../model/useVoiceConversation';
import type { ChatMessage } from '../api/tutorService';
import TutorOrb from './TutorOrb';
import './voice-panel.css';

const labels:Record<VoiceState,string>={idle:'Ready when you are',listening:'Listening to you',transcribing:'Understanding your question',thinking:'Thinking it through',compacting:'Compacting conversation',preparing:'Preparing your explanation',speaking:'AI is speaking',paused:'Microphone muted',error:'Letâ€™s try again'};
export default function VoiceConversationPanel({courseId,courseName,activeFacilitator,sendMessage,stopGeneration,onClose,minimized=false,onMinimize,onRestore}:VoiceConversationOptions&{
  courseName:string;messages:ChatMessage[];activeFacilitator?:string;onClose:()=>void;
  minimized?:boolean;onMinimize?:()=>void;onRestore?:()=>void;
}) {
  const voice=useVoiceConversation({courseId,sendMessage,stopGeneration});
  const startedAt=useRef<number>();
  const [elapsed,setElapsed]=useState(0);
  const started=voice.state!=='idle';
  useEffect(()=>{
    if(!started)return;
    startedAt.current??=Date.now();
    const tick=()=>setElapsed(Math.floor((Date.now()-startedAt.current!)/1000));
    tick();const timer=setInterval(tick,1000);
    return()=>clearInterval(timer);
  },[started]);
  const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
  const close=()=>{voice.end();onClose();};
  const busy=['compacting','thinking','transcribing','preparing','speaking'].includes(voice.state);
  const micLabel=voice.state==='idle'?'Start microphone':voice.muted?'Unmute microphone':'Mute microphone';
  const microphone=()=>{if(voice.state==='idle'){void voice.start();}else voice.toggleMute();};
  const actionLabel=voice.state==='idle'?'Start conversation':voice.state==='speaking'?'Interrupt and ask':voice.state==='listening'?'Send question':voice.state==='error'?(voice.canRetryAudio?'Retry audio':'Start listening'):busy?'Stop and ask':labels[voice.state];
  const act=()=>{if(voice.state==='idle'){void voice.start();}else if(voice.state==='listening')voice.finishQuestion();else if(voice.state==='error'){void(voice.canRetryAudio?voice.retryAudio():voice.start());}else if(busy)voice.interrupt();else voice.toggleMute();};
  if(minimized)return <section aria-label="Voice conversation" className="voice-dock" data-state={voice.state}>
    <button type="button" onClick={onRestore} aria-label="Restore voice conversation" className="voice-dock-restore">
      <TutorOrb voiceState={voice.state} level={voice.level} tone={voice.tone} className="voice-mini-orb"/>
      <span className="voice-dock-copy"><span className="voice-dock-course">{courseName}</span><span aria-live="polite" className="voice-dock-state">{labels[voice.state]}</span></span>
      <Maximize2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400"/>
    </button>
    {voice.state==='speaking'&&<button type="button" className="voice-control voice-control-small voice-stop" aria-label="Stop speaking" onClick={voice.stopSpeaking}><Square aria-hidden="true"/></button>}
    <button type="button" className="voice-control voice-control-small" aria-label={micLabel} aria-pressed={voice.muted} onClick={microphone}>{voice.muted?<MicOff aria-hidden="true"/>:<Mic aria-hidden="true"/>}</button>
    <button type="button" className="voice-control voice-control-end voice-control-small" aria-label="End voice conversation" onClick={close}><PhoneOff aria-hidden="true"/></button>
  </section>;
  return <section aria-label="Voice conversation" className="voice-panel" data-state={voice.state} data-orb-pointer-area>
    <header className="voice-panel-header">
      <span className="voice-header-spacer"/>
      <span className="voice-course"><Lightbulb aria-hidden="true"/><span title={courseName}>{courseName}</span></span>
      <button type="button" onClick={onMinimize} disabled={!onMinimize} className="voice-minimize" aria-label="Minimize voice conversation" title="Minimize"><Minus aria-hidden="true"/></button>
    </header>
    <div className="voice-stage">
      <div className="voice-orb-stage">
        <TutorOrb voiceState={voice.state} level={voice.level} tone={voice.tone} className="voice-main-orb"/>
        <span role="status" aria-live="polite" className="voice-status">{voice.state==='listening'?<Mic aria-hidden="true"/>:voice.state==='speaking'?<Volume2 aria-hidden="true"/>:null}{labels[voice.state]}</span>
        <p className="voice-turn-hint">{voice.state==='listening'?'Your turn. Ask your question, then pause.':voice.state==='speaking'?'Your microphone is off. Interrupt to ask, or stop the audio.':busy?'Preparing your answer ? you can interrupt and ask again.':voice.state==='paused'?'Audio stopped. Unmute when you are ready.':'Start whenever you are ready.'}</p>
        <button type="button" className="voice-action-pill" onClick={act}>{actionLabel}</button>
      </div>
      <p className="voice-intro">Ask a doubt. Talk it through.</p>
      {voice.error&&<p role="alert" className="voice-error">{voice.error}</p>}
      {activeFacilitator&&voice.state!=='idle'&&<span className="sr-only">{activeFacilitator.replace(/-/g,' ')}</span>}
    </div>
    <footer className="voice-controls">
      <div className="voice-call-wrapper">
      {started&&<div className="voice-call-status"><span className={voice.state==='error'?'voice-call-dot voice-call-dot-error':'voice-call-dot'}/><span>{voice.state==='error'?'Call needs attention':voice.state==='listening'?'Your turn':voice.state==='speaking'?'AI answering':voice.state==='paused'?'Call paused':'Active voice call'}</span><span aria-label={`Call duration ${duration}`} className="voice-call-duration">{duration}</span></div>}
      <div className="voice-control-tray">
      {voice.state==='speaking'&&<button type="button" className="voice-control voice-stop" aria-label="Stop speaking" title="Stop speaking" onClick={voice.stopSpeaking}><Square aria-hidden="true"/></button>}
      <button type="button" aria-label={micLabel} aria-pressed={voice.muted} onClick={microphone} className={`voice-control ${voice.muted?'voice-control-muted':''}`} title={micLabel}>{voice.muted?<MicOff aria-hidden="true"/>:<Mic aria-hidden="true"/>}</button>
      <button type="button" aria-label="Text chat" onClick={close} className="voice-control" title="Return to text chat"><Keyboard aria-hidden="true"/></button>
      <button type="button" aria-label="End voice conversation" onClick={close} className="voice-control voice-control-end" title="End conversation"><PhoneOff aria-hidden="true"/></button>
      </div>
      </div>
    </footer>
  </section>;
}
