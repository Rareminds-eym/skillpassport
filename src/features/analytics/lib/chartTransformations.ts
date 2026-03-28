/**
 * Chart data transformation utilities for analytics
 */

export interface Application {
  application_status?: string;
  status?: string;
  applied_at?: string;
  opportunities?: {
    employment_type?: string;
    mode?: string;
    location?: string;
    company_name?: string;
  };
}

export interface SkillData {
  skill: string;
  total_mentions: number | string;
}

/**
 * Calculate status distribution percentages for radial chart
 */
export function calculateStatusPercentages(
  statusCounts: Record<string, number>,
  totalApplications: number
): number[] {
  if (totalApplications === 0) return [0, 0, 0, 0];
  
  return [
    ((statusCounts['accepted'] || 0) / totalApplications * 100) || 0,
    ((statusCounts['under_review'] || 0) / totalApplications * 100) || 0,
    ((statusCounts['applied'] || statusCounts['pending'] || 0) / totalApplications * 100) || 0,
    ((statusCounts['rejected'] || 0) / totalApplications * 100) || 0,
  ];
}

/**
 * Transform applications by month for timeline chart
 */
export function transformApplicationsByMonth(
  applicationsByMonth: Record<string, number>
): { month: string; count: number }[] {
  return Object.entries(applicationsByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

/**
 * Calculate job type radar chart series data
 */
export function calculateJobTypeRadarSeries(
  applications: Application[],
  jobTypeDistribution: Record<string, number>
): Array<{ name: string; data: number[] }> {
  const types = Object.keys(jobTypeDistribution);
  
  return [
    {
      name: 'Total Applied',
      data: Object.values(jobTypeDistribution),
    },
    {
      name: 'Accepted',
      data: types.map(type => {
        return applications.filter(app => 
          (app.opportunities?.employment_type === type || app.opportunities?.mode === type) && 
          app.application_status === 'accepted'
        ).length;
      }),
    },
    {
      name: 'In Progress',
      data: types.map(type => {
        return applications.filter(app => 
          (app.opportunities?.employment_type === type || app.opportunities?.mode === type) && 
          ['applied', 'under_review', 'interview_scheduled'].includes(app.application_status || '')
        ).length;
      }),
    },
  ];
}

/**
 * Process skills data for chart display
 */
export function processSkillsForChart(
  skillsData: SkillData[],
  limit: number = 5
): Record<string, number> {
  if (skillsData.length === 0) return {};
  
  return skillsData.slice(0, limit).reduce((acc, item) => {
    // Capitalize first letter for better display
    const displayName = item.skill.charAt(0).toUpperCase() + item.skill.slice(1);
    acc[displayName] = parseInt(String(item.total_mentions));
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get top N items from location distribution
 */
export function getTopLocations(
  locationDistribution: Record<string, number>,
  limit: number = 5
): { labels: string[]; values: number[] } {
  const entries = Object.entries(locationDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);
  
  return {
    labels: entries.map(([label]) => label),
    values: entries.map(([, value]) => value),
  };
}
