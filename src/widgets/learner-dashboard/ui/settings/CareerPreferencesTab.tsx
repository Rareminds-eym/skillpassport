import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';
import { careerPreferencesSchema, careerPreferencesRevisionSchema, type CareerPreferences } from '../../../../../shared/contracts/career-preferences';

type Saved = { learnerId: string; preferences: CareerPreferences; preferencesRevision: string | null; inputRevision?: string };
const textValues = (preferences: CareerPreferences) => Object.fromEntries(Object.keys(labels).map(key => [key, preferences[key as keyof typeof labels].join(', ')]));
const path = '/learners/career-preferences';
const labels = { targetRoles: 'Target roles', locations: 'Preferred locations', departments: 'Preferred departments or sectors' } as const;
const employment = ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance'] as const;
const modes = ['remote', 'hybrid', 'onsite'] as const;

export default function CareerPreferencesTab() {
  const user = useUser();
  const cacheKey = ['career-preferences', user?.id, user?.orgId];
  const query = useQuery({
    queryKey: cacheKey, enabled: Boolean(user?.id),
    queryFn: async ({ signal }) => {
      const result = await apiGet<{ data: Saved }>(path, { signal });
      return { ...result.data, preferences: careerPreferencesSchema.parse(result.data.preferences), preferencesRevision: careerPreferencesRevisionSchema.parse(result.data.preferencesRevision) };
    }, retry: false,
  });
  if (query.isPending) return <p role="status">Loading career preferences…</p>;
  if (!query.data) return <div role="alert">Career preferences are unavailable. <button type="button" onClick={() => query.refetch()} className="underline">Try again</button></div>;
  return <>{query.error && <p role="alert">Could not refresh career preferences. <button type="button" className="underline" onClick={() => query.refetch()}>Try again</button></p>}<PreferencesEditor key={`${user?.id}:${user?.orgId}:${query.data.learnerId}`} saved={query.data} cacheKey={cacheKey} /></>;
}

