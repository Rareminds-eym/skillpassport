import { useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { Learner } from '@/features/learner-profile/model';
import toast from 'react-hot-toast';
import { isCollegeLearner as checkIsCollegeLearner, isSchoolLearner as checkIsSchoolLearner } from '@/entities/learner/lib/learnerType';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-actions');

export const useLearnerActions = (learner: Learner | null) => {
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
      const updateData: any = {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      };

      // If approving, also set enrollment date
      if (action === 'approve') {
        if (!learner.enrollmentDate) {
          updateData.enrollmentDate = new Date().toISOString().split('T')[0];
        }
      }

      // Add reason to metadata if provided
      if (reason) {
        updateData.metadata = {
          ...learner.metadata,
          approval_reason: reason,
          approval_date: new Date().toISOString()
        };
      }

      const { error } = await supabase.from('learners').update(updateData).eq('id', learner.id);

      if (error) {
        throw error;
      }

      toast.success(`Learner ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      logger.error('Error updating learner status', error as Error);
      toast.error(`Failed to ${action} learner: ${(error as any)?.message || 'Please try again.'}`);
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

      // Validation: Check if learner can be promoted
      if (nextSem > totalSems) {
        toast.error(`Learner is already in final semester (${currentSem}/${totalSems}). Cannot promote further.`);
        return;
      }

      if (learner.approval_status !== 'approved' && learner.approval_status !== 'verified') {
        toast.error('Learner must be approved before promotion.');
        return;
      }

      // Calculate academic year from admission year and current semester
      const academicYear = learner.admission_academic_year
        ? calculateAcademicYear(learner.admission_academic_year, currentSem)
        : `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`; // Fallback

      // Get current user ID and find the appropriate admin record
      const user = useAuthStore.getState().user;
      let promotedByAdminId = null;

      if (user?.id) {
        // For college learners, try to find college admin record
        if (learner.college_id) {
          // Try to find in college_educators or similar table
          // For now, we'll set it to null since the constraint expects school_educators
          promotedByAdminId = null;
        }
        // For school learners, try to find in school_educators
        else if (learner.school_id) {
          const { data: educator } = await supabase
            .from('school_educators')
            .select('id')
            .eq('user_id', user.id)
            .single();

          promotedByAdminId = educator?.id || null;
        }
      }

      // Prepare promotion data - exclude promoted_by if it's null to avoid foreign key constraint
      const promotionData: any = {
        learner_id: learner.id,
        academic_year: academicYear,
        from_grade: currentSem.toString(),
        to_grade: nextSem.toString(),
        school_id: learner.school_id || null,
        college_id: learner.college_id || null,
        is_passed: true,
        is_promoted: true,
        promotion_date: new Date().toISOString().split('T')[0],
        remarks: `Promoted via admin panel from semester ${currentSem} to ${nextSem} for academic year ${academicYear}`,
        // You can add more fields like grades, percentages etc. if available
        overall_percentage: learner.currentCgpa ? (parseFloat(learner.currentCgpa.toString()) * 10) : null,
        overall_grade: learner.currentCgpa ? (() => {
          const cgpa = parseFloat(learner.currentCgpa.toString());
          return cgpa >= 8.5 ? 'A' : cgpa >= 7.5 ? 'B' : cgpa >= 6.5 ? 'C' : 'D';
        })() : null,
        overall_grade_point: learner.currentCgpa ? parseFloat(learner.currentCgpa.toString()) : null
      };

      // Only add promoted_by if we have a valid admin ID
      if (promotedByAdminId) {
        promotionData.promoted_by = promotedByAdminId;
      }

      // 1. Insert promotion record into learner_promotions table
      const { data: promotionResult, error: promotionError } = await supabase
        .from('learner_promotions')
        .insert(promotionData)
        .select();

      if (promotionError) {
        // Handle specific error cases
        if (promotionError.code === '23503') { // Foreign key constraint violation
          // Continue with learner semester update even if promotion record fails
        } else if (promotionError.code === '23505') { // Unique constraint violation
          toast.error(`Learner already has a promotion record for academic year ${academicYear}.`);
          return;
        } else {
          toast.error(`Failed to create promotion record: ${promotionError.message}`);
          return;
        }
      } else {
        logger.info('Promotion record created', { promotionResult });
      }

      // 2. Update learner's current semester in learners table
      // Note: If you have the trigger `trg_update_learner_grade_on_promotion`, 
      // it should automatically update the learners table. If not, we'll do it manually.
      const { error: learnerUpdateError } = await supabase
        .from('learners')
        .update({
          semester: nextSem,  // Use 'semester' column, not 'current_semester'
          updated_at: new Date().toISOString()
        })
        .eq('id', learner.id);

      if (learnerUpdateError) {
        logger.error('Learner update error', learnerUpdateError);
        // If learner update fails, we should ideally rollback the promotion record
        // For now, we'll just log the error and continue
      }

      toast.success(`Learner promoted successfully from Semester ${currentSem} to ${nextSem}!`);

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      logger.error('Error promoting learner', error as Error);
      toast.error(`Failed to promote learner: ${(error as any)?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle graduation
  const handleGraduation = async () => {
    if (!learner?.id) return;

    setActionLoading(true);
    try {
      const graduationDate = new Date().toISOString();
      const updateData: any = {
        updated_at: graduationDate,
        metadata: {
          ...learner.metadata,
          graduation_date: graduationDate,
          graduated_by: 'current_admin', // Replace with actual admin ID
          final_semester: getCurrentSemester(),
          final_cgpa: learner.currentCgpa || learner.profile?.education?.[0]?.cgpa
        }
      };

      // Set expected graduation date if not already set
      if (!learner.expectedGraduationDate) {
        updateData.expectedGraduationDate = graduationDate.split('T')[0];
      }

      // For school learners, mark as completed grade 12
      if (learner.school_id) {
        updateData.grade = getTotalSemesters().toString();
      }

      const { error } = await supabase.from('learners').update(updateData).eq('id', learner.id);

      if (error) {
        throw error;
      }

      toast.success('Learner marked as graduated successfully!');

      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      logger.error('Error marking learner as graduated', error as Error);
      toast.error(`Failed to mark learner as graduated: ${(error as any)?.message || 'Please try again.'}`);
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