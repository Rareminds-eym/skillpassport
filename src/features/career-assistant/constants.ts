/**
 * Career Assistant Constants
 * Centralized configuration values
 */

// Virtual scrolling configuration
export const INITIAL_VISIBLE_MESSAGES = 5;
export const INITIAL_VISIBLE_CONVERSATIONS = 10;
export const MESSAGE_PRELOAD_MARGIN = '600px';
export const CONVERSATION_PRELOAD_MARGIN = '300px';

// Message heights for virtual scrolling
export const USER_MESSAGE_HEIGHT = 80;
export const ASSISTANT_MESSAGE_HEIGHT = 150;
export const CONVERSATION_ITEM_HEIGHT = 70;

// Pagination
export const CONVERSATIONS_PER_PAGE = 20;
export const MAX_MESSAGES_PER_CONVERSATION = 50;

// Rate limiting
export const MIN_MESSAGE_INTERVAL_MS = 1000; // 1 second between messages

// Input validation
export const MAX_INPUT_LENGTH = 10000;
export const MIN_INPUT_LENGTH = 1;
