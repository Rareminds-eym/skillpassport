import { useEffect, useId, useRef } from 'react';

function followPointer(event: PointerEvent, orb: HTMLDivElement) {
  if (event.pointerType === 'touch') return;
  const bounds = orb.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
  orb.style.setProperty('--orb-eye-x', `${x * 9}px`);
  orb.style.setProperty('--orb-eye-y', `${y * 6}px`);
  orb.style.setProperty('--orb-tilt-x', `${-y * 8}deg`);
  orb.style.setProperty('--orb-tilt-y', `${x * 6}deg`);
}

function resetEyes(orb: HTMLDivElement) {
  orb.style.removeProperty('--orb-eye-x');
  orb.style.removeProperty('--orb-eye-y');
  orb.style.removeProperty('--orb-tilt-x');
  orb.style.removeProperty('--orb-tilt-y');
}

const ACTIONS = [
  { label: 'Plan', role: 'organizer', position: 'left-[7%] top-[15%]' },
  { label: 'Create', role: 'resource-provider', position: 'right-[4%] top-[3%]' },
  { label: 'Guide', role: 'mentor-and-guide', position: 'right-[2%] bottom-[23%]' },
  { label: 'Solve', role: 'problem-solver', position: 'left-[2%] bottom-[10%]' },
];
interface Props { onSelectRole: (_id: string) => void; disabled?: boolean }

/** Reference-inspired welcome illustration; action labels remain real accessible buttons. */
export default function FacilitatorWelcome({ onSelectRole, disabled = false }: Props) {
  const id = useId().replace(/:/g, '');
  const orbRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    const area = orb.closest<HTMLElement>('[data-orb-pointer-area]') ?? orb;
    const follow = (event: PointerEvent) => followPointer(event, orb);
    const reset = () => resetEyes(orb);
    // Capture also tracks over interactive children that stop event bubbling.
    area.addEventListener('pointermove', follow, true);
    area.addEventListener('pointerenter', follow);
    area.addEventListener('pointerleave', reset);
    area.addEventListener('pointercancel', reset, true);
    return () => {
      area.removeEventListener('pointermove', follow, true);
      area.removeEventListener('pointerenter', follow);
      area.removeEventListener('pointerleave', reset);
      area.removeEventListener('pointercancel', reset, true);
      reset();
    };
  }, []);
  return <section aria-label="Facilitator welcome" className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center py-5">
    <p className="!m-0 w-full max-w-sm px-5 text-left !text-sm !leading-6 text-muted-foreground sm:!text-base">Explore ideas, get guidance, and create<br className="hidden sm:block" /> better learning experiences.</p>
    <div ref={orbRef} className="facilitator-orb relative my-4 aspect-[4/3] w-full max-w-sm sm:my-6">
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full overflow-visible origin-[50%_50.333%] [transform:perspective(700px)_rotateX(var(--orb-tilt-x,0deg))_rotateY(var(--orb-tilt-y,0deg))] transition-none motion-reduce:transform-none" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-halo`}><stop offset="0" stopColor="hsl(var(--facilitator-orb-ice))" stopOpacity="0.7" /><stop offset="0.75" stopColor="hsl(var(--facilitator-orb-lilac))" stopOpacity="0.3" /><stop offset="1" stopColor="hsl(var(--background))" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${id}-orb`} cx="40%" cy="28%" r="80%"><stop offset="0" stopColor="hsl(var(--facilitator-orb-ice))" /><stop offset="0.48" stopColor="hsl(var(--facilitator-orb-ice))" stopOpacity="0.82" /><stop offset="0.82" stopColor="hsl(var(--facilitator-orb-lilac))" /><stop offset="1" stopColor="hsl(var(--background))" stopOpacity="0.7" /></radialGradient>
          <radialGradient id={`${id}-shine`}><stop offset="0" stopColor="white" stopOpacity="0.68" /><stop offset="0.65" stopColor="white" stopOpacity="0.16" /><stop offset="1" stopColor="white" stopOpacity="0" /></radialGradient>
          <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <circle cx="200" cy="151" r="139" fill={`url(#${id}-halo)`} />
        <g fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5">
          <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-orbit"><ellipse cx="200" cy="151" rx="125" ry="100" transform="rotate(-31 200 151)" opacity="0.1" /></g>
          <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-orbit-reverse"><ellipse cx="200" cy="151" rx="117" ry="106" transform="rotate(37 200 151)" opacity="0.1" /></g>
          <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-orbit-slow"><ellipse cx="200" cy="151" rx="107" ry="123" transform="rotate(12 200 151)" opacity="0.07" /></g>
        </g>
        <circle cx="200" cy="151" r="91" fill={`url(#${id}-orb)`} filter={`url(#${id}-soft)`} />
        <circle cx="200" cy="151" r="87" fill={`url(#${id}-orb)`} opacity="0.8" />
        <ellipse cx="205" cy="171" rx="61" ry="55" fill={`url(#${id}-shine)`} filter={`url(#${id}-soft)`} />
        <path d="M139 111 Q154 82 185 78" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.3" filter={`url(#${id}-soft)`} />
        <g className="[transform:translate(var(--orb-eye-x,0px),var(--orb-eye-y,0px))] transition-none motion-reduce:transform-none" fill="hsl(var(--facilitator-orb-eye))"><g className="[transform-box:fill-box] origin-center animate-facilitator-blink motion-reduce:animate-none"><rect x="171" y="137" width="15" height="27" rx="7.5" /><rect x="216" y="137" width="15" height="27" rx="7.5" /></g></g>
        <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-particles" fill="hsl(var(--primary))"><circle cx="291" cy="46" r="4.5" opacity="0.45" /><circle cx="91" cy="206" r="4" opacity="0.23" /><circle cx="112" cy="230" r="4" opacity="0.3" /><circle cx="294" cy="220" r="4" opacity="0.22" /><circle cx="78" cy="143" r="2.5" opacity="0.2" /><circle cx="312" cy="181" r="3" opacity="0.2" /></g>
      </svg>
      {ACTIONS.map(action => <button key={action.role} type="button" disabled={disabled} onClick={() => onSelectRole(action.role)} className={`absolute z-10 inline-flex min-h-11 min-w-20 items-center justify-center rounded-full border border-primary/5 bg-primary/5 px-5 py-2 text-xs font-medium text-slate-700 backdrop-blur-sm transition-colors hover:border-primary/15 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40 sm:!text-sm ${action.position}`}>{action.label}</button>)}
    </div>
    <div className="px-2 text-center"><h2 className="!mb-1.5 !mt-0 !text-xl !font-semibold !leading-7 !tracking-tight text-foreground sm:!text-2xl sm:!leading-8">What would you like to do?</h2><p className="!m-0 !text-sm !leading-6 text-muted-foreground">Choose a facilitator or just ask a question.</p></div>
  </section>;
}
