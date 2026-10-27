interface PresentedJob {
  job_title?: string;
  title?: string;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  stipend_or_salary?: string;
  application_link?: string;
  learning_eligibility?: { canApply?: boolean };
}
interface LearnerApplicationProfile {
  currentBacklogs?: number | string;
}
/** Narrow repair of punctuation corrupted by the legacy UTF-8/CP437 seed export. */
export function opportunityText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replaceAll('ΓÇö', '—')
    .replaceAll('ΓÇô', '–')
    .replaceAll('ΓÇÖ', '’')
    .replaceAll('ΓÇ£', '“')
    .replaceAll('ΓÇ¥', '”')
    .replaceAll('ΓÇª', '…');
}

export function jobTitle(job: PresentedJob | null | undefined) {
  return opportunityText(job?.job_title || job?.title) || 'Job opportunity';
}
export function jobSalary(job: PresentedJob | null | undefined) {
  const min = job?.salary_range_min,
    max = job?.salary_range_max;
  if (min == null && max == null)
    return opportunityText(job?.stipend_or_salary) || 'Salary not specified';
  const currency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  return min != null && max != null
    ? `${currency(min)} – ${currency(max)}`
    : min != null
      ? `${currency(min)}+`
      : `Up to ${currency(max)}`;
}
export function applicationState(
  job: PresentedJob | null | undefined,
  {
    isApplied = false,
    isApplying = false,
    learnerData = null as LearnerApplicationProfile | null,
  } = {},
) {
  if (isApplied)
    return {
      disabled: true,
      label: job?.application_link
        ? 'Application Recorded'
        : 'Application Submitted',
    };
  if (isApplying) return { disabled: true, label: 'Submitting…' };
  if (Number(learnerData?.currentBacklogs || 0) > 0)
    return { disabled: true, label: 'Clear backlogs to apply' };
  if (job?.learning_eligibility?.canApply === false)
    return { disabled: true, label: 'Requirements not met' };
  return { disabled: false, label: 'Apply Now' };
}
export function textItems(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(opportunityText);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return textItems(parsed);
  } catch {
    /* Plain text is also supported. */
  }
  return value.split(/\n/).filter(Boolean).map(opportunityText);
}
