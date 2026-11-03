import { Navigate } from 'react-router-dom';

/** Keep existing bookmarks and evidence-workflow links on the Jobs page. */
export default function LearningJobs() {
  return (
    <Navigate
      to="/learner/opportunities?tab=my-jobs#learning-matches"
      replace
    />
  );
}
