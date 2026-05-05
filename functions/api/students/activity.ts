/**
 * Student Activity API
 *
 * Handles education, training, experience, and skills data for students.
 * All endpoints require SSO authentication.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/students/activity — Get student activity data
 * Query params: type (education|training|experience|skills), student_id
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');
  const studentId = url.searchParams.get('student_id') || user.sub;

  if (!type) {
    return Response.json({ error: 'type query param is required (education|training|experience|skills)' }, { status: 400 });
  }

  const tableMap: Record<string, string> = {
    education: 'student_education',
    training: 'student_training',
    experience: 'student_experience',
    skills: 'student_skills',
  };

  const table = tableMap[type];
  if (!table) {
    return Response.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
});

/**
 * POST /api/students/activity — Create/update activity record
 * Body: { type, ...record }
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, ...record } = body;

  const tableMap: Record<string, string> = {
    education: 'student_education',
    training: 'student_training',
    experience: 'student_experience',
    skills: 'student_skills',
  };

  const table = tableMap[type];
  if (!table) {
    return Response.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }

  // Set student_id from JWT if not provided
  if (!record.student_id) {
    record.student_id = user.sub;
  }

  if (record.id) {
    // Update
    const { data, error } = await supabase
      .from(table)
      .update(record)
      .eq('id', record.id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  // Create
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
});
