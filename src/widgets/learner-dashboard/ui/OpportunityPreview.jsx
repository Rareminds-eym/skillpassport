import { useEffect, useRef, useState } from 'react';
import { Bookmark, ExternalLink, MapPin } from 'lucide-react';
import { OpportunityDialog } from '@/features/opportunities/ui/OpportunityDialog';
import { LearningEligibilityPanel } from '@/features/opportunities/ui/LearningEligibilityPanel';
import {
  applicationState,
  jobSalary,
  jobTitle,
  opportunityText,
  textItems,
} from '@/features/opportunities/lib/presentation';
import { openExternalApplication } from '@/features/opportunities/lib/externalApplication';

const button =
  'min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60';
const primary = `${button} border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-600`;

export default function OpportunityPreview({
  opportunity,
  onApply,
  onToggleSave,
  isApplied = false,
  isSaved = false,
  isApplying = false,
  needsProfileCompletion = false,
  missingFields = [],
  completionPercentage = 0,
  profileCheckLoading = false,
  profileCheckError = null,
  onRetryProfile,
  navigate,
  learnerData,
  canAccessOpportunities = true,
  onShowUpgradePrompt,
  showSummary = true,
  detailsOpen,
  onDetailsOpenChange,
}) {
  const [localDetails, setLocalDetails] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [profilePrompt, setProfilePrompt] = useState(false);
  const [status, setStatus] = useState('confirm');
  const [actionError, setActionError] = useState('');
  const inFlight = useRef(false);
  const showDetails = detailsOpen ?? localDetails;
  const setDetails = (open) => {
    setLocalDetails(open);
    onDetailsOpenChange?.(open);
  };
  useEffect(() => {
    setConfirmation(false);
    setProfilePrompt(false);
    setStatus('confirm');
    setActionError('');
    setLocalDetails(false);
  }, [opportunity?.id]);
  if (!opportunity)
    return showSummary ? (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm leading-5 text-slate-600">
          Select a job to view details.
        </p>
      </div>
    ) : null;
  const title = jobTitle(opportunity);
  const state = applicationState(opportunity, {
    isApplied,
    isApplying: isApplying || status === 'applying',
    learnerData,
  });
  const external = !!opportunity.application_link;
  const startApplication = () => {
    if (state.disabled || profileCheckLoading || profileCheckError) return;
    if (!canAccessOpportunities) {
      onShowUpgradePrompt?.();
      return;
    }
    if (needsProfileCompletion) {
      setProfilePrompt(true);
      return;
    }
    setActionError('');
    setStatus('confirm');
    setConfirmation(true);
  };
  const confirmApplication = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('applying');
    setActionError('');
    try {
      const acknowledged = await onApply(opportunity);
      if (acknowledged === true) setStatus('success');
      else {
        setStatus('confirm');
        setActionError(
          'The application was not completed. Review any message and try again.',
        );
      }
    } catch {
      setStatus('confirm');
      setActionError('Unable to complete your application. Please try again.');
    } finally {
      inFlight.current = false;
    }
  };
  const save = onToggleSave && (
    <button
      type="button"
      onClick={() => onToggleSave(opportunity)}
      aria-label={isSaved ? 'Unsave job' : 'Save job'}
      title={isSaved ? 'Unsave job' : 'Save job'}
      aria-pressed={isSaved}
      className={button}
    >
      <Bookmark
        size={17}
        className={isSaved ? 'fill-blue-600 text-blue-600' : ''}
      />
    </button>
  );
  const sections = [
    ['Required skills', opportunity.skills_required],
    ['Requirements', opportunity.requirements],
    ['Responsibilities', opportunity.responsibilities],
    ['Benefits', opportunity.benefits],
    ['What you’ll learn', opportunity.what_youll_learn],
    ['What you’ll do', opportunity.what_youll_do],
    ['Prerequisites', opportunity.prerequiste],
    ['Schedule', opportunity.schedule_note],
    [
      'Project / outcome',
      opportunity.final_artifact_description || opportunity.final_artifact_type,
    ],
    ['Mentor', opportunity.mentor_bio],
    ['Safety', opportunity.safety_note],
    ['Parent involvement', opportunity.parent_role],
  ];
  return (
    <>
      {showSummary && (
        <aside className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="break-words text-base font-semibold leading-6 text-slate-900">
                {title}
              </h2>
              {save}
            </div>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {opportunityText(opportunity.company_name)}
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              {opportunityText(opportunity.location) ||
                'Location not specified'}
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-800">
              {jobSalary(opportunity)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              {[opportunity.employment_type, opportunity.mode]
                .filter(Boolean)
                .map((item, i) => (
                  <span key={i} className="rounded bg-slate-100 px-2 py-1">
                    {item}
                  </span>
                ))}
            </div>
          </div>
          <div className="space-y-4 p-5">
            <p className="line-clamp-4 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
              {opportunityText(opportunity.description) ||
                'Review the job requirements and application details.'}
            </p>
            <LearningEligibilityPanel job={opportunity} compact />
            <button
              type="button"
              onClick={() => setDetails(true)}
              className={`${primary} w-full`}
            >
              View More Details
            </button>
          </div>
        </aside>
      )}
      <OpportunityDialog
        variant="job"
        open={showDetails}
        onOpenChange={setDetails}
        title={title}
        description={opportunityText(opportunity.company_name)}
        wide
        footer={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={startApplication}
                disabled={
                  state.disabled || profileCheckLoading || !!profileCheckError
                }
                className={`${primary} flex-1`}
              >
                {state.disabled
                  ? state.label
                  : profileCheckLoading
                    ? 'Checking profile…'
                    : profileCheckError
                      ? 'Profile check unavailable'
                      : needsProfileCompletion
                        ? 'Complete Profile Info'
                        : !canAccessOpportunities
                          ? 'View application plans'
                          : 'Apply Now'}
              </button>
              {save}
              {external && (
                <button
                  type="button"
                  title="Open employer application page"
                  aria-label="Open employer application page"
                  className={button}
                  onClick={() => {
                    try {
                      openExternalApplication(opportunity.application_link);
                      setActionError('');
                    } catch {
                      setActionError(
                        'The employer application link is invalid or unavailable.',
                      );
                    }
                  }}
                >
                  <ExternalLink size={17} />
                </button>
              )}
            </div>
            {profileCheckError && (
              <button
                type="button"
                onClick={onRetryProfile}
                className="mt-2 text-sm text-blue-700 underline"
              >
                Retry profile check
              </button>
            )}
            {isApplied && (
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {external
                  ? 'Recorded for tracking only. Complete submission on the employer website; use the employer link to retry.'
                  : 'Track your application in the Applications tab.'}
              </p>
            )}
            {!isApplied && external && (
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Record for tracking, then complete submission on the employer
                website.
              </p>
            )}
            {actionError && !confirmation && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {actionError}
              </p>
            )}
          </>
        }
      >
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            {[
              ['Location', opportunityText(opportunity.location)],
              ['Employment', opportunity.employment_type],
              ['Work mode', opportunity.mode],
              ['Salary', jobSalary(opportunity)],
              ['Department', opportunity.department],
              ['Experience', opportunity.experience_level],
              ['Sector', opportunity.sector],
              ['Exposure', opportunity.exposure_type],
              [
                'Duration',
                opportunity.duration_weeks
                  ? `${opportunity.duration_weeks} weeks`
                  : opportunity.duration_days
                    ? `${opportunity.duration_days} days`
                    : opportunity.total_hours
                      ? `${opportunity.total_hours} hours`
                      : null,
              ],
              [
                'Cost',
                opportunity.cost_inr != null
                  ? `₹${opportunity.cost_inr}${opportunity.cost_note ? ` · ${opportunity.cost_note}` : ''}`
                  : opportunity.cost_note,
              ],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words font-medium text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Job description
            </h3>
            <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">
              {opportunityText(opportunity.description) ||
                'The employer has not provided a description.'}
            </p>
          </section>
          {sections.map(([label, value]) => {
            const items = textItems(value);
            return items.length ? (
              <section key={label}>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  {label}
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  {items.map((item, i) => (
                    <li key={i} className="break-words">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null;
          })}
          <LearningEligibilityPanel job={opportunity} />
          {(opportunity.deadline || opportunity.closing_date) && (
            <p className="text-sm leading-5 text-slate-700">
              Application deadline:{' '}
              {new Date(
                opportunity.deadline || opportunity.closing_date,
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      </OpportunityDialog>
      <OpportunityDialog
        variant={status === 'success' ? 'success' : 'confirmation'}
        open={confirmation}
        onOpenChange={(open) => {
          if (!inFlight.current) setConfirmation(open);
        }}
        title={
          status === 'success'
            ? external
              ? 'Application Recorded!'
              : 'Application Submitted!'
            : 'Confirm Application'
        }
        description={title}
        footer={
          status === 'success' ? (
            <button
              type="button"
              className={primary}
              onClick={() => setConfirmation(false)}
            >
              Done
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                className={button}
                disabled={status === 'applying'}
                onClick={() => setConfirmation(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${primary} flex-1`}
                onClick={confirmApplication}
                disabled={status === 'applying' || isApplying}
              >
                {status === 'applying'
                  ? 'Submitting…'
                  : external
                    ? 'Record & Open Employer Site'
                    : 'Confirm & Apply'}
              </button>
            </div>
          )
        }
      >
        <p className="text-sm leading-6 text-slate-700">
          {status === 'success'
            ? external
              ? 'Recorded for tracking; opening a page does not confirm submission. Complete the application on the employer website.'
              : 'Your application was submitted successfully. Track updates in Applications.'
            : external
              ? 'We will record this application for tracking. Complete and submit it on the employer website.'
              : 'Your saved profile will be shared with the employer. Confirm that you want to apply for this job.'}
        </p>
        {actionError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {actionError}
          </p>
        )}
      </OpportunityDialog>
      <OpportunityDialog
        variant="profile"
        open={profilePrompt}
        onOpenChange={setProfilePrompt}
        title="Complete Your Profile"
        description={`Your profile is ${completionPercentage}% complete`}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={button}
              onClick={() => setProfilePrompt(false)}
            >
              Later
            </button>
            <button
              type="button"
              className={primary}
              onClick={() => navigate?.('/learner/settings')}
            >
              Go to Settings
            </button>
          </div>
        }
      >
        <p className="mb-2 text-sm font-medium text-slate-800">
          Missing information:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </OpportunityDialog>
    </>
  );
}
