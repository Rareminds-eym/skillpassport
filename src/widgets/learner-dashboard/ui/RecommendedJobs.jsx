import { ArrowUpRight, Briefcase, MapPin, RefreshCw, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAIJobMatching } from '@/features/opportunities';
import { FeatureGate } from '@/features/subscription/ui/shared/FeatureGate';
import { jobTitle, opportunityText, applicationState } from '@/features/opportunities/lib/presentation';
import './RecommendedJobs.css';

function RecommendedJobsContent({ learnerProfile, onSelectJob, appliedJobs = new Set(), onApply, sidebar = false, onResultsChange }) {
  const key = `recommendations_dismissed:${learnerProfile?.id || learnerProfile?.learner_id || 'none'}`;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(key) === 'true');
  useEffect(() => { setDismissed(localStorage.getItem(key) === 'true'); }, [key]);
  const { matchedJobs = [], loading, error, refreshMatches } = useAIJobMatching(learnerProfile, !dismissed, 3);
  const matches = matchedJobs.slice(0, 3);
  const resultIds = matches.map(match => (match.opportunity || match).id).filter(Boolean).join(',');
  useEffect(() => {
    onResultsChange?.(dismissed || !resultIds ? [] : resultIds.split(','));
  }, [resultIds, dismissed, onResultsChange]);
  if (dismissed) return <button type="button" className="recommended-jobs-restore" onClick={() => { localStorage.removeItem(key); setDismissed(false); }}><Sparkles size={15} aria-hidden="true" />Show suggested opportunities</button>;
  return <section aria-label={matches.length && !error ? 'Suggested opportunities' : 'AI job recommendations'} className="recommended-jobs">
    <header className="recommended-jobs-header">
      <div className="recommended-jobs-heading">
        <span className="recommended-jobs-mark" aria-hidden="true"><Sparkles size={18} /></span>
        <h2>{!loading && !error && !matches.length ? 'AI job recommendations' : 'AI recommended for you'}</h2>
        <div className="recommended-jobs-controls">
          <button type="button" aria-label="Refresh suggestions" title="Refresh suggestions" onClick={refreshMatches} disabled={loading}><RefreshCw size={16} aria-hidden="true" className={loading ? 'recommended-jobs-spinner' : undefined} /></button>
          <button type="button" aria-label="Hide suggestions" title="Hide suggestions" onClick={() => { localStorage.setItem(key, 'true'); setDismissed(true); }}><X size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <p>Suggestions based on your profile.</p>
    </header>
    {loading ? <div className="recommended-jobs-loading"><p role="status">Finding AI recommendations…</p><div aria-hidden="true" className="recommended-jobs-skeleton"><span /><span /><span /></div></div>
      : error ? <div role="alert" className="recommended-jobs-state"><p>{opportunityText(error) || 'Recommendations could not be loaded.'}</p><button type="button" onClick={refreshMatches} className="recommended-jobs-secondary">Retry suggestions</button></div>
      : !matches.length ? <div className="recommended-jobs-state"><Briefcase size={24} aria-hidden="true" /><p>No matching jobs found for your current profile. Keep your skills and learning achievements up to date.</p><button type="button" onClick={refreshMatches} className="recommended-jobs-secondary">Refresh recommendations</button></div>
      : <>
        <div className={`recommended-jobs-list ${sidebar ? 'is-sidebar' : 'is-inline'}`}>
          {matches.map((match, index) => {
            const job = match.opportunity || match;
            const title = jobTitle(job);
            const company = opportunityText(job.company_name) || 'Company not specified';
            const location = opportunityText(job.location);
            const initials = opportunityText(job.company_name) ? company.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase() : '?';
            const tone = Array.from(company).reduce((sum, letter) => sum + letter.codePointAt(0), 0) % 4;
            const state = applicationState(job, { isApplied: appliedJobs.has(match.job_id || job.id), learnerData: learnerProfile });
            const tags = [...new Set([job.employment_type, job.mode].map(opportunityText).filter(Boolean))].slice(0, 2);
            const skills = Array.isArray(match.key_matching_skills) ? match.key_matching_skills.filter(value => typeof value === 'string' && value.trim()).slice(0, 2) : [];
            const reason = opportunityText(match.match_reason).trim();
            const genericReason = ['', 'Ranked against your profile', 'Ranked against your profile; this is not a hiring probability.', 'Review this opportunity.', 'Review the current job requirements.'].includes(reason);
            return <article key={job.id || index} className="recommended-job" aria-label={title}>
              <div className="recommended-job-heading">
                <span className="recommended-job-avatar" data-tone={tone} aria-hidden="true">{initials}</span>
                <div className="recommended-job-identity"><h3><button type="button" onClick={() => onSelectJob(job)} title={title}>{title}</button></h3><p className="recommended-job-company">{company}</p></div>
              </div>
              {location && <p className="recommended-job-location"><MapPin size={13} aria-hidden="true" /><span>{location}</span></p>}
              {tags.length > 0 && <div className="recommended-job-tags">{tags.map(tag => <span key={tag}>{tag.replaceAll('_', ' ')}</span>)}</div>}
              {(skills.length > 0 || !genericReason) && <div className="recommended-job-reason"><Sparkles size={13} aria-hidden="true" /><p><span>{skills.length ? 'Relevant learning' : 'Why this role'}</span>{skills.length ? skills.join(' · ') : reason}</p></div>}
              <div className="recommended-job-actions"><button type="button" aria-label={`Details for ${title}`} onClick={() => onSelectJob(job)} className="recommended-job-details">Details</button>{onApply && <button type="button" disabled={state.disabled} onClick={() => onApply(job)} className="recommended-job-apply"><span>{state.label}</span>{!state.disabled && <ArrowUpRight size={14} aria-hidden="true" />}</button>}</div>
            </article>;
          })}
        </div>
        <footer className="recommended-jobs-note">Profile-based suggestions, not hiring guarantees. Review each role’s requirements.</footer>
      </>}
  </section>;
}
export default function RecommendedJobs({ sidebar = false, ...props }) {
  return <FeatureGate featureKey="ai_job_matching" embedded={sidebar} showUpgradePrompt blurContent={false}><RecommendedJobsContent {...props} sidebar={sidebar} /></FeatureGate>;
}
