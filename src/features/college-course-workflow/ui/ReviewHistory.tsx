import { useState } from 'react';
import type { ReviewDecision } from '../model/types';
import { ReviewProposalDetails } from './ReviewProposalDetails';

export function ReviewHistory({ decisions, showCourse = false, filter = false, emptyMessage = 'No review decisions yet.' }: { decisions: ReviewDecision[]; showCourse?: boolean; filter?: boolean; emptyMessage?: string }) {
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const visible = decisions.filter(item => status === 'all' || item.status === status);
  return <div className="space-y-4">
    {filter && <label className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-gray-700">Review status<select value={status} onChange={event => setStatus(event.target.value)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
      <option value="all">All decisions</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
    </select></label>}
    {!visible.length && <p className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center !text-sm text-gray-500">{status === 'all' ? emptyMessage : `No ${status} changes yet.`}</p>}
    {visible.map(item => {
      const date = item.reviewed_at ? new Date(item.reviewed_at) : null;
      const key = `${item.curriculum_id}-${item.id}`;
      return <article key={`${item.curriculum_id}-${item.id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><h4 className="!m-0 break-words !text-sm !font-semibold !leading-6 text-gray-900">{item.proposed_data.name || item.proposed_data.outcome_text || 'Curriculum change'}</h4><p className="mt-1 !text-xs !leading-5 text-gray-500">{showCourse && `${item.course_name} / `}{item.academic_year} / {item.entity_type === 'unit' ? 'Unit' : 'Learning outcome'}</p></div>
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${item.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{item.status === 'approved' ? 'Approved' : 'Rejected'}</span>
          </div>
          {showCourse && <p className="break-words !text-xs text-gray-500">Submitted by {item.requester_email}</p>}
          {date && !Number.isNaN(date.getTime()) && <time dateTime={item.reviewed_at} className="block text-xs text-gray-500">Reviewed {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(date)}</time>}
          {item.review_notes && <div className="border-l-2 border-gray-200 pl-3"><p className="!text-xs !font-medium text-gray-500">Review note</p><p className="mt-1 whitespace-pre-wrap break-words !text-sm !leading-6 text-gray-700">{item.review_notes}</p></div>}
          <details className="border-t border-gray-100 pt-3" onToggle={event => { const open = event.currentTarget.open; setExpanded(previous => ({ ...previous, [key]: open })); }}><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">View reviewed content</summary>{expanded[key] && <div className="pt-3"><ReviewProposalDetails data={item.proposed_data} entityType={item.entity_type} /></div>}</details>
        </div>
      </article>;
    })}
  </div>;
}
