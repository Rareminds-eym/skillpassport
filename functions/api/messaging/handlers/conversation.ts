// Conversation creation and management handlers
import type { SupabaseClient } from '@supabase/supabase-js';
import { convertApplicationId, convertOpportunityId } from '../utils';

interface Conversation {
  id: string;
  learner_id: string;
  educator_id?: string;
  recruiter_id?: string;
  school_id?: string;
  college_id?: string;
  conversation_type?: string;
  subject?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface GetOrCreateConversationParams {
  learnerId: string;
  recruiterId: string;
  applicationId?: number | string;
  opportunityId?: number | string;
  subject?: string;
}

interface LearnerEducatorParams {
  learnerId: string;
  educatorId: string;
  classId?: string;
  subject?: string;
}

interface CollegeLecturerParams {
  learnerId: string;
  collegeLecturerId: string;
  collegeId?: string;
  programSectionId?: string;
  subject?: string;
}

interface LearnerAdminParams {
  learnerId: string;
  schoolId: string;
  subject?: string;
}

interface LearnerCollegeAdminParams {
  learnerId: string;
  collegeId: string;
  subject?: string;
}

interface EducatorAdminParams {
  educatorId: string;
  schoolId: string;
  subject?: string;
}

interface CollegeEducatorAdminParams {
  educatorId: string;
  collegeId: string;
  subject?: string;
}

interface ArchiveParams {
  conversationId: string;
}

interface UnarchiveParams {
  conversationId: string;
}

async function handleGetOrCreateConversation(supabase: SupabaseClient, params: GetOrCreateConversationParams): Promise<Conversation> {
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

async function handleGetOrCreateLearnerEducatorConversation(supabase: SupabaseClient, params: LearnerEducatorParams): Promise<Conversation> {
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

async function handleGetOrCreateLearnerCollegeLecturerConversation(supabase: SupabaseClient, params: CollegeLecturerParams): Promise<Conversation> {
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

async function handleGetOrCreateLearnerAdminConversation(supabase: SupabaseClient, params: LearnerAdminParams): Promise<Conversation> {
  const { learnerId, schoolId, subject } = params;

  // Resolve learner's user_id — conversations.learner_id FK references learners.user_id, not learners.id
  const { data: learnerRow, error: learnerErr } = await supabase
    .from('learners')
    .select('user_id')
    .eq('id', String(learnerId))
    .maybeSingle();
  if (learnerErr) throw learnerErr;
  if (!learnerRow?.user_id) {
  throw new Error(`Learner not found or missing user_id for learnerId=${learnerId}`);
}
const lrnId = String(learnerRow.user_id);
  const schId = String(schoolId);

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('learner_id', lrnId)
    .eq('school_id', schId)
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
      learner_id: lrnId,
      school_id: schId,
      subject: subject || 'General Discussion',
      conversation_type: 'learner_admin',
      status: 'active',
      learner_unread_count: 0,
      admin_unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleGetOrCreateLearnerCollegeAdminConversation(supabase: SupabaseClient, params: LearnerCollegeAdminParams): Promise<Conversation> {
  const { learnerId, collegeId, subject } = params;

  // Resolve learner's user_id — conversations.learner_id FK references learners.user_id, not learners.id
  const { data: learnerRow, error: learnerErr } = await supabase
    .from('learners')
    .select('user_id')
    .eq('id', String(learnerId))
    .maybeSingle();
  if (learnerErr) throw learnerErr;
  if (!learnerRow?.user_id) {
  throw new Error(`Learner not found or missing user_id for learnerId=${learnerId}`);
}
const lrnId = String(learnerRow.user_id);

  const collId = String(collegeId);

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('learner_id', lrnId)
    .eq('college_id', collId)
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
      learner_id: lrnId,
      college_id: collId,
      subject: subject || 'General Discussion',
      conversation_type: 'learner_college_admin',
      status: 'active',
      learner_unread_count: 0,
      college_admin_unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleGetOrCreateEducatorAdminConversation(supabase: SupabaseClient, params: EducatorAdminParams): Promise<Conversation> {
  const { educatorId, schoolId, subject } = params;

  // Ensure IDs are strings
  const eduId = String(educatorId);
  const schId = String(schoolId);

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('educator_id', eduId)
    .eq('school_id', schId)
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
      educator_id: eduId,
      school_id: schId,
      subject: subject || 'General Discussion',
      conversation_type: 'educator_admin',
      status: 'active',
      educator_unread_count: 0,
      admin_unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleGetOrCreateCollegeEducatorAdminConversation(supabase: SupabaseClient, params: CollegeEducatorAdminParams): Promise<Conversation> {
  const { educatorId, collegeId, subject } = params;

  // Ensure IDs are strings
  const eduId = String(educatorId);
  const collId = String(collegeId);

  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('educator_id', eduId)
    .eq('college_id', collId)
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
      educator_id: eduId,
      college_id: collId,
      subject: subject || 'General Discussion',
      conversation_type: 'college_educator_admin',
      status: 'active',
      educator_unread_count: 0,
      college_admin_unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function handleArchiveConversation(supabase: SupabaseClient, params: ArchiveParams): Promise<void> {
  const { conversationId } = params;
  const { error } = await supabase.from('conversations').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', conversationId);
  if (error) throw error;
}

async function handleUnarchiveConversation(supabase: SupabaseClient, params: UnarchiveParams): Promise<void> {
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
