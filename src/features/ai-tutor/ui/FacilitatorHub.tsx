import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Compass, FileText, Layers, Lightbulb } from 'lucide-react';
import { FACILITATORS, type FacilitatorRole } from '../config/facilitators';

const ROLE_ICONS = [CalendarDays, BookOpen, Layers, FileText, Lightbulb, Compass];
function circlePoint(radius: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}
const ROLE_SEGMENTS = FACILITATORS.map((_, index) => {
  const angle = index * 60 - 90;
  const start = angle - 28;
  const end = angle + 28;
  const outer = Array.from({ length: 19 }, (_, step) => circlePoint(48, start + (end - start) * step / 18));
  const inner = Array.from({ length: 19 }, (_, step) => circlePoint(19, end - (end - start) * step / 18));
  return {
    clipPath: `polygon(${[...outer, ...inner].map(point => `${point.x}% ${point.y}%`).join(',')})`,
    label: circlePoint(33.5, angle),
  };
});
interface Props { courseName: string; disabled?: boolean; onAction: (_role: FacilitatorRole) => void; onBack?: () => void }

/** One workspace, six discoverable roles; examples never impersonate live learner evidence. */
export default function FacilitatorHub({ courseName, disabled = false, onAction, onBack }: Props) {
  const descriptionId = useId();
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [selected, setSelected] = useState<FacilitatorRole | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (selected) heading.current?.focus(); }, [selected]);
  const Icon = selected ? ROLE_ICONS[FACILITATORS.indexOf(selected)] : Lightbulb;
  const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
  return <section aria-label="Six AI facilitators" className="mx-auto w-full max-w-xl text-foreground">
    {selected ? <div className="space-y-4 motion-safe:animate-fade-in">
      <button type="button" onClick={() => setSelected(null)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary ${focusClass}`}><ArrowLeft className="h-3.5 w-3.5" />All six facilitators</button>
      <div className="rounded-2xl border border-primary/15 bg-card/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="!m-0 !text-[10px] !font-semibold uppercase tracking-widest text-primary">Your teaching team</p><h3 ref={heading} tabIndex={-1} className="!m-0 !text-base !font-semibold !leading-6 outline-none">{selected.name}</h3></div></div>
        <p className="mt-3 !text-sm !leading-6 text-foreground">{selected.purpose}</p>
        <p className="mt-2 !text-xs !leading-5 text-muted-foreground">{selected.available}</p>
        {selected.planned && <p className="mt-2 border-l-2 border-border pl-2.5 !text-[11px] !leading-5 text-muted-foreground"><span className="font-semibold">Next on the roadmap: </span>{selected.planned}</p>}
        <button type="button" disabled={disabled} onClick={() => onAction(selected)} className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}>{selected.actionLabel}<ArrowRight className="h-3.5 w-3.5" /></button>
        {selected.action === 'chat' && <p className="!mb-0 !mt-2 !text-[11px] !leading-5 text-muted-foreground">Adds a suggested question to your message bar. Review it, then send.</p>}
      </div>
      <article className="rounded-2xl border border-border bg-card p-4" aria-label="Illustrative facilitator example">
        <p className="!m-0 !text-[10px] !font-semibold uppercase tracking-widest text-primary">Example · Grade 7 Science</p>
        <h4 className="!mb-3 !mt-1 !text-sm !font-semibold !leading-6">{selected.example.title}</h4>
        <ul className="!m-0 !list-none space-y-2.5 !p-0">{selected.example.items.map((item, index) => <li key={item} className="flex gap-2.5 !text-xs !leading-5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">{index + 1}</span><span>{item}</span></li>)}</ul>
        <p className="mb-0 mt-3 border-t border-border pt-3 !text-[11px] !leading-5 text-muted-foreground">{selected.example.note || 'Illustrative content from the facilitator plan. Your next action uses the current course.'}</p>
      </article>
    </div> : <div className="space-y-4">
      {onBack && <button type="button" onClick={onBack} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary ${focusClass}`}><ArrowLeft className="h-3.5 w-3.5" />Back to conversation</button>}
      <div className="pb-1 pt-2">
        <h2 className="!mb-2 !mt-0 !text-xl !font-semibold !leading-7 !tracking-tight">More ways to bring<br />learning to life.</h2>
        <p className="!m-0 !text-xs !leading-5 text-muted-foreground">Choose your approach for <span className="font-medium text-foreground">{courseName}</span>. Explore a role, then put it to work.</p>
      </div>
      <div className="mx-auto w-full max-w-[400px]">
        <div className="relative isolate aspect-square w-full" aria-label="Choose a facilitator">
          <div aria-hidden="true" className="pointer-events-none absolute inset-[1%] rounded-full border border-muted-foreground/10" />
          {FACILITATORS.map((role, index) => {
            const RoleIcon = ROLE_ICONS[index];
            const segment = ROLE_SEGMENTS[index];
            return <button key={role.id} type="button" aria-label={role.name} aria-describedby={highlighted === index ? descriptionId : undefined} disabled={disabled}
              onClick={() => setSelected(role)} onPointerEnter={() => setHighlighted(index)} onPointerLeave={() => setHighlighted(null)} onFocus={() => setHighlighted(index)} onBlur={() => setHighlighted(null)}
              style={{ clipPath: segment.clipPath }}
              className="group absolute inset-0 bg-muted-foreground/[0.045] text-muted-foreground transition-colors enabled:hover:bg-blue-50 enabled:hover:text-blue-700 focus-visible:bg-blue-100 focus-visible:text-blue-800 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none">
              <span style={{ left: `${segment.label.x}%`, top: `${segment.label.y}%` }} className="pointer-events-none absolute flex w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 px-1 text-center">
                <RoleIcon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                <span className="block text-balance text-[10px] font-medium leading-[1.35] min-[420px]:text-[11px]">{role.name}</span>
              </span>
            </button>;
          })}
          <div aria-hidden="true" className="pointer-events-none absolute inset-[34%] flex flex-col items-center justify-center gap-1.5 rounded-full border border-muted-foreground/10 bg-background text-center shadow-[inset_0_2px_12px_0_rgba(0,0,0,0.025)]">
            <Lightbulb className="h-6 w-6 text-muted-foreground" strokeWidth={1.25} />
            <span className="text-[9px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">Your teaching<br />toolkit</span>
          </div>
        </div>
        <div id={descriptionId} aria-live="polite" className="mx-auto flex min-h-16 max-w-xs items-center justify-center px-3 text-center text-xs leading-5 text-muted-foreground">
          {highlighted === null ? 'Explore an approach. Make it your own.' : FACILITATORS[highlighted].purpose}
        </div>
      </div>
    </div>}
  </section>;
}
