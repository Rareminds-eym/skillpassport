import { useEffect, useRef, useState } from 'react';
import {
  Eye,
  MapPin,
  MessageSquare,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MessageService from '@/shared/api/messageService';
import offerManagementService from '../api/offerManagementService';
import {
  applicationDate,
  applicationStatus,
  applicationStatuses,
  applicationType,
} from '../lib/applicationPresentation';
import { ApplicationDetailsDialog } from './ApplicationDetailsDialog';
import { ApplicationProgress } from './ApplicationProgress';
import { OpportunityDialog } from './OpportunityDialog';

export function ApplicationsPanel({
  applications,
  loading,
  error,
  total,
  page,
  totalPages,
  onPageChange,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  kindFilter = 'all',
  setKindFilter,
  onResetFilters,
  onBrowseJobs,
  learnerId,
  navigate,
  onApplicationsUpdate,
}) {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [messageBusy, setMessageBusy] = useState(null);
  const [messageError, setMessageError] = useState({});
  const [offerBusy, setOfferBusy] = useState(null);
  const [decline, setDecline] = useState(null);
  const [reason, setReason] = useState('');
  const offerLock = useRef(false),
    messageLock = useRef(false);
  useEffect(() => {
    const hidden = document.body.classList.contains('hide-zoho-widget');
    document.body.classList.add(
      'hide-zoho-widget',
      'application-tracking-active',
    );
    return () => {
      document.body.classList.remove('application-tracking-active');
      if (!hidden) document.body.classList.remove('hide-zoho-widget');
    };
  }, []);
  const statusOptions =
    kindFilter === 'visits'
      ? applicationStatuses.filter(
          (status) =>
            !['interview_scheduled', 'interviewed', 'offer_received'].includes(
              status,
            ),
        )
      : applicationStatuses;
  const filtered =
    !!searchQuery || statusFilter !== 'all' || kindFilter !== 'all';
  const noun =
    kindFilter === 'jobs'
      ? 'application'
      : kindFilter === 'visits'
        ? 'registration'
        : 'submission';
  const context = (app) => `${app.jobTitle} at ${app.company}`;
  async function message(app) {
    if (messageLock.current) return;
    if (!learnerId || !app.recruiterId) {
      setMessageError((previous) => ({
        ...previous,
        [app.id]: 'Contact information is unavailable for this submission.',
      }));
      return;
    }
    messageLock.current = true;
    setMessageBusy(app.id);
    setMessageError((previous) => ({ ...previous, [app.id]: '' }));
    try {
      const conversation = await MessageService.getOrCreateConversation(
        String(learnerId),
        String(app.recruiterId),
        app.id,
        app.opportunityId,
        `Application: ${app.jobTitle}`,
      );
      navigate('/learner/messages', {
        state: {
          conversationId: conversation.id,
          recipientId: app.recruiterId,
          recipientName: app.company,
          recipientType: 'recruiter',
        },
      });
    } catch {
      setMessageError((previous) => ({
        ...previous,
        [app.id]: 'Messaging could not be opened. Please retry.',
      }));
    } finally {
      messageLock.current = false;
      setMessageBusy(null);
    }
  }
  async function respond(id, accepted) {
    if (offerLock.current) return;
    offerLock.current = true;
    setOfferBusy(id);
    try {
      const result = accepted
        ? await offerManagementService.acceptOffer(id)
        : await offerManagementService.rejectOffer(id, reason.trim() || null);
      if (!result.success)
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Your response could not be saved. Please retry.',
        );
      toast.success(accepted ? 'Offer accepted.' : 'Offer declined.');
      setDecline(null);
      setReason('');
      onApplicationsUpdate?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Your response could not be saved. Please retry.',
      );
    } finally {
      offerLock.current = false;
      setOfferBusy(null);
    }
  }
  return (
    <section
      aria-labelledby="applications-heading"
      className="applications-panel min-w-0 space-y-4"
    >
      <h2 id="applications-heading" className="sr-only">
        Your applications and visit registrations
      </h2>
      <ApplicationDetailsDialog
        application={selected}
        onClose={() => setSelected(null)}
      />
      <OpportunityDialog
        variant="danger"
        open={!!decline}
        onOpenChange={(open) => {
          if (!open && !offerBusy) {
            setDecline(null);
            setReason('');
          }
        }}
        title="Decline offer"
        description="You can provide an optional reason for your decision."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={!!offerBusy}
              onClick={() => {
                setDecline(null);
                setReason('');
              }}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!!offerBusy}
              onClick={() => respond(decline, false)}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {offerBusy ? 'Declining…' : 'Decline offer'}
            </button>
          </div>
        }
      >
        <label
          htmlFor="decline-offer-reason"
          className="text-sm font-medium text-slate-900"
        >
          Reason (optional)
        </label>
        <textarea
          id="decline-offer-reason"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={!!offerBusy}
          className="mt-2 w-full resize-none rounded-md border border-slate-300 p-3 text-sm"
        />
      </OpportunityDialog>
      <div className="application-filters flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-[1_1_260px]">
          <span className="sr-only">Search applications</span>
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute left-3 top-3 text-slate-500"
          />
          <input
            type="search"
            maxLength={200}
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value.slice(0, 200))
            }
            placeholder="Search job title or company…"
            className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-10 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear application search"
              title="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-0.5 flex h-9 w-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <label className="min-w-0 flex-[1_1_140px] sm:flex-none">
          <span className="sr-only">Submission type</span>
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="all">All submissions</option>
            <option value="jobs">Job applications</option>
            <option value="visits">Visit registrations</option>
          </select>
        </label>
        <label className="min-w-0 flex-[1_1_150px] sm:flex-none">
          <span className="sr-only">Application status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {applicationStatus(status, kindFilter === 'visits')}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-10 rounded-md px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Reset filters
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="text-sm text-slate-600">
        {loading
          ? 'Loading submissions…'
          : error
            ? 'Submissions could not be loaded'
            : `${total} ${noun}${total === 1 ? '' : 's'}${total > 0 && totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}
      </p>
      <div aria-busy={loading} className="min-w-0">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading your submissions…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={onApplicationsUpdate}
              className="mt-2 min-h-9 rounded px-2 font-medium text-blue-700"
            >
              Retry applications
            </button>
          </div>
        ) : !applications.length ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
            <h3 className="text-base font-semibold text-slate-900">
              {filtered
                ? 'No submissions match your filters'
                : 'No submissions yet'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {filtered
                ? 'Try another keyword or reset your filters.'
                : 'Your job applications and visit registrations will appear here.'}
            </p>
            <button
              type="button"
              onClick={filtered ? onResetFilters : onBrowseJobs}
              className="mt-4 min-h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-blue-700"
            >
              {filtered ? 'Clear search and filters' : 'Browse jobs'}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {applications.map((app) => {
              const visit = app.type === 'factory_visit',
                identity = context(app),
                progressId = `application-progress-${app.id}`,
                titleId = `application-title-${app.id}`;
              const canTrack =
                !visit && app.hasPipelineStatus && !!app.pipelineStage;
              const status = applicationStatus(app.status, visit);
              const positive = app.status === 'accepted',
                negative =
                  app.status === 'rejected' || app.status === 'withdrawn';
              return (
                <li key={app.id}>
                  <article
                    aria-labelledby={titleId}
                    className="opportunity-card opportunity-application min-w-0 rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                      <div className="min-w-0 flex-[1_1_180px]">
                        <h3
                          id={titleId}
                          className="break-words text-base font-semibold leading-6 text-slate-900"
                        >
                          {app.jobTitle}
                        </h3>
                        <p className="mt-0.5 break-words text-sm leading-5 text-slate-600">
                          {app.company}
                        </p>
                      </div>
                      <span
                        className={`max-w-full rounded-md border px-2 py-1 text-xs font-medium ${positive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : negative ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-blue-200 bg-blue-50 text-blue-800'}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-5 text-slate-600">
                      {app.location && app.location !== 'N/A' && (
                        <span className="flex min-w-0 items-start gap-1.5">
                          <MapPin
                            aria-hidden="true"
                            size={15}
                            className="mt-0.5 shrink-0"
                          />
                          <span className="min-w-0 break-words">
                            {app.location}
                          </span>
                        </span>
                      )}
                      {!visit && app.salary && <span>{app.salary}</span>}
                      <span className="flex items-center gap-1.5">
                        <Clock aria-hidden="true" size={15} />
                        <span>
                          {visit ? 'Registered' : 'Applied'}{' '}
                          <time dateTime={app.appliedDate || undefined}>
                            {applicationDate(app.appliedDate)}
                          </time>
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-600">
                        {applicationType(app.type) && (
                          <span className="rounded bg-slate-50 px-2 py-1">
                            {applicationType(app.type)}
                          </span>
                        )}
                        {(visit ? app.industry : app.level) && (
                          <span className="rounded bg-slate-50 px-2 py-1">
                            {visit ? 'Industry: ' : ''}
                            {visit ? app.industry : app.level}
                          </span>
                        )}
                        {app.updatedAt &&
                          app.updatedAt !== app.appliedDate &&
                          app.lastUpdate &&
                          app.lastUpdate !== 'Update unavailable' && (
                            <span>Updated {app.lastUpdate}</span>
                          )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {app.status === 'offer_received' && !visit && (
                          <>
                            <button
                              type="button"
                              disabled={!!offerBusy}
                              onClick={() => respond(app.id, true)}
                              className="min-h-10 rounded-md border border-emerald-300 px-3 text-sm font-medium text-emerald-800 disabled:opacity-50"
                            >
                              {offerBusy === app.id
                                ? 'Saving…'
                                : 'Accept offer'}
                            </button>
                            <button
                              type="button"
                              disabled={!!offerBusy}
                              onClick={() => setDecline(app.id)}
                              className="min-h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {canTrack && (
                          <button
                            type="button"
                            aria-label={`${expanded[app.id] ? 'Hide' : 'Track'} progress for ${identity}`}
                            aria-expanded={!!expanded[app.id]}
                            aria-controls={progressId}
                            onClick={() =>
                              setExpanded((previous) => ({
                                ...previous,
                                [app.id]: !previous[app.id],
                              }))
                            }
                            className="flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700"
                          >
                            {expanded[app.id] ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                            {expanded[app.id]
                              ? 'Hide progress'
                              : 'Track progress'}
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`View details for ${identity}`}
                          onClick={() => setSelected(app)}
                          className="flex min-h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <Eye size={15} />
                          View details
                        </button>
                        {app.recruiterId && (
                          <button
                            type="button"
                            aria-label={`Message recruiter about ${identity}`}
                            disabled={!!messageBusy}
                            onClick={() => message(app)}
                            className="flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <MessageSquare size={15} />
                            {messageBusy === app.id ? 'Opening…' : 'Message'}
                          </button>
                        )}
                      </div>
                    </div>
                    {messageError[app.id] && (
                      <div
                        role="alert"
                        className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900"
                      >
                        <p>{messageError[app.id]}</p>
                        {app.recruiterId && (
                          <button
                            type="button"
                            disabled={!!messageBusy}
                            onClick={() => message(app)}
                            className="mt-1 min-h-9 rounded px-2 font-medium text-blue-700"
                          >
                            Retry messaging
                          </button>
                        )}
                      </div>
                    )}
                    {canTrack && (
                      <div hidden={!expanded[app.id]}>
                        <ApplicationProgress
                          application={app}
                          id={progressId}
                        />
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!loading && !error && totalPages > 1 && (
        <nav
          aria-label="Application pages"
          className="flex items-center justify-between gap-3 text-sm"
        >
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="min-h-10 rounded-md border bg-white px-3 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="min-h-10 rounded-md border bg-white px-3 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
