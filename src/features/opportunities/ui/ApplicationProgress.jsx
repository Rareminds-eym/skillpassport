import { Check, Clock, XCircle } from 'lucide-react';
import {
  applicationDate,
  recruitmentStages,
} from '../lib/applicationPresentation';

export function ApplicationProgress({ application, id }) {
  const stage = application.pipelineStage;
  const rejected = stage === 'rejected' || application.status === 'rejected';
  const index = recruitmentStages.findIndex((item) => item.key === stage);
  const previous = recruitmentStages.find(
    (item) => item.key === application.pipelineStatus?.previous_stage,
  );
  return (
    <section
      id={id}
      aria-label={`Recruitment progress for ${application.jobTitle} at ${application.company}`}
      className="mt-4 min-w-0 border-t border-slate-200 pt-4 text-sm text-slate-600"
    >
      <h4 className="text-sm font-semibold leading-5 text-slate-900">
        Recruitment progress
      </h4>
      {rejected ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="flex items-center gap-2 font-medium text-slate-900">
            <XCircle size={16} />
            Not selected
          </p>
          {previous && (
            <p className="mt-1 text-sm leading-5">
              Last recorded stage: {previous.label}
            </p>
          )}
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">
            {application.rejectionReason ||
              'The employer has not shared additional feedback.'}
          </p>
        </div>
      ) : index >= 0 ? (
        <>
          <p className="mt-1 text-sm leading-5">
            Stage {index + 1} of {recruitmentStages.length} ·{' '}
            {recruitmentStages[index].label}
          </p>
          <ol className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {recruitmentStages.map((item, i) => (
              <li
                key={item.key}
                aria-current={i === index ? 'step' : undefined}
                className={`flex min-w-0 items-center gap-2 rounded-md p-2 ${i === index ? 'bg-blue-50 text-blue-800' : 'bg-slate-50 text-slate-600'}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${i < index ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : i === index ? 'border-blue-300' : 'border-slate-200'}`}
                >
                  {i < index ? <Check size={14} /> : i + 1}
                </span>
                <span className="min-w-0 break-words">
                  {item.label}
                  <span className="sr-only">
                    {i < index
                      ? ' completed'
                      : i === index
                        ? ' current'
                        : ' pending'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-2 text-sm leading-5">
          The employer has not shared a recognized stage yet.
        </p>
      )}
      {application.pipelineStageChangedAt && (
        <p className="mt-3 text-sm leading-5">
          Stage updated {applicationDate(application.pipelineStageChangedAt)}
        </p>
      )}
      {application.nextAction && !rejected && (
        <p className="mt-3 rounded-md bg-blue-50 p-3 text-sm leading-5 text-blue-900">
          Next: {application.nextAction.replaceAll('_', ' ')}
          {application.nextActionDate
            ? ` · ${applicationDate(application.nextActionDate)}`
            : ''}
        </p>
      )}
      {!!application.interviews?.length && (
        <section aria-label="Scheduled interviews" className="mt-4">
          <h5 className="text-sm font-semibold leading-5 text-slate-900">
            Scheduled interviews
          </h5>
          <ul className="mt-2 space-y-2">
            {application.interviews.map((interview) => (
              <li
                key={interview.id}
                className="min-w-0 rounded-md border border-slate-200 p-3"
              >
                <p className="break-words text-sm leading-5">
                  {interview.type || 'Interview'}
                  {interview.interviewer
                    ? ` with ${interview.interviewer}`
                    : ''}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm leading-5">
                  <Clock size={14} />
                  {Number.isNaN(Date.parse(interview.date))
                    ? 'Schedule to be confirmed'
                    : new Date(interview.date).toLocaleString()}
                </p>
                {interview.meeting_link &&
                  /^https?:\/\//i.test(interview.meeting_link) && (
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-9 items-center rounded px-2 font-medium text-blue-700 underline"
                    >
                      Join meeting
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
