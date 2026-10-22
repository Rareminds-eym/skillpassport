import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { SavedJobsService, AppliedJobsService } from '../api';
import { opportunitiesService } from '../api/opportunitiesService';
import { getExternalApplicationUrl, openExternalApplication } from '../lib/externalApplication';
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
  handleApply: (opportunity: SavedJob) => Promise<boolean>;
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
        logger.info('📥 Loading saved jobs', { learnerId });

        const jobs: SavedJob[] = await SavedJobsService.getSavedJobsWithAppliedStatus(learnerId);

        logger.info('✅ Saved jobs loaded:', { count: jobs?.length || 0, jobs });

        setSavedJobs(jobs || []);

        // Set applied jobs
        const appliedSet = new Set<string>(
          (jobs || []).filter((job: SavedJob) => job.has_applied).map((job: SavedJob) => job.id)
        );
        setAppliedJobs(appliedSet);

        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load saved jobs';
        logger.error('❌ Error loading saved jobs', err instanceof Error ? err : new Error(errorMessage));
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
      toast.error('Please log in to unsave jobs');
      return;
    }

    try {
      const result = await SavedJobsService.unsaveJob(learnerId, opportunity.id);

      if (result.success) {
        setSavedJobs(prev => prev.filter(job => job.id !== opportunity.id));
        toast.success('Job removed from saved list');
      } else {
        toast.error(result.message || 'Failed to remove job');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsave job';
      logger.error('Error unsaving job', err instanceof Error ? err : new Error(errorMessage));
      toast.error(errorMessage);
    }
  };

  // Handle apply
  const handleApply = async (opportunity: SavedJob) => {
    if (!learnerId) {
      toast.error('Please log in to apply for jobs');
      return false;
    }

    if (appliedJobs.has(opportunity.id)) {
      toast.error('You have already applied to this job');
      return false;
    }

    setIsApplying(true);
    try {
      // A saved snapshot is not authoritative for the action or its destination.
      const currentOpportunity = await opportunitiesService.getOpportunityById(opportunity.id);
      if (!currentOpportunity) throw new Error('This opportunity is no longer available');
      // Refresh the selected Details DTO and saved row before recording/opening.
      // Preserve saved-application metadata, which is not part of the job endpoint.
      const refreshSnapshot = (saved: SavedJob): SavedJob => ({
        ...saved,
        ...currentOpportunity,
        saved_at: saved.saved_at,
        has_applied: saved.has_applied,
      });
      setSavedJobs(previous => previous.map(saved => saved.id === currentOpportunity.id ? refreshSnapshot(saved) : saved));
      setSelectedOpportunity(previous => previous?.id === currentOpportunity.id ? refreshSnapshot(previous) : previous);
      const destination = currentOpportunity.application_link
        ? getExternalApplicationUrl(currentOpportunity.application_link)
        : null;
      const result = await AppliedJobsService.applyToJob(learnerId, opportunity.id);

      if (result.success) {
        setAppliedJobs(prev => new Set([...prev, opportunity.id]));
        toast.success(destination
          ? 'Application recorded. Complete submission on the employer website.'
          : 'Application submitted successfully!');
      } else {
        toast.error(result.message || (destination ? 'Failed to record application' : 'Failed to submit application'));
      }
      if (destination && result.success) {
        // Opening the employer page is not an application acknowledgement.
        try {
          const opened = openExternalApplication(destination);
          if (!opened) toast('If the employer page did not open, use the application link in Details.');
        } catch {
          toast.error(result.success
            ? 'Application recorded, but the employer page could not be opened. Use the application link in Details to retry.'
            : 'The employer page could not be opened. Use the application link in Details to retry.');
        }
      }
      return result.success === true;
    } catch (err: unknown) {
      logger.error('Error applying to job', err instanceof Error ? err : new Error('Failed to submit application'));
      toast.error('Failed to submit application');
      return false;
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
