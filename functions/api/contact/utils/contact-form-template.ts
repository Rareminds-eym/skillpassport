/**
 * Contact Form Email Template
 * Reusable email template system with brand configuration support
 */

// XSS-safe HTML escaping
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Brand configuration interface
export interface BrandConfig {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  logoType: 'text' | 'image';
  logoUrl?: string;
  replyEmail: string;
  websiteUrl: string;
}

// Contact form data interface
export interface ContactFormData {
  name?: string;
  email?: string;
  organization?: string;
  user_type?: string;
  message?: string;
}

// Generate email styles
function generateStyles(config: BrandConfig): string {
  return `
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 15px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-card {
      background: white;
      border-radius: 8px;
      padding: 25px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .info-row {
      display: table;
      width: 100%;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 15px;
    }
    .info-row:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      font-weight: bold;
      color: #6b7280;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      color: #111827;
      font-size: 15px;
      word-wrap: break-word;
    }
    .message-box {
      background: #f3f4f6;
      border-left: 4px solid ${config.primaryColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .message-box p {
      margin: 0;
      color: #374151;
      line-height: 1.8;
    }
    .cta-button {
      display: inline-block;
      background: ${config.primaryColor};
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: ${config.secondaryColor};
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 13px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: ${config.primaryColor};
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .header {
        padding: 30px 20px !important;
      }
      .content {
        padding: 20px !important;
      }
      .info-card {
        padding: 20px !important;
      }
    }
  `;
}

// Generate email header
function generateHeader(config: BrandConfig): string {
  return `
    <div class="header">
      ${config.logoType === 'image' && config.logoUrl
        ? `<img src="${escapeHtml(config.logoUrl)}" alt="${escapeHtml(config.brandName)}" class="logo" />`
        : `<h1>${escapeHtml(config.brandName)}</h1>`
      }
      <p>New Contact Form Submission</p>
    </div>
  `;
}

// Generate info card
function generateInfoCard(data: ContactFormData): string {
  const fields = [
    { label: 'Name', value: data.name },
    { label: 'Email', value: data.email },
    { label: 'Organization', value: data.organization },
    { label: 'User Type', value: data.user_type }
  ];

  const rows = fields
    .filter(field => field.value)
    .map(field => `
      <div class="info-row">
        <div class="info-label">${escapeHtml(field.label)}</div>
        <div class="info-value">${escapeHtml(field.value!)}</div>
      </div>
    `)
    .join('');

  return `<div class="info-card">${rows}</div>`;
}

// Generate message section
function generateMessageSection(message?: string): string {
  if (!message) return '';
  
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br/>');
  
  return `
    <div class="message-box">
      <div class="info-label" style="margin-bottom: 10px;">Message</div>
      <p>${escapedMessage}</p>
    </div>
  `;
}

// Generate CTA button
function generateCTAButton(config: BrandConfig, email?: string): string {
  if (!email) return '';
  
  return `
    <div style="text-align: center;">
      <a href="mailto:${escapeHtml(email)}" class="cta-button">
        Reply to ${escapeHtml(email)}
      </a>
    </div>
  `;
}

// Generate footer
function generateFooter(config: BrandConfig): string {
  return `
    <div class="footer">
      <p>${escapeHtml(config.footerText)}</p>
      <p>© ${new Date().getFullYear()} ${escapeHtml(config.brandName)}. All rights reserved.</p>
      <p><a href="${escapeHtml(config.websiteUrl)}">${escapeHtml(config.websiteUrl)}</a></p>
    </div>
  `;
}

// Main template generator
export function generateContactFormEmail(
  data: ContactFormData,
  config: BrandConfig
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Contact Form Submission - ${escapeHtml(config.brandName)}</title>
  <style>${generateStyles(config)}</style>
</head>
<body>
  <div class="container">
    ${generateHeader(config)}
    <div class="content">
      <p style="margin-top: 0; color: #374151; font-size: 15px;">
        You have received a new contact form submission from your website.
      </p>
      ${generateInfoCard(data)}
      ${generateMessageSection(data.message)}
      ${generateCTAButton(config, data.email)}
    </div>
    ${generateFooter(config)}
  </div>
</body>
</html>
  `.trim();
}
