import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/shared/api/apiClient';
import { Learner } from '@/features/learner-profile/model';
import toast from 'react-hot-toast';
import { isCollegeLearner as checkIsCollegeLearner, isSchoolLearner as checkIsSchoolLearner } from '@/entities/learner/lib/learnerType';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';

const logger = getLogger('learner-actions');

/**
 * Hook providing learner management actions such as approval, promotion, and graduation.
 *
 * @param learner - The learner record to act upon. Pass null when no learner is selected.
 * @param onRefresh - Optional callback invoked after a successful action to trigger a data refresh in the parent component.
 */
export const useLearnerActions = (learner: Learner | null, onRefresh?: () => void) => {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to calculate academic year from admission year and current semester
  const calculateAcademicYear = (admissionYear: string, currentSemester: number): string => {
    try {
      // Every 2 semesters = 1 academic year progression
      const yearsProgressed = Math.floor((currentSemester - 1) / 2);
      const [startYear] = admissionYear.split('-');
      const newStartYear = parseInt(startYear) + yearsProgressed;
      return `${newStartYear}-${(newStartYear + 1).toString().slice(-2)}`;
    } catch (error) {
      logger.error('Error calculating academic year', error as Error);
      // Fallback to current year calculation
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    }
  };

  // Helper function to get current semester number
  const getCurrentSemester = () => {
    if (!learner) return 1;

    // First, check if semester is directly available in the learner record
    if ((learner as any).semester && (learner as any).semester > 0) {
      return (learner as any).semester;
    }

    // Also check current_semester field
    if ((learner as any).current_semester && (learner as any).current_semester > 0) {
      const parsed = parseInt((learner as any).current_semester);
      return parsed || 1;
    }

    // For college learners, calculate based on enrollment date and current date
    if (checkIsCollegeLearner(learner) && learner.enrollmentDate) {
      const enrollmentDate = new Date(learner.enrollmentDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - enrollmentDate.getFullYear()) * 12 +
        (currentDate.getMonth() - enrollmentDate.getMonth());

      // Assuming 6 months per semester
      const calculatedSemester = Math.floor(monthsDiff / 6) + 1;
      return Math.max(1, calculatedSemester);
    }

    // For school learners, use grade directly
    if (checkIsSchoolLearner(learner) && learner.grade) {
      const gradeNum = parseInt(learner.grade);
      if (!isNaN(gradeNum)) {
        return gradeNum;
      }
    }

    // Fallback to manual current_semester field or default
    return parseInt(learner.current_semester || '1') || 1;
  };

  // Helper function to get total semesters for the course
  const getTotalSemesters = () => {
    if (!learner) return 8;

    // For school learners, typically goes up to grade 12
    if (checkIsSchoolLearner(learner)) {
      return 12;
    }

    // For college learners, determine based on degree type
    const degreeType = learner.branch_field?.toLowerCase() ||
      learner.dept?.toLowerCase() ||
      learner.profile?.education?.[0]?.degree?.toLowerCase() || '';

    if (degreeType.includes('phd') || degreeType.includes('doctorate')) return 8;
    if (degreeType.includes('master') || degreeType.includes('mtech') || degreeType.includes('mba')) return 4;
    if (degreeType.includes('bachelor') || degreeType.includes('btech') || degreeType.includes('be') || degreeType.includes('bsc') || degreeType.includes('ba')) return 8;
    if (degreeType.includes('diploma')) return 6;

    return 8; // Default to 8 semesters for bachelor's degree
  };

  // Check if learner needs verification
  const needsVerification = () => {
    if (!learner) return false;
    return learner.approval_status === 'pending' ||
      learner.approval_status === null ||
      learner.approval_status === undefined ||
      !learner.approval_status;
  };

  // Check if learner can be promoted
  const canPromote = () => {
    if (!learner) return false;
    return learner.approval_status === 'approved' || learner.approval_status === 'verified';
  };

  // Check if learner can graduate
  const canGraduate = () => {
    if (!learner) return false;

    const currentSem = getCurrentSemester();
    const totalSems = getTotalSemesters();

    // Check if learner is in good standing
    const isEligible = learner.approval_status === 'approved' ||
      learner.approval_status === 'verified';

    // Check if not already graduated
    const notGraduated = !learner.metadata?.graduation_date;

    // Check if reached final semester OR expected graduation date has arrived
    const readyToGraduate = currentSem >= totalSems ||
      (learner.expectedGraduationDate &&
        new Date() >= new Date(learner.expectedGraduationDate));

    return readyToGraduate && isEligible && notGraduated;
  };

  // Handle learner approval/rejection
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
      queryClient.invalidateQueries({ queryKey: ['learners'] });
      onRefresh?.();
    } catch (error: any) {
      logger.error('Error updating learner status', error as Error);
      toast.error(`Failed to ${action} learner: ${error?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle semester promotion
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
      await apiPost('/learners/actions', {
        action: 'promote',
        learnerId: learner.id,
        currentSemester: currentSem,
        totalSemesters: totalSems,
        academicYear: learner.admission_academic_year
          ? calculateAcademicYear(learner.admission_academic_year, currentSem)
          : undefined,
        promotedBy: user?.id,
        remarks: `Promoted via admin panel from semester ${currentSem} to ${nextSem}`,
        overallPercentage: learner.currentCgpa ? parseFloat(learner.currentCgpa.toString()) * 10 : undefined,
        overallGrade: learner.currentCgpa ? (() => {
          const cgpa = parseFloat(learner.currentCgpa.toString());
          return cgpa >= 8.5 ? 'A' : cgpa >= 7.5 ? 'B' : cgpa >= 6.5 ? 'C' : 'D';
        })() : undefined,
        overallGradePoint: learner.currentCgpa ? parseFloat(learner.currentCgpa.toString()) : undefined,
      });

      toast.success(`Learner promoted successfully from Semester ${currentSem} to ${nextSem}!`);
      queryClient.invalidateQueries({ queryKey: ['learners'] });
      onRefresh?.();
    } catch (error: any) {
      logger.error('Error promoting learner', error as Error);
      toast.error(`Failed to promote learner: ${error?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle graduation
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
      queryClient.invalidateQueries({ queryKey: ['learners'] });
      onRefresh?.();
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
    handleGraduation
  };
};