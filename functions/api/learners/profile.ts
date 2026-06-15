/**
 * Learner Profile API
 *
 * GET /api/learners/profile - Fetch learner profile with all assessment-relevant fields
 * PUT /api/learners/profile - Update learner profile (institution, education info)
 *
 * This consolidated endpoint handles both read and write operations for learner profiles,
 * including learner type, grade, school/university info, and program details.
 */

import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/learners/profile
 * Fetch complete learner profile with all assessment-relevant fields
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const userId = url.searchParams.get('user_id') || user.sub;

  try {
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select(`
        id,
        user_id,
        grade,
        grade_start_date,
        school_class_id,
        school_id,
        university_college_id,
        program_id,
        course_name,
        branch_field,
        university,
        college_school_name,
        school_name,
        learner_type,
        school_classes:school_class_id(grade, academic_year),
        program:program_id(name, code),
        users!inner(role)
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching learner profile:', fetchError);
      return Response.json(
        { error: 'Failed to fetch learner profile', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!learner) {
      return Response.json(
        { error: 'Learner profile not found' },
        { status: 404 }
      );
    }

    const userRole = Array.isArray(learner.users) && learner.users.length > 0
      ? (learner.users[0] as any)?.role
      : (learner.users as any)?.role;

    return Response.json({
      success: true,
      learner: {
        ...learner,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Error fetching learner profile:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/learners/profile
 * Update learner profile with institution and educational information
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // Get learner by user_id
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select('id')
      .eq('user_id', user.sub)
      .single();

    if (fetchError || !learner) {
      return Response.json(
        { error: 'Learner profile not found' },
        { status: 404 }
      );
    }

    // Map frontend field names to database columns
    const updateData: Record<string, any> = {};

    if (body.schoolId !== undefined) updateData.school_id = body.schoolId;
    if (body.schoolClassId !== undefined) updateData.school_class_id = body.schoolClassId;
    if (body.universityId !== undefined) updateData.university_id = body.universityId;
    if (body.universityCollegeId !== undefined) updateData.university_college_id = body.universityCollegeId;
    if (body.programId !== undefined) updateData.program_id = body.programId;
    if (body.programSectionId !== undefined) updateData.program_section_id = body.programSectionId;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.gradeStartDate !== undefined) updateData.grade_start_date = body.gradeStartDate;
    if (body.semester !== undefined) updateData.semester = body.semester;
    if (body.section !== undefined) updateData.section = body.section;
    if (body.university !== undefined) updateData.university = body.university;
    if (body.college !== undefined) updateData.college_school_name = body.college;
    if (body.school_name !== undefined) updateData.school_name = body.school_name;
    if (body.branch !== undefined) {
      updateData.branch_field = body.branch;
      updateData.course_name = body.branch;
    }

    // Update learner profile
    const { data: updatedLearner, error: updateError } = await supabase
      .from('learners')
      .update(updateData)
      .eq('id', learner.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating learner profile:', updateError);
      return Response.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      learner: updatedLearner
    });
  } catch (error) {
    console.error('Error in profile endpoint:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
