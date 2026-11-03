import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
export type QuickFilter = "overdue" | "attention" | "priority" | null;
interface Props {
  showAIRecommendedOnly: boolean;
  setShowAIRecommendedOnly: (value: boolean) => void;
  totalCandidates: number;
  totalAIRecommended: number;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  activeQuickFilter: QuickFilter;
  onQuickFilterChange: (value: QuickFilter) => void;
}
export const PipelineQuickFilters = ({
  showAIRecommendedOnly,
  setShowAIRecommendedOnly,
  totalCandidates,
  totalAIRecommended,
  globalSearch,
  setGlobalSearch,
  activeQuickFilter,
  onQuickFilterChange,
}: Props) => {
  const style = (active: boolean) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary-500 ${active ? "border-primary-200 bg-primary-100 text-primary-800" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;
  return (
    <div className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
          Quick filters:
        </span>
        <button
          type="button"
          className={style(!activeQuickFilter && !showAIRecommendedOnly)}
          aria-pressed={!activeQuickFilter && !showAIRecommendedOnly}
          onClick={() => {
            setShowAIRecommendedOnly(false);
            onQuickFilterChange(null);
          }}
        >
          <CheckIcon className="h-3.5 w-3.5" />
          All candidates ({totalCandidates})
        </button>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100 px-3 text-xs font-medium text-purple-800">
          <SparklesIcon className="h-3.5 w-3.5" />
          AI recommendations ({totalAIRecommended})
        </span>
        {(
          [
            {
              value: "overdue",
              label: "Overdue actions",
              hint: "Next action date is in the past",
              icon: ClockIcon,
            },
            {
              value: "attention",
              label: "Needs attention",
              hint: "No next action has been set",
              icon: ExclamationTriangleIcon,
            },
            {
              value: "priority",
              label: "High priority",
              hint: "Recruiter rating is 4 or 5",
              icon: StarIcon,
            },
          ] as const
        ).map(({ value, label, hint, icon: Icon }) => (
          <button
            type="button"
            key={value}
            aria-pressed={activeQuickFilter === value}
            title={hint}
            className={style(activeQuickFilter === value)}
            onClick={() =>
              onQuickFilterChange(activeQuickFilter === value ? null : value)
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        {globalSearch && (
          <button
            type="button"
            onClick={() => setGlobalSearch("")}
            className={style(false)}
            aria-label="Clear candidate search"
          >
            Search: {globalSearch}
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
export default PipelineQuickFilters;
