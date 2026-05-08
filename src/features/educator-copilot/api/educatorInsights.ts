import { dataFetcherService } from './dataFetcherService';
import { educatorAnalyticsService } from './educatorAnalyticsService';

/**
 * Educator Insights Orchestrator
 * Pulls real data and produces educator-focused answers for key intents.
 */
export class EducatorInsightsOrchestrator {
  // 1) At-risk learners
  async getAtRisklearners(universityId?: string) {
    const learners = await dataFetcherService.getlearnersWithAssignments(universityId);
    const insights = educatorAnalyticsService.buildlearnerInsights(learners);
    return educatorAnalyticsService.identifyAtRisklearners(insights);
  }

  // 2) Career readiness: match learners to active opportunities
  async getOpportunityMatches(universityId?: string, limitJobs = 50) {
    const [learners, opportunities] = await Promise.all([
      dataFetcherService.getlearnersWithAssignments(universityId),
      dataFetcherService.getActiveOpportunities(limitJobs),
    ]);
    const matches = educatorAnalyticsService.matchlearnersToOpportunities(learners, opportunities);
    return matches;
  }

  // 3) Class-wide analytics
  async getClassAnalytics(universityId?: string) {
    const learners = await dataFetcherService.getlearnersWithAssignments(universityId);
    return educatorAnalyticsService.buildClassAnalytics(learners);
  }
}

export const educatorInsights = new EducatorInsightsOrchestrator();
