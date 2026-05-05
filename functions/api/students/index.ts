/**
 * Students API
 *
 * CRUD operations for student records.
 * All endpoints require SSO authentication. Data scoped by org_id.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/students — List students (for admins) or get own profile (for students)
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const studentId = url.searchParams.get('id');

  // If specific student requested
  if (studentId) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ student: data });
  }

  // If user is a student, return their own profile
  const isStudent = user.roles.some((r: string) =>
    ['student', 'school_student', 'college_student'].includes(r)
  );

  if (isStudent) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.sub)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ student: data });
  }

  // Admin: list students in their org
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const { data, error, count } = await supabase
    .from('students')
    .select('*', { count: 'exact' })
    .eq('org_id', user.org_id)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ students: data, total: count });
});

/**
 * POST /api/students — Create or update student record
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

  // Ensure org_id is set from the JWT (prevent cross-org writes)
  body.org_id = user.org_id;

  if (body.id) {
    // Update existing
    const { data, error } = await supabase
      .from('students')
      .update(body)
      .eq('id', body.id)
      .eq('org_id', user.org_id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ student: data });
  }

  // Create new
  body.user_id = body.user_id || user.sub;
  const { data, error } = await supabase
    .from('students')
    .insert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ student: data }, { status: 201 });
});
