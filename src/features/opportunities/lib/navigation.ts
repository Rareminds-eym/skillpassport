interface LearnerTabs {
  isLearner: boolean;
  isMiddleSchool: boolean;
}

export function getOpportunityTabs(learner: LearnerTabs): [string, string][] {
  const tabs: [string, string][] = [];
  if (!learner.isMiddleSchool) tabs.push(['my-jobs', 'Jobs']);
  if (!learner.isLearner) tabs.push(['industrial-visits', 'Visits']);
  tabs.push(learner.isMiddleSchool ? ['history', 'History'] : ['my-applications', 'Applications']);
  return tabs;
}

/** A shared link must never select a panel hidden for the current learner. */
export function resolveOpportunityTab(
  requested: string | null,
  preferred: string,
  tabs: [string, string][],
) {
  const allowed = tabs.map(([value]) => value);
  if (requested && allowed.includes(requested)) return requested;
  return allowed.includes(preferred) ? preferred : allowed[0];
}
