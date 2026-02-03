/**
 * Application constants and configuration
 */

export const APP_URL = 'https://skillpassport.rareminds.in';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const DEFAULT_FROM_EMAIL = 'noreply@rareminds.in';
export const DEFAULT_FROM_NAME = 'Skill Passport';

export const COUNTDOWN_DAYS = [8, 7, 6, 5, 4, 3, 2, 1];
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BATCH_SIZE = 10;

export const EMAIL_STATUS = {
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  REJECTED: 'rejected',
};

export const ERROR_TYPES = {
  PERMANENT: 'permanent',
  TEMPORARY: 'temporary',
  UNKNOWN: 'unknown',
};
