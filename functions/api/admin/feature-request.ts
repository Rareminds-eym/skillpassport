/**
 * Enterprise Module Access Request Endpoint
 * POST /api/admin/feature-request
 *
 * Receives activation requests submitted by administrators for unincluded Hybrid modules.
 * Forwards details to the enterprise sales & institutional onboarding desk (marketing@rareminds.in)
 * and records the request for tracking.
 */

import { sendEmailSafe } from '../../lib/email-service';
import { apiLogger } from '../../lib/logger';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import type { PagesFunction } from '../../lib/types';

export const onRequestPost: PagesFunction = async (context) => {
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', context.request);
  }

  const {
    featureKey,
    featureLabel,
    urgency = 'immediate',
    notes = '',
    phone,
    userPhone,
    userId,
    userEmail,
    userName,
    orgId,
    role = 'admin',
    timestamp = new Date().toISOString(),
  } = body || {};

  if (!featureKey || typeof featureKey !== 'string') {
    return apiError(400, 'VALIDATION_ERROR', 'featureKey is required', context.request);
  }

  let cleanPhone = String(phone || userPhone || '').trim();

  apiLogger.info('[feature-request] Received module access request', {
    featureKey,
    featureLabel,
    urgency,
    userId,
    userEmail,
    cleanPhone,
    orgId,
    role,
  });

  let orgName = 'Institutional Partner';

  try {
    const supabase = getServiceClient(context.env as any);
    if (orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .maybeSingle();

      if (org?.name) {
        orgName = org.name;
      }
    }

    // If phone was not provided in request payload, attempt to look up from user profile
    if (!cleanPhone && userId) {
      const { data: profile } = await supabase
        .from('users')
        .select('phone, phone_number')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.phone || profile?.phone_number) {
        cleanPhone = String(profile.phone || profile.phone_number).trim();
      }
    }
  } catch (err) {
    apiLogger.warn('[feature-request] Failed to look up organization or user details', { err });
  }

  function formatPhoneNumber(num: string): string {
    const cleaned = num.replace(/[^\d+]/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith('+91')) {
      return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
    }
    return num;
  }

  const urgencyConfig: Record<string, { label: string; badgeBg: string; badgeText: string; borderColor: string }> = {
    immediate: {
      label: 'Immediate (Current Academic Session)',
      badgeBg: '#fef2f2',
      badgeText: '#991b1b',
      borderColor: '#fecaca',
    },
    next_term: {
      label: 'Next Academic Term',
      badgeBg: '#eff6ff',
      badgeText: '#1e40af',
      borderColor: '#bfdbfe',
    },
    planning: {
      label: 'Evaluating for Future Adoption',
      badgeBg: '#f8fafc',
      badgeText: '#334155',
      borderColor: '#e2e8f0',
    },
  };

  const urgencyMeta = urgencyConfig[urgency] || urgencyConfig.immediate;
  const cleanRequesterName = userName || 'Institution Administrator';
  const cleanRequesterEmail = userEmail || 'No contact email provided';
  const cleanLabel = featureLabel || featureKey;
  const formattedPhone = cleanPhone ? formatPhoneNumber(cleanPhone) : '';

  const roleLabels: Record<string, string> = {
    college_admin: 'College Administrator',
    school_admin: 'School Administrator',
    university_admin: 'University Administrator',
    platform_admin: 'Platform Administrator',
    system_admin: 'System Administrator',
    institution_admin: 'Institution Administrator',
    admin: 'Administrator',
    principal: 'Principal / Director',
    dean: 'Dean / Academic Head',
    hod: 'Head of Department',
    faculty: 'Faculty Member',
    placement_officer: 'Placement Officer',
  };
  const roleDisplay = roleLabels[role] || (role ? role.replace(/_/g, ' ') : 'Administrator');

  const formattedDate = new Date(timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }) + ' IST';

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Access Request: ${cleanLabel}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  <!-- Hidden Preheader -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #f9fafb; opacity: 0;">
    Module access request: ${cleanLabel} for ${orgName} (${cleanRequesterName}).
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; text-align: left;">
          <tr>
            <td style="padding: 32px 36px;">

              <!-- Minimal Brand Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px;">
                <tr>
                  <td style="font-size: 13px; font-weight: 600; color: #111827; letter-spacing: -0.2px;">
                    RareMinds <span style="font-weight: 400; color: #6b7280;">SkillPassport</span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #6b7280;">
                    Module Request
                  </td>
                </tr>
              </table>

              <!-- Title & Context -->
              <h1 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; line-height: 1.4;">
                Request to activate ${cleanLabel}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #4b5563;">
                An administrator at <strong>${orgName}</strong> has submitted a request to unlock the <strong>${cleanLabel}</strong> module (<code style="font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; color: #374151; background: #f3f4f6; padding: 2px 5px; border-radius: 4px;">${featureKey}</code>) for their institution.
              </p>

              <!-- Structured Details Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border-top: 1px solid #e5e7eb; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; width: 130px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                    Module
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #f3f4f6;">
                    ${cleanLabel} <span style="color: #6b7280; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; font-weight: 400;">(${featureKey})</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                    Institution
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #f3f4f6;">
                    ${orgName}
                    ${orgId ? `<div style="font-size: 11px; color: #9ca3af; font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 400; margin-top: 2px;">ID: ${orgId}</div>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                    Requester
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #f3f4f6;">
                    ${cleanRequesterName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                    Email
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #f3f4f6;">
                    <a href="mailto:${cleanRequesterEmail}?subject=Re: Module Access Request: ${encodeURIComponent(cleanLabel)} - ${encodeURIComponent(orgName)}" style="color: #2563eb; text-decoration: none;">
                      ${cleanRequesterEmail}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                    Phone
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #f3f4f6;">
                    ${cleanPhone ? `<a href="tel:${cleanPhone}" style="color: #111827; text-decoration: none;">${formattedPhone}</a>` : '<span style="color: #9ca3af; font-weight: 400;">Not provided</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                    Role
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #f3f4f6;">
                    ${roleDisplay} <span style="color: #9ca3af; font-size: 12px; font-weight: 400;">(${role})</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                    Urgency
                  </td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #111827; border-bottom: 1px solid #e5e7eb;">
                    ${urgencyMeta.label}
                  </td>
                </tr>
              </table>

              <!-- Requester Notes Callout (Conditional) -->
              ${notes ? `
              <div style="margin: 0 0 24px 0; padding: 12px 16px; background-color: #f9fafb; border-left: 3px solid #d1d5db; border-radius: 0 4px 4px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Requester notes
                </div>
                <div style="font-size: 13px; color: #374151; line-height: 20px; white-space: pre-wrap;">${notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>
              ` : ''}

              <!-- Action CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; margin-bottom: 8px;">
                <tr>
                  <td>
                    <a href="mailto:${cleanRequesterEmail}?subject=Re: Module Access Request: ${encodeURIComponent(cleanLabel)} - ${encodeURIComponent(orgName)}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; padding: 10px 18px; border-radius: 6px;">
                      Reply via Email
                    </a>
                  </td>
                  ${cleanPhone ? `
                  <td style="padding-left: 14px; font-size: 13px; color: #6b7280;">
                    or <a href="tel:${cleanPhone}" style="color: #2563eb; text-decoration: underline;">call ${formattedPhone}</a>
                  </td>
                  ` : ''}
                </tr>
              </table>

              <!-- Minimal Footer -->
              <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; line-height: 18px;">
                Submitted on ${formattedDate} via SkillPassport Admin Portal.<br>
                RareMinds Enterprise Platform
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const urgencyPrefix = urgency === 'immediate' ? '[Urgent Module Request]' : '[Module Request]';
  const emailSubject = `${urgencyPrefix} ${cleanLabel} – ${orgName}`;

  // Dispatch email notification to sales desk
  await sendEmailSafe(context.env as any, {
    to: 'marketing@rareminds.in',
    subject: emailSubject,
    html: emailHtml,
    text: `Enterprise Module Activation Request\n=======================================\nModule: ${cleanLabel} (${featureKey})\nInstitution: ${orgName} (${orgId || 'N/A'})\nRequester: ${cleanRequesterName} <${cleanRequesterEmail}>\nRole: ${roleDisplay}\n${cleanPhone ? `Phone: ${formattedPhone}\n` : ''}Deployment Urgency: ${urgencyMeta.label}\n${notes ? `Requester Notes:\n${notes}\n` : ''}Submitted: ${formattedDate}\nOrigin: SkillPassport Admin Portal`,
  });

  return apiSuccess(
    {
      received: true,
      featureKey,
      message: 'Module access request logged and dispatched to enterprise support.',
    },
    context.request
  );
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
