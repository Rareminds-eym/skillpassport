import { useState } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { Learner } from '@/features/learner-profile/model';
import toast from 'react-hot-toast';
import { isCollegeLearner as checkIsCollegeLearner, isSchoolLearner as checkIsSchoolLearner } from '@/entities/learner/lib/learnerType';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';

const logger = getLogger('learner-actions');

export const useLearnerActions = (learner: Learner | null) => {
  const [actionLoading, setActionLoading] = useState(false);

  const calculateAcademicYear = (admissionYear: string, currentSemester: number): string => {
    try {
      const yearsProgressed = Math.floor((currentSemester - 1) / 2);
      const [startYear] = admissionYear.split('-');
      const newStartYear = parseInt(startYear) + yearsProgressed;
      return `${newStartYear}-${(newStartYear + 1).toString().slice(-2)}`;
    } catch {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    }
  };

  const getCurrentSemester = () => {
    if (!learner) return 1;

    if ((learner as any).semester && (learner as any).semester > 0) {
      return (learner as any).semester;
    }
    if ((learner as any).current_semester && (learner as any).current_semester > 0) {
      return parseInt((learner as any).current_semester) || 1;
    }
    if (checkIsCollegeLearner(learner) && learner.enrollmentDate) {
      const enrollmentDate = new Date(learner.enrollmentDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - enrollmentDate.getFullYear()) * 12 +
        (currentDate.getMonth() - enrollmentDate.getMonth());
      return Math.max(1, Math.floor(monthsDiff / 6) + 1);
    }
    if (checkIsSchoolLearner(learner) && learner.grade) {
      const gradeNum = parseInt(learner.grade);
      if (!isNaN(gradeNum)) return gradeNum;
    }
    return parseInt((learner as any).current_semester || '1') || 1;
  };

  const getTotalSemesters = () => {
    if (!learner) return 8;
    if (checkIsSchoolLearner(learner)) return 12;
    const degreeType = learner.branch_field?.toLowerCase() ||
      learner.dept?.toLowerCase() ||
      learner.profile?.education?.[0]?.degree?.toLowerCase() || '';
    if (degreeType.includes('phd') || degreeType.includes('doctorate')) return 8;
    if (degreeType.includes('master') || degreeType.includes('mtech') || degreeType.includes('mba')) return 4;
    if (degreeType.includes('bachelor') || degreeType.includes('btech') || degreeType.includes('be') || degreeType.includes('bsc') || degreeType.includes('ba')) return 8;
    if (degreeType.includes('diploma')) return 6;
    return 8;
  };

  const needsVerification = () => {
    if (!learner) return false;
    return learner.approval_status === 'pending' ||
      learner.approval_status === null ||
      learner.approval_status === undefined ||
      !learner.approval_status;
  };

  const canPromote = () => {
    if (!learner) return false;
    return learner.approval_status === 'approved' || learner.approval_status === 'verified';
  };

  const canGraduate = () => {
    if (!learner) return false;
    const currentSem = getCurrentSemester();
    const totalSems = getTotalSemesters();
    return (currentSem >= totalSems ||
      (learner.expectedGraduationDate && new Date() >= new Date(learner.expectedGraduationDate))) &&
      (learner.approval_status === 'approved' || learner.approval_status === 'verified') &&
      !learner.metadata?.graduation_date;
  };

  const handleApprovalAction = async (action: 'approve' | 'reject', reason?: string) => {
    if (!learner?.id) return;
    setActionLoading(true);
    try {
      const user = useAuthStore.getState().user;
      await apiPost('/learners/actions', {
        action,
        learnerId: learner.id,
        reason,
        promotedBy: user?.id,
      });
      toast.success(`Learner ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      window.location.reload();
    } catch (error: any) {
      logger.error('Error updating learner status', error as Error);
      toast.error(`Failed to ${action} learner: ${error?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromotion = async () => {
    if (!learner?.id) return;
    setActionLoading(true);
    try {
      const currentSem = getCurrentSemester();
      const nextSem = currentSem + 1;
      const totalSems = getTotalSemesters();

      if (nextSem > totalSems) {
        toast.error(`Learner is already in final semester (${currentSem}/${totalSems}). Cannot promote further.`);
        return;
      }
      if (learner.approval_status !== 'approved' && learner.approval_status !== 'verified') {
        toast.error('Learner must be approved before promotion.');
        return;
      }

      const user = useAuthStore.getState().user;
      const academicYear = learner.admission_academic_year
        ? calculateAcademicYear(learner.admission_academic_year, currentSem)
        : `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`;

      await apiPost('/learners/actions', {
        action: 'promote',
        learnerId: learner.id,
        currentSemester: currentSem,
        totalSemesters: totalSems,
        academicYear,
        promotedBy: user?.id,
      });

      toast.success(`Learner promoted successfully from Semester ${currentSem} to ${nextSem}!`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      logger.error('Error promoting learner', error as Error);
      toast.error(`Failed to promote learner: ${error?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGraduation = async () => {
    if (!learner?.id) return;
    setActionLoading(true);
    try {
      await apiPost('/learners/actions', {
        action: 'graduate',
        learnerId: learner.id,
        currentSemester: getCurrentSemester(),
        totalSemesters: getTotalSemesters(),
      });
      toast.success('Learner marked as graduated successfully!');
      window.location.reload();
    } catch (error: any) {
      logger.error('Error marking learner as graduated', error as Error);
      toast.error(`Failed to mark learner as graduated: ${error?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    actionLoading,
    getCurrentSemester,
    getTotalSemesters,
    needsVerification,
    canPromote,
    canGraduate,
    handleApprovalAction,
    handlePromotion,
    handleGraduation,
  };
};
