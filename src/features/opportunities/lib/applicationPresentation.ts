export const applicationStatuses = [
  'applied',
  'viewed',
  'under_review',
  'interview_scheduled',
  'interviewed',
  'offer_received',
  'accepted',
  'rejected',
  'withdrawn',
] as const;
export function applicationDate(
  value: string | null | undefined,
  locale?: string,
  timeZone?: string,
) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Date unavailable';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}
export function applicationUpdated(
  value: string | null | undefined,
  now = new Date(),
) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Update unavailable';
  const date = new Date(value);
  const localDay = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((localDay(now) - localDay(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  return applicationDate(value);
}
export function applicationStatus(status: string, visit = false) {
  const labels: Record<string, string> = {
    applied: visit ? 'Registered' : 'Applied',
    viewed: 'Viewed',
    under_review: 'Under review',
    interview_scheduled: 'Interview scheduled',
    interviewed: 'Interviewed',
    offer_received: 'Offer received',
    accepted: visit ? 'Confirmed' : 'Offer accepted',
    rejected: visit ? 'Not selected' : 'Not selected',
    withdrawn: visit ? 'Registration withdrawn' : 'Withdrawn',
  };
  return labels[status] || 'Status unavailable';
}
export const recruitmentStages = [
  { key: 'sourced', label: 'Sourced' },
  { key: 'screened', label: 'Screened' },
  { key: 'interview_1', label: 'Interview 1' },
  { key: 'interview_2', label: 'Interview 2' },
  { key: 'offer', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
];
export function applicationType(value: string | null | undefined) {
  if (!value || value === 'N/A') return '';
  if (value === 'factory_visit') return 'Industrial visit';
  return value.replaceAll('_', ' ');
}
