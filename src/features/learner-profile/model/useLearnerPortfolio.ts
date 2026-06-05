import { useState, useEffect, useCallback } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-portfolio');

export interface UselearnerPortfolioOptions {
  learnerId: string | null;
  enabled?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  role: string;
  status: string;
  startDate: string;
  endDate: string;
  duration: string;
  organization: string;
  techStack: string[];
  skills: string[];
  demoLink: string;
  githubLink: string;
  certificateUrl: string;
  videoUrl: string;
  pptUrl: string;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issuedOn: string;
  expiryDate: string;
  level: string;
  description: string;
  credentialId: string;
  link: string;
  documentUrl: string;
  platform: string;
  instructor: string;
  category: string;
  status: string;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  title: string;
  course: string;
  organization: string;
  provider: string;
  start_date: string;
  end_date: string;
  startDate: string;
  endDate: string;
  duration: string;
  description: string;
  status: string;
  completedModules: number;
  totalModules: number;
  hoursSpent: number;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  source: string;
  course_id?: string;
  skills: string[];
  certificateUrl: string;
  createdAt: string;
  updatedAt: string;
  type: 'training' | 'course_enrollment';
}

const fetchData = async <T>(action: string, params: Record<string, any>): Promise<T[]> => {
  const res = await apiPost<T[]>('/learner-profile/actions', { action, ...params });
  return res?.data || [];
};

export const useLearnerPortfolio = ({ learnerId, enabled = true }: UselearnerPortfolioOptions) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    if (!learnerId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchProjects(),
        fetchCertificates(),
        fetchTrainings()
      ]);
    } catch (err: any) {
      logger.error('Error fetching portfolio data', err);
      setError(err.message || 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  }, [learnerId, enabled]);

  const fetchProjects = async () => {
    if (!learnerId) return;
    try {
      const data = await fetchData<any>('fetch-projects', { learnerId });
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        description: item.description,
        role: item.role,
        status: item.status || 'completed',
        startDate: item.start_date,
        endDate: item.end_date,
        duration: item.duration,
        organization: item.organization,
        techStack: item.tech_stack || [],
        technologies: item.tech_stack || [],
        skills: item.skills_used || [],
        demoLink: item.demo_link,
        githubLink: item.github_link,
        certificateUrl: item.certificate_url,
        videoUrl: item.video_url,
        pptUrl: item.ppt_url,
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      setProjects(transformedData);
    } catch (err) {
      logger.error('Error fetching projects', err as Error);
    }
  };

  const fetchCertificates = async () => {
    if (!learnerId) return;
    try {
      const data = await fetchData<any>('fetch-certificates', { learnerId });
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        issuer: item.issuer || item.organization,
        issuedOn: item.issued_on,
        expiryDate: item.expiry_date,
        level: item.level,
        description: item.description,
        credentialId: item.credential_id,
        link: item.link || item.certificate_url,
        documentUrl: item.document_url,
        platform: item.platform,
        instructor: item.instructor,
        category: item.category,
        status: item.status || 'active',
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      setCertificates(transformedData);
    } catch (err) {
      logger.error('Error fetching certificates', err as Error);
    }
  };

  const fetchTrainings = async () => {
    if (!learnerId) return;
    try {
      const trainingsData = await fetchData<any>('fetch-trainings', { learnerId });
      const enrollmentsData = await fetchData<any>('fetch-course-enrollments', { learnerId });

      const formattedTrainings: Training[] = [];

      for (const train of (trainingsData || [])) {
        const certificateRows = await fetchData<any>('fetch-certificates-by-training', { trainingIds: [train.id], enabled: true });
        const skillRows = await fetchData<any>('fetch-skills-by-training', { trainingIds: [train.id], skillType: 'technical' });

        formattedTrainings.push({
          id: train.id,
          title: train.title || '',
          course: train.title || '',
          organization: train.organization || '',
          provider: train.organization || '',
          start_date: train.start_date,
          end_date: train.end_date,
          startDate: train.start_date,
          endDate: train.end_date,
          duration: train.duration || '',
          description: train.description || '',
          status: train.status || 'ongoing',
          completedModules: train.completed_modules || 0,
          totalModules: train.total_modules || 0,
          hoursSpent: train.hours_spent || 0,
          approval_status: train.approval_status || 'pending',
          verified: train.approval_status === 'approved' || train.approval_status === 'verified',
          processing: train.approval_status === 'pending',
          enabled: train.approval_status !== 'rejected',
          source: train.source || 'manual',
          course_id: train.course_id,
          skills: (skillRows || []).map((s: any) => s.name) || [],
          certificateUrl: certificateRows?.[0]?.link || '',
          createdAt: train.created_at,
          updatedAt: train.updated_at,
          type: 'training'
        });
      }

      const filteredEnrollments = (enrollmentsData || []).filter((e: any) => 
        e.progress > 0 || e.status === 'completed'
      );

      const formattedEnrollments = filteredEnrollments.map((enroll: any) => {
        const completedLessonsCount = enroll.completed_lessons?.length || 0;
        const totalLessonsCount = enroll.total_lessons || 0;
        let calculatedProgress = 0;
        if (totalLessonsCount > 0) {
          calculatedProgress = Math.round((completedLessonsCount / totalLessonsCount) * 100);
        }
        return {
          id: `enrollment-${enroll.id}`,
          title: enroll.course_title || 'Untitled Course',
          course: enroll.course_title || 'Untitled Course',
          organization: enroll.educator_name || 'Platform Course',
          provider: enroll.educator_name || 'Platform Course',
          start_date: enroll.enrolled_at,
          end_date: enroll.completed_at,
          startDate: enroll.enrolled_at,
          endDate: enroll.completed_at,
          duration: '',
          description: '',
          status: calculatedProgress >= 100 ? 'completed' : 'ongoing',
          completedModules: completedLessonsCount,
          totalModules: totalLessonsCount,
          hoursSpent: Math.round((enroll.total_time_spent_seconds || 0) / 3600),
          progress: calculatedProgress,
          approval_status: 'approved',
          verified: true,
          processing: false,
          enabled: true,
          source: 'course_enrollment',
          course_id: enroll.course_id,
          skills: [],
          certificateUrl: enroll.certificate_url || '',
          createdAt: enroll.enrolled_at,
          updatedAt: enroll.last_accessed,
          type: 'course_enrollment' as const
        };
      });

      const enrollmentCourseIds = new Set(formattedEnrollments.map(e => e.course_id).filter(Boolean));
      const filteredTrainings = formattedTrainings.filter(t => !t.course_id || !enrollmentCourseIds.has(t.course_id));

      setTrainings([...filteredTrainings, ...formattedEnrollments]);
    } catch (err) {
      logger.error('Error fetching trainings', err as Error);
    }
  };

  const refresh = useCallback(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const stats = {
    totalProjects: projects.length,
    totalCertificates: certificates.length,
    totalTrainings: trainings.length,
    completedTrainings: trainings.filter(t => t.status === 'completed').length,
    ongoingTrainings: trainings.filter(t => t.status === 'ongoing').length
  };

  return {
    projects,
    certificates,
    trainings,
    stats,
    loading,
    error,
    refresh,
    refreshProjects: fetchProjects,
    refreshCertificates: fetchCertificates,
    refreshTrainings: fetchTrainings
  };
};
