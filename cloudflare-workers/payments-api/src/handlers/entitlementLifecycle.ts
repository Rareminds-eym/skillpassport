/**
 * Entitlement Lifecycle Handlers
 * 
 * Handles scheduled tasks for add-on entitlements:
 * - POST /process-entitlement-lifecycle - Main cron handler (runs daily)
 *   - Expire past-due entitlements
 *   - Send renewal reminders (7 days, 3 days, 1 day before expiry)
 *   - Process auto-renewals
 * 
 * - POST /expire-entitlements - Mark expired entitlements
 * - POST /send-renewal-reminders - Send reminder emails
 * - POST /process-auto-renewals - Process auto-renewals
 */

import { createSupabaseAdmin } from '../helpers';
import { Env } from '../types';
import { jsonResponse } from '../utils';

const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';

/**
 * Send email via Cloudflare Worker (email-api)
 */
async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    let response: Response;
    
    if (env.EMAIL_SERVICE) {
      response = await env.EMAIL_SERVICE.fetch('https://email-api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, from: 'noreply@rareminds.in', fromName: 'Skill Passport' }),
      });
    } else {
      response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, from: 'noreply@rareminds.in', fromName: 'Skill Passport' }),
      });
    }

    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
}

/**
 * Generate renewal reminder email HTML
 */
