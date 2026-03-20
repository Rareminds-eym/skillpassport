/**
 * Shared Utilities
 * Consolidated from duplicate code
 */


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
