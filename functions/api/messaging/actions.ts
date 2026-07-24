import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withAuth } from '../../lib/auth';
import { createLogger } from '../../lib/logger';
import { notifyRealtime } from '../../lib/realtime';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import {
  handleArchiveConversation,
  handleGetOrCreateCollegeEducatorAdminConversation,
  handleGetOrCreateConversation,
  handleGetOrCreateEducatorAdminConversation,
  handleGetOrCreateLearnerAdminConversation,
  handleGetOrCreateLearnerCollegeAdminConversation,
  handleGetOrCreateLearnerCollegeLecturerConversation,
  handleGetOrCreateLearnerEducatorConversation,
  handleUnarchiveConversation,
} from './handlers/conversation';
import { convertApplicationId, convertOpportunityId, fetchEducatorDetailsForConversations } from './utils';

const logger = createLogger('messaging-actions');

const resolveString = (primary: unknown, fallback: unknown): string => {
  if (typeof primary === 'string') return primary;
  if (typeof fallback === 'string') return fallback;
  return '';
}; 

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  receiver_id: string;
  receiver_type: string;
  message_text: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  receiver_id: string;
  receiver_type: string;
  message_text: string;
  application_id?: number;
  opportunity_id?: number;
  class_id?: string;
  subject?: string;
  attachments?: any[];
}

interface SendMessageParams {
  conversationId: string;
  senderId: string;
  senderType: string;
  receiverId: string;
  receiverType: string;
  messageText: string;
  applicationId?: number | string;
  opportunityId?: number | string;
  classId?: string;
  subject?: string;
  attachments?: any[];
}

async function handleSendMessage(supabase: SupabaseClient, params: SendMessageParams): Promise<Message> {
  const { conversationId, senderId, senderType, receiverId, receiverType, messageText, applicationId, opportunityId, classId, subject, attachments } = params;

  if (!conversationId || !senderId || !receiverId || !messageText?.trim()) {
    throw new Error('Missing required fields for message');
  }

  // Ensure all IDs are strings
  const convId = String(conversationId);

  // Resolve learner user_id if sender/receiver is a learner (notifications FK requires user_id not learners.id)
  // Batch both lookups into a single query to avoid N+1
  let sendId = String(senderId);
  let recvId = String(receiverId);

  const learnerIdsToResolve: string[] = [];
  if (senderType === 'learner') learnerIdsToResolve.push(sendId);
  if (receiverType === 'learner' && recvId !== sendId) learnerIdsToResolve.push(recvId);

  if (learnerIdsToResolve.length > 0) {
    // First try lookup by learners.id (used by AdminMessageModal)
    const { data: learnersById, error: learnersByIdError } = await supabase.from('learners').select('id, user_id').in('id', learnerIdsToResolve);
    if (learnersByIdError) throw learnersByIdError;

    // For any IDs not resolved, try lookup by learners.user_id (used by communication page where conv.learner_id = user_id)
    const resolvedByIdMap = new Map((learnersById || []).map((l: { id: string; user_id: string }) => [l.id, l.user_id]));
    const stillUnresolved = learnerIdsToResolve.filter(id => !resolvedByIdMap.has(id));

    let resolvedByUserIdMap = new Map<string, string>();
    if (stillUnresolved.length > 0) {
      const { data: learnersByUserId } = await supabase.from('learners').select('id, user_id').in('user_id', stillUnresolved);
      resolvedByUserIdMap = new Map((learnersByUserId || []).map((l: { id: string; user_id: string }) => [l.user_id, l.user_id]));
    }

    const learnerMap = new Map([...resolvedByIdMap, ...resolvedByUserIdMap]);

    if (senderType === 'learner') {
      const resolved = learnerMap.get(sendId);
      if (!resolved) throw new Error(`Could not resolve user_id for learner sender (learnerId=${sendId})`);
      sendId = String(resolved);
    }

    if (receiverType === 'learner') {
      const resolved = learnerMap.get(recvId);
      if (!resolved) throw new Error(`Could not resolve user_id for learner receiver (learnerId=${recvId})`);
      recvId = String(resolved);
    }
  }

  const applicationIdOld = await convertApplicationId(supabase, applicationId);
  const opportunityIdOld = await convertOpportunityId(supabase, opportunityId);

  const messageData: MessageInsert = { conversation_id: convId, sender_id: sendId, sender_type: senderType, receiver_id: recvId, receiver_type: receiverType, message_text: messageText.trim() };
  if (applicationIdOld) messageData.application_id = applicationIdOld;
  if (opportunityIdOld) messageData.opportunity_id = opportunityIdOld;
  if (classId) messageData.class_id = classId;
  if (subject) messageData.subject = subject;
  if (attachments?.length) messageData.attachments = attachments;

  const { data, error } = await supabase.from('messages').insert(messageData).select('id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read, read_at, created_at, updated_at').single();
  // Ignore FK errors from the notifications trigger — the message itself was saved
  if (error && !(error.code === '23503' && error.message?.includes('notifications'))) throw error;
  if (!data) {
  logger.warn('Message insert succeeded but returned no data', { error });
  throw new Error('Message insert returned no data');
}
  return data;
}

