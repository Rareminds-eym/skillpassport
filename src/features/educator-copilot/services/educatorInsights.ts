import { dataFetcherService } from './dataFetcherService';
import { educatorAnalyticsService } from './educatorAnalyticsService';

/**
 * Educator Insights Orchestrator
 * Pulls real data and produces educator-focused answers for key intents.
 */
export class EducatorInsightsOrchestrator {
  // 1) At-risk students
  async getAtRiskStudents(universityId?: string) {
    const students = await dataFetcherService.getStudentsWithAssignments(universityId);
    const insights = educatorAnalyticsService.buildStudentInsights(students);
    return educatorAnalyticsService.identifyAtRiskStudents(insights);
  }

  // 2) Career readiness: match students to active opportunities
  async getOpportunityMatches(universityId?: string, limitJobs = 50) {
    const [students, opportunities] = await Promise.all([
      dataFetcherService.getStudentsWithAssignments(universityId),
      dataFetcherService.getActiveOpportunities(limitJobs),
    ]);
    const matches = educatorAnalyticsService.matchStudentsToOpportunities(students, opportunities);
    return matches;
  }

  // 3) Class-wide analytics
  async getClassAnalytics(universityId?: string) {
    const students = await dataFetcherService.getStudentsWithAssignments(universityId);
    return educatorAnalyticsService.buildClassAnalytics(students);
  }
}

export const educatorInsights = new EducatorInsightsOrchestrator();
