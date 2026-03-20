/**
 * Project Entity - Model Exports
 */

// Type exports
export type {
  ProjectStatus,
  ProjectCategory,
  ProjectPriority,
  ProjectVisibility,
  Project,
  ProjectMilestone,
  ProposalMilestone,
  ContractMilestone,
  MilestoneStatus,
  ProposalStatus,
  Proposal,
  StudentProfile,
  ContractStatus,
  PaymentSchedule,
  ProjectContract,
  ProjectReview,
  ProjectFilters,
  ProjectAnalytics,
  QA,
  StudentProject
} from './types';

// Validation exports
export {
  isValidProjectStatus,
  isValidProjectCategory,
  validateProject,
  validateMilestone,
  validateMilestones,
  validateProposal,
  validateContract,
  validateBudgetRange,
  validateRating
} from './validation';

// Utility exports
export {
  getProjectStatusDisplayName,
  getProjectStatusColor,
  canEditProject,
  canCancelProject,
  getProjectCategoryDisplayName,
  formatBudget,
  formatBudgetRange,
  calculateTotalMilestoneAmount,
  formatDuration,
  convertDurationToDays,
  getMilestoneStatusDisplayName,
  getMilestoneStatusColor,
  calculateMilestoneProgress,
  getNextMilestone,
  calculateTotalPaid,
  filterProjectsByStatus,
  filterProjectsByCategory,
  filterProjectsByBudget,
  filterProjectsBySkills,
  searchProjects,
  sortProjectsByDate,
  sortProjectsByBudget,
  sortProjectsByProposals,
  calculateProjectAnalytics,
  isProjectDeadlinePassed,
  getDaysUntilDeadline,
  formatDeadline
} from './utils';
