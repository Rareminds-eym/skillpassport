import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowPathIcon, CheckCircleIcon, ClipboardDocumentCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiPost } from '@/shared/api/apiClient';

interface LessonPlanEditRequest {
  id: string;
  plan_id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  department_name?: string;
  program_name?: string;
  unit_name?: string;
  academic_year: string;
  semester: number;
  action: 'create' | 'edit';
  requester_email: string;
  requested_by: string;
  requested_at: string;
  proposed_data: Record<string, any>;
  before_data: Record<string, any>;
}

interface ReviewDecision {
  id: string;
  plan_id: string;
  course_name: string;
  course_code: string;
  academic_year: string;
  status: 'approved' | 'rejected';
  action: 'create' | 'edit';
  requester_email: string;
  reviewed_at: string;
  review_notes?: string;
  proposed_data: Record<string, any>;
}

export function CollegeLessonPlanReviewDrawer({ onReviewed }: { onReviewed?: () => void }) {
  const [searchParams] = useSearchParams();
  const requestedChange = searchParams.get('reviewChange');
  const openedChange = useRef<string | null>(null);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingRequests, setPendingRequests] = useState<LessonPlanEditRequest[]>([]);
  const [approvedDecisions, setApprovedDecisions] = useState<ReviewDecision[]>([]);
  const [rejectedDecisions, setRejectedDecisions] = useState<ReviewDecision[]>([]);

  const [reviewing, setReviewing] = useState<LessonPlanEditRequest | null>(null);
  const [note, setNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const loadChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiPost('/college-admin/lesson-plans', { action: 'get-educator-changes' });
      const data = res?.data || res || {};
      setPendingRequests(data.pending || []);
      setApprovedDecisions(data.approved || []);
      setRejectedDecisions(data.rejected || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load educator session plan changes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, []);

  useEffect(() => {
    if (!requestedChange || openedChange.current === requestedChange || pendingRequests.length === 0) return;
    const req = pendingRequests.find(r => r.id === requestedChange);
    if (req) {
      openedChange.current = requestedChange;
      setActiveTab('pending');
      setReviewing(req);
      setNote('');
      requestAnimationFrame(() => {
        document.getElementById(`lesson-plan-change-${req.id}`)?.scrollIntoView({ block: 'nearest' });
      });
    }
  }, [requestedChange, pendingRequests]);

  const handleReview = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      setActionBusy(true);
      await apiPost('/college-admin/lesson-plans', {
        action: 'review-educator-change',
        requestId,
        decision,
        notes: note,
      });

      toast.success(
        decision === 'approved'
          ? 'Session plan approved and published to the live portal.'
          : 'Session plan changes rejected. Existing content was preserved.'
      );

      setReviewing(null);
      setNote('');
      await loadChanges();
      onReviewed?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs.Root value={activeTab} onValueChange={v => setActiveTab(v as any)} className="space-y-4">
        <Tabs.List aria-label="Educator session plan review status" className="flex border-b border-gray-200">
          <Tabs.Trigger
            value="pending"
            className="min-h-11 flex-1 border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            Pending ({pendingRequests.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="approved"
            className="min-h-11 flex-1 border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            Approved ({approvedDecisions.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="rejected"
            className="min-h-11 flex-1 border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            Rejected ({rejectedDecisions.length})
          </Tabs.Trigger>
        </Tabs.List>

        {/* PENDING TAB */}
        <Tabs.Content value="pending" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="!m-0 !text-sm !font-semibold text-gray-900">Pending review</h3>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {pendingRequests.length}
              </span>
            </div>
            <button
              type="button"
              disabled={loading || actionBusy}
              onClick={() => loadChanges()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="h-28 rounded-xl border border-gray-200 bg-gray-50 p-4" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button type="button" onClick={() => loadChanges()} className="mt-2 font-semibold underline">
                Try again
              </button>
            </div>
          )}

          {!loading && pendingRequests.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400">
                <ClipboardDocumentCheckIcon className="h-6 w-6" />
              </span>
              <h4 className="!m-0 !text-base !font-semibold text-gray-900">You're all caught up</h4>
              <p className="mt-2 !text-sm text-gray-600">No session plans awaiting review.</p>
              <p className="mt-1 max-w-sm !text-sm !leading-6 text-gray-500">
                New session plans and edits submitted by educators will appear here for your approval.
              </p>
            </div>
          )}

          {!loading &&
            pendingRequests.map(req => {
              const isEdit = req.action === 'edit';
              const proposed = req.proposed_data || {};
              const before = req.before_data || {};

              return (
                <article
                  id={`lesson-plan-change-${req.id}`}
                  key={req.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="!m-0 !text-base !font-semibold text-gray-900">
                          {req.course_name || 'Course'}
                        </h4>
                        <p className="mt-1 !text-xs text-gray-500">
                          {req.course_code ? `${req.course_code} · ` : ''}
                          Semester {req.semester} ({req.academic_year})
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                          isEdit ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {isEdit ? 'Proposed edit' : 'New session plan'}
                      </span>
                    </div>
                    <p className="mt-2 !text-xs text-gray-500">
                      Submitted by <span className="font-medium text-gray-700">{req.requester_email}</span>
                    </p>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {isEdit ? (
                      <dl className="grid gap-5 sm:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Current content
                          </dt>
                          <dd className="space-y-2 text-xs text-gray-700">
                            <p><span className="font-semibold">Title:</span> {before.title || '—'}</p>
                            <p><span className="font-semibold">Date:</span> {before.session_date || '—'}</p>
                            <p><span className="font-semibold">Duration:</span> {before.duration_minutes ? `${before.duration_minutes} mins` : '—'}</p>
                            <p><span className="font-semibold">Objectives:</span> {before.session_objectives || '—'}</p>
                            <p><span className="font-semibold">Approach:</span> {before.teaching_methodology || '—'}</p>
                          </dd>
                        </div>
                        <div className="rounded-lg bg-indigo-50/60 p-3">
                          <dt className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                            Proposed content
                          </dt>
                          <dd className="space-y-2 text-xs text-gray-800">
                            <p><span className="font-semibold">Title:</span> {proposed.title || '—'}</p>
                            <p><span className="font-semibold">Date:</span> {proposed.session_date || '—'}</p>
                            <p><span className="font-semibold">Duration:</span> {proposed.duration_minutes ? `${proposed.duration_minutes} mins` : '—'}</p>
                            <p><span className="font-semibold">Objectives:</span> {proposed.session_objectives || '—'}</p>
                            <p><span className="font-semibold">Approach:</span> {proposed.teaching_methodology || '—'}</p>
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <div className="rounded-lg bg-blue-50/50 p-4 space-y-2 text-xs text-gray-800">
                        <p><span className="font-semibold text-gray-700">Session title:</span> {proposed.title || '—'}</p>
                        <p><span className="font-semibold text-gray-700">Session date:</span> {proposed.session_date || '—'}</p>
                        <p><span className="font-semibold text-gray-700">Duration:</span> {proposed.duration_minutes ? `${proposed.duration_minutes} minutes` : '—'}</p>
                        <p><span className="font-semibold text-gray-700">Session objectives:</span> {proposed.session_objectives || '—'}</p>
                        <p><span className="font-semibold text-gray-700">Teaching approach:</span> {proposed.teaching_methodology || '—'}</p>
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                      {reviewing?.id !== req.id ? (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => {
                            setReviewing(req);
                            setNote('');
                          }}
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                          Review change
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-gray-700">
                            Review notes / feedback (optional)
                            <textarea
                              rows={2}
                              value={note}
                              onChange={e => setNote(e.target.value)}
                              placeholder="Add feedback for the educator..."
                              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => handleReview(req.id, 'approved')}
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-600 disabled:opacity-50"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Approve change
                            </button>
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => handleReview(req.id, 'rejected')}
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50"
                            >
                              <XCircleIcon className="h-4 w-4" />
                              Reject change
                            </button>
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => {
                                setReviewing(null);
                                setNote('');
                              }}
                              className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </Tabs.Content>

        {/* APPROVED TAB */}
        <Tabs.Content value="approved" className="space-y-4">
          {approvedDecisions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center !text-sm text-gray-500">
              No approved session plans yet.
            </p>
          ) : (
            approvedDecisions.map(item => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="!text-sm !font-semibold text-gray-900">
                      {item.proposed_data?.title || 'Session plan'}
                    </h4>
                    <p className="mt-1 !text-xs text-gray-500">
                      {item.course_name} ({item.academic_year}) · Submitted by {item.requester_email}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    Approved
                  </span>
                </div>
                {item.reviewed_at && (
                  <p className="mt-2 text-xs text-gray-400">
                    Approved on {new Date(item.reviewed_at).toLocaleDateString()}
                  </p>
                )}
                {item.review_notes && (
                  <div className="mt-3 border-l-2 border-green-300 pl-3 text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Admin note:</span> {item.review_notes}
                  </div>
                )}
              </article>
            ))
          )}
        </Tabs.Content>

        {/* REJECTED TAB */}
        <Tabs.Content value="rejected" className="space-y-4">
          {rejectedDecisions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center !text-sm text-gray-500">
              No rejected session plans yet.
            </p>
          ) : (
            rejectedDecisions.map(item => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="!text-sm !font-semibold text-gray-900">
                      {item.proposed_data?.title || 'Session plan'}
                    </h4>
                    <p className="mt-1 !text-xs text-gray-500">
                      {item.course_name} ({item.academic_year}) · Submitted by {item.requester_email}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    Rejected
                  </span>
                </div>
                {item.reviewed_at && (
                  <p className="mt-2 text-xs text-gray-400">
                    Reviewed on {new Date(item.reviewed_at).toLocaleDateString()}
                  </p>
                )}
                {item.review_notes && (
                  <div className="mt-3 border-l-2 border-red-300 pl-3 text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Feedback:</span> {item.review_notes}
                  </div>
                )}
              </article>
            ))
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
