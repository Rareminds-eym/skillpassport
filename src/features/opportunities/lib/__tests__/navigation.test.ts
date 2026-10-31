import { expect, it } from 'vitest';
import { getOpportunityTabs, resolveOpportunityTab } from '../navigation';

it.each([
  [{ isLearner: true, isMiddleSchool: false }, ['my-jobs', 'my-applications']],
  [{ isLearner: false, isMiddleSchool: true }, ['industrial-visits', 'history']],
  [{ isLearner: false, isMiddleSchool: false }, ['my-jobs', 'industrial-visits', 'my-applications']],
] as const)('uses one set of allowed tabs for navigation and rendered panels', (learner, expected) => {
  const tabs = getOpportunityTabs(learner);
  expect(tabs.map(([key]) => key)).toEqual(expected);
  expect(expected).toContain(resolveOpportunityTab('invalid', 'my-jobs', tabs));
  for (const [key] of tabs) expect(resolveOpportunityTab(key, 'my-jobs', tabs)).toBe(key);
});
