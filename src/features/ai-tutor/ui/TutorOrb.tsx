import { useEffect, useId, useRef, type ReactNode } from 'react';

function followPointer(event: PointerEvent, orb: HTMLDivElement) {
  if (event.pointerType === 'touch') return;
  const bounds = orb.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
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

interface Props { className?: string; children?: ReactNode }

/** Shared interactive illustration for educator and learner welcome screens. */
export default function TutorOrb({ className = '', children }: Props) {
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
  return <div ref={orbRef} className={`facilitator-orb relative my-4 aspect-[4/3] w-full max-w-sm sm:my-6 ${className}`}>
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" focusable="false">
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
        <g className="[transform-box:view-box] origin-[201px_150.5px] [transform:translate(var(--orb-face-x,0px),var(--orb-face-y,0px))_scaleX(var(--orb-face-scale-x,1))_scaleY(var(--orb-face-scale-y,1))] transition-none motion-reduce:transform-none">
          <g className="[transform:translate(var(--orb-eye-x,0px),var(--orb-eye-y,0px))] transition-none motion-reduce:transform-none" fill="hsl(var(--facilitator-orb-eye))"><g className="[transform-box:fill-box] origin-center animate-facilitator-blink motion-reduce:animate-none"><rect x="171" y="137" width="15" height="27" rx="7.5" /><rect x="216" y="137" width="15" height="27" rx="7.5" /></g></g>
        </g>
        <g className="[transform-box:view-box] origin-[200px_151px] motion-reduce:animate-none animate-facilitator-particles" fill="hsl(var(--primary))"><circle cx="291" cy="46" r="4.5" opacity="0.45" /><circle cx="91" cy="206" r="4" opacity="0.23" /><circle cx="112" cy="230" r="4" opacity="0.3" /><circle cx="294" cy="220" r="4" opacity="0.22" /><circle cx="78" cy="143" r="2.5" opacity="0.2" /><circle cx="312" cy="181" r="3" opacity="0.2" /></g>
      </svg>
    {children}
  </div>;
}
