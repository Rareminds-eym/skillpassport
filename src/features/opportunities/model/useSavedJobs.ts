import { useState, useEffect, useMemo } from 'react';
import { SavedJobsService, AppliedJobsService } from '../api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useSavedJobs');

interface SavedJob {
  id: string;
  job_title?: string;
  title?: string;
  company_name?: string;
  is_active: boolean;
  has_applied: boolean;
  saved_at: string;
  deadline?: string;
  employment_type?: string;
  application_link?: string;
}

interface UseSavedJobsProps {
  learnerId: string | undefined;
}

interface UseSavedJobsReturn {
  savedJobs: SavedJob[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  selectedOpportunity: SavedJob | null;
  appliedJobs: Set<string>;
  isApplying: boolean;
  showActiveOnly: boolean;
  filteredAndSortedJobs: SavedJob[];
  setSearchTerm: (term: string) => void;
  setSortBy: (sort: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedOpportunity: (opportunity: SavedJob | null) => void;
  setShowActiveOnly: (show: boolean) => void;
  handleUnsave: (opportunity: SavedJob) => Promise<void>;
  handleApply: (opportunity: SavedJob) => Promise<void>;
}

export const useSavedJobs = ({ learnerId }: UseSavedJobsProps): UseSavedJobsReturn => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedOpportunity, setSelectedOpportunity] = useState<SavedJob | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Load saved jobs
  useEffect(() => {
    const loadSavedJobs = async () => {
      if (!learnerId) {
        logger.warn('⚠️ No learnerId provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        logger.info('📥 Loading saved jobs for learnerId:', learnerId);

        const jobs = await SavedJobsService.getSavedJobsWithAppliedStatus(learnerId);

        logger.info('✅ Saved jobs loaded:', { count: jobs?.length || 0, jobs });

        setSavedJobs(jobs || []);

        // Set applied jobs
        const appliedSet = new Set(
          (jobs || []).filter((job: SavedJob) => job.has_applied).map((job: SavedJob) => job.id)
        );
        setAppliedJobs(appliedSet);

        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load saved jobs';
        logger.error('❌ Error loading saved jobs', err);
        setError(errorMessage);
        setSavedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadSavedJobs();
  }, [learnerId]);

  // Filter and sort saved jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!savedJobs || savedJobs.length === 0) return [];

    // First filter
    let filtered = savedJobs.filter(job => {
      const matchesSearch = 
        job.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesActiveOnly = !showActiveOnly || job.is_active;

      return matchesSearch && matchesActiveOnly;
    });

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
        case 'oldest':
          return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
        case 'deadline':
          const aDeadline = a.deadline || '9999-12-31';
          const bDeadline = b.deadline || '9999-12-31';
          return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [savedJobs, searchTerm, sortBy, showActiveOnly]);

  // Handle unsave
  const handleUnsave = async (opportunity: SavedJob) => {
    if (!learnerId) {
      alert('Please log in to unsave jobs');
      return;
    }

    const confirmUnsave = window.confirm(
      `Remove "${opportunity.job_title || opportunity.title}" from saved jobs?`
    );

    if (!confirmUnsave) return;

    try {
      const result = await SavedJobsService.unsaveJob(learnerId, opportunity.id);

      if (result.success) {
        // Remove from local state
        setSavedJobs(prev => prev.filter(job => job.id !== opportunity.id));
        alert('Job removed from saved list');
      } else {
        alert(result.message);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsave job';
      logger.error('Error unsaving job', err);
      alert(errorMessage);
    }
  };

  // Handle apply
  const handleApply = async (opportunity: SavedJob) => {
    if (!learnerId) {
      alert('Please log in to apply for jobs');
      return;
    }

    if (appliedJobs.has(opportunity.id)) {
      alert('You have already applied to this job');
      return;
    }

    // If there's an external application link
    if (opportunity.application_link) {
      const confirmExternal = window.confirm(
        'This job requires external application. You will be redirected to the company website. Continue?'
      );

      if (confirmExternal) {
        window.open(opportunity.application_link, '_blank');

        // Still record the application
        try {
          await AppliedJobsService.applyToJob(learnerId, opportunity.id);
          setAppliedJobs(prev => new Set([...prev, opportunity.id]));
        } catch (err: unknown) {
          logger.error('Error recording external application', err);
        }
      }
      return;
    }

    // Internal application
    setIsApplying(true);
    try {
      const result = await AppliedJobsService.applyToJob(learnerId, opportunity.id);

      if (result.success) {
        setAppliedJobs(prev => new Set([...prev, opportunity.id]));
        alert('Application submitted successfully!');
      } else {
        alert(result.message || 'Failed to submit application');
      }
    } catch (err: unknown) {
      logger.error('Error applying to job', err);
      alert('Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  return {
    savedJobs,
    loading,
    error,
    searchTerm,
    sortBy,
    viewMode,
    selectedOpportunity,
    appliedJobs,
    isApplying,
    showActiveOnly,
    filteredAndSortedJobs,
    setSearchTerm,
    setSortBy,
    setViewMode,
    setSelectedOpportunity,
    setShowActiveOnly,
    handleUnsave,
    handleApply,
  };
};
