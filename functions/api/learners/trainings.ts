import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('learner-trainings-api');

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = getContextUser(context);

  try {
    const url = new URL(context.request.url);
    let learnerId = url.searchParams.get('learner_id') || null;

    if (!learnerId) {
      const { data: learnerByUser } = await supabase
        .from('learners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!learnerByUser) {
        return apiError(404, 'NOT_FOUND', 'No learner found', context.request, { startTime });
      }
      learnerId = learnerByUser.id;
    }

    const { data: trainings, error: trainError } = await supabase
      .from('trainings')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('enabled', true)
      .in('approval_status', ['verified', 'approved'])
      .order('created_at', { ascending: false });

    if (trainError) {
      return apiError(500, 'INTERNAL_ERROR', trainError.message, context.request, { startTime });
    }

    const trainingIds = (trainings || []).map(t => t.id);

    let skillMap: Record<string, any[]> = {};
    let certMap: Record<string, any[]> = {};

    if (trainingIds.length > 0) {
      const [skillsResult, certsResult] = await Promise.all([
        supabase.from('skills').select('*').in('training_id', trainingIds).eq('enabled', true),
        supabase.from('certificates').select('*').in('training_id', trainingIds).eq('enabled', true),
      ]);

      if (skillsResult.error) logger.error('Skills query error', { error: skillsResult.error });
      if (certsResult.error) logger.error('Certificates query error', { error: certsResult.error });

      for (const skill of (skillsResult.data || [])) {
        if (!skillMap[skill.training_id]) skillMap[skill.training_id] = [];
        skillMap[skill.training_id].push(skill);
      }
      for (const cert of (certsResult.data || [])) {
        if (!certMap[cert.training_id]) certMap[cert.training_id] = [];
        certMap[cert.training_id].push(cert);
      }
    }

    const result = (trainings || []).map(t => ({
      ...t,
      skills: skillMap[t.id] || [],
      certificates: certMap[t.id] || [],
    }));

    return apiSuccess({ trainings: result }, context.request, { startTime });
  } catch (err) {
    logger.error('Unexpected error fetching trainings', { error: err });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = getContextUser(context);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { learnerId, training, certificate, skills } = body;
  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'learnerId is required', context.request, { startTime });
  }

  try {
    if (certificate && (certificate.link || certificate.credential_id)) {
      if (certificate.link) {
        const { data: existingByUrl } = await supabase
          .from('certificates')
          .select('id, title')
          .eq('learner_id', learnerId)
          .eq('link', certificate.link)
          .maybeSingle();
        if (existingByUrl) {
          return apiError(400, 'VALIDATION_ERROR', `Duplicate certificate: "${existingByUrl.title}" already exists with this URL`, context.request, { startTime });
        }
      }
      if (!certificate.link && certificate.credential_id && certificate.platform) {
        const { data: existingByCred } = await supabase
          .from('certificates')
          .select('id, title')
          .eq('learner_id', learnerId)
          .eq('credential_id', certificate.credential_id)
          .eq('platform', certificate.platform)
          .maybeSingle();
        if (existingByCred) {
          return apiError(400, 'VALIDATION_ERROR', `Duplicate certificate: "${existingByCred.title}" already exists with this credential`, context.request, { startTime });
        }
      }
    }

    const trainingRecord = {
      learner_id: learnerId,
      title: training?.title || training?.course || 'Untitled Course',
      course: training?.course || training?.title || '',
      organization: training?.organization || training?.provider || '',
      description: training?.description || '',
      duration: training?.duration || '',
      start_date: training?.startDate || training?.start_date || null,
      end_date: training?.endDate || training?.end_date || null,
      status: training?.status || 'in_progress',
      progress: training?.progress ?? 0,
      total_modules: training?.total_modules ?? 0,
      completed_modules: training?.completed_modules ?? 0,
      hours_spent: training?.hours_spent ?? 0,
      source: training?.source || 'manual',
      approval_status: training?.source === 'external_course' ? 'approved' : 'pending',
      enabled: true,
    };

    const { data: newTraining, error: trainError } = await supabase
      .from('trainings')
      .insert(trainingRecord)
      .select()
      .single();

    if (trainError) throw trainError;
    const trainingId = newTraining.id;

    const errors: string[] = [];

    if (certificate) {
      const { error: certError } = await supabase.from('certificates').insert({
        learner_id: learnerId,
        training_id: trainingId,
        title: certificate.title || trainingRecord.title,
        issuer: certificate.issuer || null,
        link: certificate.link || certificate.url || '',
        platform: certificate.platform || '',
        credential_id: certificate.credentialId || certificate.credential_id || null,
        issued_on: certificate.issued_on || certificate.issuedOn || null,
        level: certificate.level || null,
        description: certificate.description || null,
        instructor: certificate.instructor || null,
        category: certificate.category || null,
        approval_status: 'approved',
        enabled: true,
      });
      if (certError) errors.push(`certificate: ${certError.message}`);
    }

    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillRecords = skills.map((s: any) => ({
        learner_id: learnerId,
        training_id: trainingId,
        name: s.name || s,
        type: s.type || 'technical',
        level: s.level ?? 1,
        description: s.description || '',
        approval_status: 'pending',
        enabled: true,
      }));
      const { error: skillError } = await supabase.from('skills').insert(skillRecords);
      if (skillError) errors.push(`skills: ${skillError.message}`);
    }

    return apiSuccess({
      trainingId,
      training: newTraining,
      warnings: errors.length > 0 ? errors : undefined,
    }, context.request, { startTime });
  } catch (err) {
    console.error('[Trainings POST] Error:', err);
    return apiError(500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'Unknown error', context.request, { startTime });
  }
});
