/**
 * Email API Configuration
 */

import type { PagesEnv } from '../../../src/functions-lib/types';

export interface EmailWorkerConfig {
  url: string;
  apiKey: string;
}

export function getEmailWorkerConfig(env: PagesEnv): EmailWorkerConfig {
  return {
    url: env.EMAIL_WORKER_URL || 'https://shared-email-api.dark-mode-d021.workers.dev',
    apiKey: env.EMAIL_WORKER_API_KEY || '',
  };
}

export const APP_URL = 'https://skillpassport.rareminds.in';