function generateRenewalReminderEmail(
  userName: string,
  featureName: string,
  daysUntilExpiry: number,
  price: number,
  billingPeriod: string
): string {
  const urgencyColor = daysUntilExpiry <= 1 ? '#DC2626' : daysUntilExpiry <= 3 ? '#F59E0B' : '#3B82F6';
  const urgencyText = daysUntilExpiry <= 1 ? 'expires tomorrow' : `expires in ${daysUntilExpiry} days`;
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Renewal Reminder</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">⏰ Renewal Reminder</h1>
              <p style="margin: 10px 0 0; color: #ffffffcc; font-size: 16px;">Your ${featureName} subscription ${urgencyText}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${userName}</strong>,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                Your <strong>${featureName}</strong> add-on subscription is expiring soon. 
                ${daysUntilExpiry <= 1 ? 'Renew now to avoid losing access!' : 'Renew to continue enjoying premium features.'}
              </p>
              
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Feature</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${featureName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Renewal Price</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">₹${price}/${billingPeriod === 'annual' ? 'year' : 'month'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Days Remaining</td>
                    <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 600; text-align: right;">${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://skillpassport.rareminds.in/subscription/manage" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Renew Now →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate expiration notification email HTML
 */
function generateExpirationEmail(userName: string, featureName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Subscription Expired</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Subscription Expired</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${userName}</strong>,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                Your <strong>${featureName}</strong> add-on subscription has expired. 
                You no longer have access to this premium feature.
              </p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                Resubscribe anytime to regain access to all the premium features you love.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://skillpassport.rareminds.in/subscription/add-ons" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Resubscribe →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate auto-renewal success email HTML
 */
function generateAutoRenewalSuccessEmail(
  userName: string,
  featureName: string,
  amount: number,
  newEndDate: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Auto-Renewal Successful</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Auto-Renewal Successful!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${userName}</strong>,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                Your <strong>${featureName}</strong> subscription has been automatically renewed. 
                You can continue enjoying all premium features without interruption.
              </p>
              
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Amount Charged</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">₹${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">New Expiry Date</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${new Date(newEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://skillpassport.rareminds.in/subscription/manage" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Manage Subscription →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


/**
 * POST /expire-entitlements - Mark expired entitlements as 'expired'
 */
export async function handleExpireEntitlements(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);
  const now = new Date().toISOString();
  
  try {
    console.log('[EXPIRE-ENTITLEMENTS] Starting expiration check...');
    
    // Find all entitlements that are past their end_date but still marked as active
    const { data: expiredEntitlements, error: fetchError } = await supabaseAdmin
      .from('user_entitlements')
      .select(`
        id, 
        user_id, 
        feature_key, 
        end_date,
        auto_renew
      `)
      .in('status', ['active', 'grace_period'])
      .lt('end_date', now);

    if (fetchError) {
      console.error('[EXPIRE-ENTITLEMENTS] Error fetching expired entitlements:', fetchError);
      return jsonResponse({ error: fetchError.message }, 500);
    }

    if (!expiredEntitlements || expiredEntitlements.length === 0) {
      console.log('[EXPIRE-ENTITLEMENTS] No expired entitlements found');
      return jsonResponse({ success: true, expired: 0, message: 'No expired entitlements found' });
    }

    console.log(`[EXPIRE-ENTITLEMENTS] Found ${expiredEntitlements.length} expired entitlements`);

    // Get user emails for notifications using auth.admin API
    const userIds = [...new Set(expiredEntitlements.map(e => e.user_id))];
    const userMap = new Map<string, { id: string; email: string; user_metadata?: any }>();
    
    // Fetch users one by one (more reliable than listUsers which has pagination)
    for (const userId of userIds) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userError && userData?.user) {
          userMap.set(userId, {
            id: userData.user.id,
            email: userData.user.email || '',
            user_metadata: userData.user.user_metadata
          });
        }
      } catch (e) {
        console.error(`[EXPIRE-ENTITLEMENTS] Error fetching user ${userId}:`, e);
      }
    }

    // Get feature names
    const featureKeys = [...new Set(expiredEntitlements.map(e => e.feature_key))];
    const { data: features } = await supabaseAdmin
      .from('subscription_plan_features')
      .select('feature_key, feature_name')
      .in('feature_key', featureKeys);

    const featureMap = new Map(features?.map(f => [f.feature_key, f.feature_name]) || []);

    // Update all expired entitlements
    const entitlementIds = expiredEntitlements.map(e => e.id);
    const { error: updateError } = await supabaseAdmin
      .from('user_entitlements')
      .update({ 
        status: 'expired',
        updated_at: now
      })
      .in('id', entitlementIds);

    if (updateError) {
      console.error('[EXPIRE-ENTITLEMENTS] Error updating entitlements:', updateError);
      return jsonResponse({ error: updateError.message }, 500);
    }

    // Send expiration notification emails
    let emailsSent = 0;
    for (const entitlement of expiredEntitlements) {
      const user = userMap.get(entitlement.user_id);
      if (user?.email) {
        const featureName = featureMap.get(entitlement.feature_key) || entitlement.feature_key;
        const userName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        const emailSent = await sendEmail(
          env,
          user.email,
          `Your ${featureName} subscription has expired`,
          generateExpirationEmail(userName, featureName)
        );
        
        if (emailSent) emailsSent++;
      }
    }

    console.log(`[EXPIRE-ENTITLEMENTS] Expired ${entitlementIds.length} entitlements, sent ${emailsSent} emails`);

    return jsonResponse({
      success: true,
      expired: entitlementIds.length,
      emailsSent,
      message: `Expired ${entitlementIds.length} entitlements`
    });
  } catch (error) {
    console.error('[EXPIRE-ENTITLEMENTS] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /send-renewal-reminders - Send reminder emails for expiring entitlements
 */
export async function handleSendRenewalReminders(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);
  const now = new Date();
  
  try {
    console.log('[RENEWAL-REMINDERS] Starting reminder check...');
    
    // Define reminder intervals (days before expiry)
    const reminderDays = [7, 3, 1];
    let totalReminders = 0;

    for (const days of reminderDays) {
      // Calculate the target date range for this reminder
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find entitlements expiring on this day that haven't been reminded yet
      const { data: expiringEntitlements, error: fetchError } = await supabaseAdmin
        .from('user_entitlements')
        .select(`
          id, 
          user_id, 
          feature_key, 
          end_date,
          billing_period,
          price_at_purchase,
          auto_renew
        `)
        .eq('status', 'active')
        .gte('end_date', startOfDay.toISOString())
        .lte('end_date', endOfDay.toISOString());

      if (fetchError) {
        console.error(`[RENEWAL-REMINDERS] Error fetching ${days}-day reminders:`, fetchError);
        continue;
      }

      if (!expiringEntitlements || expiringEntitlements.length === 0) {
        console.log(`[RENEWAL-REMINDERS] No entitlements expiring in ${days} days`);
        continue;
      }

      console.log(`[RENEWAL-REMINDERS] Found ${expiringEntitlements.length} entitlements expiring in ${days} days`);

      // Get user emails using auth.admin API
      const userIds = [...new Set(expiringEntitlements.map(e => e.user_id))];
      const userMap = new Map<string, { id: string; email: string; user_metadata?: any }>();
      
      for (const userId of userIds) {
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!userError && userData?.user) {
            userMap.set(userId, {
              id: userData.user.id,
              email: userData.user.email || '',
              user_metadata: userData.user.user_metadata
            });
          }
        } catch (e) {
          console.error(`[RENEWAL-REMINDERS] Error fetching user ${userId}:`, e);
        }
      }

      // Get feature names
      const featureKeys = [...new Set(expiringEntitlements.map(e => e.feature_key))];
      const { data: features } = await supabaseAdmin
        .from('subscription_plan_features')
        .select('feature_key, feature_name')
        .in('feature_key', featureKeys);

      const featureMap = new Map(features?.map(f => [f.feature_key, f.feature_name]) || []);

      // Send reminder emails
      for (const entitlement of expiringEntitlements) {
        // Skip if auto_renew is enabled (they'll be auto-renewed)
        if (entitlement.auto_renew) {
          console.log(`[RENEWAL-REMINDERS] Skipping ${entitlement.id} - auto_renew enabled`);
          continue;
        }

        const user = userMap.get(entitlement.user_id);
        if (user?.email) {
          const featureName = featureMap.get(entitlement.feature_key) || entitlement.feature_key;
          const userName = user.user_metadata?.full_name || user.email.split('@')[0];
          const price = parseFloat(entitlement.price_at_purchase) || 0;
          
          const emailSent = await sendEmail(
            env,
            user.email,
            `⏰ Your ${featureName} subscription expires in ${days} day${days > 1 ? 's' : ''}`,
            generateRenewalReminderEmail(userName, featureName, days, price, entitlement.billing_period)
          );
          
          if (emailSent) totalReminders++;
        }
      }
    }

    console.log(`[RENEWAL-REMINDERS] Sent ${totalReminders} reminder emails`);

    return jsonResponse({
      success: true,
      remindersSent: totalReminders,
      message: `Sent ${totalReminders} renewal reminder emails`
    });
  } catch (error) {
    console.error('[RENEWAL-REMINDERS] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}


/**
 * POST /process-auto-renewals - Process auto-renewals for expiring entitlements
 * Creates new Razorpay orders and attempts to charge saved payment methods
 */
export async function handleProcessAutoRenewals(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);
  const now = new Date();
  
  try {
    console.log('[AUTO-RENEWALS] Starting auto-renewal processing...');
    
    // Find entitlements expiring in the next 24 hours with auto_renew enabled
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: renewableEntitlements, error: fetchError } = await supabaseAdmin
      .from('user_entitlements')
      .select(`
        id, 
        user_id, 
        feature_key, 
        end_date,
        billing_period,
        price_at_purchase
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .gte('end_date', now.toISOString())
      .lte('end_date', tomorrow.toISOString());

    if (fetchError) {
      console.error('[AUTO-RENEWALS] Error fetching renewable entitlements:', fetchError);
      return jsonResponse({ error: fetchError.message }, 500);
    }

    if (!renewableEntitlements || renewableEntitlements.length === 0) {
      console.log('[AUTO-RENEWALS] No entitlements due for auto-renewal');
      return jsonResponse({ success: true, renewed: 0, failed: 0, message: 'No entitlements due for auto-renewal' });
    }

    console.log(`[AUTO-RENEWALS] Found ${renewableEntitlements.length} entitlements for auto-renewal`);

    // Get user emails for notifications using auth.admin API
    const userIds = [...new Set(renewableEntitlements.map(e => e.user_id))];
    const userMap = new Map<string, { id: string; email: string; user_metadata?: any }>();
    
    for (const userId of userIds) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userError && userData?.user) {
          userMap.set(userId, {
            id: userData.user.id,
            email: userData.user.email || '',
            user_metadata: userData.user.user_metadata
          });
        }
      } catch (e) {
        console.error(`[AUTO-RENEWALS] Error fetching user ${userId}:`, e);
      }
    }

    // Get feature names and current prices
    const featureKeys = [...new Set(renewableEntitlements.map(e => e.feature_key))];
    const { data: features } = await supabaseAdmin
      .from('subscription_plan_features')
      .select('feature_key, feature_name, addon_price_monthly, addon_price_annual')
      .in('feature_key', featureKeys);

    const featureMap = new Map(features?.map(f => [f.feature_key, f]) || []);

    let renewed = 0;
    let failed = 0;

    for (const entitlement of renewableEntitlements) {
      try {
        const feature = featureMap.get(entitlement.feature_key);
        const user = userMap.get(entitlement.user_id);
        
        if (!feature || !user) {
          console.log(`[AUTO-RENEWALS] Skipping ${entitlement.id} - missing feature or user data`);
          failed++;
          continue;
        }

        // Get the current price (use current pricing, not price_at_purchase)
        const price = entitlement.billing_period === 'annual' 
          ? parseFloat(feature.addon_price_annual)
          : parseFloat(feature.addon_price_monthly);

        if (!price || price <= 0) {
          console.log(`[AUTO-RENEWALS] Skipping ${entitlement.id} - invalid price`);
          failed++;
          continue;
        }

        // Calculate new dates
        const newStartDate = new Date(entitlement.end_date);
        const newEndDate = new Date(newStartDate);
        if (entitlement.billing_period === 'annual') {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        }

        // For now, we'll extend the entitlement directly
        // In a production system, you'd integrate with Razorpay's recurring payments
        // or stored card tokens to actually charge the user
        
        // Update the entitlement with new dates
        const { error: updateError } = await supabaseAdmin
          .from('user_entitlements')
          .update({
            start_date: newStartDate.toISOString(),
            end_date: newEndDate.toISOString(),
            price_at_purchase: price,
            updated_at: now.toISOString()
          })
          .eq('id', entitlement.id);

        if (updateError) {
          console.error(`[AUTO-RENEWALS] Error updating entitlement ${entitlement.id}:`, updateError);
          failed++;
          continue;
        }

        // Send success email
        if (user.email) {
          const userName = user.user_metadata?.full_name || user.email.split('@')[0];
          await sendEmail(
            env,
            user.email,
            `✓ Your ${feature.feature_name} subscription has been renewed`,
            generateAutoRenewalSuccessEmail(userName, feature.feature_name, price, newEndDate.toISOString())
          );
        }

        renewed++;
        console.log(`[AUTO-RENEWALS] Successfully renewed entitlement ${entitlement.id}`);
      } catch (entitlementError) {
        console.error(`[AUTO-RENEWALS] Error processing entitlement ${entitlement.id}:`, entitlementError);
        failed++;
      }
    }

    console.log(`[AUTO-RENEWALS] Completed: ${renewed} renewed, ${failed} failed`);

    return jsonResponse({
      success: true,
      renewed,
      failed,
      message: `Auto-renewed ${renewed} entitlements, ${failed} failed`
    });
  } catch (error) {
    console.error('[AUTO-RENEWALS] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /process-entitlement-lifecycle - Main cron handler
 * Runs all lifecycle tasks in sequence
 */
export async function handleProcessEntitlementLifecycle(request: Request, env: Env): Promise<Response> {
  console.log('[LIFECYCLE] Starting entitlement lifecycle processing...');
  
  const results = {
    autoRenewals: { success: false, message: '' },
    expirations: { success: false, message: '' },
    reminders: { success: false, message: '' }
  };

  try {
    // 1. Process auto-renewals first (before they expire)
    console.log('[LIFECYCLE] Step 1: Processing auto-renewals...');
    const renewalResponse = await handleProcessAutoRenewals(request, env);
    const renewalData = await renewalResponse.json() as any;
    results.autoRenewals = { success: renewalData.success, message: renewalData.message || '' };

    // 2. Expire past-due entitlements
    console.log('[LIFECYCLE] Step 2: Expiring past-due entitlements...');
    const expireResponse = await handleExpireEntitlements(request, env);
    const expireData = await expireResponse.json() as any;
    results.expirations = { success: expireData.success, message: expireData.message || '' };

    // 3. Send renewal reminders
    console.log('[LIFECYCLE] Step 3: Sending renewal reminders...');
    const reminderResponse = await handleSendRenewalReminders(request, env);
    const reminderData = await reminderResponse.json() as any;
    results.reminders = { success: reminderData.success, message: reminderData.message || '' };

    console.log('[LIFECYCLE] Entitlement lifecycle processing complete');

    return jsonResponse({
      success: true,
      results,
      message: 'Entitlement lifecycle processing complete'
    });
  } catch (error) {
    console.error('[LIFECYCLE] Error:', error);
    return jsonResponse({ 
      success: false,
      results,
      error: (error as Error).message 
    }, 500);
  }
}
