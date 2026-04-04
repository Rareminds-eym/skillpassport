/**
 * Project Entity - Utility Functions
 */

import type {
import { formatBudget } from '..\..\..\shared\lib\format';
  Project,
  ProjectStatus,
  ProjectCategory,
  ProjectMilestone,
  ContractMilestone,
  MilestoneStatus,
  ProjectAnalytics
} from '@/shared/types';

// ============================================================================
// Project Status Utilities
// ============================================================================

export function getProjectStatusDisplayName(status: ProjectStatus): string {
  const displayNames: Record<ProjectStatus, string> = {
    draft: 'Draft',
    open: 'Open for Proposals',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return displayNames[status] || status;
}

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    draft: 'gray',
    open: 'blue',
    in_progress: 'yellow',
    completed: 'green',
    cancelled: 'red'
  };
  return colors[status] || 'gray';
}

export function canEditProject(status: ProjectStatus): boolean {
  return status === 'draft' || status === 'open';
}

export function canCancelProject(status: ProjectStatus): boolean {
  return status === 'draft' || status === 'open' || status === 'in_progress';
}

// ============================================================================
// Project Category Utilities
// ============================================================================

export function getProjectCategoryDisplayName(category: ProjectCategory): string {
  const displayNames: Record<ProjectCategory, string> = {
    web_development: 'Web Development',
    mobile_app: 'Mobile App Development',
    data_science: 'Data Science',
    ui_ux_design: 'UI/UX Design',
    content_writing: 'Content Writing',
    marketing: 'Marketing',
    devops: 'DevOps',
    blockchain: 'Blockchain',
    ai_ml: 'AI/ML',
    other: 'Other'
  };
  return displayNames[category] || category;
}

// ============================================================================
// Budget Utilities
// ============================================================================


export function formatBudgetRange(min?: number, max?: number, currency: string = 'USD'): string {
  if (min !== undefined && max !== undefined) {
    return `${formatBudget(min, currency)} - ${formatBudget(max, currency)}`;
  }
  if (min !== undefined) {
    return `From ${formatBudget(min, currency)}`;
  }
  if (max !== undefined) {
    return `Up to ${formatBudget(max, currency)}`;
  }
  return 'Budget not specified';
}

export function calculateTotalMilestoneAmount(milestones: ProjectMilestone[]): number {
  return milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
}

// ============================================================================
// Duration Utilities
// ============================================================================

export function formatDuration(value?: number, unit?: 'days' | 'weeks' | 'months'): string {
  if (!value || !unit) return 'Duration not specified';
  
  const unitNames = {
    days: value === 1 ? 'day' : 'days',
    weeks: value === 1 ? 'week' : 'weeks',
    months: value === 1 ? 'month' : 'months'
  };
  
  return `${value} ${unitNames[unit]}`;
}

export function convertDurationToDays(value: number, unit: 'days' | 'weeks' | 'months'): number {
  const conversions = {
    days: 1,
    weeks: 7,
    months: 30
  };
  return value * conversions[unit];
}

// ============================================================================
// Milestone Utilities
// ============================================================================

export function getMilestoneStatusDisplayName(status: MilestoneStatus): string {
  const displayNames: Record<MilestoneStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid'
  };
  return displayNames[status] || status;
}

export function getMilestoneStatusColor(status: MilestoneStatus): string {
  const colors: Record<MilestoneStatus, string> = {
    pending: 'gray',
    in_progress: 'blue',
    submitted: 'yellow',
    approved: 'green',
    rejected: 'red',
    paid: 'green'
  };
  return colors[status] || 'gray';
}

export function calculateMilestoneProgress(milestones: ContractMilestone[]): number {
  if (milestones.length === 0) return 0;
  
  const completedMilestones = milestones.filter(
    m => m.status === 'approved' || m.status === 'paid'
  ).length;
  
  return Math.round((completedMilestones / milestones.length) * 100);
}

export function getNextMilestone(milestones: ContractMilestone[]): ContractMilestone | null {
  const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);
  return sortedMilestones.find(m => m.status === 'pending' || m.status === 'in_progress') || null;
}

export function calculateTotalPaid(milestones: ContractMilestone[]): number {
  return milestones
    .filter(m => m.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0);
}

// ============================================================================
// Project Filtering Utilities
// ============================================================================

