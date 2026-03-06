/**
 * Client for Shared Email API Worker
 */

import type { EmailWorkerConfig } from '../config';

// ==================== REQUEST TYPES ====================

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  metadata?: Record<string, any>;
}

export interface EmailWorkerResponse {
  success: boolean;
  messageId?: string;
  recipient?: string | string[];
  timestamp?: string;
  error?: string;
  errorCode?: string;
}

// ==================== WORKER CLIENT ====================

export class EmailWorkerClient {
  constructor(private config: EmailWorkerConfig) {}
  
  /**
   * Send raw HTML email via worker
   */
  async sendEmail(request: SendEmailRequest): Promise<EmailWorkerResponse> {
    try {
      const response = await fetch(`${this.config.url}/send`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json() as EmailWorkerResponse;
      
      if (!response.ok) {
        throw new Error(data.error || `Worker returned ${response.status}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Email worker error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
  
  /**
   * Check worker health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/health`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });
      
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
