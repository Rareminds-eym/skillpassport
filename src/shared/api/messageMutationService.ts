import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('message-mutation-service');

// Response wrapper from backend
interface ApiResp<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

// Types
export interface Conversation {
  id: string;
  learner_id?: string;
  recruiter_id?: string;
  educator_id?: string;
  school_id?: string;
  college_id?: string;
  application_id?: number;
  opportunity_id?: number;
  class_id?: number;
  subject?: string;
  status: 'active' | 'archived' | 'closed';
  conversation_type: 'learner_recruiter' | 'learner_educator' | 'educator_recruiter' | 'learner_admin' | 'learner_college_admin' | 'learner_college_educator' | 'educator_admin' | 'college_educator_admin';
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  receiver_id: string;
  receiver_type: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * Mutation service for message and conversation write operations
 * Handles all POST/PUT/DELETE requests
 */
export class MessageMutationService {
  /**
   * Create or get a learner-recruiter conversation
   */
  static async getOrCreateConversation(params: {
    learnerId: string;
    recruiterId: string;
    applicationId?: number | string;
    opportunityId?: number | string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create or get a learner-educator conversation
   */
  static async getOrCreateLearnerEducatorConversation(params: {
    learnerId: string;
    educatorId: string;
    classId?: string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-learner-educator-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateLearnerEducatorConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create or get a learner-college-lecturer conversation
   */
  static async getOrCreateLearnerCollegeLecturerConversation(params: {
    learnerId: string;
    collegeLecturerId: string;
    collegeId?: string;
    programSectionId?: string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-learner-college-lecturer-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateLearnerCollegeLecturerConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create or get a learner-admin conversation
   */
  static async getOrCreateLearnerAdminConversation(params: {
    learnerId: string;
    schoolId: string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-learner-admin-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateLearnerAdminConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create or get a learner-college-admin conversation
   */
  static async getOrCreateLearnerCollegeAdminConversation(params: {
    learnerId: string;
    collegeId: string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-learner-college-admin-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateLearnerCollegeAdminConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create or get an educator-admin conversation
   */
  static async getOrCreateEducatorAdminConversation(params: {
    educatorId: string;
    schoolId: string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-educator-admin-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateEducatorAdminConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create or get a college-educator-admin conversation
   */
  static async getOrCreateCollegeEducatorAdminConversation(params: {
    educatorId: string;
    collegeId: string;
    subject?: string;
  }): Promise<Conversation> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-or-create-college-educator-admin-conversation',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in getOrCreateCollegeEducatorAdminConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message to any recipient
   */
  static async sendMessage(params: {
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
  }): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-message',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in sendMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message to a learner-educator conversation
   */
  static async sendLearnerEducatorMessage(params: {
    conversationId: string;
    learnerId: string;
    educatorId: string;
    messageText: string;
    classId?: string;
    subject?: string;
  }): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-learner-educator-message',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in sendLearnerEducatorMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message to a learner-admin conversation
   */
  static async sendLearnerAdminMessage(params: {
    conversationId: string;
    learnerId: string;
    schoolId: string;
    messageText: string;
    subject?: string;
  }): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-learner-admin-message',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in sendLearnerAdminMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message to a learner-college-admin conversation
   */
  static async sendLearnerCollegeAdminMessage(params: {
    conversationId: string;
    learnerId: string;
    collegeId: string;
    messageText: string;
    subject?: string;
  }): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-learner-college-admin-message',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in sendLearnerCollegeAdminMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message to an educator-admin conversation
   */
  static async sendEducatorAdminMessage(params: {
    conversationId: string;
    educatorId: string;
    schoolId: string;
    messageText: string;
    subject?: string;
  }): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-educator-admin-message',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in sendEducatorAdminMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message to a college-educator-admin conversation
   */
  static async sendCollegeEducatorAdminMessage(params: {
    conversationId: string;
    educatorId: string;
    collegeId: string;
    messageText: string;
    subject?: string;
  }): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-college-educator-admin-message',
        ...params
      });
      return resp.data;
    } catch (error) {
      logger.error('Error in sendCollegeEducatorAdminMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  static async markAsRead(messageId: number): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'mark-as-read',
        messageId
      });
    } catch (error) {
      logger.error('Error in markAsRead', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark a conversation as read
   */
  static async markConversationAsRead(conversationId: string, userId: string, userType: string): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'mark-conversation-as-read',
        conversationId, userId, userType
      });
    } catch (error) {
      logger.error('Error in markConversationAsRead', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'archive-conversation',
        conversationId
      });
    } catch (error) {
      logger.error('Error in archiveConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Unarchive a conversation
   */
  static async unarchiveConversation(conversationId: string): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'unarchive-conversation',
        conversationId
      });
    } catch (error) {
      logger.error('Error in unarchiveConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Delete a conversation for a user
   */
  static async deleteConversationForUser(conversationId: string, userId: string, userType: string): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'delete-conversation-for-user',
        conversationId, userId, userType
      });
    } catch (error) {
      logger.error('Error in deleteConversationForUser', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Restore a conversation
   */
  static async restoreConversation(conversationId: string, userId: string, userType: string): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'restore-conversation',
        conversationId, userId, userType
      });
    } catch (error) {
      logger.error('Error in restoreConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Permanently delete a conversation
   */
  static async permanentlyDeleteConversation(conversationId: string): Promise<void> {
    try {
      await apiPost('/messaging/actions', {
        action: 'permanently-delete-conversation',
        conversationId
      });
    } catch (error) {
      logger.error('Error in permanentlyDeleteConversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