function PreferencesEditor({ saved, cacheKey }: { saved: Saved; cacheKey: readonly unknown[] }) {
  const client = useQueryClient();
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const [base, setBase] = useState(saved);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState(saved.preferences);
  const [text, setText] = useState(textValues(saved.preferences));
  const [error, setError] = useState('');
  const save = useMutation({ retry: false, mutationFn: async (preferences: CareerPreferences) => {
    const result = await apiPut<{ data: Saved }>(path, { learnerId: base.learnerId, preferences, expectedRevision: base.preferencesRevision });
    if (result.data.learnerId !== saved.learnerId) throw new Error('Your profile changed. Reload before saving preferences.');
    const preferencesRevision = careerPreferencesRevisionSchema.parse(result.data.preferencesRevision);
    if (!preferencesRevision) throw new Error('The saved preference revision could not be verified. Reload before saving again.');
    return { ...result.data, preferences: careerPreferencesSchema.parse(result.data.preferences), preferencesRevision };
  }, onSuccess: result => {
    if (!active.current) return;
    setBase(result); setDraft(result.preferences); setText(textValues(result.preferences)); setDirty(false);
    client.setQueryData(cacheKey, result);
    // The acknowledged write resets both active and inactive result scopes.
    window.dispatchEvent(new CustomEvent('learner-profile-updated', { detail: { learnerId: result.learnerId } }));
    void client.invalidateQueries({ queryKey: cacheKey, exact: true });
  }, onError: failure => {
    if (active.current && (failure as { status?: number }).status === 409) void client.invalidateQueries({ queryKey: cacheKey, exact: true });
  } });
  const changedElsewhere = saved.preferencesRevision !== base.preferencesRevision;
  const serverConflict = (save.error as { status?: number } | null)?.status === 409;
  const reloadLatest = () => {
    setBase(saved); setDraft(saved.preferences); setText(textValues(saved.preferences)); setDirty(false); setError(''); save.reset();
  };
  useEffect(() => {
    if (!dirty && !save.isPending) {
      setBase(saved); setDraft(saved.preferences); setText(textValues(saved.preferences));
    }
  }, [saved, dirty, save.isPending]);
  const update = <K extends keyof CareerPreferences>(key: K, value: CareerPreferences[K]) => { setDirty(true); setDraft(previous => ({ ...previous, [key]: value })); setError(''); if (!serverConflict) save.reset(); };
  const toggle = (key: 'employmentTypes' | 'workModes', value: string) => {
    const values = draft[key] as string[];
    update(key, (values.includes(value) ? values.filter(item => item !== value) : [...values, value]) as never);
  };
  return <form className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-7" onSubmit={event => {
    event.preventDefault();
    if (changedElsewhere || serverConflict || save.isPending) return;
    const parsed = careerPreferencesSchema.safeParse({ ...draft, ...Object.fromEntries(Object.entries(text).map(([key, value]) => [key, value.split(',').map(item => item.trim()).filter(Boolean)])) });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Review your preferences.'); return; }
    setError(''); save.mutate(parsed.data);
  }}>
    <header className="border-l-4 border-slate-900 pl-4"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your next move</p><h2 className="mt-1 text-2xl font-semibold text-slate-900">Career preferences</h2><p className="mt-2 text-sm text-slate-600">Choose what matters for your job search. Empty choices leave that part of your search open.</p></header>
    <fieldset disabled={save.isPending} className="space-y-6 disabled:opacity-60">
      {Object.entries(labels).map(([key, label]) => <label key={key} className="block text-sm font-medium text-slate-800">{label}<input aria-label={label} value={text[key]} maxLength={2100} onChange={event => { setDirty(true); setText(previous => ({ ...previous, [key]: event.target.value })); setError(''); if (!serverConflict) save.reset(); }} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-slate-800" aria-describedby={`${key}-help`} /><span id={`${key}-help`} className="mt-1 block text-xs font-normal text-slate-500">Separate choices with commas. Up to 20 choices.</span></label>)}
      {(['employmentTypes', 'workModes'] as const).map(key => <fieldset key={key}><legend className="mb-2 text-sm font-medium text-slate-800">{key === 'workModes' ? 'Work arrangement' : 'Employment types'}</legend><div className="flex flex-wrap gap-3">{(key === 'workModes' ? modes : employment).map(value => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={(draft[key] as string[]).includes(value)} onChange={() => toggle(key, value)} />{value.replace(/_/g, ' ')}</label>)}</div></fieldset>)}
      <label className="block text-sm font-medium">Willing to relocate<select value={draft.willingToRelocate === null ? '' : String(draft.willingToRelocate)} onChange={event => update('willingToRelocate', event.target.value === '' ? null : event.target.value === 'true')} className="ml-3 rounded-lg border border-slate-300 p-2"><option value="">Not specified</option><option value="true">Yes</option><option value="false">No</option></select></label>
      <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Required choices</legend><p className="text-sm text-slate-500">Required choices exclude jobs that do not confirm a match, including jobs with missing details.</p>{(['strictLocations', 'strictEmploymentTypes', 'strictWorkModes'] as const).map((key, index) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft[key]} onChange={event => update(key, event.target.checked)} />Require a matching {['location', 'employment type', 'work arrangement'][index]}</label>)}</fieldset>
      <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Additional career context</legend><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={draft.useAssessmentRecommendations} onChange={event => update('useAssessmentRecommendations', event.target.checked)} />Use career suggestions from my completed assessment as interests to explore.</label><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={draft.useVerifiedLearning} onChange={event => update('useVerifiedLearning', event.target.checked)} />Use my evaluated LTE learning achievements.</label><p className="text-xs text-slate-500">Assessment suggestions do not prove skills or eligibility. Learning achievements keep their human or AI evaluation labels.</p></fieldset>
      {(changedElsewhere || serverConflict) ? <p role="alert" className="text-sm text-amber-800">Career preferences changed elsewhere. Reload the latest preferences before saving. <button type="button" className="underline" onClick={reloadLatest}>Reload latest preferences</button></p> : (error || save.error) && <p role="alert" className="text-sm text-red-700">{error || save.error?.message}</p>}
      {save.isSuccess && <p role="status" className="text-sm text-emerald-700">Career preferences saved. Recommendations will refresh.</p>}
      <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white disabled:opacity-50" disabled={save.isPending || changedElsewhere || serverConflict}>{save.isPending ? 'Saving…' : 'Save career preferences'}</button>
    </fieldset>
  </form>;
}
