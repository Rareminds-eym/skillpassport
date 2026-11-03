import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from './types';
import { resolveUserOrganization } from './resolve-organization';

export class FacultyCredentialsError extends Error {
  constructor(readonly status: number, message: string, readonly code = 'CREDENTIAL_DELIVERY_ERROR') { super(message); }
}
export interface FacultyCredentialsActor { id: string; email?: string; org_id?: string }
export type CredentialsEmailStatus = 'sent' | 'failed';

/** Resolve authority from current SSO membership, never caller-supplied roles or college IDs. */
export async function requireFacultyAdmin(env: PagesEnv, db: SupabaseClient, actor: FacultyCredentialsActor) {
  const authority = env.SSO_SERVICE;
  if (!authority || !actor.org_id) throw new FacultyCredentialsError(403, 'College administrator access is required.');
  const [user, result] = await Promise.all([
    authority.getUserById(actor.id), authority.getUserMemberships(actor.id),
  ]);
  const membership = result.memberships?.find((m: { org_id: string; status: string; roles?: string[]; role?: string }) =>
    m.org_id === actor.org_id && m.status === 'active' && (m.roles ?? [m.role]).includes('college_admin'));
  if (!user || user.is_blocked || !user.is_email_verified || !membership)
    throw new FacultyCredentialsError(403, 'Active college administrator access is required.');
  const resolved = await resolveUserOrganization(db, { userId: actor.id, email: actor.email, orgType: 'college' });
  if (!resolved) throw new FacultyCredentialsError(403, 'Your college could not be resolved.');
  return { collegeId: resolved.organizationId, ssoOrgId: actor.org_id };
}

/** CSPRNG password with guaranteed character classes; kept only in request memory. */
export function generateFacultyPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `Aa7!${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/** Configuration is trusted; only loopback requests may supply a local fallback. */
export function facultyLoginUrl(env: PagesEnv, requestUrl?: string): string {
  const request = requestUrl ? new URL(requestUrl) : null;
  const local = request && ['localhost', '127.0.0.1', '[::1]'].includes(request.hostname);
  const configured = env.APP_URL || (local ? request!.origin : 'https://skillpassport.rareminds.in');
  const url = new URL(configured);
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))))
    throw new FacultyCredentialsError(503, 'The application email URL is not configured correctly.');
  return new URL('/login', url.origin).href;
}

/** Delivery is authoritative even if the optional status write is unavailable. */
export async function recordCredentialStatus(db: SupabaseClient, id: string, status: CredentialsEmailStatus, attemptedAt?: string): Promise<boolean> {
  try {
    let query = db.from('college_lecturers').update({ credentials_email_status: status }).eq('id', id);
    if (attemptedAt) query = query.eq('credentials_email_attempted_at', attemptedAt);
    const { error } = await query;
    return !error;
  } catch { return false; }
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!));

/** Never log the email body, provider error, or plaintext credential. */
export async function sendFacultyCredentials(env: PagesEnv, email: string, name: string, password: string, loginUrl = facultyLoginUrl(env)): Promise<CredentialsEmailStatus> {
  if (!env.EMAIL_SERVICE) return 'failed';
  const text = `Hello ${name},\n\nYour college administrator has created or reset your SkillPassport login credentials.\n\nEmail: ${email}\nTemporary password: ${password}\nSign in: ${loginUrl}\n\nThis password replaces any previous password. Please change it in your account settings after signing in.\nIf you did not expect this email, contact your college administrator.`;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      env.EMAIL_SERVICE.sendEmail({ to: email, subject: 'Your SkillPassport login credentials', text,
        html: `<p>Hello ${escapeHtml(name)},</p><p>Your college administrator has created or reset your login credentials.</p><p>Email: ${escapeHtml(email)}<br>Temporary password: <strong>${escapeHtml(password)}</strong></p><p><a href="${loginUrl}">Sign in to SkillPassport</a></p><p>This replaces any previous password. Change it in your account settings after signing in.</p>` }),
      new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), 10_000); }),
    ]);
    return result?.success === true ? 'sent' : 'failed';
  } catch { return 'failed'; }
  finally { clearTimeout(timer); }
}

export async function resendFacultyCredentials(env: PagesEnv, db: SupabaseClient, actor: FacultyCredentialsActor, facultyId: string, requestUrl?: string) {
  const loginUrl = facultyLoginUrl(env, requestUrl);
  const scope = await requireFacultyAdmin(env, db, actor);
  const { data: faculty, error } = await db.from('college_lecturers')
    .select('id,user_id,collegeId,accountStatus,first_name,last_name')
    .eq('id', facultyId).eq('collegeId', scope.collegeId).maybeSingle();
  if (error) throw new FacultyCredentialsError(503, 'Could not load this faculty member.');
  if (!faculty?.user_id) throw new FacultyCredentialsError(404, 'Faculty member not found in your college.');
  if (faculty.accountStatus !== 'active') throw new FacultyCredentialsError(409, 'Activate this faculty account before sending credentials.');
  const authority = env.SSO_SERVICE!;
  const [target, memberships] = await Promise.all([
    authority.getUserById(faculty.user_id), authority.getUserMemberships(faculty.user_id),
  ]);
  const member = memberships.memberships?.find((m: { org_id: string; status: string; roles?: string[]; role?: string }) =>
    m.org_id === scope.ssoOrgId && m.status === 'active' && (m.roles ?? [m.role]).includes('college_educator'));
  if (!target || target.is_blocked || !target.email || !member || target.id === actor.id)
    throw new FacultyCredentialsError(403, 'This account is not an active educator in your organization.');
  if (!env.EMAIL_SERVICE) throw new FacultyCredentialsError(503, 'Email delivery is unavailable. No password was changed.');

  // Atomic per-faculty cooldown prevents overlapping rotations from competing administrators.
  const attemptedAt = new Date().toISOString();
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: claimed, error: claimError } = await db.from('college_lecturers')
    .update({ credentials_email_status: 'sending', credentials_email_attempted_at: attemptedAt })
    .eq('id', faculty.id).eq('collegeId', scope.collegeId)
    .or(`credentials_email_attempted_at.is.null,credentials_email_attempted_at.lt.${cutoff}`)
    .select('id').maybeSingle();
  if (claimError) throw new FacultyCredentialsError(503, 'Could not prepare credential delivery. No password was changed.');
  if (!claimed) throw new FacultyCredentialsError(429, 'Please wait one minute before sending credentials again.', 'CREDENTIAL_COOLDOWN');
  const password = generateFacultyPassword();
  try {
    const reset = await authority.adminResetPassword({ admin_user_id: actor.id, admin_roles: ['college_admin'],
      admin_org_id: scope.ssoOrgId, target_user_id: faculty.user_id, new_password: password });
    if (!reset?.success) throw new Error('Reset failed');
  } catch (error) {
    await recordCredentialStatus(db, faculty.id, 'failed', attemptedAt);
    if (error instanceof Error && /rate limit exceeded/i.test(error.message))
      throw new FacultyCredentialsError(429, 'Your administrator account has reached its reset limit. Wait five minutes before trying again.', 'RESET_RATE_LIMITED');
    throw new FacultyCredentialsError(503, 'Could not reset credentials. No credential email was sent. Try again later.');
  }
  const emailStatus = await sendFacultyCredentials(env, target.email, [faculty.first_name, faculty.last_name].filter(Boolean).join(' ') || 'Educator', password, loginUrl);
  const statusSaved = await recordCredentialStatus(db, faculty.id, emailStatus, attemptedAt);
  return { emailStatus, email: target.email, passwordChanged: true, statusSaved, attemptedAt };
}
