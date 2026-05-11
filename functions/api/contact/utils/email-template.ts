/**
 * Email template generator for contact form notifications
 */

import type { ContactFormRequest } from '../types';

/**
 * Generate HTML email template for contact form submission
 */
export function generateEmailHTML(formData: ContactFormRequest): string {
  const { name, email, organization, user_type, message } = formData;

  // User type display mapping
  const userTypeDisplay: Record<string, string> = {
    learner: 'Learner',
    institution: 'Institution',
    employer: 'Employer',
    other: 'Other'
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 3px solid #E94235;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #E94235;
      font-size: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
    .badge-learner { background-color: #E3F2FD; color: #1976D2; }
    .badge-institution { background-color: #F3E5F5; color: #7B1FA2; }
    .badge-employer { background-color: #E8F5E9; color: #388E3C; }
    .badge-other { background-color: #FFF3E0; color: #F57C00; }
    .field {
      margin-bottom: 20px;
    }
    .field-label {
      font-weight: 600;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 16px;
      color: #333;
      word-wrap: break-word;
    }
    .message-box {
      background-color: #f8f9fa;
      border-left: 4px solid #E94235;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .reply-button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background-color: #E94235;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Form Submission</h1>
      <span class="badge badge-${user_type}">${userTypeDisplay[user_type] || user_type}</span>
    </div>

    <div class="field">
      <div class="field-label">Name</div>
      <div class="field-value">${escapeHtml(name)}</div>
    </div>

    <div class="field">
      <div class="field-label">Email</div>
      <div class="field-value">
        <a href="mailto:${escapeHtml(email)}" style="color: #E94235; text-decoration: none;">
          ${escapeHtml(email)}
        </a>
      </div>
    </div>

    ${organization ? `
    <div class="field">
      <div class="field-label">Organization</div>
      <div class="field-value">${escapeHtml(organization)}</div>
    </div>
    ` : ''}

    <div class="field">
      <div class="field-label">User Type</div>
      <div class="field-value">${userTypeDisplay[user_type] || user_type}</div>
    </div>

    <div class="field">
      <div class="field-label">Message</div>
      <div class="message-box">
        ${escapeHtml(message).replace(/\n/g, '<br>')}
      </div>
    </div>

    <a href="mailto:${escapeHtml(email)}" class="reply-button">
      Reply to ${escapeHtml(name)}
    </a>

    <div class="footer">
      <p>This email was sent from the Skill Passport contact form.</p>
      <p>Submitted on ${new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'short'
      })}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
