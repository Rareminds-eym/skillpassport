# 🚀 Project-Based Hiring Feature - Architecture & Implementation Guide

> **Complete architectural analysis and implementation roadmap for building a project-based hiring system for recruiters**

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Understanding Project-Based Hiring](#understanding-project-based-hiring)
3. [Current Architecture Analysis](#current-architecture-analysis)
4. [Recommended Architecture](#recommended-architecture)
5. [Database Schema Design](#database-schema-design)
6. [File Structure & Implementation Plan](#file-structure--implementation-plan)
7. [Integration with Existing Features](#integration-with-existing-features)
8. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 Executive Summary

### What is Project-Based Hiring?

Project-based hiring (also called freelance/gig hiring) is fundamentally different from permanent employment hiring:

| **Permanent Hiring** | **Project-Based Hiring** |
|---------------------|-------------------------|
| Full-time positions | Time-bound projects |
| Fixed salary | Project-based budget/milestones |
| Simple application → interview → offer | Proposal submission → evaluation → contract |
| Long-term commitment | Short-term engagement |
| Single workflow | Multiple parallel projects |

### Key Differences in Workflow

**Permanent Hiring Flow:**
```
Job Post → Applications → Screen → Interview → Offer → Hire
```

**Project-Based Hiring Flow:**
```
Project Post → Proposals (with quotes) → 
  Review & Compare → Award Contract → 
    Milestone Tracking → Payment Releases → 
      Project Completion & Rating
```

### Recommendation

**Build as a NEW feature module** parallel to existing Requisitions, not an extension of it. Here's why:

✅ **Separate Concerns**: Different data models, workflows, and business logic  
✅ **Clear User Experience**: Distinct UI/UX for projects vs. jobs  
✅ **Easier Maintenance**: Independent feature can be developed, tested, and scaled separately  
✅ **Better Performance**: Optimized queries and indexes for project-specific operations  
✅ **Future Extensibility**: Easy to add project-specific features (escrow, time tracking, ratings)

---

## 🔍 Current Architecture Analysis

### Existing Structure

```
src/
├── pages/recruiter/
│   ├── Requisitions.tsx        # Job postings management
│   ├── TalentPool.tsx          # Candidate discovery
│   ├── Pipelines.tsx           # Recruitment pipeline tracking
│   ├── Shortlists.tsx          # Candidate shortlists
│   ├── Interviews.tsx          # Interview scheduling
│   ├── OffersDecisions.tsx     # Offer management
│   └── Analytics.tsx           # Recruitment analytics
│
├── components/Recruiter/
│   ├── components/             # Reusable UI components
│   ├── filters/                # Filter components
│   └── modals/                 # Modal dialogs
│
├── features/recruiter-copilot/ # AI assistant for recruiters
│   ├── services/               # AI services
│   ├── prompts/                # Prompt engineering
│   └── components/             # Copilot UI
│
├── hooks/
│   └── useRequisitions.js      # Data fetching hook
│
├── services/
│   ├── pipelineService.ts      # Pipeline operations
│   ├── shortlistService.ts     # Shortlist operations
│   └── interviewService.ts     # Interview operations
│
└── types/
    └── recruiter.ts            # TypeScript definitions
```

### Architecture Patterns Identified

1. **Page Component Pattern**: Each major feature has a dedicated page in `pages/recruiter/`
2. **Custom Hooks Pattern**: Data fetching abstracted into hooks (`useRequisitions`, `useStudents`, etc.)
3. **Service Layer Pattern**: Business logic in `services/` directory
4. **Type Safety**: TypeScript interfaces in `types/recruiter.ts`
5. **Component Modularity**: Reusable components in `components/Recruiter/`
6. **AI Integration**: Copilot features in `features/recruiter-copilot/`

---

## 🏗️ Recommended Architecture

### High-Level Structure

```
src/
├── pages/recruiter/
│   └── ProjectHiring.tsx               # NEW: Main project hiring page
│
├── components/Recruiter/Projects/      # NEW: Project-specific components
│   ├── ProjectCard.tsx                 # Display individual project
│   ├── ProjectList.tsx                 # List all projects
│   ├── ProjectForm.tsx                 # Create/edit project
│   ├── ProposalCard.tsx                # Display proposals
│   ├── ProposalReview.tsx              # Review & compare proposals
│   ├── MilestoneTracker.tsx            # Track project milestones
│   ├── ContractManager.tsx             # Manage contracts
│   └── ProjectAnalytics.tsx            # Project-specific metrics
│
├── components/Recruiter/Projects/filters/
│   ├── ProjectFilters.tsx              # Filter projects
│   └── ProposalFilters.tsx             # Filter proposals
│
├── components/Recruiter/Projects/modals/
│   ├── CreateProjectModal.tsx          # Create new project
│   ├── AwardContractModal.tsx          # Award contract to candidate
│   ├── MilestonePaymentModal.tsx       # Release milestone payment
│   └── CompleteProjectModal.tsx        # Mark project complete
│
├── hooks/
│   ├── useProjects.ts                  # NEW: Fetch projects
│   ├── useProposals.ts                 # NEW: Fetch proposals
│   ├── useMilestones.ts                # NEW: Track milestones
│   └── useProjectAnalytics.ts          # NEW: Project metrics
│
├── services/
│   ├── projectService.ts               # NEW: Project CRUD operations
│   ├── proposalService.ts              # NEW: Proposal management
│   ├── milestoneService.ts             # NEW: Milestone tracking
│   └── contractService.ts              # NEW: Contract management
│
├── types/
│   └── project.ts                      # NEW: Project-related types
│
└── features/project-copilot/           # NEW: AI for project hiring
    ├── services/
    │   ├── projectMatchingService.ts   # Match candidates to projects
    │   ├── proposalAnalysisService.ts  # Analyze proposals
    │   └── budgetEstimationService.ts  # Budget recommendations
    ├── prompts/
    │   └── projectPrompts.ts           # Project-specific prompts
    └── components/
        └── ProjectCopilot.tsx          # AI assistant for projects
```

---

## 💾 Database Schema Design

### New Tables Required

#### 1. `projects` Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES recruiters(id) NOT NULL,
  
  -- Project Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'web_development', 'mobile_app', 'data_science', etc.
  
  -- Budget & Timeline
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT DEFAULT 'INR',
  duration_value INTEGER, -- e.g., 2
  duration_unit TEXT, -- 'weeks', 'months'
  
  -- Requirements
  skills_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_required TEXT, -- 'Entry', 'Mid', 'Senior'
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of deliverable descriptions
  
  -- Milestones
  milestones JSONB DEFAULT '[]'::jsonb, -- [{ name, description, amount, deadline }]
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'open', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  visibility TEXT DEFAULT 'public', -- 'public', 'private', 'invited_only'
  
  -- Engagement Details
  max_proposals INTEGER DEFAULT 50,
  proposal_count INTEGER DEFAULT 0,
  hired_freelancer_id UUID REFERENCES students(id),
  
  -- Dates
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline_for_proposals TIMESTAMP WITH TIME ZONE,
  project_start_date DATE,
  project_end_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_budget CHECK (budget_min <= budget_max),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX idx_projects_recruiter ON projects(recruiter_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_posted_at ON projects(posted_at DESC);
CREATE INDEX idx_projects_skills ON projects USING GIN(skills_required);
```

#### 2. `project_proposals` Table

```sql
CREATE TABLE project_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Proposal Details
  cover_letter TEXT NOT NULL,
  proposed_budget NUMERIC NOT NULL,
  proposed_timeline TEXT NOT NULL, -- e.g., "6 weeks"
  proposed_milestones JSONB DEFAULT '[]'::jsonb,
  
  -- Portfolio & References
  relevant_experience TEXT,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  sample_work_links JSONB DEFAULT '[]'::jsonb,
  
  -- Status & Review
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'
  recruiter_rating INTEGER CHECK (recruiter_rating >= 1 AND recruiter_rating <= 5),
  recruiter_notes TEXT,
  
  -- Q&A Thread
  questions_answers JSONB DEFAULT '[]'::jsonb, -- [{ question, answer, asked_by, timestamp }]
  
  -- Dates
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(project_id, student_id), -- One proposal per student per project
  CONSTRAINT valid_proposal_status CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'))
);

-- Indexes
CREATE INDEX idx_proposals_project ON project_proposals(project_id);
CREATE INDEX idx_proposals_student ON project_proposals(student_id);
CREATE INDEX idx_proposals_status ON project_proposals(status);
CREATE INDEX idx_proposals_submitted_at ON project_proposals(submitted_at DESC);
```

#### 3. `project_contracts` Table

```sql
CREATE TABLE project_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  proposal_id UUID REFERENCES project_proposals(id) NOT NULL,
  student_id UUID REFERENCES students(id) NOT NULL,
  recruiter_id UUID REFERENCES recruiters(id) NOT NULL,
  
  -- Contract Terms
  agreed_budget NUMERIC NOT NULL,
  agreed_timeline TEXT NOT NULL,
  agreed_milestones JSONB NOT NULL, -- [{ name, amount, deadline, status, paid_at }]
  
  -- Payment Tracking
  total_paid NUMERIC DEFAULT 0,
  payment_schedule TEXT, -- 'milestone_based', 'hourly', 'fixed'
  
  -- Contract Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'terminated', 'disputed'
  
  -- Terms & Conditions
  contract_document_url TEXT,
  terms_and_conditions TEXT,
  
  -- Performance
  completion_percentage INTEGER DEFAULT 0,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  -- Dates
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_contract_status CHECK (status IN ('active', 'completed', 'terminated', 'disputed'))
);

-- Indexes
CREATE INDEX idx_contracts_project ON project_contracts(project_id);
CREATE INDEX idx_contracts_student ON project_contracts(student_id);
CREATE INDEX idx_contracts_recruiter ON project_contracts(recruiter_id);
CREATE INDEX idx_contracts_status ON project_contracts(status);
```

#### 4. `project_milestones` Table

```sql
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES project_contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Milestone Details
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  order_index INTEGER NOT NULL, -- For ordering milestones
  
  -- Deliverables
  deliverables JSONB DEFAULT '[]'::jsonb,
  submission_url TEXT,
  submission_notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid'
  
  -- Dates
  deadline DATE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_milestone_status CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid'))
);

-- Indexes
CREATE INDEX idx_milestones_contract ON project_milestones(contract_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_milestones_order ON project_milestones(contract_id, order_index);
```

#### 5. `project_reviews` Table

```sql
CREATE TABLE project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  contract_id UUID REFERENCES project_contracts(id) NOT NULL,
  
  -- Review From Recruiter
  recruiter_rating INTEGER CHECK (recruiter_rating >= 1 AND recruiter_rating <= 5),
  recruiter_review TEXT,
  recruiter_would_rehire BOOLEAN,
  
  -- Review From Student
  student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
  student_review TEXT,
  student_would_work_again BOOLEAN,
  
  -- Category Ratings
  quality_rating INTEGER,
  communication_rating INTEGER,
  timeliness_rating INTEGER,
  professionalism_rating INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(contract_id) -- One review per contract
);

-- Indexes
CREATE INDEX idx_reviews_project ON project_reviews(project_id);
CREATE INDEX idx_reviews_contract ON project_reviews(contract_id);
```

---

## 📁 File Structure & Implementation Plan

### Phase 1: Core Types & Interfaces

**File:** `src/types/project.ts`

```typescript
// Project Types
export interface Project {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  duration_value?: number;
  duration_unit?: 'days' | 'weeks' | 'months';
  skills_required: string[];
  experience_required: 'Entry' | 'Mid' | 'Senior' | 'Expert';
  deliverables: string[];
  milestones: ProjectMilestone[];
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  visibility: 'public' | 'private' | 'invited_only';
  max_proposals: number;
  proposal_count: number;
  hired_freelancer_id?: string;
  posted_at: string;
  deadline_for_proposals?: string;
  project_start_date?: string;
  project_end_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 
  | 'draft' 
  | 'open' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type ProjectCategory = 
  | 'web_development'
  | 'mobile_app'
  | 'data_science'
  | 'ui_ux_design'
  | 'content_writing'
  | 'marketing'
  | 'other';

// Proposal Types
export interface Proposal {
  id: string;
  project_id: string;
  student_id: string;
  cover_letter: string;
  proposed_budget: number;
  proposed_timeline: string;
  proposed_milestones: ProposalMilestone[];
  relevant_experience?: string;
  portfolio_links: string[];
  sample_work_links: string[];
  status: ProposalStatus;
  recruiter_rating?: number;
  recruiter_notes?: string;
  questions_answers: QA[];
  submitted_at: string;
  reviewed_at?: string;
  updated_at: string;
}

export type ProposalStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

// Milestone Types
export interface ProjectMilestone {
  name: string;
  description?: string;
  amount: number;
  deadline?: string;
}

export interface ProposalMilestone extends ProjectMilestone {
  deliverables?: string[];
}

// Contract Types
export interface ProjectContract {
  id: string;
  project_id: string;
  proposal_id: string;
  student_id: string;
  recruiter_id: string;
  agreed_budget: number;
  agreed_timeline: string;
  agreed_milestones: ContractMilestone[];
  total_paid: number;
  payment_schedule: 'milestone_based' | 'hourly' | 'fixed';
  status: ContractStatus;
  contract_document_url?: string;
  terms_and_conditions?: string;
  completion_percentage: number;
  quality_rating?: number;
  signed_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

export type ContractStatus = 
  | 'active' 
  | 'completed' 
  | 'terminated' 
  | 'disputed';

export interface ContractMilestone extends ProjectMilestone {
  id: string;
  status: MilestoneStatus;
  submission_url?: string;
  submission_notes?: string;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
}

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'paid';

// Filter Types
export interface ProjectFilters {
  status: ProjectStatus[];
  categories: ProjectCategory[];
  budgetRange: { min?: number; max?: number };
  skills: string[];
  priority: string[];
  dateRange: { start?: string; end?: string };
}

// Q&A
export interface QA {
  question: string;
  answer?: string;
  asked_by: 'recruiter' | 'student';
  timestamp: string;
}
```

### Phase 2: Service Layer

**File:** `src/services/projectService.ts`

```typescript
import { supabase } from '../lib/supabaseClient';
import { Project, ProjectFilters } from '../types/project';

export const projectService = {
  // Get all projects for a recruiter
  async getProjects(recruiterId: string, filters?: ProjectFilters) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('posted_at', { ascending: false });

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.categories?.length) {
      query = query.in('category', filters.categories);
    }
    if (filters?.budgetRange?.min) {
      query = query.gte('budget_min', filters.budgetRange.min);
    }
    if (filters?.budgetRange?.max) {
      query = query.lte('budget_max', filters.budgetRange.max);
    }

    return await query;
  },

  // Get single project
  async getProject(projectId: string) {
    return await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
  },

  // Create new project
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    return await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
  },

  // Update project
  async updateProject(projectId: string, updates: Partial<Project>) {
    return await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
  },

  // Delete project
  async deleteProject(projectId: string) {
    return await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
  },

  // Get project analytics
  async getProjectAnalytics(recruiterId: string) {
    const { data: projects } = await supabase
      .from('projects')
      .select('status, budget_min, budget_max, proposal_count')
      .eq('recruiter_id', recruiterId);

    if (!projects) return null;

    return {
      total: projects.length,
      byStatus: {
        open: projects.filter(p => p.status === 'open').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length,
      },
      totalBudget: projects.reduce((sum, p) => sum + (p.budget_max || 0), 0),
      avgProposals: projects.reduce((sum, p) => sum + p.proposal_count, 0) / projects.length,
    };
  },
};
```

**File:** `src/services/proposalService.ts`

```typescript
import { supabase } from '../lib/supabaseClient';
import { Proposal } from '../types/project';

export const proposalService = {
  // Get proposals for a project
  async getProposalsForProject(projectId: string) {
    return await supabase
      .from('project_proposals')
      .select(`
        *,
        student:students(id, name, email, photo, cgpa, university, department)
      `)
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });
  },

  // Get single proposal
  async getProposal(proposalId: string) {
    return await supabase
      .from('project_proposals')
      .select(`
        *,
        project:projects(*),
        student:students(*)
      `)
      .eq('id', proposalId)
      .single();
  },

  // Update proposal status
  async updateProposalStatus(proposalId: string, status: string, notes?: string) {
    return await supabase
      .from('project_proposals')
      .update({ 
        status, 
        recruiter_notes: notes,
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', proposalId)
      .select()
      .single();
  },

  // Rate proposal
  async rateProposal(proposalId: string, rating: number, notes?: string) {
    return await supabase
      .from('project_proposals')
      .update({ 
        recruiter_rating: rating,
        recruiter_notes: notes 
      })
      .eq('id', proposalId)
      .select()
      .single();
  },

  // Compare proposals
  async compareProposals(proposalIds: string[]) {
    return await supabase
      .from('project_proposals')
      .select(`
        *,
        student:students(*)
      `)
      .in('id', proposalIds);
  },
};
```

### Phase 3: Custom Hooks

**File:** `src/hooks/useProjects.ts`

```typescript
import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { Project, ProjectFilters } from '../types/project';
import { useAuth } from '../context/AuthContext';

export const useProjects = (filters?: ProjectFilters) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user?.id, filters]);

  const fetchProjects = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await projectService.getProjects(user.id, filters);
      
      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
};
```

**File:** `src/hooks/useProposals.ts`

```typescript
import { useState, useEffect } from 'react';
import { proposalService } from '../services/proposalService';
import { Proposal } from '../types/project';

