/**
 * College Admin - Admissions & Learner Admissions API
 * GET: Fetch admissions (original table)
 * POST: Action-based dispatch for learner_admissions CRUD + workflows
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { PagesEnv } from '../../lib/types';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as unknown as PagesEnv;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('admissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ admissions: data, total: count }, context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as unknown as PagesEnv;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  const startTime = Date.now();

  try {
    // If no action, treat as direct upsert on admissions table (original behavior)
    if (!action) {
      const { data, error } = await supabase.from('admissions').upsert(params).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ admission: data }, context.request);
    }

    switch (action) {
      case 'create-application': {
        // Create learner via SSO (creates user account + sends invitation)
        const { email, name, organization_id, contact_number, enrollment_number, program_id, metadata } = params;
        
        if (!email || !name || !organization_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: email, name, organization_id', context.request, { startTime });
        }
        
        // Call SSO to create learner user
        const ssoResult = await env.SSO_SERVICE.createLearnerUser({
          email,
          name,
          organization_id,
          contact_number,
          enrollment_number,
          program_id,
          metadata
        });
        
        if (!ssoResult.success) {
          return apiError(500, 'SSO_ERROR', ssoResult.error || 'Failed to create learner user', context.request, { startTime });
        }
        
        console.log(`[admissions] Created learner user ${ssoResult.user_id} via SSO`);
        
        // User will be synced to learners table via auth-db-sync-queue
        // Invitation email will be sent via learner-email-queue
        
        return apiSuccess({
          user_id: ssoResult.user_id,
          email,
          message: 'Learner created successfully. Invitation email will be sent shortly.',
          temp_password: ssoResult.temp_password // Return temp password for admin reference
        }, context.request, { startTime });
      }

      case 'verify-documents': {
        const { id, document_ids } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data: admission, error: fetchError } = await supabase.from('learner_admissions').select('documents').eq('id', id).single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const updatedDocuments = (admission.documents || []).map((doc: any) => {
          if (document_ids?.includes(doc.id)) {
            return { ...doc, verified: true, verified_at: new Date().toISOString() };
          }
          return doc;
        });
        const { error: updateError } = await supabase.from('learner_admissions').update({ documents: updatedDocuments, status: 'verified' }).eq('id', id);
        if (updateError) return apiDbError(updateError, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'approve-admission': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('learner_admissions').update({ status: 'approved' }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'generate-roll-number': {
        const { program_id, year } = params;
        if (!program_id) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });
        const { data: program, error: programError } = await supabase.from('programs').select('code').eq('id', program_id).single();
        if (programError) return apiDbError(programError, context.request, { startTime });
        const { count } = await supabase.from('learner_admissions').select('*', { count: 'exact', head: true }).eq('program_id', program_id).like('roll_number', `${year}${program.code}%`);
        const sequence = String((count || 0) + 1).padStart(4, '0');
        const rollNumber = `${year}${program.code}${sequence}`;
        const { data: existing } = await supabase.from('learner_admissions').select('id').eq('roll_number', rollNumber).single();
        if (existing) {
          return apiError(409, 'DUPLICATE', 'Generated roll number already exists', context.request, { startTime });
        }
        return apiSuccess({ roll_number: rollNumber }, context.request, { startTime });
      }

      case 'enroll-learner': {
        const { id, roll_number } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('learner_admissions').update({ status: 'enrolled', roll_number, current_semester: 1 }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'promote-semester': {
        const { learner_ids } = params;
        if (!learner_ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_ids', context.request, { startTime });
        const success: string[] = [];
        const failed: string[] = [];
        for (const learnerId of learner_ids) {
          const { data: learner, error: fetchError } = await supabase.from('learner_admissions').select('current_semester, program_id').eq('id', learnerId).single();
          if (fetchError) { failed.push(learnerId); continue; }
          const { error: updateError } = await supabase.from('learner_admissions').update({ current_semester: (learner.current_semester || 1) + 1 }).eq('id', learnerId);
          if (updateError) { failed.push(learnerId); } else { success.push(learnerId); }
        }
        return apiSuccess({ success, failed }, context.request, { startTime });
      }

      case 'check-graduation': {
        const { learner_id } = params;
        const { data: learner, error: fetchError } = await supabase.from('learner_admissions').select('current_semester, cgpa, program_id').eq('id', learner_id).single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const { data: program } = await supabase.from('programs').select('duration_semesters, total_credits_required').eq('id', learner.program_id).single();
        if (!program) return apiSuccess({ eligible: false, reason: 'Program not found' }, context.request, { startTime });
        if (learner.current_semester < program.duration_semesters) {
          return apiSuccess({ eligible: false, reason: `Not completed all semesters (${learner.current_semester}/${program.duration_semesters})` }, context.request, { startTime });
        }
        if (learner.cgpa < 5.0) {
          return apiSuccess({ eligible: false, reason: `CGPA below minimum (${learner.cgpa}/10.0)` }, context.request, { startTime });
        }
        return apiSuccess({ eligible: true }, context.request, { startTime });
      }

      case 'mark-graduated': {
        const { learner_ids } = params;
        if (!learner_ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_ids', context.request, { startTime });
        const { error } = await supabase.from('learner_admissions').update({ status: 'graduated' }).in('id', learner_ids);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'update-cgpa': {
        const { learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        const { data: marks, error: marksError } = await supabase.from('mark_entries').select('grade').eq('learner_id', learner_id).eq('is_locked', true).not('grade', 'is', null);
        if (marksError) return apiDbError(marksError, context.request, { startTime });
        const gradePoints: Record<string, number> = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
        const totalPoints = (marks || []).reduce((sum: number, e: any) => sum + (gradePoints[e.grade] || 0), 0);
        const cgpa = marks && marks.length > 0 ? Math.round((totalPoints / marks.length) * 100) / 100 : 0;
        const { error: updateError } = await supabase.from('learners').update({ currentCgpa: cgpa }).eq('id', learner_id);
        if (updateError) return apiDbError(updateError, context.request, { startTime });
        return apiSuccess({ cgpa }, context.request, { startTime });
      }

      case 'get-admissions': {
        let query = supabase.from('learner_admissions').select('*');
        if (params.program_id) query = query.eq('program_id', params.program_id);
        if (params.department_id) query = query.eq('department_id', params.department_id);
        if (params.status) query = query.eq('status', params.status);
        if (params.search) query = query.or(`application_number.ilike.%${params.search}%,roll_number.ilike.%${params.search}%`);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'bulk-upload-csv': {
        // Bulk CSV upload - queues processing job via SSO RPC
        const { csv_data, organization_id } = params;
        
        if (!csv_data || !organization_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: csv_data, organization_id', context.request, { startTime });
        }
        
        console.log(`[admissions] Starting bulk upload for org ${organization_id}`);
        
        // Call SSO Worker RPC to queue bulk upload
        if (!env.SSO_SERVICE) {
          return apiError(500, 'SSO_ERROR', 'SSO_SERVICE not configured', context.request, { startTime });
        }
        
        const result = await env.SSO_SERVICE.queueBulkLearnerUpload({
          csv_data,
          organization_id,
          admin_id: user.id
        });
        
        if (!result.success) {
          return apiError(500, 'QUEUE_ERROR', result.error || 'Failed to queue bulk upload', context.request, { startTime });
        }
        
        console.log(`[admissions] Queued bulk upload batch ${result.batch_id}`);
        
        return apiSuccess({
          batch_id: result.batch_id,
          status: 'processing',
          message: 'CSV upload queued for processing. Use batch_id to check progress.'
        }, context.request, { startTime });
      }

      case 'bulk-upload-status': {
        const { batch_id } = params;
        if (!batch_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing batch_id', context.request, { startTime });
        }
        
        const metadata = await env.SSO_SERVICE.getBulkUploadStatus(batch_id);
        
        if (!metadata || metadata.status === 'pending') {
          return apiSuccess({
            batch_id,
            status: 'pending',
            total_rows: 0, processed_rows: 0,
            success_count: 0, failed_count: 0, pending_count: 0,
            progress_percentage: 0, errors_count: 0
          }, context.request, { startTime });
        }
        
        return apiSuccess({
          batch_id: metadata.batch_id,
          status: metadata.status,
          total_rows: metadata.total_rows,
          processed_rows: metadata.processed_rows,
          success_count: metadata.success_count,
          failed_count: metadata.failed_count,
          pending_count: metadata.total_rows - metadata.processed_rows,
          progress_percentage: metadata.total_rows > 0
            ? Math.round((metadata.processed_rows / metadata.total_rows) * 100) : 0,
          created_at: metadata.created_at,
          completed_at: metadata.completed_at,
          errors_count: metadata.errors?.length || 0
        }, context.request, { startTime });
      }

      case 'bulk-upload-errors': {
        const { batch_id } = params;
        if (!batch_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing batch_id', context.request, { startTime });
        }
        
        const metadata = await env.SSO_SERVICE.getBulkUploadStatus(batch_id);
        if (!metadata) {
          return apiError(404, 'NOT_FOUND', `Batch ${batch_id} not found`, context.request, { startTime });
        }
        
        return apiSuccess({
          batch_id: metadata.batch_id,
          errors: metadata.errors,
          total_errors: metadata.errors.length
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[admissions POST] action=${action || 'upsert'}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
