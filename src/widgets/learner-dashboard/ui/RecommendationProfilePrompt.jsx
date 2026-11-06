export function RecommendationReadinessGate({ readiness, error, processing, onRetry, children }) {
  if (error) return <div className="recommended-jobs-state" role="alert">
    <p>Job recommendations could not be loaded.</p>
    {onRetry && <button type="button" className="recommended-jobs-secondary" onClick={onRetry}>Retry recommendations</button>}
  </div>;
  if (processing) return <div className="recommended-jobs-state" role="status"><p>Preparing job recommendations…</p></div>;
  return readiness?.state === 'needs_profile' || readiness?.state === 'limited_context'
    ? <RecommendationProfilePrompt readiness={readiness} />
    : children;
}

export default function RecommendationProfilePrompt({ readiness }) {
  const limited = readiness?.state === 'limited_context';
  return <div className="recommended-jobs-state" role="status">
    <p>{limited ? 'Add more career details for personalized matches.' : 'Add career context to get personalized job recommendations.'}</p>
    <p>A skill, a specific study field or a described project can help. Work experience is optional.</p>
    <a href="/learner/my-skills" className="recommended-jobs-secondary">Add a skill</a>
    <a href="/learner/dashboard" className="recommended-jobs-secondary">Review education and projects</a>
  </div>;
}
