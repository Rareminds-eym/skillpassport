import { useState, useEffect, useMemo } from 'react';
import { SavedJobsService, AppliedJobsService } from '../api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useSavedJobs');

interface UseSavedJobsProps {
  learnerId: string | undefined;
}

interface UseSavedJobsReturn {
  savedJobs: any[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  selectedOpportunity: any | null;
  appliedJobs: Set<string>;
  isApplying: boolean;
  showActiveOnly: boolean;
  filteredAndSortedJobs: any[];
  setSearchTerm: (term: string) => void;
  setSortBy: (sort: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedOpportunity: (opportunity: any | null) => void;
  setShowActiveOnly: (show: boolean) => void;
  handleUnsave: (opportunity: any) => Promise<void>;
  handleApply: (opportunity: any) => Promise<void>;
}

export const useSavedJobs = ({ learnerId }: UseSavedJobsProps): UseSavedJobsReturn => {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
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
          (jobs || []).filter((job: any) => job.has_applied).map((job: any) => job.id)
        );
        setAppliedJobs(appliedSet);

        setError(null);
      } catch (err: any) {
        logger.error('❌ Error loading saved jobs', err);
        setError(err.message || 'Failed to load saved jobs');
        setSavedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadSavedJobs();
  }, [learnerId]);

  // Filter and sort saved jobs
  const filteredAndSortedJobs = useMemo(() => {
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
  const handleUnsave = async (opportunity: any) => {
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
    } catch (error) {
      logger.error('Error unsaving job', error as Error);
      alert('Failed to unsave job');
    }
  };

  // Handle apply
  const handleApply = async (opportunity: any) => {
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
        } catch (error) {
          logger.error('Error recording external application', error as Error);
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
    } catch (error) {
      logger.error('Error applying to job', error as Error);
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
