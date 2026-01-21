import { ProjectContract, ContractMilestone } from '../../types/project';
import { mockStudents } from './mockProposals';
import { mockProjects } from './mockProjects';

export const mockContracts: ProjectContract[] = [
  {
    id: 'contract-001',
    project_id: 'proj-002',
    proposal_id: 'prop-005',
    student_id: 'std-005',
    recruiter_id: 'rec-001',
    student: mockStudents[4],
    project: mockProjects[1],
    agreed_budget: 95000,
    agreed_timeline: '10 weeks',
    agreed_milestones: [
      {
        id: 'mile-001',
        name: 'App Architecture & Design',
        description: 'Complete app architecture, wireframes, and initial design mockups',
        amount: 20000,
        deadline: '2025-12-05',
        order_index: 1,
        status: 'paid',
        submission_url: 'https://figma.com/design-mockups',
        submission_notes: 'Completed all design mockups and architecture diagrams',
        submitted_at: '2025-12-03T14:00:00Z',
        approved_at: '2025-12-04T10:30:00Z',
        paid_at: '2025-12-04T15:00:00Z',
      },
      {
        id: 'mile-002',
        name: 'Core Features Development',
        description: 'Implement order placement, tracking, and user authentication',
        amount: 35000,
        deadline: '2025-12-20',
        order_index: 2,
        status: 'in_progress',
        submission_url: '',
        submission_notes: '',
      },
      {
        id: 'mile-003',
        name: 'Integration & Testing',
        description: 'Payment gateway integration, API testing, and bug fixes',
        amount: 25000,
        deadline: '2026-01-05',
        order_index: 3,
        status: 'pending',
      },
      {
        id: 'mile-004',
        name: 'Launch & Support',
        description: 'App store deployment and 2 weeks post-launch support',
        amount: 15000,
        deadline: '2026-01-15',
        order_index: 4,
        status: 'pending',
      },
    ],
    total_paid: 20000,
    payment_schedule: 'milestone_based',
    status: 'active',
    completion_percentage: 25,
    signed_at: '2025-11-08T09:00:00Z',
    started_at: '2025-11-08T10:00:00Z',
    updated_at: '2025-12-04T15:00:00Z',
  },
  {
    id: 'contract-002',
    project_id: 'proj-004',
    proposal_id: 'prop-006',
    student_id: 'std-003',
    recruiter_id: 'rec-001',
    student: mockStudents[2],
    project: mockProjects[3],
    agreed_budget: 38000,
    agreed_timeline: '4 weeks',
    agreed_milestones: [
      {
        id: 'mile-005',
        name: 'Brand Research & Concepts',
        description: 'Market research, competitor analysis, and 3 brand concepts',
        amount: 10000,
        deadline: '2025-11-28',
        order_index: 1,
        status: 'paid',
        submission_url: 'https://behance.net/project/brand-concepts',
        submission_notes: 'Delivered 3 unique brand concepts with mood boards',
        submitted_at: '2025-11-26T16:00:00Z',
        approved_at: '2025-11-27T11:00:00Z',
        paid_at: '2025-11-27T14:00:00Z',
      },
      {
        id: 'mile-006',
        name: 'UI/UX Design',
        description: 'Complete UI/UX design for web and mobile applications',
        amount: 18000,
        deadline: '2025-12-10',
        order_index: 2,
        status: 'paid',
        submission_url: 'https://figma.com/uiux-final',
        submission_notes: 'All screens designed with interactive prototype',
        submitted_at: '2025-12-08T18:00:00Z',
        approved_at: '2025-12-09T10:00:00Z',
        paid_at: '2025-12-09T15:00:00Z',
      },
      {
        id: 'mile-007',
        name: 'Final Deliverables',
        description: 'Brand style guide, design system, and all source files',
        amount: 10000,
        deadline: '2025-12-15',
        order_index: 3,
        status: 'paid',
        submission_url: 'https://drive.google.com/final-deliverables',
        submission_notes: 'Complete style guide and design system delivered',
        submitted_at: '2025-12-14T17:00:00Z',
        approved_at: '2025-12-15T09:00:00Z',
        paid_at: '2025-12-15T14:00:00Z',
      },
    ],
    total_paid: 38000,
    payment_schedule: 'milestone_based',
    status: 'completed',
    completion_percentage: 100,
    quality_rating: 5,
    signed_at: '2025-11-01T08:00:00Z',
    started_at: '2025-11-01T09:00:00Z',
    completed_at: '2025-12-15T14:00:00Z',
    updated_at: '2025-12-15T14:00:00Z',
  },
];

export const getContractById = (id: string): ProjectContract | undefined => {
  return mockContracts.find((contract) => contract.id === id);
};

export const getContractByProjectId = (projectId: string): ProjectContract | undefined => {
  return mockContracts.find((contract) => contract.project_id === projectId);
};

export const getActiveContracts = (): ProjectContract[] => {
  return mockContracts.filter((contract) => contract.status === 'active');
};

export const getCompletedContracts = (): ProjectContract[] => {
  return mockContracts.filter((contract) => contract.status === 'completed');
};

export const getContractStats = () => {
  return {
    total: mockContracts.length,
    active: mockContracts.filter((c) => c.status === 'active').length,
    completed: mockContracts.filter((c) => c.status === 'completed').length,
    totalPaid: mockContracts.reduce((sum, c) => sum + c.total_paid, 0),
    avgCompletion: Math.round(
      mockContracts.reduce((sum, c) => sum + c.completion_percentage, 0) / mockContracts.length
    ),
  };
};

export const getMilestonesByStatus = (status: string): ContractMilestone[] => {
  const allMilestones = mockContracts.flatMap((c) => c.agreed_milestones);
  if (status === 'all') return allMilestones;
  return allMilestones.filter((m) => m.status === status);
};
