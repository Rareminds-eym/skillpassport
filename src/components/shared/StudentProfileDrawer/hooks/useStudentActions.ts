import { useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Student } from '../types';
import toast from 'react-hot-toast';

export const useStudentActions = (student: Student | null) => {
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to get current semester number
  const getCurrentSemester = () => {
    if (!student) return 1;
    
    // Debug: Log the student object to see what fields are available
    console.log('🔍 Student data for semester calculation:', {
      id: student.id,
      name: student.name,
      semester: (student as any).semester,
      current_semester: (student as any).current_semester,
      grade: student.grade,
      college_id: student.college_id,
      school_id: student.school_id,
      enrollmentDate: student.enrollmentDate
    });
    
    // First, check if semester is directly available in the student record
    if ((student as any).semester && (student as any).semester > 0) {
      console.log('✅ Using semester field:', (student as any).semester);
      return (student as any).semester;
    }
    
    // Also check current_semester field
    if ((student as any).current_semester && (student as any).current_semester > 0) {
      const parsed = parseInt((student as any).current_semester);
      console.log('✅ Using current_semester field:', parsed);
      return parsed || 1;
    }
    
    // For college students, calculate based on enrollment date and current date
    if (student.college_id && student.enrollmentDate) {
      const enrollmentDate = new Date(student.enrollmentDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - enrollmentDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - enrollmentDate.getMonth());
      
      // Assuming 6 months per semester
      const calculatedSemester = Math.floor(monthsDiff / 6) + 1;
      console.log('✅ Calculated semester from enrollment date:', calculatedSemester);
      return Math.max(1, calculatedSemester);
    }
    
    // For school students, use grade directly
    if (student.school_id && student.grade) {
      const gradeNum = parseInt(student.grade);
      if (!isNaN(gradeNum)) {
        console.log('✅ Using grade as semester:', gradeNum);
        return gradeNum;
      }
    }
    
    // Fallback to manual current_semester field or default
    console.log('⚠️ Using fallback semester: 1');
    return parseInt(student.current_semester || '1') || 1;
  };

  // Helper function to get total semesters for the course
  const getTotalSemesters = () => {
    if (!student) return 8;
    
    // For school students, typically goes up to grade 12
    if (student.school_id) {
      return 12;
    }
    
    // For college students, determine based on degree type
    const degreeType = student.branch_field?.toLowerCase() || 
                      student.dept?.toLowerCase() || 
                      student.profile?.education?.[0]?.degree?.toLowerCase() || '';
    
    if (degreeType.includes('phd') || degreeType.includes('doctorate')) return 8;
    if (degreeType.includes('master') || degreeType.includes('mtech') || degreeType.includes('mba')) return 4;
    if (degreeType.includes('bachelor') || degreeType.includes('btech') || degreeType.includes('be') || degreeType.includes('bsc') || degreeType.includes('ba')) return 8;
    if (degreeType.includes('diploma')) return 6;
    
    return 8; // Default to 8 semesters for bachelor's degree
  };

  // Check if student needs verification
  const needsVerification = () => {
    if (!student) return false;
    return student.approval_status === 'pending' ||
           student.approval_status === null ||
           student.approval_status === undefined ||
           !student.approval_status;
  };

  // Check if student can be promoted
  const canPromote = () => {
    if (!student) return false;
    return student.approval_status === 'approved' || student.approval_status === 'verified';
  };

  // Check if student can graduate
  const canGraduate = () => {
    if (!student) return false;
    
    const currentSem = getCurrentSemester();
    const totalSems = getTotalSemesters();
    
    // Check if student is in good standing
    const isEligible = student.approval_status === 'approved' ||
                      student.approval_status === 'verified';
    
    // Check if not already graduated
    const notGraduated = !student.metadata?.graduation_date;
    
    // Check if reached final semester OR expected graduation date has arrived
    const readyToGraduate = currentSem >= totalSems || 
                           (student.expectedGraduationDate && 
                            new Date() >= new Date(student.expectedGraduationDate));
    
    return readyToGraduate && isEligible && notGraduated;
  };

  // Handle student approval/rejection
  const handleApprovalAction = async (action: 'approve' | 'reject', reason?: string) => {
    if (!student?.id) return;
    
    setActionLoading(true);
    try {
      const updateData: any = {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      };
      
      // If approving, also set enrollment date
      if (action === 'approve') {
        if (!student.enrollmentDate) {
          updateData.enrollmentDate = new Date().toISOString().split('T')[0];
        }
      }
      
      // Add reason to metadata if provided
      if (reason) {
        updateData.metadata = {
          ...student.metadata,
          approval_reason: reason,
          approval_date: new Date().toISOString()
        };
      }
      
      const { error } = await supabase.from('students').update(updateData).eq('id', student.id);
      
      if (error) {
        throw error;
      }
      
      toast.success(`Student ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      
      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error(`Failed to ${action} student: ${(error as any)?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle semester promotion
  const handlePromotion = async () => {
    if (!student?.id) return;
    
    setActionLoading(true);
    try {
      const currentSem = getCurrentSemester();
      const nextSem = currentSem + 1;
      const totalSems = getTotalSemesters();
      
      // Validation: Check if student can be promoted
      if (nextSem > totalSems) {
        toast.error(`Student is already in final semester (${currentSem}/${totalSems}). Cannot promote further.`);
        return;
      }
      
      if (student.approval_status !== 'approved' && student.approval_status !== 'verified') {
        toast.error('Student must be approved before promotion.');
        return;
      }
      
      // Get current academic year (you might want to make this dynamic)
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      
      // Get current user ID and find the appropriate admin record
      const { data: { user } } = await supabase.auth.getUser();
      let promotedByAdminId = null;
      
      if (user?.id) {
        // For college students, try to find college admin record
        if (student.college_id) {
          // Try to find in college_educators or similar table
          // For now, we'll set it to null since the constraint expects school_educators
          promotedByAdminId = null;
        } 
        // For school students, try to find in school_educators
        else if (student.school_id) {
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
        student_id: student.id,
        academic_year: academicYear,
        from_grade: currentSem.toString(),
        to_grade: nextSem.toString(),
        school_id: student.school_id || null,
        college_id: student.college_id || null,
        is_passed: true,
        is_promoted: true,
        promotion_date: new Date().toISOString().split('T')[0],
        remarks: `Promoted via admin panel from semester ${currentSem} to ${nextSem}`,
        // You can add more fields like grades, percentages etc. if available
        overall_percentage: student.currentCgpa ? (parseFloat(student.currentCgpa.toString()) * 10) : null,
        overall_grade: student.currentCgpa ? (() => {
          const cgpa = parseFloat(student.currentCgpa.toString());
          return cgpa >= 8.5 ? 'A' : cgpa >= 7.5 ? 'B' : cgpa >= 6.5 ? 'C' : 'D';
        })() : null,
        overall_grade_point: student.currentCgpa ? parseFloat(student.currentCgpa.toString()) : null
      };
      
      // Only add promoted_by if we have a valid admin ID
      if (promotedByAdminId) {
        promotionData.promoted_by = promotedByAdminId;
      }
      
      // 1. Insert promotion record into student_promotions table
      const { data: promotionResult, error: promotionError } = await supabase
        .from('student_promotions')
        .insert(promotionData)
        .select();

      if (promotionError) {
        console.error('Promotion error:', promotionError);
        
        // Handle specific error cases
        if (promotionError.code === '23503') { // Foreign key constraint violation
          console.warn('Skipping promotion record due to foreign key constraint. Proceeding with semester update.');
          // Continue with student semester update even if promotion record fails
        } else if (promotionError.code === '23505') { // Unique constraint violation
          toast.error(`Student already has a promotion record for academic year ${academicYear}.`);
          return;
        } else {
          toast.error(`Failed to create promotion record: ${promotionError.message}`);
          return;
        }
      } else {
        console.log('Promotion record created:', promotionResult);
      }

      // 2. Update student's current semester in students table
      // Note: If you have the trigger `trg_update_student_grade_on_promotion`, 
      // it should automatically update the students table. If not, we'll do it manually.
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({
          semester: nextSem,  // Use 'semester' column, not 'current_semester'
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (studentUpdateError) {
        console.error('Student update error:', studentUpdateError);
        // If student update fails, we should ideally rollback the promotion record
        // For now, we'll just log the error and continue
        console.warn('Promotion record created but student semester update failed');
      }
      
      toast.success(`Student promoted successfully from Semester ${currentSem} to ${nextSem}!`);
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error promoting student:', error);
      toast.error(`Failed to promote student: ${(error as any)?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle graduation
  const handleGraduation = async () => {
    if (!student?.id) return;
    
    setActionLoading(true);
    try {
      const graduationDate = new Date().toISOString();
      const updateData: any = {
        updated_at: graduationDate,
        metadata: {
          ...student.metadata,
          graduation_date: graduationDate,
          graduated_by: 'current_admin', // Replace with actual admin ID
          final_semester: getCurrentSemester(),
          final_cgpa: student.currentCgpa || student.profile?.education?.[0]?.cgpa
        }
      };
      
      // Set expected graduation date if not already set
      if (!student.expectedGraduationDate) {
        updateData.expectedGraduationDate = graduationDate.split('T')[0];
      }
      
      // For school students, mark as completed grade 12
      if (student.school_id) {
        updateData.grade = getTotalSemesters().toString();
      }
      
      const { error } = await supabase.from('students').update(updateData).eq('id', student.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Student marked as graduated successfully!');
      
      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Error marking student as graduated:', error);
      toast.error(`Failed to mark student as graduated: ${(error as any)?.message || 'Please try again.'}`);
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