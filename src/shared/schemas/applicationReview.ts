import { z } from 'zod';

export const APPLICATION_STATUSES = ['applied', 'viewed', 'under_review', 'interview_scheduled', 'interviewed', 'offer_received', 'accepted', 'rejected', 'withdrawn'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export const REVIEW_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  applied: ['viewed', 'under_review', 'rejected'],
  viewed: ['under_review', 'rejected'],
  under_review: ['viewed', 'rejected'],
  rejected: ['under_review'],
};
export const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
export const reviewChoices = (status: string): ApplicationStatus[] => REVIEW_TRANSITIONS[status as ApplicationStatus] || [];
export const reviewApplicationSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid(),
  expectedStatus: z.enum(APPLICATION_STATUSES),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  status: z.enum(APPLICATION_STATUSES),
  note: z.string().trim().max(2000).default(''),
}).superRefine((value, ctx) => {
  if (!reviewChoices(value.expectedStatus).includes(value.status)) ctx.addIssue({ code: 'custom', path: ['status'], message: 'This status change must be managed through the hiring pipeline or by the candidate.' });
  if ((value.status === 'rejected' || value.expectedStatus === 'rejected') && !value.note) ctx.addIssue({ code: 'custom', path: ['note'], message: 'Add a review reason for rejecting or reopening this application.' });
});
