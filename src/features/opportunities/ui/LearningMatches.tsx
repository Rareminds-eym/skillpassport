import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { apiGet } from '@/shared/api';
import { useUser } from '@/shared/model';
import { LearningEligibilityPanel } from './LearningEligibilityPanel';

interface LearningJob extends Record<string, unknown> {
  id: string;
  title?: string;
  job_title?: string;
  company_name?: string;
  location?: string;
  employment_type?: string;
  learning_requirements?: unknown[];
  learning_eligibility?: { state?: string };
}
interface LearningFeed {
  jobs: LearningJob[];
  total: number;
  pageSize: number;
}
const PAGE_SIZE = 12;
const states = [
  ['eligible', 'Ready to apply'],
  ['not_yet_eligible', 'Requirements to meet'],
] as const;

export function LearningMatches({
  onSelectJob,
}: {
  onSelectJob: (job: LearningJob) => void;
}) {
  const user = useUser();
  const [params, setParams] = useSearchParams();
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;
  const filter = states.some(([value]) => value === params.get('matchState'))
    ? params.get('matchState')!
    : 'eligible';
  const query = (params.get('matchQ') || '').slice(0, 100);
  const rawPage = Number(params.get('matchPage') || 1);
  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 8334
      ? rawPage
      : 1;
  const expanded = params.get('matchView') === 'expanded';
  const [search, setSearch] = useState(query);
  const [jobs, setJobs] = useState<LearningJob[]>([]),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  const update = (patch: Record<string, string | null>, replace = false) =>
    setParamsRef.current(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('job');
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace },
    );
  useEffect(() => setSearch(query), [query]);
  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(
      () =>
        setParamsRef.current(
          (previous) => {
            const next = new URLSearchParams(previous);
            next.delete('matchPage');
            next.delete('job');
            if (search.trim()) next.set('matchQ', search.trim());
            else next.delete('matchQ');
            return next;
          },
          { replace: true },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, query]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setJobs([]);
    setTotal(0);
    if (!user?.id) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    apiGet<{ data?: LearningFeed }>(
      `/learning/jobs?state=${filter}&search=${encodeURIComponent(query)}&offset=${(page - 1) * PAGE_SIZE}`,
    )
      .then((response) => {
        if (!active) return;
        const feed = response.data;
        if (
          !feed ||
          !Array.isArray(feed.jobs) ||
          !Number.isSafeInteger(feed.total) ||
          feed.total < 0
        )
          throw new Error(
            'Learning matches could not be loaded. Please retry.',
          );
        const lastPage = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
        if (page > lastPage) {
          setParamsRef.current(
            (previous) => {
              const next = new URLSearchParams(previous);
              if (lastPage > 1) next.set('matchPage', String(lastPage));
              else next.delete('matchPage');
              return next;
            },
            { replace: true },
          );
          return;
        }
        setJobs(feed.jobs);
        setTotal(feed.total);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Learning matches could not be loaded. Please retry.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, filter, query, page, revision]);
  const displayed = expanded ? jobs : jobs.slice(0, 3);
  const resultName = total === 1 ? 'learning match' : 'learning matches';
  return (
    <section
      id="learning-matches"
      aria-labelledby="learning-matches-heading"
      className="mb-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <GraduationCap size={18} />
          </span>
          <div>
            <h2
              id="learning-matches-heading"
              className="text-base font-semibold text-slate-900"
            >
              Learning matches
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Openings based on your approved courses, capabilities, and levels.
            </p>
          </div>
        </div>
        <Link
          to="/learner/learning-evidence"
          className="rounded px-1 py-1 text-sm font-medium text-blue-700 hover:underline"
        >
          My equivalent evidence
        </Link>
      </header>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Learning eligibility filter"
          className="flex flex-wrap gap-1 rounded-md bg-slate-50 p-1"
        >
          {states.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => update({ matchState: value, matchPage: null })}
              className={`min-h-8 rounded px-2.5 text-sm font-medium ${filter === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">Search learning matches</span>
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
          />
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search learning matches…"
            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <button
          type="button"
          onClick={() => setRevision((value) => value + 1)}
          disabled={loading}
          aria-label="Refresh learning matches"
          title="Refresh learning matches"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <RefreshCw size={15} />
        </button>
      </div>
      {loading ? (
        <p role="status" className="py-4 text-sm text-slate-600">
          Checking your learning and openings…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3"
        >
          <p className="text-sm leading-5 text-amber-900">{error}</p>
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
            className="mt-2 min-h-8 rounded px-2 text-sm font-medium text-blue-700"
          >
            Retry learning matches
          </button>
        </div>
      ) : !jobs.length ? (
        <div className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            {filter === 'eligible' && !query
              ? 'No learning matches ready to apply yet'
              : 'No learning matches in this view'}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {query
              ? 'Try another role, employer, or location.'
              : 'Review requirements to meet or submit equivalent evidence for review.'}{' '}
            You can still browse all job openings below.
          </p>
        </div>
      ) : (
        <>
          <p
            role="status"
            aria-live="polite"
            className="mb-3 text-sm text-slate-600"
          >
            {expanded
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)}`
              : `${displayed.length}`}{' '}
            of {total} {resultName}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {displayed.map((job) => (
              <article
                key={job.id}
                className="flex min-w-0 flex-col rounded-md border border-slate-200 p-3"
              >
                <h3 className="text-base font-semibold leading-6 text-slate-900">
                  {job.job_title || job.title}
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {job.company_name}
                </p>
                <p className="mb-3 mt-2 flex items-start gap-1.5 text-sm leading-5 text-slate-600">
                  <MapPin size={13} className="mt-0.5 shrink-0" />
                  {[job.location, job.employment_type]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="mt-auto">
                  <LearningEligibilityPanel job={job} compact />
                  <button
                    type="button"
                    onClick={() => onSelectJob(job)}
                    className="mt-3 flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  >
                    View job details
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {expanded && total > PAGE_SIZE && (
            <nav
              aria-label="Learning match pages"
              className="mt-4 flex items-center justify-between gap-3 text-sm"
            >
              <button
                type="button"
                disabled={page === 1}
                onClick={() => update({ matchPage: String(page - 1) })}
                className="min-h-9 rounded border px-3 text-blue-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-600">
                Page {page} of {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                type="button"
                disabled={page * PAGE_SIZE >= total}
                onClick={() => update({ matchPage: String(page + 1) })}
                className="min-h-9 rounded border px-3 text-blue-700 disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
          {(total > 3 || expanded) && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() =>
                update({
                  matchView: expanded ? null : 'expanded',
                  matchPage: null,
                })
              }
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded px-1 text-sm font-medium text-blue-700"
            >
              {expanded
                ? 'Show fewer matches'
                : `Show all ${total} ${resultName}`}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </>
      )}
    </section>
  );
}
