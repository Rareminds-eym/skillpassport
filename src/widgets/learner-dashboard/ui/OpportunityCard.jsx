import { ArrowUpRight, Bookmark, Briefcase, Eye, MapPin } from 'lucide-react';
import { LearningEligibilityPanel } from '@/features/opportunities/ui/LearningEligibilityPanel';
import {
  applicationState,
  jobSalary,
  jobTitle,
  opportunityText,
} from '@/features/opportunities/lib/presentation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

const avatarTones = [
  'border-blue-100 bg-blue-50 text-blue-700',
  'border-teal-100 bg-teal-50 text-teal-700',
  'border-amber-100 bg-amber-50 text-amber-800',
  'border-indigo-100 bg-indigo-50 text-indigo-700',
];

const OpportunityCard = ({
  opportunity,
  onClick,
  isSelected,
  isApplied = false,
  isApplying = false,
  isSaved = false,
  onToggleSave,
  onApply,
  learnerData,
  list = false,
}) => {
  const title = jobTitle(opportunity);
  const company =
    opportunityText(opportunity.company_name) || 'Company not specified';
  const avatarTone =
    avatarTones[
      Array.from(company).reduce(
        (sum, letter) => sum + letter.codePointAt(0),
        0,
      ) % avatarTones.length
    ];
  const state = applicationState(opportunity, {
    isApplied,
    isApplying,
    learnerData,
  });
  const salary = jobSalary(opportunity);
  const hasSalary =
    opportunity.salary_range_min != null ||
    opportunity.salary_range_max != null;
  const hasLearning =
    opportunity.learning_requirements?.length ||
    opportunity.learning_eligibility;
  const tags = [
    ...new Set(
      [
        opportunity.employment_type,
        opportunity.mode,
        opportunity.experience_level,
      ]
        .filter(Boolean)
        .map(opportunityText),
    ),
  ];
  const iconButton =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  return (
    <TooltipProvider delayDuration={250}>
      <article
        className={`group flex h-full min-w-0 flex-col rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-[border-color,box-shadow] ${isSelected ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]'} ${list ? 'w-full' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold tracking-wide ${avatarTone}`}
          >
            {company.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-6 text-slate-950">
              <button
                type="button"
                onClick={onClick}
                aria-label={`View details for ${title}`}
                aria-current={isSelected ? 'true' : undefined}
                title={title}
                className="line-clamp-2 break-words text-left hover:text-blue-700 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {title}
              </button>
            </h3>
            <p
              className="mt-1 break-words text-sm leading-5 text-slate-600"
              title={company}
            >
              {company}
            </p>
          </div>
          {onToggleSave && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggleSave(opportunity)}
                  aria-label={isSaved ? `Unsave ${title}` : `Save ${title}`}
                  aria-pressed={isSaved}
                  className={`${iconButton} ${isSaved ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-transparent'}`}
                >
                  <Bookmark
                    size={16}
                    className={isSaved ? 'fill-blue-600 text-blue-600' : ''}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isSaved ? 'Remove from saved jobs' : 'Save job'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="mb-3 mt-3 space-y-2.5">
          <div className="flex min-w-0 items-start gap-1.5 text-sm leading-5 text-slate-600">
            <MapPin size={13} aria-hidden="true" className="mt-1 shrink-0" />
            <span className="break-words">
              {opportunityText(opportunity.location) ||
                'Location not specified'}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={tag}
                  className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium leading-4 ${tag.toLowerCase() === 'remote' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                >
                  {index === 0 && (
                    <Briefcase
                      size={13}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                  )}
                  <span className="break-words">{tag}</span>
                </span>
              ))}
            </div>
          )}
          {hasLearning ? (
            <LearningEligibilityPanel job={opportunity} compact />
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p
            className={`min-w-0 flex-[1_1_100px] break-words leading-5 ${hasSalary ? 'text-sm font-semibold tracking-tight text-slate-900' : 'text-sm text-slate-600'}`}
          >
            {salary}
          </p>
          <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClick}
                  aria-label={`Details for ${title}`}
                  className={iconButton}
                >
                  <Eye size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>View job details</TooltipContent>
            </Tooltip>
            {onApply ? (
              <button
                type="button"
                onClick={onApply}
                disabled={state.disabled}
                className="inline-flex min-h-9 max-w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600"
              >
                <span className="break-words">{state.label}</span>
                {!state.disabled && (
                  <ArrowUpRight
                    size={14}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            ) : isApplied ? (
              <span className="text-sm font-medium text-emerald-700">
                {state.label}
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </TooltipProvider>
  );
};
export default OpportunityCard;
