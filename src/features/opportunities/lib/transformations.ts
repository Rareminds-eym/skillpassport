/**
 * Data transformation utilities for opportunities/jobs
 */

export interface Opportunity {
  id: string;
  job_title?: string;
  title?: string;
  company_name?: string;
  location?: string;
  employment_type?: string;
  mode?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  deadline?: string;
  is_active?: boolean;
  has_applied?: boolean;
  application_status?: string;
  saved_at?: string;
  [key: string]: any;
}

/**
 * Filter opportunities by search term
 */
export function filterBySearchTerm(
  opportunities: Opportunity[],
  searchTerm: string
): Opportunity[] {
  if (!searchTerm.trim()) return opportunities;
  
  const term = searchTerm.toLowerCase();
  
  return opportunities.filter(opp => {
    const title = (opp.job_title || opp.title || '').toLowerCase();
    const company = (opp.company_name || '').toLowerCase();
    const location = (opp.location || '').toLowerCase();
    
    return title.includes(term) || 
           company.includes(term) || 
           location.includes(term);
  });
}

/**
 * Filter opportunities by active status
 */
export function filterByActiveStatus(
  opportunities: Opportunity[],
  showActiveOnly: boolean
): Opportunity[] {
  if (!showActiveOnly) return opportunities;
  return opportunities.filter(opp => opp.is_active !== false);
}

/**
 * Sort opportunities by various criteria
 */
export function sortOpportunities(
  opportunities: Opportunity[],
  sortBy: 'newest' | 'oldest' | 'deadline'
): Opportunity[] {
  const sorted = [...opportunities];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.saved_at || a.deadline || 0).getTime();
        const dateB = new Date(b.saved_at || b.deadline || 0).getTime();
        return dateB - dateA;
      });
      
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.saved_at || a.deadline || 0).getTime();
        const dateB = new Date(b.saved_at || b.deadline || 0).getTime();
        return dateA - dateB;
      });
      
    case 'deadline':
      return sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
      
    default:
      return sorted;
  }
}

/**
 * Filter and sort opportunities (combined operation)
 */
export function filterAndSortOpportunities(
  opportunities: Opportunity[],
  searchTerm: string,
  showActiveOnly: boolean,
  sortBy: 'newest' | 'oldest' | 'deadline'
): Opportunity[] {
  let filtered = filterBySearchTerm(opportunities, searchTerm);
  filtered = filterByActiveStatus(filtered, showActiveOnly);
  return sortOpportunities(filtered, sortBy);
}

/**
 * Count opportunities by status
 */
export function countByStatus(
  opportunities: Opportunity[]
): Record<string, number> {
  return opportunities.reduce((acc, opp) => {
    const status = opp.application_status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get inactive opportunities
 */
export function getInactiveOpportunities(
  opportunities: Opportunity[]
): Opportunity[] {
  return opportunities.filter(opp => !opp.is_active);
}

/**
 * Get applied opportunities
 */
export function getAppliedOpportunities(
  opportunities: Opportunity[]
): Opportunity[] {
  return opportunities.filter(opp => opp.has_applied);
}
