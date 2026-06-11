/**
 * Recruiter Copilot API
 * POST: Action-based dispatch for recruiter AI operations
 */
import { withAuth, getContextUser } from '../lib/auth';
import { getServiceClient } from '../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const supabase = getServiceClient(context.env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Semantic Search ──
      case 'semantic-search-candidates': {
        const { query_embedding, match_threshold = 0.7, match_count = 20 } = params;
        const { data, error } = await supabase.rpc('search_candidates_by_embedding', {
          query_embedding,
          match_threshold,
          match_count,
        });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'semantic-find-for-opportunity': {
        const { opportunity_id, match_count = 20, min_similarity = 0.65 } = params;
        const { data: opp, error: oppError } = await supabase
          .from('opportunities')
          .select('embedding')
          .eq('id', opportunity_id)
          .single();
        if (oppError) return apiDbError(oppError, context.request, { startTime });
        if (!opp?.embedding) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase.rpc('match_candidates_to_opportunity', {
          opportunity_embedding: opp.embedding,
          match_count,
          min_similarity,
        });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Learners ──
      case 'fetch-learners': {
        const { learner_ids, name_filter, limit = 50 } = params;
        let query = supabase.from('learners').select('*');
        if (learner_ids) query = query.in('user_id', learner_ids);
        if (name_filter) query = query.ilike('name', `%${name_filter}%`);
        query = query.not('name', 'is', null).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-basic': {
        const { learner_ids, name_filter, limit = 50 } = params;
        let query = supabase
          .from('learners')
          .select('user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, updated_at, resumeUrl');
        if (learner_ids) query = query.in('user_id', learner_ids);
        if (name_filter) query = query.ilike('name', `%${name_filter}%`);
        query = query.not('name', 'is', null).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-with-location': {
        const { data, error } = await supabase
          .from('learners')
          .select('city, state')
          .not('city', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-university': {
        const { data, error } = await supabase
          .from('learners')
          .select('university')
          .not('university', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-grad-years': {
        const { data, error } = await supabase
          .from('learners')
          .select('expectedGraduationDate');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-enriched': {
        const { limit = 50 } = params;
        const { data, error } = await supabase
          .from('learners')
          .select(`
            user_id, name, email, phone, university, branch_field,
            currentCgpa, expectedGraduationDate, city, state, country,
            resumeUrl, githubUrl, linkedinUrl, portfolioUrl,
            created_at, updated_at
          `)
          .not('name', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-learners': {
        const { data, error, count } = await supabase
          .from('learners')
          .select('user_id', { count: 'exact', head: true })
          .not('name', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'count-learners-with-location': {
        const { data, error, count } = await supabase
          .from('learners')
          .select('user_id', { count: 'exact', head: true })
          .not('name', 'is', null)
          .not('city', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'count-learners-with-cgpa': {
        const { data, error, count } = await supabase
          .from('learners')
          .select('user_id', { count: 'exact', head: true })
          .not('name', 'is', null)
          .not('currentCgpa', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      // ── Skills ──
      case 'fetch-skills': {
        const { learner_ids, skill_name_filter, limit = 100 } = params;
        let query = supabase.from('skills').select('*').eq('enabled', true);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (skill_name_filter) query = query.ilike('name', `%${skill_name_filter}%`);
        if (limit) query = query.limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-skills-learner-ids': {
        const { data, error } = await supabase
          .from('skills')
          .select('learner_id')
          .eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-skills-names': {
        const { data, error } = await supabase
          .from('skills')
          .select('name')
          .eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-skills': {
        const { data, error, count } = await supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'count-skill-by-name': {
        const { skill_name } = params;
        const { count } = await supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('enabled', true)
          .ilike('name', `%${skill_name}%`);
        return apiSuccess((count || 0) > 0, context.request, { startTime });
      }

      // ── Trainings ──
      case 'fetch-trainings': {
        const { learner_ids } = params;
        let query = supabase.from('trainings').select('learner_id, trainingName, organization, completedDate');
        if (learner_ids) query = query.in('learner_id', learner_ids);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-trainings': {
        const { learner_id } = params;
        const { count } = await supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner_id);
        return apiSuccess(count || 0, context.request, { startTime });
      }

      // ── Certificates ──
      case 'fetch-certificates': {
        const { learner_ids } = params;
        let query = supabase.from('certificates').select('learner_id, certificateName, issuedBy, issuedDate, title, issuer, level, enabled');
        if (learner_ids) query = query.in('learner_id', learner_ids);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-certificates': {
        const { learner_id } = params;
        const { count } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner_id)
          .eq('enabled', true);
        return apiSuccess(count || 0, context.request, { startTime });
      }

      // ── Opportunities ──
      case 'fetch-opportunities': {
        const { recruiter_id, opp_ids, is_active, job_title_filter, limit = 10 } = params;
        let query = supabase.from('opportunities').select('*');
        if (recruiter_id) query = query.eq('recruiter_id', recruiter_id);
        if (opp_ids) query = query.in('id', opp_ids);
        if (is_active !== undefined) query = query.eq('is_active', is_active);
        if (job_title_filter) query = query.ilike('job_title', `%${job_title_filter}%`);
        query = query.order('created_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-opportunities-basic': {
        const { recruiter_id } = params;
        let query = supabase.from('opportunities').select('id, job_title, company_name');
        if (recruiter_id) query = query.eq('recruiter_id', recruiter_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-opportunities-departments': {
        const { recruiter_id } = params;
        let query = supabase.from('opportunities').select('department').not('department', 'is', null);
        if (recruiter_id) query = query.eq('recruiter_id', recruiter_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-opportunities-recent': {
        const { recruiter_id, limit = 5 } = params;
        const { data, error } = await supabase
          .from('opportunities')
          .select('job_title, company_name, employment_type, posted_date, status')
          .eq('recruiter_id', recruiter_id)
          .order('posted_date', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-active-opportunities': {
        const { recruiter_id } = params;
        const { count } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('recruiter_id', recruiter_id)
          .eq('is_active', true);
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'fetch-opportunity-by-id': {
        const { id } = params;
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Pipeline Candidates ──
      case 'fetch-pipeline-candidates': {
        const { opportunity_ids, learner_ids, stage, status, days_stuck } = params;
        let query = supabase.from('pipeline_candidates').select('*');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (stage) query = query.eq('stage', stage);
        if (status) query = query.eq('status', status);
        if (days_stuck) {
          const threshold = new Date();
          threshold.setDate(threshold.getDate() - days_stuck);
          query = query.lt('stage_changed_at', threshold.toISOString());
        }
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-pipeline-with-learners': {
        const { opportunity_ids, learner_ids, limit = 50 } = params;
        const { data, error } = await supabase
          .from('pipeline_candidates')
          .select('*, learners:learner_id ( name, email, university, currentCgpa )')
          .in('opportunity_id', opportunity_ids)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-pipeline-with-opportunities': {
        const { opportunity_ids, learner_ids, stage, status, limit = 50 } = params;
        let query = supabase
          .from('pipeline_candidates')
          .select('*, opportunities:opportunity_id ( job_title, company_name )');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (stage) query = query.eq('stage', stage);
        if (status) query = query.eq('status', status);
        query = query.order('stage_changed_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-pipeline-needs-action': {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('pipeline_candidates')
          .select('*, opportunities:opportunity_id ( job_title, company_name )')
          .eq('status', 'active')
          .or(`next_action_date.lte.${today},next_action_date.is.null`)
          .not('next_action', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Applied Jobs ──
      case 'fetch-applied-jobs': {
        const { opportunity_ids, learner_ids, statuses, limit = 50 } = params;
        let query = supabase
          .from('applied_jobs')
          .select('*, learners:learner_id ( user_id, name, email, university, currentCgpa, city, state, resumeUrl )');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (statuses) query = query.in('application_status', statuses);
        query = query.order('applied_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Recruiters ──
      case 'fetch-recruiter-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-recruiter-by-user-id': {
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-recruiter-by-id': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('id, name, email, phone, state, website, isactive')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Companies ──
      case 'companies-get-all': {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'companies-get-filtered': {
        const { search_term, industry, company_size, account_status } = params;
        let query = supabase.from('companies').select('*');
        if (search_term) query = query.or(`name.ilike.%${search_term}%,code.ilike.%${search_term}%,industry.ilike.%${search_term}%`);
        if (industry) query = query.eq('industry', industry);
        if (company_size) query = query.eq('companySize', company_size);
        if (account_status) query = query.eq('accountStatus', account_status);
        query = query.order('createdAt', { ascending: false });
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'companies-add': {
        const { name, code, industry, companySize, establishedYear, hqAddress, hqCity, hqState, hqCountry, hqPincode, phone, email, website, contactPersonName, contactPersonDesignation, contactPersonEmail, contactPersonPhone, companyDescription, specialRequirements } = params;
        const newCompany = {
          name,
          code,
          industry,
          companySize,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          hqAddress, hqCity, hqState, hqCountry, hqPincode,
          phone, email, website,
          contactPersonName, contactPersonDesignation, contactPersonEmail, contactPersonPhone,
          accountStatus: 'pending',
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalBranches: 0,
          totalRecruiters: 0,
          hqRecruiters: 0,
          branchRecruiters: 0,
          metadata: {
            companyDescription: companyDescription || '',
            specialRequirements: specialRequirements || '',
            registrationDate: new Date().toISOString(),
          },
        };
        const { data, error } = await supabase.from('companies').insert([newCompany]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-update': {
        const { id, companyDescription, specialRequirements, ...regularFields } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const updateData: any = { ...regularFields, updatedAt: new Date().toISOString() };
        if (regularFields.establishedYear) updateData.establishedYear = parseInt(regularFields.establishedYear);
        if (companyDescription !== undefined || specialRequirements !== undefined) {
          const { data: current } = await supabase.from('companies').select('metadata').eq('id', id).single();
          const currentMetadata = current?.metadata || {};
          updateData.metadata = {
            ...currentMetadata,
            ...(companyDescription !== undefined && { companyDescription }),
            ...(specialRequirements !== undefined && { specialRequirements }),
          };
        }
        const { data, error } = await supabase.from('companies').update(updateData).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-update-status': {
        const { id, status } = params;
        if (!id || !status) return apiError(400, 'VALIDATION_ERROR', 'Missing id or status', context.request, { startTime });
        const { data, error } = await supabase.from('companies').update({ accountStatus: status, updatedAt: new Date().toISOString() }).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-delete': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'companies-get-by-id': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-stats': {
        const { data, error } = await supabase.from('companies').select('accountStatus');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Market Intelligence (from opportunities) ──
      case 'fetch-active-opportunities': {
        const { limit = 100 } = params;
        const { data, error } = await supabase
          .from('opportunities')
          .select('skills_required, job_title')
          .eq('is_active', true)
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'UNKNOWN_ACTION', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[recruiter-copilot] Action "${action}" failed:`, error?.message || error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
