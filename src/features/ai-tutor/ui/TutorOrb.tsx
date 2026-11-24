import { useEffect, useId, useRef, type ReactNode, type CSSProperties } from 'react';
import { caretPosition } from './caretPosition';
function followPoint(clientX: number, clientY: number, orb: HTMLDivElement) {
  const bounds = orb.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.max(-1, Math.min(1, (clientX - bounds.left) / bounds.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (clientY - bounds.top) / bounds.height * 2 - 1));
  orb.style.setProperty('--orb-eye-x', `${x * 9}px`);
  orb.style.setProperty('--orb-eye-y', `${y * 6}px`);
  // Project the face across a sphere instead of rotating its flat silhouette.
  const yaw = x * Math.PI / 10;
  const pitch = y * Math.PI / 8;
  orb.style.setProperty('--orb-face-x', `${Math.sin(yaw) * 60}px`);
  orb.style.setProperty('--orb-face-y', `${Math.sin(pitch) * 60}px`);
  orb.style.setProperty('--orb-face-scale-x', `${Math.cos(yaw)}`);
  orb.style.setProperty('--orb-face-scale-y', `${Math.cos(pitch)}`);
}
function resetEyes(orb: HTMLDivElement) {
  orb.style.removeProperty('--orb-eye-x');
  orb.style.removeProperty('--orb-eye-y');
  orb.style.removeProperty('--orb-face-x');
  orb.style.removeProperty('--orb-face-y');
  orb.style.removeProperty('--orb-face-scale-x');
  orb.style.removeProperty('--orb-face-scale-y');
}
interface Props { className?: string; children?: ReactNode; voiceState?: string; level?: number; tone?: readonly [number,number,number] }
/** Shared interactive illustration for educator and learner welcome screens. */
export default function TutorOrb({ className = '', children, voiceState, level = 0, tone }: Props) {
  const id = useId().replace(/:/g, '');
  const orbRef = useRef<HTMLDivElement>(null);
  const reactiveAudio=useRef({level,tone});reactiveAudio.current={level,tone};
  const mode=voiceState==='listening'?'listening':voiceState==='speaking'?'speaking':['compacting','transcribing','thinking','preparing'].includes(voiceState??'')?'loading':'idle';
  useEffect(()=>{
    const orb=orbRef.current;if(!orb||!voiceState)return;
    const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let frame=0;let last=0;const current=[0,0,0];
    const draw=(time:number)=>{
      const dt=last?Math.max(0,Math.min((time-last)/1000,.05)):1/60;last=time;
      const audio=reactiveAudio.current;const active=mode==='listening'||mode==='speaking';
      const values=audio.tone??[audio.level,audio.level,audio.level];
      ['low','mid','high'].forEach((band,index)=>{
        const target=active&&Number.isFinite(values[index])?Math.max(0,Math.min(1,values[index])):0;
        current[index]+=(target-current[index])*(1-Math.exp(-dt*(target>current[index]?16:5)));
        orb.style.setProperty(`--voice-${band}`,current[index].toFixed(4));
      });
      if(active&&!preference?.matches)frame=requestAnimationFrame(draw);
    };
    const restart=()=>{cancelAnimationFrame(frame);last=0;draw(performance.now());};restart();
    preference?.addEventListener('change',restart);
    return()=>{cancelAnimationFrame(frame);preference?.removeEventListener('change',restart);};
  },[mode,voiceState]);
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb || voiceState) return;
    const area = orb.closest<HTMLElement>('[data-orb-pointer-area]') ?? orb;
    const activeInput = () => {
      const input = document.activeElement;
      return input instanceof HTMLTextAreaElement && input.hasAttribute('data-orb-caret') && area.contains(input) && input.value ? input : null;
    };
    const followCaret = () => {
      const input = activeInput();
      if (!input) return false;
      const caret = caretPosition(input);
      followPoint(caret.x, caret.y, orb);
      return true;
    };
    const follow = (event: PointerEvent) => {
      if (!activeInput() && event.pointerType !== 'touch') followPoint(event.clientX, event.clientY, orb);
    };
    const reset = () => { if (!followCaret()) resetEyes(orb); };
    const refreshCaret = () => { followCaret(); };
    const blur = () => resetEyes(orb);
    for (const event of ['input', 'select', 'keyup', 'click', 'focusin', 'scroll']) area.addEventListener(event, refreshCaret, true);
    area.addEventListener('focusout', blur, true);
    document.addEventListener('selectionchange', refreshCaret);
    // Capture also tracks over interactive children that stop event bubbling.
    area.addEventListener('pointermove', follow, true);
    area.addEventListener('pointerenter', follow);
    area.addEventListener('pointerleave', reset);
    area.addEventListener('pointercancel', reset, true);
    return () => {
      for (const event of ['input', 'select', 'keyup', 'click', 'focusin', 'scroll']) area.removeEventListener(event, refreshCaret, true);
      area.removeEventListener('focusout', blur, true);
      document.removeEventListener('selectionchange', refreshCaret);
      area.removeEventListener('pointermove', follow, true);
      area.removeEventListener('pointerenter', follow);
      area.removeEventListener('pointerleave', reset);
      area.removeEventListener('pointercancel', reset, true);
      resetEyes(orb);
    };
  }, [voiceState]);
  return <div ref={orbRef} data-voice-state={voiceState} data-voice-mode={voiceState?mode:undefined} style={voiceState?{'--voice-energy':['listening','speaking'].includes(voiceState)&&Number.isFinite(level)?Math.max(0,Math.min(1,level)):0} as CSSProperties:undefined} className={`facilitator-orb relative my-4 aspect-[4/3] w-full max-w-sm sm:my-6 ${className}`}>
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-halo`}><stop offset="0" stopColor="hsl(var(--facilitator-orb-ice))" stopOpacity="0.7" /><stop offset="0.75" stopColor="hsl(var(--facilitator-orb-lilac))" stopOpacity="0.3" /><stop offset="1" stopColor="hsl(var(--background))" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${id}-orb`} cx="40%" cy="28%" r="80%"><stop offset="0" stopColor="hsl(var(--facilitator-orb-ice))" /><stop offset="0.48" stopColor="hsl(var(--facilitator-orb-ice))" stopOpacity="0.82" /><stop offset="0.82" stopColor="hsl(var(--facilitator-orb-lilac))" /><stop offset="1" stopColor="hsl(var(--background))" stopOpacity="0.7" /></radialGradient>
          <radialGradient id={`${id}-shine`}><stop offset="0" stopColor="white" stopOpacity="0.68" /><stop offset="0.65" stopColor="white" stopOpacity="0.16" /><stop offset="1" stopColor="white" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${id}-side-wave`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6eaddd" stopOpacity="0"/><stop offset=".45" stopColor="#88bce5" stopOpacity=".6"/><stop offset="1" stopColor="#a8d4ef" stopOpacity=".12"/></linearGradient>
          <radialGradient id={`${id}-voice-orb`} cx="30%" cy="23%" r="88%"><stop offset="0" stopColor="var(--voice-orb-top,#ecf4ff)"/><stop offset=".2" stopColor="#ccdfff"/><stop offset=".52" stopColor="var(--voice-orb-mid,#bdcefa)"/><stop offset=".82" stopColor="var(--voice-orb-bottom,#d4cbfb)"/><stop offset="1" stopColor="#eee7ff"/></radialGradient>
          <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <circle className="voice-halo" cx="200" cy="151" r="139" fill={`url(#${id}-halo)`} />
        {voiceState&&<g className="voice-audio-aura" fill="none">
          {[-1,1].map(side=><g key={side} transform={side===1?'translate(400 0) scale(-1 1)':undefined}>
            {[{x:145,top:47,bend:53},{x:132,top:29,bend:26},{x:160,top:12,bend:-12}].map(({x,top,bend},index)=><path key={index} className="voice-aura-line" d={`M ${x} ${top} C ${bend} 99 ${bend} 203 ${x} ${302-top} C ${bend+16} 208 ${bend+16} 94 ${x} ${top} Z`} fill={`url(#${id}-side-wave)`} style={{'--aura-weight':(1-index*.18).toFixed(2),'--band':index===2?'max(var(--voice-low,0),var(--voice-mid,0),var(--voice-high,0))':`var(--voice-${['low','mid'][index]},0)`,'--aura-delay':`${index*-.3}s`} as CSSProperties}/>)}
          </g>)}
        </g>}
        {voiceState&&<g className="voice-loading-indicator" fill="none">
          <circle className="voice-loading-track" cx="200" cy="151" r="110" stroke="#e4def4" strokeWidth="1"/>
          <g className="voice-loading-ring" stroke="#a897d8" strokeWidth="2" strokeLinecap="round"><circle cx="200" cy="151" r="110" strokeDasharray="115 576"/><circle cx="200" cy="41" r="3" fill="#a897d8" stroke="none"/></g>
          <circle className="voice-loading-inner" cx="200" cy="151" r="101" stroke="#a9c5e9" strokeWidth="1.2" strokeDasharray="52 583" strokeLinecap="round"/>
        </g>}
        <g className="voice-orbit-lines" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5">
          <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-orbit"><ellipse cx="200" cy="151" rx={voiceState?111:125} ry={voiceState?99:100} transform="rotate(-31 200 151)" opacity="0.1" /></g>
          <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-orbit-reverse"><ellipse cx="200" cy="151" rx={voiceState?105:117} ry={voiceState?113:106} transform="rotate(37 200 151)" opacity="0.1" /></g>
          <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-orbit-slow"><ellipse cx="200" cy="151" rx={voiceState?118:107} ry={voiceState?105:123} transform="rotate(12 200 151)" opacity="0.07" /></g>
        </g>
        <g className="voice-body"><g className="voice-body-breathe">
        <circle className="voice-orb-soft-fill" cx="200" cy="151" r="91" fill={`url(#${id}-orb)`} filter={`url(#${id}-soft)`} />
        <circle className="voice-orb-fill" cx="200" cy="151" r="87" fill={`url(#${id}-${voiceState?'voice-orb':'orb'})`} opacity="0.8" />
        <ellipse cx="205" cy="171" rx="61" ry="55" fill={`url(#${id}-shine)`} filter={`url(#${id}-soft)`} />
        <path d="M139 111 Q154 82 185 78" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.3" filter={`url(#${id}-soft)`} />
        <g className="[transform-box:view-box] origin-[201px_150.5px] [transform:translate(var(--orb-face-x,0px),var(--orb-face-y,0px))_scaleX(var(--orb-face-scale-x,1))_scaleY(var(--orb-face-scale-y,1))] transition-none motion-reduce:transform-none">
          <g className="[transform:translate(var(--orb-eye-x,0px),var(--orb-eye-y,0px))] transition-none motion-reduce:transform-none" fill="hsl(var(--facilitator-orb-eye))"><g className="[transform-box:fill-box] origin-center animate-facilitator-blink motion-reduce:animate-none"><rect x="171" y="137" width="15" height="27" rx="7.5" /><rect x="216" y="137" width="15" height="27" rx="7.5" /></g></g>
        </g>
        </g></g>
        <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-particles" fill="hsl(var(--primary))"><circle cx="291" cy="46" r="4.5" opacity="0.45" /><circle cx="91" cy="206" r="4" opacity="0.23" /><circle cx="112" cy="230" r="4" opacity="0.3" /><circle cx="294" cy="220" r="4" opacity="0.22" /><circle cx="78" cy="143" r="2.5" opacity="0.2" /><circle cx="312" cy="181" r="3" opacity="0.2" /></g>
      </svg>
    {children}
  </div>;
}
