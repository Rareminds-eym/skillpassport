import { supabase } from '@/shared/api/supabaseClient';
import { uploadMultipleFiles } from '@/shared/api/fileUploadService';
import { getLogger } from '@/shared/config/logging';
import type {
    CollegeStudentAssignment,
    CollegeAssignmentStats,
    ServiceResponse,
    UploadedFile,
    StudentAssignmentStatus,
} from './collegeAssignmentTypes';

// Re-export types so existing imports from this path still work
export type { CollegeStudentAssignment, CollegeAssignmentStats } from './collegeAssignmentTypes';

const logger = getLogger('college-student-assignments');

/**
 * Fetch assignments for a college student (optimized with join)
 */
export const fetchCollegeStudentAssignments = async (studentId: string): Promise<ServiceResponse<CollegeStudentAssignment[]>> => {
    try {
        logger.info('Fetching college assignments for student', { studentId });

        // Use a single joined query instead of N+1 pattern
        const { data, error } = await supabase
            .from('college_student_assignments')
            .select(`
                *,
                college_assignments!inner(
                    assignment_id,
                    title,
                    description,
                    instructions,
                    course_name,
                    course_code,
                    educator_name,
                    total_points,
                    assignment_type,
                    skill_outcomes,
                    due_date,
                    available_from,
                    allow_late_submission,
                    document_pdf,
                    instruction_files,
                    created_date,
                    is_deleted
                )
            `)
            .eq('student_id', studentId)
            .eq('is_deleted', false);

        if (error) throw error;
        if (!data || data.length === 0) {
            return { data: [], error: null };
        }

        // Filter out soft-deleted assignments (PostgREST join filter may not work)
        const validData = data.filter(row => {
            const assignment = row.college_assignments;
            return assignment && !assignment.is_deleted;
        });

        const combinedAssignments = validData.map((row): CollegeStudentAssignment => {
            const assignment = row.college_assignments;

            // Type guard: ensure assignment is an object, not an array
            if (!assignment || typeof assignment !== 'object' || Array.isArray(assignment)) {
                throw new Error('Invalid assignment data structure from join');
            }

            return {
                assignment_id: assignment.assignment_id as string,
                student_assignment_id: row.student_assignment_id,
                title: assignment.title as string,
                description: (assignment.description as string) || '',
                instructions: (assignment.instructions as string) || '',
                course_name: assignment.course_name as string,
                course_code: (assignment.course_code as string) || '',
                educator_name: (assignment.educator_name as string) || '',
                total_points: assignment.total_points as number,
                assignment_type: (assignment.assignment_type as string) || 'assignment',
                skill_outcomes: (assignment.skill_outcomes as string[]) || [],
                due_date: assignment.due_date as string,
                available_from: (assignment.available_from as string) || '',
                allow_late_submission: (assignment.allow_late_submission as boolean) || false,
                document_pdf: assignment.document_pdf as string | undefined,
                instruction_files: (assignment.instruction_files as Array<{ name: string; url: string; size: number; type: string }>) || [],
                created_date: assignment.created_date as string,
                status: row.status,
                priority: row.priority,
                grade_received: row.grade_received,
                grade_percentage: row.grade_percentage,
                instructor_feedback: row.instructor_feedback,
                submission_date: row.submission_date,
                submission_content: row.submission_content,
                submission_url: row.submission_url,
                submission_files: row.submission_files,
                is_late: row.is_late,
                program_name: '',
                department_name: '',
                semester: undefined,
                section: '',
                academic_year: ''
            };
        });

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
    newStatus: StudentAssignmentStatus
): Promise<ServiceResponse<boolean>> => {
    try {
        // First, fetch the current assignment to check existing submission_date
        const { data: currentAssignment, error: fetchError } = await supabase
            .from('college_student_assignments')
            .select('submission_date')
            .eq('student_assignment_id', studentAssignmentId)
            .single();

        if (fetchError) throw fetchError;

        const updateData: Record<string, string> = {
            status: newStatus,
            updated_date: new Date().toISOString()
        };

        if (newStatus === 'in_progress') {
            updateData.started_date = new Date().toISOString();
        }

        // Only set submission_date if it's not already set (preserve original submission)
        if (newStatus === 'submitted' && !currentAssignment?.submission_date) {
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
 * Submit college assignment with files (with improved error handling)
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

        // Upload files first, but don't commit to DB yet
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

        // Now update the DB record - if this fails, files are orphaned but logged
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

        if (error) {
            // Log orphaned files for cleanup
            if (uploadedFiles.length > 0) {
                logger.error('DB update failed after file upload - orphaned files', undefined, {
                    studentAssignmentId,
                    orphanedFiles: uploadedFiles.map(f => f.url)
                });
            }
            throw error;
        }
        return { data: true, error: null };
    } catch (err: unknown) {
        logger.error('Error submitting assignment', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Failed to submit assignment';
        return { data: null, error: message };
    }
};
