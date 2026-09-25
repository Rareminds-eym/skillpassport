import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Certificates ──
      case 'insert-certificate': {
        const { data, error } = await supabase
          .from('certificates')
          .insert([params])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-enrollment-certificate': {
        const { learner_id, course_id, certificate_url } = params;
        if (!learner_id || !course_id || !certificate_url) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id, course_id, or certificate_url', context.request, { startTime });
        }
        const { error } = await supabase
          .from('course_enrollments')
          .update({ certificate_url })
          .eq('learner_id', learner_id)
          .eq('course_id', course_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Projects ──
      case 'insert-projects': {
        const { records } = params;
        if (!records || !Array.isArray(records) || records.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or empty records array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('projects')
          .insert(records)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Education ──
      case 'insert-education': {
        const { records } = params;
        if (!records || !Array.isArray(records) || records.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or empty records array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('education')
          .insert(records)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Skills ──
      case 'insert-skills': {
        const { records } = params;
        if (!records || !Array.isArray(records) || records.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or empty records array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('skills')
          .insert(records)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Achievements ──
      case 'insert-achievements': {
        const { records } = params;
        if (!records || !Array.isArray(records) || records.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or empty records array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('achievements')
          .insert(records)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Learners ──
      case 'update-learner': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-learner': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Badges ──
      case 'save-badges': {
        const { learner_id, metadata } = params;
        if (!learner_id || !metadata) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id or metadata', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('learners')
          .update({ metadata })
          .eq('id', learner_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Portfolio ──
      case 'get-portfolio-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners')
          .select(`
            *,
            school:organizations!learners_school_id_fkey (
              id, name, code, city, state, organization_type
            ),
            college:organizations!learners_college_id_fkey (
              id, name, code, city, state, organization_type
            ),
            universityInfo:organizations!learners_universityid_fkey (
              id, name, code, state, city, website, organization_type
            ),
            university_colleges:university_college_id (
              id, name, code,
              university:organizations!university_colleges_university_id_fkey (
                id, name, state, city, organization_type
              )
            )
          `)
          .eq('email', email)
          .maybeSingle();

        if (learnerError) return apiDbError(learnerError, context.request, { startTime });
        if (!learner) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });

        if (learner.school_id && !learner.school) {
          const { data: schoolData } = await supabase
            .from('organizations')
            .select('id, name, code, city, state, organization_type')
            .eq('id', learner.school_id)
            .single();
          if (schoolData) learner.school = schoolData;
        }

        if (learner.college_id && !learner.college) {
          const { data: collegeData } = await supabase
            .from('organizations')
            .select('id, name, code, city, state, organization_type')
            .eq('id', learner.college_id)
            .single();
          if (collegeData) learner.college = collegeData;
        }

        const userId = learner.id;

        const [
          skillsResult,
          trainingsResult,
          projectsResult,
          certificatesResult,
          educationResult,
          experienceResult,
          achievementsResult
        ] = await Promise.all([
          supabase.from('skills').select('*').eq('learner_id', userId).in('approval_status', ['verified', 'approved']).eq('enabled', true).order('created_at', { ascending: false }),
          supabase.from('trainings').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
          supabase.from('projects').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
          supabase.from('certificates').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('issued_on', { ascending: false }),
          supabase.from('education').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('year_of_passing', { ascending: false }),
          supabase.from('experience').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
          supabase.from('achievements').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('created_at', { ascending: false })
        ]);

        return apiSuccess({
          learner,
          skills: skillsResult.data || [],
          trainings: trainingsResult.data || [],
          projects: projectsResult.data || [],
          certificates: certificatesResult.data || [],
          education: educationResult.data || [],
          experience: experienceResult.data || [],
          achievements: achievementsResult.data || [],
        }, context.request, { startTime });
      }

      // ── Video Portfolio ──
      case 'get-videos': {
        const user = getContextUser(context);
        const { learnerId } = params;

        // If learnerId provided, verify access (must be own learner or admin)
        const targetLearnerId = learnerId || user.learnerId;
        if (!targetLearnerId) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        }

        // Query videos directly from video_portfolio table
        const { data: videos, error, count } = await supabase
          .from('video_portfolio')
          .select('*', { count: 'exact' })
          .eq('learner_id', targetLearnerId)
          .order('created_at', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        // Map database snake_case to camelCase for frontend
        const mappedVideos = (videos || []).map(video => ({
          id: video.id,
          learnerId: video.learner_id,
          title: video.title,
          description: video.description,
          tags: video.tags || [],
          videoUrl: video.video_url,
          thumbnailColor: video.thumbnail_color,
          thumbnailType: video.thumbnail_type,
          thumbnailValue: video.thumbnail_value,
          duration: video.duration,
          fileSizeBytes: video.file_size_bytes,
          mimeType: video.mime_type,
          trimStart: video.trim_start,
          trimEnd: video.trim_end,
          status: video.status,
          approvalStatus: video.approval_status,
          showOnPublic: video.show_on_public,
          reviewedBy: video.reviewed_by,
          reviewedAt: video.reviewed_at,
          rejectionReason: video.rejection_reason,
          createdAt: video.created_at,
          updatedAt: video.updated_at
        }));

        return apiSuccess({
          videos: mappedVideos,
          totalCount: count || 0,
          maxAllowed: 3
        }, context.request, { startTime });
      }

      case 'create-video': {
        const user = getContextUser(context);
        const {
          learnerId,
          title,
          description,
          tags,
          videoUrl,
          thumbnailColor,
          duration,
          fileSizeBytes,
          mimeType,
          trimStart,
          trimEnd,
          showOnPublic
        } = params;

        // Verify ownership
        if (!learnerId || !title || !videoUrl) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: learnerId, title, videoUrl', context.request, { startTime });
        }

        // Check quota (max 5 videos per learner)
        const { count, error: countError } = await supabase
          .from('video_portfolio')
          .select('*', { count: 'exact', head: true })
          .eq('learner_id', learnerId);

        if (countError) return apiDbError(countError, context.request, { startTime });

        if (count !== null && count >= 3) {
          return apiError(403, 'QUOTA_EXCEEDED', 'Maximum 3 videos allowed per learner', context.request, { startTime });
        }

        // Insert video
        const { data, error } = await supabase
          .from('video_portfolio')
          .insert([{
            learner_id: learnerId,
            title,
            description: description || null,
            tags: tags || [],
            video_url: videoUrl,
            thumbnail_color: thumbnailColor || '#2D3E5F',
            duration: duration || null,
            file_size_bytes: fileSizeBytes || null,
            mime_type: mimeType || 'video/mp4',
            trim_start: trimStart ?? 0,
            trim_end: trimEnd ?? 100,
            show_on_public: showOnPublic ?? false,
            status: 'DRAFT',
            approval_status: 'pending'
          }])
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({
          id: data.id,
          message: 'Video created successfully'
        }, context.request, { startTime });
      }

      case 'update-video': {
        const user = getContextUser(context);
        const {
          videoId,
          title,
          description,
          tags,
          thumbnailColor,
          thumbnailType,
          thumbnailValue,
          trimStart,
          trimEnd,
          showOnPublic,
          status,
          approvalStatus
        } = params;

        if (!videoId) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing videoId', context.request, { startTime });
        }

        // Get video to verify ownership
        const { data: video, error: fetchError } = await supabase
          .from('video_portfolio')
          .select('learner_id')
          .eq('id', videoId)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!video) return apiError(404, 'NOT_FOUND', 'Video not found', context.request, { startTime });

        // Build update object
        const updates: Record<string, any> = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (tags !== undefined) updates.tags = tags;
        if (thumbnailColor !== undefined) updates.thumbnail_color = thumbnailColor;
        if (thumbnailType !== undefined) updates.thumbnail_type = thumbnailType;
        if (thumbnailValue !== undefined) updates.thumbnail_value = thumbnailValue;
        if (trimStart !== undefined) updates.trim_start = trimStart;
        if (trimEnd !== undefined) updates.trim_end = trimEnd;
        if (showOnPublic !== undefined) updates.show_on_public = showOnPublic;
        if (status !== undefined) updates.status = status;
        if (approvalStatus !== undefined) updates.approval_status = approvalStatus;

        if (Object.keys(updates).length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'No fields to update', context.request, { startTime });
        }

        // Update video
        const { error } = await supabase
          .from('video_portfolio')
          .update(updates)
          .eq('id', videoId);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ message: 'Video updated successfully' }, context.request, { startTime });
      }

      case 'delete-video': {
        const user = getContextUser(context);
        const { videoId } = params;

        if (!videoId) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing videoId', context.request, { startTime });
        }

        // Get video to get R2 key and verify ownership
        const { data: video, error: fetchError } = await supabase
          .from('video_portfolio')
          .select('learner_id, video_url')
          .eq('id', videoId)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!video) return apiError(404, 'NOT_FOUND', 'Video not found', context.request, { startTime });

        // Delete from R2 first
        try {
          const { R2Client } = await import('../storage/utils/r2-client');
          const r2Client = new R2Client(env.R2_BUCKET as any, env);
          await r2Client.delete(video.video_url);
        } catch (r2Error: any) {
          console.error('Error deleting video from R2:', r2Error);
          // Continue with DB deletion even if R2 fails
        }

        // Delete from database
        const { error } = await supabase
          .from('video_portfolio')
          .delete()
          .eq('id', videoId);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ message: 'Video deleted successfully' }, context.request, { startTime });
      }

      case 'approve-video': {
        const user = getContextUser(context);
        const { videoId } = params;

        if (!videoId) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing videoId', context.request, { startTime });
        }

        // Update video approval status
        const { error } = await supabase
          .from('video_portfolio')
          .update({
            approval_status: 'approved',
            status: 'VERIFIED',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: null
          })
          .eq('id', videoId);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ message: 'Video approved successfully' }, context.request, { startTime });
      }

      case 'reject-video': {
        const user = getContextUser(context);
        const { videoId, rejectionReason } = params;

        if (!videoId || !rejectionReason) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing videoId or rejectionReason', context.request, { startTime });
        }

        // Update video approval status
        const { error } = await supabase
          .from('video_portfolio')
          .update({
            approval_status: 'rejected',
            status: 'REJECTED',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: rejectionReason
          })
          .eq('id', videoId);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ message: 'Video rejected successfully' }, context.request, { startTime });
      }

      case 'get-pending-videos': {
        const { limit = 50 } = params;

        // Use helper function to get pending videos
        const { data: videos, error } = await supabase
          .rpc('get_pending_video_portfolio', { limit_count: limit });

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({
          videos: videos || [],
          totalCount: videos?.length || 0
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[digital-portfolio POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
