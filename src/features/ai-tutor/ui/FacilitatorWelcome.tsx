import TutorOrb from './TutorOrb';

const ACTIONS = [
  { label: 'Plan', role: 'organizer', position: 'left-[7%] top-[15%]' },
  { label: 'Create', role: 'resource-provider', position: 'right-[4%] top-[3%]' },
  { label: 'Guide', role: 'mentor-and-guide', position: 'right-[2%] bottom-[23%]' },
  { label: 'Solve', role: 'problem-solver', position: 'left-[2%] bottom-[10%]' },
];
interface Props { onSelectRole: (_id: string) => void; disabled?: boolean }

/** Reference-inspired welcome illustration; action labels remain real accessible buttons. */
export default function FacilitatorWelcome({ onSelectRole, disabled = false }: Props) {
  return <section aria-label="Facilitator welcome" className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center py-5">
    <p className="!m-0 w-full max-w-sm px-5 text-left !text-sm !leading-6 text-muted-foreground sm:!text-base">Explore ideas, get guidance, and create<br className="hidden sm:block" /> better learning experiences.</p>
    <TutorOrb>
      {ACTIONS.map(action => <button key={action.role} type="button" disabled={disabled} onClick={() => onSelectRole(action.role)} className={`absolute z-10 inline-flex min-h-11 min-w-20 items-center justify-center rounded-full border border-primary/5 bg-primary/5 px-5 py-2 text-xs font-medium text-slate-700 backdrop-blur-sm transition-colors hover:border-primary/15 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40 sm:!text-sm ${action.position}`}>{action.label}</button>)}
    </TutorOrb>
    <div className="px-2 text-center"><h2 className="!mb-1.5 !mt-0 !text-xl !font-semibold !leading-7 !tracking-tight text-foreground sm:!text-2xl sm:!leading-8">What would you like to do?</h2><p className="!m-0 !text-sm !leading-6 text-muted-foreground">Choose a facilitator or just ask a question.</p></div>
  </section>;
}
