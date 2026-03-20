/**
 * Project Entity - Public API
 * Central export point for all project entity functionality
 */

// Model exports
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
} from './model';

export {
  isValidProjectStatus,
  isValidProjectCategory,
  validateProject,
  validateMilestone,
  validateMilestones,
  validateProposal,
  validateContract,
  validateBudgetRange,
  validateRating,
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
} from './model';
