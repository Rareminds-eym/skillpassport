import { useEffect, useState } from 'react';
import { apiGet } from '@/shared/api';
import {
  jobTitle,
  jobSalary,
  opportunityText,
  textItems,
} from '../lib/presentation';
import {
  applicationDate,
  applicationStatus,
  applicationType,
} from '../lib/applicationPresentation';
import { OpportunityDialog } from './OpportunityDialog';

/** The application-owned read remains available after its opening closes. */
export function ApplicationDetailsDialog({ application, onClose }) {
  const [result, setResult] = useState({ id: null, detail: null, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!application) return;
    const controller = new AbortController();
    let active = true;
    setResult({ id: null, detail: null, error: '' });
    apiGet(
      `/opportunities/application-details?id=${encodeURIComponent(application.id)}`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!active) return;
        if (response.data?.application?.id !== application.id)
          throw new Error('Invalid application details.');
        setResult({
          id: application.id,
          detail: response.data.application,
          error: '',
        });
      })
      .catch(() => {
        if (active)
          setResult({
            id: application.id,
            detail: null,
            error: 'Application details could not be loaded. Please retry.',
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [application?.id, revision]);
  const detail = result.id === application?.id ? result.detail : null,
    job = detail?.opportunity;
  const visit = (job?.employment_type || application?.type) === 'factory_visit';
  return (
    <OpportunityDialog
      variant="application"
      open={!!application}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={visit ? 'Registration details' : 'Application details'}
      description={
        visit
          ? 'Review your registration and visit information.'
          : 'Review your application and opening information.'
      }
    >
      {application && (
        <div className="application-details-content space-y-5 text-sm leading-6 text-slate-600">
          <div>
            <h3 className="break-words text-base font-semibold text-slate-900">
              {job ? jobTitle(job) : application.jobTitle}
            </h3>
            <p className="break-words">
              {opportunityText(job?.company_name || application.company)}
            </p>
          </div>
          <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              [
                'Status',
                applicationStatus(
                  detail?.application_status || application.status,
                  visit,
                ),
              ],
              [
                visit ? 'Registered' : 'Applied',
                applicationDate(detail?.applied_at || application.appliedDate),
              ],
              [
                'Location',
                opportunityText(job?.location || application.location),
              ],
              [
                'Type',
                applicationType(job?.employment_type || application.type),
              ],
              ...(!visit
                ? [['Salary', job ? jobSalary(job) : application.salary]]
                : []),
              ...(job && (job.status !== 'open' || !job.is_active)
                ? [['Opening', 'No longer accepting new applications']]
                : []),
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="font-medium text-slate-900">{label}</dt>
                <dd className="break-words">{value || 'Not specified'}</dd>
              </div>
            ))}
          </dl>
          {!visit && !application.interviews?.length && (
            <p className="rounded-md bg-slate-50 p-3 text-sm leading-6">
              Updates will appear when the recruiter shares them.
            </p>
          )}
          {visit && (
            <p className="rounded-md bg-slate-50 p-3 text-sm leading-6">
              Visit updates will appear when the organizer shares them.
            </p>
          )}
          {result.id !== application.id ? (
            <p role="status">Loading submission details…</p>
          ) : result.error ? (
            <div role="alert">
              <p>{result.error}</p>
              <button
                type="button"
                onClick={() => setRevision((value) => value + 1)}
                className="mt-2 min-h-10 rounded-md border border-slate-300 px-3 font-medium text-blue-700"
              >
                Retry details
              </button>
            </div>
          ) : job ? (
            <section aria-label="Opportunity information" className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold leading-5 text-slate-900">
                  {visit ? 'About this visit' : 'About this opening'}
                </h4>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {opportunityText(job.description) ||
                    'No description provided.'}
                </p>
              </div>
              {textItems(job.requirements).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold leading-5 text-slate-900">
                    Requirements
                  </h4>
                  <ul className="list-disc space-y-1 pl-5">
                    {textItems(job.requirements).map((item, i) => (
                      <li key={i} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <p>
              Opening information is no longer available. Your submission record
              is retained.
            </p>
          )}
          {!!application.interviews?.length && (
            <section aria-label="Scheduled interviews">
              <h4 className="text-sm font-semibold leading-5 text-slate-900">
                Scheduled interviews
              </h4>
              <ul className="mt-2 space-y-2">
                {application.interviews.map((interview) => (
                  <li key={interview.id} className="break-words">
                    {interview.type || 'Interview'} ·{' '}
                    {Number.isNaN(Date.parse(interview.date))
                      ? 'Schedule to be confirmed'
                      : new Date(interview.date).toLocaleString()}
                    {interview.interviewer ? ` · ${interview.interviewer}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </OpportunityDialog>
  );
}
