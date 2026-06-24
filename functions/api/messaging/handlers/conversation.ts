// Conversation creation and management handlers
import { convertApplicationId, convertOpportunityId } from '../utils';

async function handleGetOrCreateConversation(supabase: any, params: any): Promise<any> {
  const { learnerId, recruiterId, applicationId, opportunityId, subject } = params;
  const applicationIdOld = await convertApplicationId(supabase, applicationId);
  const opportunityIdOld = await convertOpportunityId(supabase, opportunityId);

  let query = supabase.from('conversations').select('id, status, deleted_by_learner, deleted_by_recruiter, learner_id, recruiter_id, application_id, opportunity_id, subject, created_at, updated_at').eq('learner_id', learnerId).eq('recruiter_id', recruiterId).limit(1);
  if (applicationIdOld) query = query.eq('application_id', applicationIdOld);
  const { data: existing, error: fetchError } = await query.maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  if (existing) {
    if (existing.deleted_by_learner || existing.deleted_by_recruiter) {
      const { data: restored, error: restoreError } = await supabase.from('conversations').update({ deleted_by_learner: false, deleted_by_recruiter: false, learner_deleted_at: null, recruiter_deleted_at: null, updated_at: new Date().toISOString() }).eq('id', existing.id).select().maybeSingle();
      if (restoreError) return existing;
      return restored;
    }
    return existing;
  }

  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase.from('conversations').insert({ id: conversationId, learner_id: learnerId, recruiter_id: recruiterId, application_id: applicationIdOld, opportunity_id: opportunityIdOld, subject: subject, status: 'active' }).select().single();
  if (error) throw error;
  return data;
}

async function handleGetOrCreateLearnerEducatorConversation(supabase: any, params: any): Promise<any> {
  const { learnerId, educatorId, classId, subject } = params;
  let query = supabase.from('conversations').select('id, status, deleted_by_learner, deleted_by_educator, learner_id, educator_id, class_id, subject, created_at, updated_at').eq('learner_id', learnerId).eq('educator_id', educatorId).eq('conversation_type', 'learner_educator').limit(1);
  if (classId) query = query.eq('class_id', classId);
  if (subject) query = query.eq('subject', subject);
  const { data: existing, error: fetchError } = await query.maybeSingle();
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  if (existing) {
    if (existing.deleted_by_learner || existing.deleted_by_educator) {
      const { data: restored, error: restoreError } = await supabase.from('conversations').update({ deleted_by_learner: false, deleted_by_educator: false, learner_deleted_at: null, educator_deleted_at: null, updated_at: new Date().toISOString() }).eq('id', existing.id).select().maybeSingle();
      if (restoreError) return existing;
      return restored;
    }
    return existing;
  }

  const conversationId = `conv_se_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase.from('conversations').insert({ id: conversationId, learner_id: learnerId, educator_id: educatorId, class_id: classId, subject: subject || 'General Discussion', conversation_type: 'learner_educator', status: 'active' }).select().single();
  if (error) throw error;
  return data;
}

async function handleGetOrCreateLearnerCollegeLecturerConversation(supabase: any, params: any): Promise<any> {
  const { learnerId, collegeLecturerId, collegeId, programSectionId, subject } = params;
  let query = supabase.from('conversations').select('id, status, deleted_by_learner, deleted_by_educator, learner_id, educator_id, subject, created_at, updated_at').eq('learner_id', learnerId).eq('educator_id', collegeLecturerId).eq('conversation_type', 'learner_college_educator').limit(1);
  if (subject) query = query.eq('subject', subject);
  const { data: existing, error: fetchError } = await query.maybeSingle();
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  if (existing) {
    if (existing.deleted_by_learner || existing.deleted_by_educator) {
      const { data: restored, error: restoreError } = await supabase.from('conversations').update({ deleted_by_learner: false, deleted_by_educator: false, learner_deleted_at: null, educator_deleted_at: null, updated_at: new Date().toISOString() }).eq('id', existing.id).select().maybeSingle();
      if (restoreError) return existing;
      return restored;
    }
    return existing;
  }

  const conversationId = `conv_scl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase.from('conversations').insert({ id: conversationId, learner_id: learnerId, educator_id: collegeLecturerId, college_id: collegeId, program_section_id: programSectionId, subject: subject || 'General Discussion', conversation_type: 'learner_college_educator', status: 'active' }).select().single();
  if (error) throw error;
  return data;
}

async function handleGetOrCreateLearnerAdminConversation(supabase: any, params: any): Promise<any> {
  const { learnerId, schoolId, subject } = params;

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('school_id', schoolId)
    .eq('conversation_type', 'learner_admin')
    .eq('deleted_by_learner', false)
    .eq('deleted_by_admin', false)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  if (existing) return existing;

  const conversationId = `conv_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      learner_id: learnerId,
      school_id: schoolId,
      subject: subject || 'General Discussion',
      conversation_type: 'learner_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleGetOrCreateLearnerCollegeAdminConversation(supabase: any, params: any): Promise<any> {
  const { learnerId, collegeId, subject } = params;

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('college_id', collegeId)
    .eq('conversation_type', 'learner_college_admin')
    .eq('deleted_by_learner', false)
    .eq('deleted_by_college_admin', false)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  if (existing) return existing;

  const conversationId = `conv_college_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      learner_id: learnerId,
      college_id: collegeId,
      subject: subject || 'General Discussion',
      conversation_type: 'learner_college_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleGetOrCreateEducatorAdminConversation(supabase: any, params: any): Promise<any> {
  const { educatorId, schoolId, subject } = params;

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('educator_id', educatorId)
    .eq('school_id', schoolId)
    .eq('conversation_type', 'educator_admin')
    .eq('deleted_by_educator', false)
    .eq('deleted_by_admin', false)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  if (existing) return existing;

  const conversationId = `conv_edu_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      educator_id: educatorId,
      school_id: schoolId,
      subject: subject || 'General Discussion',
      conversation_type: 'educator_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleGetOrCreateCollegeEducatorAdminConversation(supabase: any, params: any): Promise<any> {
  const { educatorId, collegeId, subject } = params;

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('educator_id', educatorId)
    .eq('college_id', collegeId)
    .eq('conversation_type', 'college_educator_admin')
    .eq('deleted_by_college_educator', false)
    .eq('deleted_by_college_admin', false)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  if (existing) return existing;

  const conversationId = `conv_col_edu_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      educator_id: educatorId,
      college_id: collegeId,
      subject: subject || 'General Discussion',
      conversation_type: 'college_educator_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleArchiveConversation(supabase: any, params: any): Promise<void> {
  const { conversationId } = params;
  const { error } = await supabase.from('conversations').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', conversationId);
  if (error) throw error;
}

async function handleUnarchiveConversation(supabase: any, params: any): Promise<void> {
  const { conversationId } = params;
  const { error } = await supabase.from('conversations').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', conversationId);
  if (error) throw error;
}

export {
  handleGetOrCreateConversation,
  handleGetOrCreateLearnerEducatorConversation,
  handleGetOrCreateLearnerCollegeLecturerConversation,
  handleGetOrCreateLearnerAdminConversation,
  handleGetOrCreateLearnerCollegeAdminConversation,
  handleGetOrCreateEducatorAdminConversation,
  handleGetOrCreateCollegeEducatorAdminConversation,
  handleArchiveConversation,
  handleUnarchiveConversation
};