export function filterProjectsByStatus(projects: Project[], statuses: ProjectStatus[]): Project[] {
  if (statuses.length === 0) return projects;
  return projects.filter(p => statuses.includes(p.status));
}

export function filterProjectsByCategory(projects: Project[], categories: ProjectCategory[]): Project[] {
  if (categories.length === 0) return projects;
  return projects.filter(p => categories.includes(p.category));
}

export function filterProjectsByBudget(
  projects: Project[],
  minBudget?: number,
  maxBudget?: number
): Project[] {
  return projects.filter(p => {
    if (minBudget !== undefined && p.budget_max && p.budget_max < minBudget) {
      return false;
    }
    if (maxBudget !== undefined && p.budget_min && p.budget_min > maxBudget) {
      return false;
    }
    return true;
  });
}

export function filterProjectsBySkills(projects: Project[], skills: string[]): Project[] {
  if (skills.length === 0) return projects;
  
  return projects.filter(p => 
    skills.some(skill => 
      p.skills_required.some(required => 
        required.toLowerCase().includes(skill.toLowerCase())
      )
    )
  );
}

export function searchProjects(projects: Project[], query: string): Project[] {
  if (!query || query.trim().length === 0) return projects;
  
  const lowerQuery = query.toLowerCase();
  return projects.filter(p =>
    p.title.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.skills_required.some(skill => skill.toLowerCase().includes(lowerQuery))
  );
}

// ============================================================================
// Project Sorting Utilities
// ============================================================================

export function sortProjectsByDate(projects: Project[], order: 'asc' | 'desc' = 'desc'): Project[] {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a.posted_at).getTime();
    const dateB = new Date(b.posted_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortProjectsByBudget(projects: Project[], order: 'asc' | 'desc' = 'desc'): Project[] {
  return [...projects].sort((a, b) => {
    const budgetA = a.budget_max || a.budget_min || 0;
    const budgetB = b.budget_max || b.budget_min || 0;
    return order === 'desc' ? budgetB - budgetA : budgetA - budgetB;
  });
}

export function sortProjectsByProposals(projects: Project[], order: 'asc' | 'desc' = 'desc'): Project[] {
  return [...projects].sort((a, b) => {
    return order === 'desc' 
      ? b.proposal_count - a.proposal_count 
      : a.proposal_count - b.proposal_count;
  });
}

// ============================================================================
// Project Analytics Utilities
// ============================================================================

export function calculateProjectAnalytics(projects: Project[]): ProjectAnalytics {
  const byStatus = {
    draft: 0,
    open: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  };

  let totalBudget = 0;
  let totalProposals = 0;
  let completedProjects = 0;
  let totalCompletionTime = 0;

  projects.forEach(project => {
    byStatus[project.status]++;
    
    if (project.budget_max) {
      totalBudget += project.budget_max;
    }
    
    totalProposals += project.proposal_count;
    
    if (project.status === 'completed' && project.posted_at && project.completed_at) {
      completedProjects++;
      const start = new Date(project.posted_at).getTime();
      const end = new Date(project.completed_at).getTime();
      totalCompletionTime += (end - start) / (1000 * 60 * 60 * 24); // days
    }
  });

  const avgProposals = projects.length > 0 ? totalProposals / projects.length : 0;
  const conversionRate = projects.length > 0 ? (byStatus.completed / projects.length) * 100 : 0;
  const avgCompletionTime = completedProjects > 0 ? totalCompletionTime / completedProjects : 0;

  return {
    total: projects.length,
    byStatus,
    totalBudget,
    avgProposals: Math.round(avgProposals * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgCompletionTime: Math.round(avgCompletionTime)
  };
}

// ============================================================================
// Date Utilities
// ============================================================================

export function isProjectDeadlinePassed(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  
  const now = new Date().getTime();
  const deadlineDate = new Date(deadline).getTime();
  const diff = deadlineDate - now;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDeadline(deadline?: string): string {
  if (!deadline) return 'No deadline';
  
  const daysUntil = getDaysUntilDeadline(deadline);
  if (daysUntil === null) return 'No deadline';
  
  if (daysUntil < 0) return 'Deadline passed';
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  if (daysUntil <= 7) return `Due in ${daysUntil} days`;
  
  return new Date(deadline).toLocaleDateString();
}
