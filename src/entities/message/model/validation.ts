/**
 * Message Entity - Validation Logic
 */

import type {
  Message,
  Conversation,
  UserType,
  ConversationType,
  ConversationStatus,
  SendMessageRequest
} from './types';

// ============================================================================
// User Type Validation
// ============================================================================

const VALID_USER_TYPES: UserType[] = [
  'student',
  'recruiter',
  'educator',
  'college_educator',
  'school_admin',
  'college_admin',
  'university_admin'
];

export function isValidUserType(type: string): type is UserType {
  return VALID_USER_TYPES.includes(type as UserType);
}

// ============================================================================
// Conversation Type Validation
// ============================================================================

const VALID_CONVERSATION_TYPES: ConversationType[] = [
  'student_recruiter',
  'student_educator',
  'educator_recruiter',
  'student_admin',
  'student_college_admin',
  'student_college_educator',
  'educator_admin',
  'college_educator_admin'
];

export function isValidConversationType(type: string): type is ConversationType {
  return VALID_CONVERSATION_TYPES.includes(type as ConversationType);
}

// ============================================================================
// Conversation Status Validation
// ============================================================================

const VALID_CONVERSATION_STATUSES: ConversationStatus[] = ['active', 'archived', 'closed'];

export function isValidConversationStatus(status: string): status is ConversationStatus {
  return VALID_CONVERSATION_STATUSES.includes(status as ConversationStatus);
}

// ============================================================================
// Message Validation
// ============================================================================

export function validateMessage(message: Partial<Message>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.conversation_id) {
    errors.push('Conversation ID is required');
  }

  if (!message.sender_id) {
    errors.push('Sender ID is required');
  }

  if (!message.sender_type) {
    errors.push('Sender type is required');
  } else if (!isValidUserType(message.sender_type)) {
    errors.push('Invalid sender type');
  }

  if (!message.receiver_id) {
    errors.push('Receiver ID is required');
  }

  if (!message.receiver_type) {
    errors.push('Receiver type is required');
  } else if (!isValidUserType(message.receiver_type)) {
    errors.push('Invalid receiver type');
  }

  if (!message.message_text || message.message_text.trim().length === 0) {
    errors.push('Message text is required');
  } else if (message.message_text.length > 5000) {
    errors.push('Message text cannot exceed 5000 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Send Message Request Validation
// ============================================================================

export function validateSendMessageRequest(request: Partial<SendMessageRequest>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.conversation_id) {
    errors.push('Conversation ID is required');
  }

  if (!request.sender_id) {
    errors.push('Sender ID is required');
  }

  if (!request.sender_type) {
    errors.push('Sender type is required');
  } else if (!isValidUserType(request.sender_type)) {
    errors.push('Invalid sender type');
  }

  if (!request.receiver_id) {
    errors.push('Receiver ID is required');
  }

  if (!request.receiver_type) {
    errors.push('Receiver type is required');
  } else if (!isValidUserType(request.receiver_type)) {
    errors.push('Invalid receiver type');
  }

  if (!request.message_text || request.message_text.trim().length === 0) {
    errors.push('Message text is required');
  } else if (request.message_text.length > 5000) {
    errors.push('Message text cannot exceed 5000 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Message Text Validation
// ============================================================================

export function isValidMessageText(text: string): boolean {
  return text.trim().length > 0 && text.length <= 5000;
}

export function sanitizeMessageText(text: string): string {
  return text.trim();
}

// ============================================================================
// Attachment Validation
// ============================================================================

export function validateAttachment(attachment: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!attachment.file_name) {
    errors.push('File name is required');
  }

  if (!attachment.file_url) {
    errors.push('File URL is required');
  }

  if (!attachment.file_type) {
    errors.push('File type is required');
  }

  if (attachment.file_size && attachment.file_size > 10 * 1024 * 1024) {
    errors.push('File size cannot exceed 10MB');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
