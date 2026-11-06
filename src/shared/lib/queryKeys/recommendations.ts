export const recommendationKeys = {
  all: ['job-recommendations'] as const,
  requestPolicy: (actorId: string, orgId: string, surface: 'semantic' | 'dashboard') =>
    ['job-recommendation-request-policy', actorId, orgId, surface] as const,
  learner: (actorId: string, orgId: string, learnerId: string) =>
    ['job-recommendations', actorId, orgId, learnerId] as const,
  result: (actorId: string, orgId: string, learnerId: string, surface: 'semantic' | 'dashboard', options: { limit: number; profileRevision: string }) =>
    [...recommendationKeys.learner(actorId, orgId, learnerId), 'envelope-v2', surface, options] as const,
};
