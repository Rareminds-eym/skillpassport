/** Call after an acknowledged write, using the canonical learner UUID. */
export function recommendationSourceSaved(learnerId: string) {
  if (typeof window !== 'undefined' && learnerId) window.dispatchEvent(new CustomEvent('learner-profile-updated', { detail: { learnerId } }));
}
