import type { FC } from 'react';
import { CalendarDays, GraduationCap, Hash, School, UserRound } from 'lucide-react';

interface Props {
  name: string;
  grade: string;
  school: string;
  enrollmentNumber?: string;
  assessmentDate?: string;
  variant?: 'tabs' | 'scroll';
}

const FIELDS = (props: Props) => [
  { label: 'Learner Name', value: props.name, icon: UserRound },
  { label: 'Enrollment Number', value: props.enrollmentNumber, icon: Hash },
  { label: 'Level', value: props.grade, icon: GraduationCap },
  { label: 'School', value: props.school, icon: School },
  { label: 'Assessment Date', value: props.assessmentDate, icon: CalendarDays },
].filter((field) => field.value !== undefined);

export const GrowthMapLearnerInfoCard: FC<Props> = (props) => {
  const fields = FIELDS(props);

  if (props.variant !== 'scroll') {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0px_12px_30px_0px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col items-stretch lg:flex-row">
          <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-5 sm:px-8 sm:py-6 lg:w-5/12">
            <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full border border-blue-200/10" />
            <div className="pointer-events-none absolute -right-2 -top-6 h-32 w-32 rounded-full border border-teal-200/10" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                AI-Powered Growth Assessment
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Beyond Marks
              </h1>
              <div className="mt-2 h-0.5 w-16 bg-blue-300" />
              <p className="mt-2 text-xs font-semibold text-blue-100/90 sm:text-sm">
                8-Stage Growth Map &amp; Dimensions
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
            {fields.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="group flex flex-col justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-1 flex items-center gap-1.5 text-blue-600">
                  <Icon size={14} strokeWidth={2.2} />
                  <span className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </span>
                </div>
                <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0px_12px_30px_rgba(15,23,42,0.1)]">
      <div
        className="relative overflow-hidden px-7 py-8 sm:px-10 sm:py-9"
        style={{
          backgroundImage:
            'linear-gradient(159deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      >
        <div
          className="absolute -right-12 -top-20 size-64 rounded-full border"
          style={{ borderColor: 'rgba(191,219,254,0.1)' }}
        />
        <div
          className="absolute -right-3 -top-10 size-48 rounded-full border"
          style={{ borderColor: 'rgba(153,246,228,0.1)' }}
        />
        <div className="relative flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[2.6px] text-blue-200">
            AI-Powered Growth Assessment
          </span>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Beyond Marks Growth Map
          </h1>
          <div className="mt-3 h-px w-24 bg-blue-300" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            A personal report of your interests, real-world strengths, and collaborative superpowers beyond traditional scores or rank tables.
          </p>
        </div>
      </div>

      <div className="grid gap-4 bg-slate-50 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
        {fields.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="group rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <Icon size={15} strokeWidth={2.2} />
              <span className="text-xs font-bold tracking-wide text-slate-500">
                {label}
              </span>
            </div>
            <span className="text-base font-bold leading-tight text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
