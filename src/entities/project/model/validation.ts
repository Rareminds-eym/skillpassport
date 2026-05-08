/**
 * Project Entity - Validation Logic
 */

import type {
  Project,
  ProjectStatus,
  ProjectCategory,
  ProjectMilestone,
  Proposal,
  ProjectContract
} from '@/shared/types';

// ============================================================================
// Project Status Validation
// ============================================================================

const VALID_PROJECT_STATUSES: ProjectStatus[] = [
  'draft',
  'open',
  'in_progress',
  'completed',
  'cancelled'
];

export function isValidProjectStatus(status: string): status is ProjectStatus {
  return VALID_PROJECT_STATUSES.includes(status as ProjectStatus);
}

// ============================================================================
// Project Category Validation
// ============================================================================

const VALID_PROJECT_CATEGORIES: ProjectCategory[] = [
  'web_development',
  'mobile_app',
  'data_science',
  'ui_ux_design',
  'content_writing',
  'marketing',
  'devops',
  'blockchain',
  'ai_ml',
  'other'
];

export function isValidProjectCategory(category: string): category is ProjectCategory {
  return VALID_PROJECT_CATEGORIES.includes(category as ProjectCategory);
}

// ============================================================================
// Project Validation
// ============================================================================

export function validateProject(project: Partial<Project>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!project.title || project.title.trim().length === 0) {
    errors.push('Project title is required');
  } else if (project.title.length < 10) {
    errors.push('Project title must be at least 10 characters');
  } else if (project.title.length > 200) {
    errors.push('Project title must not exceed 200 characters');
  }

  if (!project.description || project.description.trim().length === 0) {
    errors.push('Project description is required');
  } else if (project.description.length < 50) {
    errors.push('Project description must be at least 50 characters');
  }

  if (!project.category) {
    errors.push('Project category is required');
  } else if (!isValidProjectCategory(project.category)) {
    errors.push('Invalid project category');
  }

  if (project.budget_min !== undefined && project.budget_max !== undefined) {
    if (project.budget_min < 0) {
      errors.push('Minimum budget cannot be negative');
    }
    if (project.budget_max < 0) {
      errors.push('Maximum budget cannot be negative');
    }
    if (project.budget_min > project.budget_max) {
      errors.push('Minimum budget cannot exceed maximum budget');
    }
  }

  if (!project.skills_required || project.skills_required.length === 0) {
    errors.push('At least one required skill must be specified');
  }

  if (!project.deliverables || project.deliverables.length === 0) {
    errors.push('At least one deliverable must be specified');
  }

  if (project.max_proposals !== undefined && project.max_proposals < 1) {
    errors.push('Maximum proposals must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Milestone Validation
// ============================================================================

export function validateMilestone(milestone: Partial<ProjectMilestone>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!milestone.name || milestone.name.trim().length === 0) {
    errors.push('Milestone name is required');
  }

  if (milestone.amount === undefined || milestone.amount < 0) {
    errors.push('Milestone amount must be a positive number');
  }

  if (milestone.deadline) {
    const deadlineDate = new Date(milestone.deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.push('Invalid milestone deadline date');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateMilestones(milestones: ProjectMilestone[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (milestones.length === 0) {
    errors.push('At least one milestone is required');
  }

  milestones.forEach((milestone, index) => {
    const validation = validateMilestone(milestone);
    if (!validation.valid) {
      errors.push(`Milestone ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  if (totalAmount <= 0) {
    errors.push('Total milestone amount must be greater than zero');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Proposal Validation
// ============================================================================

export function validateProposal(proposal: Partial<Proposal>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!proposal.project_id) {
    errors.push('Project ID is required');
  }

  if (!proposal.learner_id) {
    errors.push('Learner ID is required');
  }

  if (!proposal.cover_letter || proposal.cover_letter.trim().length === 0) {
    errors.push('Cover letter is required');
  } else if (proposal.cover_letter.length < 100) {
    errors.push('Cover letter must be at least 100 characters');
  }

  if (proposal.proposed_budget === undefined || proposal.proposed_budget <= 0) {
    errors.push('Proposed budget must be a positive number');
  }

  if (!proposal.proposed_timeline || proposal.proposed_timeline.trim().length === 0) {
    errors.push('Proposed timeline is required');
  }

  if (!proposal.proposed_milestones || proposal.proposed_milestones.length === 0) {
    errors.push('At least one milestone must be proposed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Contract Validation
// ============================================================================

export function validateContract(contract: Partial<ProjectContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!contract.project_id) {
    errors.push('Project ID is required');
  }

  if (!contract.proposal_id) {
    errors.push('Proposal ID is required');
  }

  if (!contract.learner_id) {
    errors.push('Learner ID is required');
  }

  if (!contract.recruiter_id) {
    errors.push('Recruiter ID is required');
  }

  if (contract.agreed_budget === undefined || contract.agreed_budget <= 0) {
    errors.push('Agreed budget must be a positive number');
  }

  if (!contract.agreed_timeline || contract.agreed_timeline.trim().length === 0) {
    errors.push('Agreed timeline is required');
  }

  if (!contract.agreed_milestones || contract.agreed_milestones.length === 0) {
    errors.push('At least one milestone must be agreed upon');
  }

  if (contract.completion_percentage !== undefined) {
    if (contract.completion_percentage < 0 || contract.completion_percentage > 100) {
      errors.push('Completion percentage must be between 0 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Budget Validation
// ============================================================================

export function validateBudgetRange(min?: number, max?: number): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (min !== undefined && min < 0) {
    errors.push('Minimum budget cannot be negative');
  }

  if (max !== undefined && max < 0) {
    errors.push('Maximum budget cannot be negative');
  }

  if (min !== undefined && max !== undefined && min > max) {
    errors.push('Minimum budget cannot exceed maximum budget');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Rating Validation
// ============================================================================

export function validateRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && !isNaN(rating);
}