export const useProposals = (projectId: string) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProposals();
    }
  }, [projectId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await proposalService.getProposalsForProject(projectId);
      
      if (fetchError) throw fetchError;
      setProposals(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    proposals,
    loading,
    error,
    refetch: fetchProposals,
  };
};
```

### Phase 4: Main Page Component

**File:** `src/pages/recruiter/ProjectHiring.tsx`

```typescript
import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { ProjectFilters } from '../../types/project';
import ProjectList from '../../components/Recruiter/Projects/ProjectList';
import ProjectFiltersComponent from '../../components/Recruiter/Projects/filters/ProjectFilters';
import CreateProjectModal from '../../components/Recruiter/Projects/modals/CreateProjectModal';
import { PlusIcon } from '@heroicons/react/24/outline';

const ProjectHiring = () => {
  const [filters, setFilters] = useState<ProjectFilters>({
    status: [],
    categories: [],
    budgetRange: {},
    skills: [],
    priority: [],
    dateRange: {},
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { projects, loading, error, refetch } = useProjects(filters);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project-Based Hiring</h1>
          <p className="text-gray-600 mt-1">
            Post projects, review proposals, and hire freelancers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5" />
          Post New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Projects" value={projects.filter(p => p.status === 'open').length} />
        <StatCard title="In Progress" value={projects.filter(p => p.status === 'in_progress').length} />
        <StatCard title="Completed" value={projects.filter(p => p.status === 'completed').length} />
        <StatCard title="Total Budget" value={`₹${calculateTotalBudget(projects)}`} />
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <ProjectFiltersComponent filters={filters} onChange={setFilters} />
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Project List */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <ProjectList projects={projects} viewMode={viewMode} onRefetch={refetch} />
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default ProjectHiring;
```

### Phase 5: Routing

**File:** `src/routes/AppRoutes.jsx` (add this line)

```javascript
// Inside recruiter routes section, add:
const ProjectHiring = lazy(() => import("../pages/recruiter/ProjectHiring"));

// Then in the Routes section:
<Route path="/recruiter/projects" element={<ProjectHiring />} />
```

---

## 🔗 Integration with Existing Features

### 1. Recruiter Layout Integration

Update `src/layouts/RecruiterLayout.tsx` or `src/components/Recruiter/Sidebar.tsx`:

```typescript
const navigationItems = [
  { name: 'Overview', path: '/recruiter/overview', icon: HomeIcon },
  { name: 'Requisitions', path: '/recruiter/requisitions', icon: BriefcaseIcon },
  { name: 'Project Hiring', path: '/recruiter/projects', icon: RocketLaunchIcon }, // NEW
  { name: 'Talent Pool', path: '/recruiter/talent-pool', icon: UsersIcon },
  // ... rest of navigation
];
```

### 2. AI Copilot Integration

Create `src/features/project-copilot/` with similar structure to `recruiter-copilot/`:

```typescript
// src/features/project-copilot/services/projectIntelligenceEngine.ts

export const projectIntelligenceEngine = {
  async analyzeProposal(proposal: Proposal, project: Project) {
    // Use AI to evaluate proposal quality
    // Compare against project requirements
    // Provide recommendation
  },

  async suggestBudget(projectDescription: string, skills: string[]) {
    // AI-powered budget estimation
  },

  async matchCandidatesToProject(projectId: string) {
    // Similar to recruiterInsights.matchCandidatesToOpportunity
    // But for project-based work
  },

  async compareProposals(proposals: Proposal[]) {
    // AI-powered proposal comparison
    // Highlight strengths/weaknesses
  },
};
```

### 3. Reuse Existing Components

Leverage these existing components:
- `CandidateProfileDrawer` → View freelancer profiles
- `AdvancedFilters` pattern → Create `ProjectFilters`
- `SearchBar` → Search projects/proposals
- Message system → Communication with freelancers

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create database schema (run SQL scripts)
- [ ] Create TypeScript types (`types/project.ts`)
- [ ] Set up service layer (`projectService.ts`, `proposalService.ts`)
- [ ] Create custom hooks (`useProjects`, `useProposals`)

### Phase 2: Core UI (Week 3-4)
- [ ] Build main `ProjectHiring.tsx` page
- [ ] Create `ProjectCard` and `ProjectList` components
- [ ] Build `CreateProjectModal` with form validation
- [ ] Implement filters and search

### Phase 3: Proposal Management (Week 5-6)
- [ ] Build proposal viewing/review UI
- [ ] Create proposal comparison feature
- [ ] Implement proposal status management
- [ ] Add Q&A functionality

### Phase 4: Contract & Milestones (Week 7-8)
- [ ] Build contract creation workflow
- [ ] Implement milestone tracker
- [ ] Add payment release functionality
- [ ] Create project completion flow

### Phase 5: Analytics & AI (Week 9-10)
- [ ] Build project analytics dashboard
- [ ] Integrate AI copilot for projects
- [ ] Add budget estimation AI
- [ ] Implement proposal analysis AI

### Phase 6: Polish & Testing (Week 11-12)
- [ ] UI/UX refinements
- [ ] Mobile responsiveness
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation

---

## 🎨 Key UI/UX Considerations

### Visual Distinction

Make project-based hiring visually distinct from regular hiring:

```tsx
// Use different color scheme
const projectTheme = {
  primary: 'purple-600', // vs. primary-600 (blue) for regular hiring
  accent: 'purple-100',
  icon: RocketLaunchIcon, // vs. BriefcaseIcon
};
```

### Dashboard Cards

```tsx
<ProjectCard project={project}>
  {/* Show budget range, not salary */}
  <BudgetBadge min={project.budget_min} max={project.budget_max} />
  
  {/* Show proposal count */}
  <ProposalCount count={project.proposal_count} />
  
  {/* Show milestones progress */}
  <MilestoneProgress completed={3} total={5} />
</ProjectCard>
```

### Proposal Review Interface

```tsx
<ProposalReview proposal={proposal}>
  {/* Side-by-side comparison */}
  <ComparisonTable proposals={selectedProposals} />
  
  {/* AI insights */}
  <AIRecommendation proposal={proposal} />
  
  {/* Quick actions */}
  <ActionBar>
    <Button action="accept">Award Contract</Button>
    <Button action="shortlist">Shortlist</Button>
    <Button action="reject">Decline</Button>
  </ActionBar>
</ProposalReview>
```

---

## 📊 Success Metrics

Track these KPIs for the project-based hiring feature:

1. **Adoption Rate**: % of recruiters using project hiring
2. **Project Completion Rate**: % of projects completed successfully
3. **Time to Award**: Days from posting to awarding contract
4. **Proposal Quality**: Average recruiter rating of proposals
5. **Re-hire Rate**: % of freelancers hired for multiple projects
6. **Budget Accuracy**: Difference between posted and actual budgets

---

## 🔐 Security Considerations

1. **Access Control**: Ensure recruiters can only see their own projects
2. **Payment Security**: Implement escrow or milestone-based payments
3. **Contract Signing**: Digital signature verification
4. **Dispute Resolution**: Mechanism for handling conflicts
5. **Data Privacy**: Protect freelancer personal information

---

## 🚀 Future Enhancements

1. **Escrow Integration**: Hold payments until milestone completion
2. **Time Tracking**: Track hours for hourly projects
3. **Video Interviews**: Built-in video calls for freelancer interviews
4. **Portfolio Builder**: Help students create project portfolios
5. **Rating System**: Public ratings for both recruiters and freelancers
6. **Auto-Matching**: AI automatically suggests best candidates for projects
7. **Mobile App**: Native mobile app for on-the-go management
8. **Slack/Teams Integration**: Notifications in workplace chat tools

---

## 📝 Summary

### Recommended Approach

**Build project-based hiring as a PARALLEL feature to regular hiring**, not an extension. This provides:

✅ **Clear separation of concerns**  
✅ **Better user experience**  
✅ **Easier maintenance**  
✅ **Future scalability**  

### Key File Locations

```
WHERE TO BUILD:
├── Database: /database/project_hiring_schema.sql (NEW)
├── Types: /src/types/project.ts (NEW)
├── Services: /src/services/projectService.ts (NEW)
├── Hooks: /src/hooks/useProjects.ts (NEW)
├── Pages: /src/pages/recruiter/ProjectHiring.tsx (NEW)
├── Components: /src/components/Recruiter/Projects/ (NEW FOLDER)
└── Routes: /src/routes/AppRoutes.jsx (ADD ROUTE)
```

### Quick Start Command

```bash
# 1. Create database tables
psql -d your_database < database/project_hiring_schema.sql

# 2. Create type definitions
touch src/types/project.ts

# 3. Create services
touch src/services/projectService.ts
touch src/services/proposalService.ts

# 4. Create hooks
touch src/hooks/useProjects.ts
touch src/hooks/useProposals.ts

# 5. Create main page
touch src/pages/recruiter/ProjectHiring.tsx

# 6. Create component folder
mkdir -p src/components/Recruiter/Projects
```

---

**Last Updated**: November 17, 2025  
**Status**: Architecture Complete - Ready for Implementation  
**Next Step**: Create database schema and type definitions

---

For questions or clarifications, refer to:
- Existing recruiter features: `/src/pages/recruiter/`
- Existing copilot: `/src/features/recruiter-copilot/README.md`
- Database patterns: `/database/opportunities_table_setup.sql`
