import { supabase } from '@/shared/api/supabaseClient';
import { uploadMultipleFiles } from '@/shared/api/fileUploadService';
import { getLogger } from '@/shared/config/logging';
import type {
    CollegeStudentAssignment,
    CollegeAssignmentStats,
    ServiceResponse,
    UploadedFile,
} from './collegeAssignmentTypes';

// Re-export types so existing imports from this path still work
export type { CollegeStudentAssignment, CollegeAssignmentStats } from './collegeAssignmentTypes';

const logger = getLogger('college-student-assignments');

/**
 * Fetch assignments for a college student
 */
export const fetchCollegeStudentAssignments = async (studentId: string): Promise<ServiceResponse<CollegeStudentAssignment[]>> => {
    try {
        logger.info('Fetching college assignments for student', { studentId });

        const { data: studentAssignments, error: saError } = await supabase
            .from('college_student_assignments')
            .select('*')
            .eq('student_id', studentId)
            .eq('is_deleted', false);

        if (saError) throw saError;
        if (!studentAssignments || studentAssignments.length === 0) {
            return { data: [], error: null };
        }

        const assignmentIds = studentAssignments.map(sa => sa.assignment_id);

        const { data: assignments, error: aError } = await supabase
            .from('college_assignments')
            .select('*')
            .in('assignment_id', assignmentIds)
            .eq('is_deleted', false);

        if (aError) throw aError;

        const combinedAssignments = studentAssignments.reduce<CollegeStudentAssignment[]>((acc, sa) => {
            const assignment = assignments?.find(a => a.assignment_id === sa.assignment_id);
            if (!assignment) return acc;

            acc.push({
                assignment_id: assignment.assignment_id,
                student_assignment_id: sa.student_assignment_id,
                title: assignment.title,
                description: assignment.description || '',
                instructions: assignment.instructions || '',
                course_name: assignment.course_name,
                course_code: assignment.course_code || '',
                educator_name: assignment.educator_name || '',
                total_points: assignment.total_points,
                assignment_type: assignment.assignment_type || 'assignment',
                skill_outcomes: assignment.skill_outcomes || [],
                due_date: assignment.due_date,
                available_from: assignment.available_from || '',
                allow_late_submission: assignment.allow_late_submission || false,
                document_pdf: assignment.document_pdf,
                instruction_files: assignment.instruction_files || [],
                created_date: assignment.created_date,
                status: sa.status,
                priority: sa.priority,
                grade_received: sa.grade_received,
                grade_percentage: sa.grade_percentage,
                instructor_feedback: sa.instructor_feedback,
                submission_date: sa.submission_date,
                submission_content: sa.submission_content,
                submission_url: sa.submission_url,
                submission_files: sa.submission_files,
                is_late: sa.is_late,
                program_name: '',
                department_name: '',
                semester: undefined,
                section: '',
                academic_year: ''
            });
            return acc;
        }, []);

        combinedAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        return { data: combinedAssignments, error: null };
    } catch (err: unknown) {
        logger.error('Error fetching college student assignments', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
        return { data: null, error: message };
    }
};

/**
 * Get assignment statistics for a college student
 */
export const getCollegeStudentAssignmentStats = async (studentId: string): Promise<ServiceResponse<CollegeAssignmentStats>> => {
    try {
        const { data, error } = await supabase
            .from('college_student_assignments')
            .select('status, grade_percentage')
            .eq('student_id', studentId)
            .eq('is_deleted', false);

        if (error) throw error;

        const assignments = data || [];
        const total = assignments.length;
        const todo = assignments.filter(a => a.status === 'todo').length;
        const inProgress = assignments.filter(a => a.status === 'in_progress').length;
        const submitted = assignments.filter(a => a.status === 'submitted').length;
        const graded = assignments.filter(a => a.status === 'graded').length;

        const gradedAssignments = assignments.filter(a => a.grade_percentage !== null);
        const averageGrade = gradedAssignments.length > 0
            ? gradedAssignments.reduce((sum, a) => sum + (a.grade_percentage || 0), 0) / gradedAssignments.length
            : 0;

        return {
            data: { total, todo, inProgress, submitted, graded, averageGrade: Math.round(averageGrade * 10) / 10 },
            error: null
        };
    } catch (err: unknown) {
        logger.error('Error fetching assignment stats', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Failed to fetch assignment statistics';
        return { data: null, error: message };
    }
};

/**
 * Update college student assignment status
 */
export const updateCollegeStudentAssignmentStatus = async (
    studentAssignmentId: string,
    newStatus: string
): Promise<ServiceResponse<boolean>> => {
    try {
        const updateData: Record<string, string> = {
            status: newStatus,
            updated_date: new Date().toISOString()
        };

        if (newStatus === 'in_progress') {
            updateData.started_date = new Date().toISOString();
        }
        if (newStatus === 'submitted') {
            updateData.submission_date = new Date().toISOString();
        }

        const { error } = await supabase
            .from('college_student_assignments')
            .update(updateData)
            .eq('student_assignment_id', studentAssignmentId);

        if (error) throw error;
        return { data: true, error: null };
    } catch (err: unknown) {
        logger.error('Error updating assignment status', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Failed to update assignment status';
        return { data: null, error: message };
    }
};

/**
 * Submit college assignment with files
 */
export const submitCollegeAssignment = async (
    studentAssignmentId: string,
    submissionData: {
        submission_content?: string;
        submission_url?: string;
    },
    submissionFiles?: File[]
): Promise<ServiceResponse<boolean>> => {
    try {
        const { data: assignment, error: assignmentError } = await supabase
            .from('college_student_assignments')
            .select('assignment_id, student_id')
            .eq('student_assignment_id', studentAssignmentId)
            .single();

        if (assignmentError) throw assignmentError;

        let uploadedFiles: UploadedFile[] = [];

        if (submissionFiles && submissionFiles.length > 0) {
            const folder = `college_assignment_submissions/${assignment.student_id}/${assignment.assignment_id}`;
            const results = await uploadMultipleFiles(submissionFiles, folder);

            uploadedFiles = results
                .map((result, index) => {
                    if (result.success && result.url) {
                        const file = submissionFiles[index];
                        return { name: file.name, url: result.url, size: file.size, type: file.type };
                    }
                    return null;
                })
                .filter((file): file is UploadedFile => file !== null);
        }

        const updateData = {
            ...submissionData,
            submission_files: uploadedFiles.length > 0 ? uploadedFiles : null,
            status: 'submitted' as const,
            submission_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        };

        const { error } = await supabase
            .from('college_student_assignments')
            .update(updateData)
            .eq('student_assignment_id', studentAssignmentId);

        if (error) throw error;
        return { data: true, error: null };
    } catch (err: unknown) {
        logger.error('Error submitting assignment', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Failed to submit assignment';
        return { data: null, error: message };
    }
};
