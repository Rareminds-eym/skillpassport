import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Compass, FileText, Layers, Lightbulb } from 'lucide-react';
import { FACILITATORS, type FacilitatorRole } from '../config/facilitators';

const ROLE_ICONS = [CalendarDays, BookOpen, Layers, FileText, Lightbulb, Compass];
interface Props { courseName: string; disabled?: boolean; onAction: (_role: FacilitatorRole) => void; onBack?: () => void }

/** One workspace, six discoverable roles; examples never impersonate live learner evidence. */
export default function FacilitatorHub({ courseName, disabled = false, onAction, onBack }: Props) {
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
        <h2 className="!mb-2 !mt-0 !text-2xl !font-semibold !leading-8 !tracking-tight">More ways to bring<br />learning to life.</h2>
        <p className="!m-0 !text-xs !leading-5 text-muted-foreground">Plan, create and support learning in <span className="font-medium text-foreground">{courseName}</span>. Choose a facilitator to explore an example and get started.</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2" aria-label="Choose a facilitator">
        {FACILITATORS.map((role, index) => {
          const RoleIcon = ROLE_ICONS[index]; return <button key={role.id} type="button" disabled={disabled} onClick={() => setSelected(role)} className={`flex min-h-32 flex-col items-start rounded-xl border border-border bg-card/90 p-3.5 text-left shadow-sm backdrop-blur-sm transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-primary/40 enabled:hover:bg-primary/5 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none ${focusClass}`}>
            <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><RoleIcon className="h-4 w-4" /></span>
            <span className="!text-xs font-semibold !leading-5">{role.name}</span><span className="mt-1 !text-[11px] !leading-4 text-muted-foreground">{role.purpose}</span>
          </button>;
        })}
      </div>
    </div>}
  </section>;
}
