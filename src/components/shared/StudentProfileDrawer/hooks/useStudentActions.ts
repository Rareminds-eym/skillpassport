import { useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Student } from '../types';
import toast from 'react-hot-toast';

export const useStudentActions = (student: Student | null) => {
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to get current semester number
  const getCurrentSemester = () => {
    if (!student) return 1;
    
    // For college students, calculate based on enrollment date and current date
    if (student.college_id && student.enrollmentDate) {
      const enrollmentDate = new Date(student.enrollmentDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - enrollmentDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - enrollmentDate.getMonth());
      
      // Assuming 6 months per semester
      const calculatedSemester = Math.floor(monthsDiff / 6) + 1;
      return Math.max(1, calculatedSemester);
    }
    
    // For school students, use grade directly
    if (student.school_id && student.grade) {
      const gradeNum = parseInt(student.grade);
      if (!isNaN(gradeNum)) {
        return gradeNum;
      }
    }
    
    // Fallback to manual current_semester field or default
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
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Student promoted successfully!');
      
    } catch (error) {
      console.error('Error promoting student:', error);
      toast.error('Failed to promote student. Please try again.');
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