async function handleGetConversationMessages(supabase: SupabaseClient, params: any): Promise<Message[]> {
  const { conversationId, limit, offset = 0 } = params;
  const convId = String(conversationId);
  let query = supabase.from('messages').select('id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read, read_at, created_at, updated_at').eq('conversation_id', convId).order('created_at', { ascending: true });
  if (limit) query = query.range(offset, offset + limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function handleGetUnreadCount(supabase: SupabaseClient, params: any): Promise<number> {
  const { userId, userType } = params;
  const usrId = String(userId);
  const { count, error } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', usrId).eq('receiver_type', userType).eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

async function handleGetConversationWithLearner(supabase: SupabaseClient, params: any): Promise<any> {
  const { conversationId } = params;
  const convId = String(conversationId);
  const { data, error } = await supabase
    .from('conversations')
    .select(`*, learner:learners(id, name, email, contact_number, university, branch_field), application:applied_jobs(id, application_status, applied_at, opportunity:opportunities(id, job_title, company_name, location, employment_type))`)
    .eq('id', convId)
    .single();
  if (error) throw error;
  return data;
}

async function handleGetUserConversations(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { userId, userType, includeArchived, conversationType } = params;
  const usrId = String(userId);
  const column = userType === 'learner' ? 'learner_id' : userType === 'recruiter' ? 'recruiter_id' : 'educator_id';
  const deletedColumn = userType === 'learner' ? 'deleted_by_learner' : userType === 'recruiter' ? 'deleted_by_recruiter' : 'deleted_by_educator';

  let query: any;
  if (userType === 'educator') {
    query = supabase
      .from('conversations')
      .select(`id, learner_id, educator_id, class_id, subject, status, conversation_type, last_message_at, last_message_preview, last_message_sender, educator_unread_count, created_at, updated_at, deleted_by_educator, learner:learners(id, user_id, email, name, contact_number, university, branch_field), school_class:school_classes(id, name, grade, section)`)
      .eq(column, usrId).eq('conversation_type', 'learner_educator');
  } else if (userType === 'college_educator') {
    query = supabase
      .from('conversations')
      .select(`id, learner_id, educator_id, subject, status, conversation_type, last_message_at, last_message_preview, last_message_sender, educator_unread_count, created_at, updated_at, deleted_by_educator, learner:learners(id, user_id, email, name, contact_number, university, branch_field, program_id, program_section_id)`)
      .eq(column, usrId).eq('conversation_type', 'learner_college_educator');
  } else if (userType === 'learner') {
    query = supabase
      .from('conversations')
      .select(`id, learner_id, recruiter_id, educator_id, class_id, subject, status, conversation_type, last_message_at, last_message_preview, last_message_sender, learner_unread_count, created_at, updated_at, deleted_by_learner, school_id, college_id, recruiter:recruiters(id, name, email, phone), school_class:school_classes(id, name, grade, section), school_organization:organizations!school_id(admin_id), college_organization:organizations!college_id(admin_id)`)
      .eq(column, usrId);
  } else {
    query = supabase
      .from('conversations')
      .select(`id, learner_id, recruiter_id, educator_id, application_id, opportunity_id, class_id, subject, status, conversation_type, last_message_at, last_message_preview, last_message_sender, learner_unread_count, recruiter_unread_count, educator_unread_count, created_at, updated_at, deleted_by_learner, deleted_by_recruiter, deleted_by_educator, learner:learners(id, user_id, email, name, contact_number, university, branch_field), recruiter:recruiters(id, name, email, phone), opportunity:opportunities(id, title, company_name, location, employment_type), application:applied_jobs(id, application_status), school_class:school_classes(id, name, grade, section)`)
      .eq(column, usrId);
  }

  try {
    if (userType === 'college_educator') {
      query = query.eq('deleted_by_educator', false);
    } else {
      query = query.eq(deletedColumn, false);
    }
  } catch (err) {
    // deleted_by column may not exist on older schema versions — silently skip the filter
    logger.warn('[handleGetUserConversations] deleted_by filter skipped', { error: err instanceof Error ? err.message : String(err) });
  }

  if (conversationType) query = query.eq('conversation_type', conversationType);
  if (!includeArchived) query = query.neq('status', 'archived');
  query = query.order('last_message_at', { ascending: false, nullsFirst: false }).limit(100);

  const { data, error } = await query;

  if (error && (error.message?.includes('deleted_by') || error.code === '42703')) {
    let retryQuery = supabase
      .from('conversations')
      .select(`id, learner_id, recruiter_id, educator_id, application_id, opportunity_id, class_id, subject, status, conversation_type, last_message_at, last_message_preview, last_message_sender, learner_unread_count, recruiter_unread_count, educator_unread_count, created_at, updated_at, learner:learners(id, name, email, contact_number, university, branch_field), recruiter:recruiters(id, name, email, phone), opportunity:opportunities(id, title, company_name, location, employment_type), application:applied_jobs(id, application_status), school_class:school_classes(id, name, grade, section)`)
      .eq(column, usrId);
    if (conversationType) retryQuery = retryQuery.eq('conversation_type', conversationType);
    if (!includeArchived) retryQuery = retryQuery.neq('status', 'archived');
    retryQuery = retryQuery.order('last_message_at', { ascending: false, nullsFirst: false }).limit(100);

    const { data: retryData, error: retryError } = await retryQuery;
    if (retryError) throw retryError;
    const conversations = retryData || [];
    if (userType === 'learner' || userType === 'educator' || userType === 'college_educator') {
      return fetchEducatorDetailsForConversations(supabase, conversations);
    }
    return conversations;
  }

  if (error) throw error;
  const conversations = data || [];
  if (userType === 'learner' || userType === 'educator' || userType === 'college_educator') {
    return fetchEducatorDetailsForConversations(supabase, conversations);
  }
  return conversations;
}

async function handleMarkConversationAsRead(supabase: SupabaseClient, params: any): Promise<void> {
  const { conversationId, userId } = params;
  const convId = String(conversationId);
  const usrId = String(userId);
  const readAt = new Date().toISOString();

  const [messageResult, conversationResult] = await Promise.allSettled([
    supabase.from('messages').update({ is_read: true, read_at: readAt }).eq('conversation_id', convId).eq('receiver_id', usrId).eq('is_read', false).select('id'),
    supabase.from('conversations').select('learner_id, recruiter_id, educator_id, school_id, college_id, conversation_type').eq('id', convId).maybeSingle()
  ]);

  if (messageResult.status === 'rejected') throw messageResult.reason;

  if (conversationResult.status === 'fulfilled' && conversationResult.value.data) {
    const conversation = conversationResult.value.data;
    const isLearner = conversation.learner_id === usrId;
    const isRecruiter = conversation.recruiter_id === usrId;

    if (conversation.conversation_type === 'learner_admin') {
      // FINALIZED (task 22.3 / deferred display reconciliation to task 13): this is a
      // participant-identity EXISTENCE check keyed by the `userId` PARAM (the user marking the
      // thread read — not necessarily the current authenticated user) AND org-scoped to
      // `conversation.school_id`. It is NOT an authorization use of `school_educators.role`:
      // `resolveSchoolRole` resolves the CURRENT user's permission role from the JWT and does
      // NOT (a) operate on an arbitrary param user, nor (b) reproduce the
      // `school_id = conversation.school_id` scoping of this membership probe — so routing it
      // through the resolver would change semantics (and could clear the wrong school's
      // counter). Endpoint authorization is enforced separately from the verified JWT.
      const schoolId = String(conversation.school_id);
      const { data: schoolAdmin } = await supabase.from('school_educators').select('user_id').eq('user_id', usrId).eq('role', 'school_admin').eq('school_id', schoolId).single();
      if (schoolAdmin) {
        await supabase.from('conversations').update({ admin_unread_count: 0 }).eq('id', convId);
      } else if (isLearner) {
        await supabase.from('conversations').update({ learner_unread_count: 0 }).eq('id', convId);
      }
    } else if (conversation.conversation_type === 'learner_college_admin') {
      if (conversation.college_id) {
        const collegeId = String(conversation.college_id);
        const { data: collegeAdmin } = await supabase.from('college_lecturers').select('user_id').eq('user_id', usrId).eq('collegeId', collegeId).single();
        if (collegeAdmin) {
          await supabase.from('conversations').update({ college_admin_unread_count: 0 }).eq('id', convId);
        } else {
          const { data: collegeOwner } = await supabase.from('organizations').select('admin_id').eq('id', collegeId).eq('organization_type', 'college').eq('admin_id', usrId).single();
          if (collegeOwner) {
            await supabase.from('conversations').update({ college_admin_unread_count: 0 }).eq('id', convId);
          } else if (isLearner) {
            await supabase.from('conversations').update({ learner_unread_count: 0 }).eq('id', convId);
          }
        }
      } else {
        if (isLearner) {
          await supabase.from('conversations').update({ learner_unread_count: 0 }).eq('id', convId);
        }
      }
    } else if (conversation.conversation_type === 'learner_college_educator') {
      if (isLearner) {
        await supabase.from('conversations').update({ learner_unread_count: 0 }).eq('id', convId);
      } else {
        const { data: lecturer } = await supabase.from('college_lecturers').select('id').eq('user_id', usrId).single();
        if (lecturer && conversation.educator_id === lecturer.id) {
          await supabase.from('conversations').update({ educator_unread_count: 0 }).eq('id', convId);
        }
      }
    } else if (conversation.conversation_type === 'college_educator_admin') {
      const { data: lecturer } = await supabase.from('college_lecturers').select('id').eq('user_id', usrId).single();
      if (lecturer && conversation.educator_id === lecturer.id) {
        await supabase.from('conversations').update({ educator_unread_count: 0 }).eq('id', convId);
      } else {
        const collegeId = String(conversation.college_id);
        const { data: collegeOwner } = await supabase.from('organizations').select('admin_id').eq('id', collegeId).eq('organization_type', 'college').eq('admin_id', usrId).single();
        if (collegeOwner) {
          await supabase.from('conversations').update({ college_admin_unread_count: 0 }).eq('id', convId);
        }
      }
    } else {
      const updateField = isLearner ? 'learner_unread_count' : isRecruiter ? 'recruiter_unread_count' : 'educator_unread_count';
      await supabase.from('conversations').update({ [updateField]: 0 }).eq('id', convId);
    }
  }
}

async function handleDeleteConversationForUser(supabase: SupabaseClient, params: any): Promise<void> {
  const { conversationId, userType } = params;
  const convId = String(conversationId);
  let deletedColumn: string, deletedAtColumn: string;
  switch (userType) {
    case 'learner': deletedColumn = 'deleted_by_learner'; deletedAtColumn = 'learner_deleted_at'; break;
    case 'recruiter': deletedColumn = 'deleted_by_recruiter'; deletedAtColumn = 'recruiter_deleted_at'; break;
    case 'educator': case 'college_educator': deletedColumn = 'deleted_by_educator'; deletedAtColumn = 'educator_deleted_at'; break;
    case 'school_admin': deletedColumn = 'deleted_by_admin'; deletedAtColumn = 'admin_deleted_at'; break;
    case 'college_admin': deletedColumn = 'deleted_by_college_admin'; deletedAtColumn = 'college_admin_deleted_at'; break;
    default: throw new Error(`Invalid user type: ${userType}`);
  }
  const { error } = await supabase.from('conversations').update({ [deletedColumn]: true, [deletedAtColumn]: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', convId);
  if (error) throw error;
}

async function handleRestoreConversation(supabase: SupabaseClient, params: any): Promise<void> {
  const { conversationId, userType } = params;
  const convId = String(conversationId);
  let deletedColumn: string, deletedAtColumn: string;
  switch (userType) {
    case 'learner': deletedColumn = 'deleted_by_learner'; deletedAtColumn = 'learner_deleted_at'; break;
    case 'recruiter': deletedColumn = 'deleted_by_recruiter'; deletedAtColumn = 'recruiter_deleted_at'; break;
    case 'educator': case 'college_educator': deletedColumn = 'deleted_by_educator'; deletedAtColumn = 'educator_deleted_at'; break;
    case 'school_admin': deletedColumn = 'deleted_by_admin'; deletedAtColumn = 'admin_deleted_at'; break;
    case 'college_admin': deletedColumn = 'deleted_by_college_admin'; deletedAtColumn = 'college_admin_deleted_at'; break;
    default: throw new Error(`Invalid user type: ${userType}`);
  }
  const { error } = await supabase.from('conversations').update({ [deletedColumn]: false, [deletedAtColumn]: null, updated_at: new Date().toISOString() }).eq('id', convId);
  if (error) throw error;
}

async function handlePermanentlyDeleteConversation(supabase: SupabaseClient, params: any): Promise<void> {
  const { conversationId } = params;
  const convId = String(conversationId);
  const { error } = await supabase.from('conversations').delete().eq('id', convId);
  if (error) throw error;
}

async function handleSendLearnerEducatorMessage(supabase: SupabaseClient, params: any): Promise<any> {
  const { conversationId, learnerId, messageText, classId, subject, attachments } = params;
  const convId = String(conversationId);
  const { data: conversation, error: convError } = await supabase.from('conversations').select('educator_id, class_id, subject').eq('id', convId).maybeSingle();
  if (convError && convError.code !== 'PGRST116') throw convError;
  if (!conversation) throw new Error('Conversation not found');
  if (!conversation.educator_id) throw new Error('Educator not found in conversation');

  return handleSendMessage(supabase, {
    conversationId, senderId: learnerId, senderType: 'learner', receiverId: conversation.educator_id, receiverType: 'educator', messageText, applicationId: undefined, opportunityId: undefined, classId: classId || conversation.class_id, subject: subject || conversation.subject, attachments
  });
}

async function handleSendLearnerAdminMessage(supabase: SupabaseClient, params: any): Promise<any> {
  const { conversationId, learnerId, messageText, subject, attachments } = params;
  const convId = String(conversationId);
  const { data: conversation, error: convError } = await supabase.from('conversations').select('school_id, subject').eq('id', convId).maybeSingle();
  if (convError && convError.code !== 'PGRST116') throw convError;
  if (!conversation) throw new Error('Conversation not found');
  if (!conversation.school_id) throw new Error('School not found in conversation');

  // Get school admin user_id from organizations table
  const schoolId = String(conversation.school_id);
  const { data: org, error: orgError } = await supabase.from('organizations').select('admin_id').eq('id', schoolId).maybeSingle();
  if (orgError) throw orgError;
  if (!org?.admin_id) throw new Error('School admin not found');

  return handleSendMessage(supabase, {
    conversationId, senderId: learnerId, senderType: 'learner', receiverId: org.admin_id, receiverType: 'school_admin', messageText, applicationId: undefined, opportunityId: undefined, classId: undefined, subject: subject || conversation.subject, attachments
  });
}

async function handleSendLearnerCollegeAdminMessage(supabase: SupabaseClient, params: any): Promise<any> {
  const { conversationId, learnerId, messageText, subject, attachments } = params;
  const convId = String(conversationId);
  const { data: conversation, error: convError } = await supabase.from('conversations').select('college_id, subject').eq('id', convId).maybeSingle();
  if (convError && convError.code !== 'PGRST116') throw convError;
  if (!conversation) throw new Error('Conversation not found');
  if (!conversation.college_id) throw new Error('College not found in conversation');

  // Get college admin user_id from organizations table
  const collegeId = String(conversation.college_id);
  const { data: org, error: orgError } = await supabase.from('organizations').select('admin_id').eq('id', collegeId).maybeSingle();
  if (orgError) throw orgError;
  if (!org?.admin_id) throw new Error('College admin not found');

  return handleSendMessage(supabase, {
    conversationId, senderId: learnerId, senderType: 'learner', receiverId: org.admin_id, receiverType: 'college_admin', messageText, applicationId: undefined, opportunityId: undefined, classId: undefined, subject: subject || conversation.subject, attachments
  });
}

async function handleSendEducatorAdminMessage(supabase: SupabaseClient, params: any): Promise<any> {
  const { conversationId, educatorId, messageText, subject, attachments } = params;
  const convId = String(conversationId);
  const { data: conversation, error: convError } = await supabase.from('conversations').select('school_id, subject').eq('id', convId).maybeSingle();
  if (convError && convError.code !== 'PGRST116') throw convError;
  if (!conversation) throw new Error('Conversation not found');
  if (!conversation.school_id) throw new Error('School not found in conversation');

  // Get school admin user_id from organizations table
  const schoolId = String(conversation.school_id);
  const { data: org, error: orgError } = await supabase.from('organizations').select('admin_id').eq('id', schoolId).maybeSingle();
  if (orgError) throw orgError;
  if (!org?.admin_id) throw new Error('School admin not found');

  return handleSendMessage(supabase, {
    conversationId, senderId: educatorId, senderType: 'educator', receiverId: org.admin_id, receiverType: 'school_admin', messageText, applicationId: undefined, opportunityId: undefined, classId: undefined, subject: subject || conversation.subject, attachments
  });
}

async function handleSendCollegeEducatorAdminMessage(supabase: SupabaseClient, params: any): Promise<any> {
  const { conversationId, educatorId, messageText, subject, attachments } = params;
  const convId = String(conversationId);
  const { data: conversation, error: convError } = await supabase.from('conversations').select('college_id, subject').eq('id', convId).maybeSingle();
  if (convError && convError.code !== 'PGRST116') throw convError;
  if (!conversation) throw new Error('Conversation not found');
  if (!conversation.college_id) throw new Error('College not found in conversation');

  // Get college admin user_id from organizations table
  const collegeId = String(conversation.college_id);
  const { data: org, error: orgError } = await supabase.from('organizations').select('admin_id').eq('id', collegeId).maybeSingle();
  if (orgError) throw orgError;
  if (!org?.admin_id) throw new Error('College admin not found');

  return handleSendMessage(supabase, {
    conversationId, senderId: educatorId, senderType: 'college_educator', receiverId: org.admin_id, receiverType: 'college_admin', messageText, applicationId: undefined, opportunityId: undefined, classId: undefined, subject: subject || conversation.subject, attachments
  });
}

async function handleMarkAsRead(supabase: SupabaseClient, params: any): Promise<void> {
  const { messageId } = params;
  const msgId = String(messageId);
  const { error } = await supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', msgId);
  if (error) throw error;
}

async function handleFetchEducatorDetails(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { conversations } = params;
  return fetchEducatorDetailsForConversations(supabase, conversations);
}

async function handleArchiveConversationForUser(supabase: SupabaseClient, params: any): Promise<void> {
  const { conversationId, userType } = params;
  const convId = String(conversationId);
  let archiveColumn: string;
  switch (userType) {
    case 'learner': archiveColumn = 'archived_by_learner'; break;
    case 'recruiter': archiveColumn = 'archived_by_recruiter'; break;
    case 'educator': case 'college_educator': archiveColumn = 'archived_by_educator'; break;
    case 'school_admin': archiveColumn = 'archived_by_admin'; break;
    case 'college_admin': archiveColumn = 'archived_by_college_admin'; break;
    default: throw new Error(`Invalid user type: ${userType}`);
  }
  const { error } = await supabase.from('conversations').update({ [archiveColumn]: true, updated_at: new Date().toISOString() }).eq('id', convId);
  if (error) throw error;
}

async function handleUnarchiveConversationForUser(supabase: SupabaseClient, params: any): Promise<void> {
  const { conversationId, userType } = params;
  const convId = String(conversationId);
  let archiveColumn: string;
  switch (userType) {
    case 'learner': archiveColumn = 'archived_by_learner'; break;
    case 'recruiter': archiveColumn = 'archived_by_recruiter'; break;
    case 'educator': case 'college_educator': archiveColumn = 'archived_by_educator'; break;
    case 'school_admin': archiveColumn = 'archived_by_admin'; break;
    case 'college_admin': archiveColumn = 'archived_by_college_admin'; break;
    default: throw new Error(`Invalid user type: ${userType}`);
  }
  const { error } = await supabase.from('conversations').update({ [archiveColumn]: false, updated_at: new Date().toISOString() }).eq('id', convId);
  if (error) throw error;
}

async function handleSearchRecipients(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { query, type, contextId, contextField } = params;
  if (!query || !type) return [];

  if (type === 'learners') {
    const q = supabase.from('learners').select('id, name, email, university, branch_field, grade, section, school_id');
    if (contextId) q.eq(contextField || 'school_id', String(contextId));
    const { data } = await q.or(`name.ilike.%${query}%,email.ilike.%${query}%`).limit(50);
    return (data || []).map((s: any) => ({ id: s.id, name: s.name, email: s.email, type: 'learner', university: s.university, branch_field: s.branch_field, grade: s.grade, section: s.section }));
  }

  if (type === 'school_educators') {
    const q = supabase.from('school_educators').select('id, user_id, first_name, last_name, email, photo_url, role').eq('school_id', String(contextId));
    const { data } = await q.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`).limit(50);
    return (data || []).map((e: any) => ({ id: e.id, userId: e.user_id, name: `${e.first_name} ${e.last_name}`.trim(), email: e.email, type: 'school_educator', role: e.role }));
  }

  if (type === 'college_lecturers') {
    const q = supabase.from('college_lecturers').select('id, user_id, first_name, last_name, email, department, specialization').eq('collegeId', String(contextId));
    const { data } = await q.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`).limit(50);
    return (data || []).map((l: any) => ({ id: l.id, userId: l.user_id, name: `${l.first_name} ${l.last_name}`.trim(), email: l.email, type: 'college_lecturer', department: l.department }));
  }

  return [];
}

async function handleResolveUserContext(supabase: SupabaseClient, params: any): Promise<any> {
  const { userId, type } = params;
  if (!userId) return null;
  const usrId = String(userId);

  if (type === 'educator' || !type) {
    const { data } = await supabase.from('school_educators').select('id, school_id, user_id, email, first_name, last_name').eq('user_id', usrId).maybeSingle();
    if (data) return { ...data, userType: 'school_educator' };
  }

  if (type === 'college_educator') {
    const { data } = await supabase.from('college_lecturers').select('id, collegeId, user_id, email, first_name, last_name, department').eq('user_id', usrId).maybeSingle();
    if (data) return { ...data, userType: 'college_educator' };
  }

  return null;
}

async function handleFetchLearnerSchool(supabase: SupabaseClient, params: any): Promise<any> {
  const { learnerId } = params;
  if (!learnerId) return null;
  const lrnId = String(learnerId);
  const { data: learner } = await supabase.from('learners').select('school_id').eq('id', lrnId).maybeSingle();
  if (!learner?.school_id) return null;
  const schoolId = String(learner.school_id);
  const { data: org } = await supabase.from('organizations').select('id, name, city, state, organization_type').eq('id', schoolId).maybeSingle();
  return { school_id: learner.school_id, school: org };
}

async function handleFetchLearnerCollege(supabase: SupabaseClient, params: any): Promise<any> {
  const { learnerId } = params;
  if (!learnerId) return null;
  const lrnId = String(learnerId);
  const { data: learner } = await supabase.from('learners').select('college_id').eq('id', lrnId).maybeSingle();
  if (!learner) return null;
  const collegeId = learner.college_id;
  if (!collegeId) return { college_id: null };
  const collId = String(collegeId);
  const { data: org } = await supabase.from('organizations').select('id, name, city, state, organization_type').eq('id', collId).maybeSingle();
  return { college_id: collegeId, college: org };
}

async function handleFetchOrganization(supabase: SupabaseClient, params: any): Promise<any> {
  const { id } = params;
  if (!id) return null;
  const orgId = String(id);
  const { data } = await supabase.from('organizations').select('*').eq('id', orgId).maybeSingle();
  return data;
}

async function handleResolveEducatorByEmail(supabase: SupabaseClient, params: any): Promise<any> {
  const { email } = params;
  if (!email) return null;
  const { data } = await supabase.from('school_educators').select('id, school_id, user_id, email, first_name, last_name, role, phone_number').eq('email', email).maybeSingle();
  return data;
}

async function handleResolveEducatorById(supabase: SupabaseClient, params: any): Promise<any> {
  const { educatorId } = params;
  if (!educatorId) return null;
  const eduId = String(educatorId);
  const { data } = await supabase.from('school_educators').select('id, school_id, user_id, email, first_name, last_name, role, phone_number').eq('id', eduId).maybeSingle();
  return data;
}

async function handleFetchLearnerContext(supabase: SupabaseClient, params: any): Promise<any> {
  const { learnerId, userId } = params;
  if (learnerId) {
    const lrnId = String(learnerId);
    const { data } = await supabase.from('learners').select('id, user_id, school_id, college_id, program_section_id, program_id').eq('id', lrnId).maybeSingle();
    return data;
  }
  if (userId) {
    const usrId = String(userId);
    const { data } = await supabase.from('learners').select('id, user_id, school_id, college_id, program_section_id, program_id').eq('user_id', usrId).maybeSingle();
    return data;
  }
  return null;
}

async function handleFetchDepartmentsByCollege(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { collegeId } = params;
  if (!collegeId) return [];
  const collId = String(collegeId);
  const { data } = await supabase.from('departments').select('id, name').eq('college_id', collId).order('name');
  return data || [];
}

async function handleFetchProgramsByDepartments(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { departmentIds, collegeId } = params;
  let query = supabase.from('programs').select('id, name, department_id');
  if (departmentIds?.length) query = query.in('department_id', departmentIds.map((id: any) => String(id)));
  if (collegeId) query = query.eq('college_id', String(collegeId));
  const { data } = await query.order('name');
  return data || [];
}

async function handleFetchLearnersByPrograms(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { programIds, collegeId, limit = 200 } = params;
  let query = supabase.from('learners').select('id, user_id, name, email, university, branch_field, program_id, program_section_id');
  if (programIds?.length) query = query.in('program_id', programIds.map((id: any) => String(id)));
  if (collegeId) query = query.eq('college_id', String(collegeId));
  const { data } = await query.limit(Math.min(limit, 500)).order('name');
  return data || [];
}

async function handleFetchRecipients(supabase: SupabaseClient, params: any): Promise<any[]> {
  const { conversationType, contextId } = params;
  let data: any[] = [];

  if (conversationType === 'learner-educator' || conversationType === 'admin-educator') {
    const { data: educatorData, error } = await supabase
      .from('school_educators')
      .select('id, user_id, first_name, last_name, email, photo_url, role, subject_expertise')
      .eq('school_id', contextId)
      .order('first_name');
    if (!error && educatorData) {
      data = educatorData.map((e: any) => ({
        id: e.id, userId: e.user_id, name: `${e.first_name} ${e.last_name}`, email: e.email,
        photo_url: e.photo_url, type: 'school_educator', role: e.role,
        specialization: Array.isArray(e.subject_expertise)
          ? e.subject_expertise.map((s: any) => s.subject || s).join(', ')
          : e.subject_expertise,
      }));
    }
  } else if (conversationType === 'admin-learner' || conversationType === 'college-admin-learner') {
    type LearnerRow = {
      id: string;
      name: string | null;
      email: string | null;
      university: string | null;
      branch_field: string | null;
      grade: string | null;
      section: string | null;
    };
    const ctxId = String(contextId);
    if (conversationType === 'admin-learner') {
      const { data: learnerData, error } = await supabase
        .from('learners')
        .select('id, name, email, university, branch_field, grade, section')
        .eq('school_id', ctxId)
        .order('name');
      if (!error && learnerData) {
        data = learnerData.map((s: LearnerRow) => ({
          id: s.id, name: s.name || 'Unnamed Learner', email: s.email,
          university: s.university, branch_field: s.branch_field, grade: s.grade, section: s.section,
        }));
      }
    } else {
      // college-admin-learner: check both college_id and university_college_id
      // UUID validation ensures ctxId is safe to use in .or() filter (PostgREST parameterizes internally)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ctxId)) {
        throw new Error(`Invalid contextId format: ${ctxId}`);
      }
      const { data: learnerData, error } = await supabase
        .from('learners')
        .select('id, name, email, university, branch_field, grade, section')
        .or(`college_id.eq.${ctxId},university_college_id.eq.${ctxId}`)
        .order('name');
      if (!error && learnerData) {
        data = learnerData.map((s: LearnerRow) => ({
          id: s.id, name: s.name || 'Unnamed Learner', email: s.email,
          university: s.university, branch_field: s.branch_field, grade: s.grade, section: s.section,
        }));
      }
    }
  } else if (conversationType === 'college-lecturer') {
    const ctxId = String(contextId);
    const { data: lecturerData, error } = await supabase
      .from('college_lecturers')
      .select('id, first_name, last_name, email, department, specialization, user_id, metadata')
      .eq('collegeId', ctxId)
      .order('first_name');
    if (!error && lecturerData) {
      data = lecturerData.map((l: any) => {
        const meta = typeof l.metadata === 'object' && l.metadata !== null ? l.metadata : {};
        const firstName = resolveString(l.first_name, meta.first_name);
        const lastName = resolveString(l.last_name, meta.last_name);
        const resolvedEmail = resolveString(l.email, meta.email);
        return {
          id: l.id, userId: l.user_id,
          name: `${firstName} ${lastName}`.trim() || resolvedEmail,
          first_name: firstName, last_name: lastName,
          email: resolvedEmail,
          type: 'college_lecturer', department: l.department, specialization: l.specialization,
        };
      });
    }
  }

  return data;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request, { startTime });
  }

  try {
    switch (action) {
      case 'fetch-educator-details':
        return apiSuccess(await handleFetchEducatorDetails(supabase, params), context.request, { startTime });

      case 'get-or-create-conversation': {
        const convData = await handleGetOrCreateConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'get-or-create-learner-educator-conversation': {
        const convData = await handleGetOrCreateLearnerEducatorConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'get-or-create-learner-college-lecturer-conversation': {
        const convData = await handleGetOrCreateLearnerCollegeLecturerConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'send-message': {
        const msgData = await handleSendMessage(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', msgData));
        return apiSuccess(msgData, context.request, { startTime });
      }

      case 'send-learner-educator-message': {
        const msgData = await handleSendLearnerEducatorMessage(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', msgData));
        return apiSuccess(msgData, context.request, { startTime });
      }

      case 'send-learner-admin-message': {
        const msgData = await handleSendLearnerAdminMessage(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', msgData));
        return apiSuccess(msgData, context.request, { startTime });
      }

      case 'send-learner-college-admin-message': {
        const msgData = await handleSendLearnerCollegeAdminMessage(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', msgData));
        return apiSuccess(msgData, context.request, { startTime });
      }

      case 'send-educator-admin-message': {
        const msgData = await handleSendEducatorAdminMessage(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', msgData));
        return apiSuccess(msgData, context.request, { startTime });
      }

      case 'send-college-educator-admin-message': {
        const msgData = await handleSendCollegeEducatorAdminMessage(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', msgData));
        return apiSuccess(msgData, context.request, { startTime });
      }

      case 'get-conversation-messages':
        return apiSuccess(await handleGetConversationMessages(supabase, params), context.request, { startTime });

      case 'get-user-conversations':
        return apiSuccess(await handleGetUserConversations(supabase, params), context.request, { startTime });

      case 'get-unread-count':
        return apiSuccess(await handleGetUnreadCount(supabase, params), context.request, { startTime });

      case 'get-conversation-with-learner':
        return apiSuccess(await handleGetConversationWithLearner(supabase, params), context.request, { startTime });

      case 'archive-conversation': {
        await handleArchiveConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId, status: 'archived' }));
        return apiSuccess({ archived: true }, context.request, { startTime });
      }

      case 'unarchive-conversation': {
        await handleUnarchiveConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId, status: 'active' }));
        return apiSuccess({ unarchived: true }, context.request, { startTime });
      }

      case 'mark-as-read': {
        await handleMarkAsRead(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'messages', 'UPDATE', { id: params.messageId, is_read: true }));
        return apiSuccess({ read: true }, context.request, { startTime });
      }

      case 'mark-conversation-as-read': {
        await handleMarkConversationAsRead(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId, is_read: true }));
        return apiSuccess({ read: true }, context.request, { startTime });
      }

      case 'get-or-create-learner-admin-conversation': {
        const convData = await handleGetOrCreateLearnerAdminConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'get-or-create-learner-college-admin-conversation': {
        const convData = await handleGetOrCreateLearnerCollegeAdminConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'get-or-create-educator-admin-conversation': {
        const convData = await handleGetOrCreateEducatorAdminConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'get-or-create-college-educator-admin-conversation': {
        const convData = await handleGetOrCreateCollegeEducatorAdminConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', convData));
        return apiSuccess(convData, context.request, { startTime });
      }

      case 'delete-conversation-for-user': {
        await handleDeleteConversationForUser(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId }));
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'restore-conversation': {
        await handleRestoreConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId }));
        return apiSuccess({ restored: true }, context.request, { startTime });
      }

      case 'permanently-delete-conversation': {
        await handlePermanentlyDeleteConversation(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'DELETE', { id: params.conversationId }));
        return apiSuccess({ permanentlyDeleted: true }, context.request, { startTime });
      }

      case 'archive-conversation-for-user': {
        await handleArchiveConversationForUser(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId }));
        return apiSuccess({ archived: true }, context.request, { startTime });
      }

      case 'unarchive-conversation-for-user': {
        await handleUnarchiveConversationForUser(supabase, params);
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: params.conversationId }));
        return apiSuccess({ unarchived: true }, context.request, { startTime });
      }

      case 'fetch-recipients':
        return apiSuccess(await handleFetchRecipients(supabase, params), context.request, { startTime });

      case 'search-recipients':
        return apiSuccess(await handleSearchRecipients(supabase, params), context.request, { startTime });

      case 'resolve-user-context':
        return apiSuccess(await handleResolveUserContext(supabase, params), context.request, { startTime });

      case 'fetch-learner-school':
        return apiSuccess(await handleFetchLearnerSchool(supabase, params), context.request, { startTime });

      case 'fetch-learner-college':
        return apiSuccess(await handleFetchLearnerCollege(supabase, params), context.request, { startTime });

      case 'fetch-organization':
        return apiSuccess(await handleFetchOrganization(supabase, params), context.request, { startTime });

      case 'resolve-educator-by-email':
        return apiSuccess(await handleResolveEducatorByEmail(supabase, params), context.request, { startTime });

      case 'resolve-educator-by-id':
        return apiSuccess(await handleResolveEducatorById(supabase, params), context.request, { startTime });

      case 'fetch-learner-context':
        return apiSuccess(await handleFetchLearnerContext(supabase, params), context.request, { startTime });

      case 'fetch-learner-context-by-user-id':
        return apiSuccess(await handleFetchLearnerContext(supabase, params), context.request, { startTime });

      case 'fetch-departments-by-college':
        return apiSuccess(await handleFetchDepartmentsByCollege(supabase, params), context.request, { startTime });

      case 'fetch-programs-by-departments':
        return apiSuccess(await handleFetchProgramsByDepartments(supabase, params), context.request, { startTime });

      case 'fetch-learners-by-programs':
        return apiSuccess(await handleFetchLearnersByPrograms(supabase, params), context.request, { startTime });

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error('[Messaging Actions] Error:', error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => apiMethodNotAllowed(context.request));
