import { z } from 'zod';
import { apiError } from '../../lib/response';
import type { CreditConsumptionCommand } from '../../lib/subscriptions/credits';
import type { PagesEnv } from '../../lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthToken } from '../../lib/supabase';
import { applicationFeatureDefinition, catalogInventoryDatabase, readApplicationFeatureInventory } from '../../lib/subscriptions/catalog-inventory';
import { currentSubscriptionSchema, subscriptionFailure } from '../../lib/subscriptions/current-subscription';
import { readApplicationPlanProjection } from '../../lib/subscriptions/publication';
import { authorizeSubscriptionAction, SubscriptionActionDenied, type ActionScope } from '../../lib/subscriptions/action';

const uuid = z.string().uuid().transform(value => value.toLowerCase());
const forbidden = z.object({ kind: z.literal('forbidden') }).strict();
const subject = z.object({ kind: z.enum(['user', 'organization']), id: uuid }).strict();
const pageSchema = z.object({ schemaVersion: z.literal(1), actorId: uuid, productId: uuid,
  items: z.array(z.object({ id: uuid, subject, productId: uuid, kind: z.enum(['initialized', 'uninitialized']) }).passthrough()).max(50),
  nextCursor: uuid.nullable(),
}).strict();
interface AccessRequest {
  env: PagesEnv; request: Request; actorId: string; subject: ActionScope['subject']; mode: 'read' | 'write';
  actionKey?: string; assessmentCategory?: string;
  feature?: { key: string; acceptedValues: readonly string[] };
}
function accessFailure(input: AccessRequest, status: number, code: string, message: string) {
  const response = apiError(status, code, message, input.request);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
/** Existing authentication/role and resource ownership checks remain the caller's responsibility. */
export async function requireSubscriptionAccess(input: AccessRequest) {
  try {
    const actorId = uuid.parse(input.actorId), productId = uuid.parse(input.env.SKILLPASSPORT_PRODUCT_ID);
    const scopedSubject = subject.parse(input.subject), token = getAuthToken(input.request), owner = input.env.SSO_SERVICE;
    if (!token || !owner) return subscriptionFailure(503);
    const ids: string[] = [];
    let uninitialized = 0;
    let cursor: string | null = null;
    for (let page = 0; ; page++) {
      if (page >= 100) throw new Error('Subscription discovery exceeded budget');
      const raw = await owner.listSubscriptionExecutions(token, productId, cursor);
      if (forbidden.safeParse(raw).success) return subscriptionFailure(403);
      const current = pageSchema.parse(raw);
      if (current.actorId !== actorId || current.productId !== productId
        || (current.nextCursor !== null && cursor !== null && current.nextCursor <= cursor)) throw new Error('Subscription discovery scope differs');
      let last = cursor;
      for (const item of current.items) {
        if (item.productId !== productId || (last !== null && item.id <= last)
          || (current.nextCursor !== null && item.id > current.nextCursor)) throw new Error('Subscription discovery sequence differs');
        last = item.id;
        if (item.subject.kind === scopedSubject.kind && item.subject.id === scopedSubject.id) {
          if (item.kind === 'initialized') ids.push(item.id);
          else uninitialized++;
        }
      }
      if (current.nextCursor === null) {
        if (current.items.length) throw new Error('Subscription discovery cursor missing');
        break;
      }
      cursor = current.nextCursor;
    }
    // Multiple executions require explicit owner resolution; array order is not commercial authority.
    if (ids.length === 0 && uninitialized > 0) return accessFailure(input, 409, 'SUBSCRIPTION_SETUP_REQUIRED',
      'Your existing subscription needs setup. Contact support to complete it.');
    if (ids.length === 0) return accessFailure(input, 403, 'SUBSCRIPTION_REQUIRED', 'Choose an available subscription to access this service.');
    if (ids.length !== 1) return accessFailure(input, 409, 'SUBSCRIPTION_REVIEW_REQUIRED', 'Your subscriptions need review. Contact support before continuing.');
    if (input.feature && input.actionKey) throw new Error('Choose an action or a feature requirement');
    if (input.actionKey !== undefined) {
      const raw = await owner.getSubscriptionActionContext(token, ids[0], productId);
      if (forbidden.safeParse(raw).success) return subscriptionFailure(403);
      const binding = z.object({ state: z.object({ planId: uuid, revisionId: uuid }) }).passthrough().parse(raw);
      const stored = await readApplicationPlanProjection(catalogInventoryDatabase(input.env), binding.state.planId, binding.state.revisionId, productId);
      const authorized = authorizeSubscriptionAction(raw, stored.projection, {
        actorId, productId, subject: scopedSubject, mode: input.mode, actionKey: input.actionKey,
        ...(input.assessmentCategory === undefined ? {} : { assessmentCategory: input.assessmentCategory }),
      });
      if (authorized.context.state.id !== ids[0]) throw new Error('Subscription action identity differs');
      return authorized;
    }
    const raw = await owner.getCurrentSubscriptionExecution(token, ids[0], productId);
    if (forbidden.safeParse(raw).success) return subscriptionFailure(403);
    const current = currentSubscriptionSchema.parse(raw);
    if (current.actorId !== actorId || current.state.id !== ids[0] || current.state.productId !== productId
      || current.state.subject.kind !== scopedSubject.kind || current.state.subject.id !== scopedSubject.id) throw new Error('Subscription current scope differs');
    if (current.access === 'suspended' || (input.mode === 'write' && current.access !== 'full')) return subscriptionFailure(403);
    if (input.feature) {
      const { key, acceptedValues } = input.feature;
      if (!key || !acceptedValues.length || new Set(acceptedValues).size !== acceptedValues.length) throw new Error('Invalid feature requirement');
      const stored = await readApplicationPlanProjection(catalogInventoryDatabase(input.env),
        current.state.planId, current.state.revisionId, productId);
      const draft = stored.projection.bundle.draft;
      if (!draft.audiences.includes(current.audience)) throw new Error('Opportunity audience differs');
      const grants = draft.features.filter(grant => grant.key === key);
      if (grants.length !== 1 || grants[0].type !== 'enum') throw new Error('Typed opportunity terms unavailable');
      const grant = grants[0];
      if (!grant.enabled || grant.value === null || !acceptedValues.includes(grant.value)) return accessFailure(input, 403, 'FEATURE_ACCESS_DENIED',
        'Your current plan does not include matched opportunities. You can still browse all job openings below.');
    }
    return { current };
  } catch (error) {
    return subscriptionFailure(error instanceof SubscriptionActionDenied ? 403 : 503);
  }
}

const candidateReference = z.object({ id: uuid, user_id: uuid }).passthrough();
const privacy = z.object({ profileVisibility: z.enum(['public', 'recruiters', 'private']), allowRecruiterContact: z.boolean(),
  showEmail: z.boolean(), showPhone: z.boolean() }).passthrough();
export interface CandidateContactPermission { visible: boolean; unlocked: boolean; email: boolean; phone: boolean; location: boolean }
interface RecruiterRequest { env: PagesEnv; request: Request; actorId: string; organizationId: string; database: SupabaseClient }

/** Consent is the learner's existing settings record; absent settings never imply consent. */
export async function readRecruiterContactPermissions(input: RecruiterRequest, candidateValues: readonly unknown[], purpose: 'discovery' | 'profile') {
  try {
    const organizationId = uuid.parse(input.organizationId), candidates = z.array(candidateReference).parse(candidateValues);
    const decision = await requireSubscriptionAccess({ ...input, subject: { kind: 'organization', id: organizationId },
      mode: 'read', actionKey: 'recruiter.contact.read' });
    if (decision instanceof Response) return decision;
    const verification = await input.database.from('organization_recruitment_verification')
      .select('organization_id,verification_status').eq('organization_id', organizationId).maybeSingle();
    if (verification.error) throw new Error('Recruiter verification unavailable');
    if (!verification.data || verification.data.organization_id !== organizationId || verification.data.verification_status !== 'approved') return subscriptionFailure(403);
    const result = new Map<string, CandidateContactPermission>();
    if (!candidates.length) return result;
    const [settings, unlocks] = await Promise.all([
      input.database.from('user_settings').select('user_id,privacy_settings').in('user_id', [...new Set(candidates.map(row => row.user_id))]),
      input.database.from('candidate_contact_unlocks').select('candidate_id').eq('organization_id', organizationId).in('candidate_id', candidates.map(row => row.id)),
    ]);
    if (settings.error || unlocks.error) throw new Error('Recruiter consent or unlock evidence unavailable');
    const rows = z.array(z.object({ user_id: uuid, privacy_settings: z.unknown() }).strict()).parse(settings.data);
    if (new Set(rows.map(row => row.user_id)).size !== rows.length || rows.some(row => !candidates.some(candidate => candidate.user_id === row.user_id))) throw new Error('Recruiter consent scope differs');
    const unlocked = new Set(z.array(z.object({ candidate_id: uuid }).strict()).parse(unlocks.data).map(row => row.candidate_id));
    if ([...unlocked].some(id => !candidates.some(candidate => candidate.id === id))) throw new Error('Recruiter unlock scope differs');
    for (const candidate of candidates) {
      const consent = privacy.safeParse(rows.find(row => row.user_id === candidate.user_id)?.privacy_settings);
      const visible = consent.success && consent.data.profileVisibility !== 'private'
        && (purpose === 'profile' || consent.data.showInTalentPool === true);
      const permitted = consent.success && visible && consent.data.allowRecruiterContact && unlocked.has(candidate.id);
      result.set(candidate.id, { visible, unlocked: permitted,
        email: permitted && consent.success && consent.data.showEmail,
        phone: permitted && consent.success && consent.data.showPhone,
        location: visible && consent.success && consent.data.showLocation === true });
    }
    return result;
  } catch { return subscriptionFailure(503); }
}

/** Only declared profile fields travel to recruiter clients; raw nested profile/contact data never does. */
const optionalText = z.string().nullable().optional();
const publicCandidateSchema = z.object({ id: uuid, user_id: uuid, name: optionalText, email: z.string().nullable(),
  contact_number: z.union([z.string(), z.number()]).nullable(), university: optionalText, universityId: optionalText,
  branch_field: optionalText, college_school_name: optionalText, course_name: optionalText,
  city: optionalText, state: optionalText, country: optionalText, district_name: optionalText,
  currentCgpa: z.union([z.string(), z.number()]).nullable().optional(), expectedGraduationDate: optionalText,
  created_at: optionalText, updated_at: optionalText, approval_status: optionalText, college_id: optionalText,
  skills: z.array(z.record(z.unknown())).optional(), projects: z.array(z.record(z.unknown())).optional(),
  certificates: z.array(z.record(z.unknown())).optional(), experience: z.array(z.record(z.unknown())).optional(), trainings: z.array(z.record(z.unknown())).optional(),
}).strict();
export function recruiterCandidateView(row: Record<string, unknown>, permission: CandidateContactPermission) {
  const fields = ['id', 'user_id', 'name', 'university', 'universityId', 'branch_field', 'college_school_name', 'course_name',
    'currentCgpa', 'expectedGraduationDate', 'created_at', 'updated_at', 'approval_status', 'college_id'];
  const value: Record<string, unknown> = {};
  for (const field of fields) if (Object.hasOwn(row, field)) value[field] = row[field];
  if (permission.location) for (const field of ['city', 'state', 'country', 'district_name']) if (Object.hasOwn(row, field)) value[field] = row[field];
  const sections: Record<string, readonly string[]> = {
    skills: ['id', 'learner_id', 'name', 'type', 'level', 'enabled', 'verified'],
    projects: ['id', 'learner_id', 'title', 'description', 'status', 'tech_stack', 'enabled'],
    certificates: ['id', 'learner_id', 'title', 'issuer', 'issued_on', 'enabled'],
    experience: ['id', 'learner_id', 'organization', 'role', 'start_date', 'end_date'],
    trainings: ['id', 'learner_id', 'title', 'organization', 'start_date', 'end_date'],
  };
  for (const [section, allowed] of Object.entries(sections)) if (Array.isArray(row[section])) {
    value[section] = row[section].map(item => {
      const record = z.record(z.unknown()).parse(item);
      return Object.fromEntries(allowed.filter(key => Object.hasOwn(record, key)).map(key => [key, record[key]]));
    });
  }
  value.email = permission.email ? row.email : null;
  value.contact_number = permission.phone ? row.contact_number : null;
  return publicCandidateSchema.parse(value);
}

/** Interviews refer to users.id. Cached contact copies never override current consent. */
export async function readRecruiterInterviewViews(input: RecruiterRequest, values: readonly Record<string, unknown>[]) {
  try {
    const rows = z.array(z.object({ learner_id: uuid.nullable() }).passthrough()).parse(values);
    const references = [...new Set(rows.flatMap(row => row.learner_id ? [row.learner_id] : []))];
    let candidates: z.infer<typeof candidateReference>[] = [];
    if (references.length) {
      const result = await input.database.from('zoho_recruiter_learners').select('id,user_id,email,contact_number').in('user_id', references);
      if (result.error) throw new Error('Interview candidate identity unavailable');
      candidates = z.array(candidateReference).parse(result.data);
      if (new Set(candidates.map(row => row.user_id)).size !== candidates.length
        || candidates.some(row => !references.includes(row.user_id))) throw new Error('Interview candidate scope differs');
    }
    const permissions = await readRecruiterContactPermissions(input, candidates, 'profile');
    if (permissions instanceof Response) return permissions;
    const fields = ['id','learner_id','organization_id','candidate_name','job_title','interviewer','interviewer_email','date','duration',
      'status','type','meeting_type','meeting_link','meeting_notes','reminders_sent','completed_date','scorecard','created_by','created_at','updated_at'];
    return rows.flatMap(row => {
      const candidate = candidates.find(item => item.user_id === row.learner_id);
      const permission = candidate && permissions.get(candidate.id);
      if (!candidate || !permission?.visible) return [];
      return [{ ...Object.fromEntries(fields.filter(field => Object.hasOwn(row, field)).map(field => [field, row[field]])),
        candidate_email: permission.email ? z.string().nullable().parse(candidate.email) : null,
        candidate_phone: permission.phone ? z.union([z.string(),z.number()]).nullable().parse(candidate.contact_number) : null }];
    });
  } catch { return subscriptionFailure(503); }
}

/** The signed owner derives the tariff; debit, unlock claim and consent recheck commit together in SQL. */
export async function prepareRecruiterSubscriptionCredit(input: RecruiterRequest, actionKey: string, operationId: string) {
  try {
    operationId = uuid.parse(operationId);
    const organizationId = uuid.parse(input.organizationId);
    const decision = await requireSubscriptionAccess({ ...input, subject: { kind: 'organization', id: organizationId },
      mode: 'write', actionKey });
    if (decision instanceof Response) return decision;
    if (!('binding' in decision) || decision.grant.type !== 'metered') return subscriptionFailure(503);
    const pools = [...new Set(decision.projection.bundle.includedCredits.rules.filter(rule => rule.featureKey === decision.binding.featureKey
      && rule.recipient === 'organization' && rule.audiences.includes(decision.context.audience)).map(rule => rule.poolKey))];
    if (pools.length !== 1) return subscriptionFailure(503);
    const features = (await readApplicationFeatureInventory(input.database)).map(item => {
      const { key, type, ...rest } = applicationFeatureDefinition(item);
      return { key, type, ...('options' in rest ? { options: rest.options } : {}) };
    });
    const token = getAuthToken(input.request);
    if (!token || !input.env.SSO_SERVICE) return subscriptionFailure(503);
    const raw = await input.env.SSO_SERVICE.prepareSubscriptionCreditExecution(token, decision.context.state.productId,
      { kind: 'consume', subscriptionId: decision.context.state.id, recipientId: organizationId,
        poolKey: pools[0], actionKey: decision.binding.actionKey, operationId }, features);
    if (forbidden.safeParse(raw).success) return subscriptionFailure(403);
    const prepared = z.object({ kind: z.literal('consume'), actorId: uuid, command: z.object({ productId: uuid, subscriptionId: uuid,
      recipient: z.object({ kind: z.literal('organization'), id: uuid }).strict(), featureKey: z.string().min(1), poolKey: z.string().min(1),
      operationId: uuid, actionKey: z.string().min(1), amount: z.number().int().min(1).max(2147483647),
      spendingOrder: z.enum(['expires_first', 'oldest_first']) }).strict() }).strict().parse(raw);
    if (prepared.actorId !== input.actorId || prepared.command.productId !== decision.context.state.productId
      || prepared.command.subscriptionId !== decision.context.state.id || prepared.command.recipient.id !== organizationId
      || prepared.command.poolKey !== pools[0] || prepared.command.featureKey !== decision.binding.featureKey
      || prepared.command.operationId !== operationId || prepared.command.actionKey !== decision.binding.actionKey) throw new Error('Recruiter credit preparation scope differs');
    const command: CreditConsumptionCommand = prepared.command;
    return { command, authorization: { actorId: input.actorId, subject: decision.context.state.subject,
      subscriptionId: decision.context.state.id, productId: decision.context.state.productId,
      revisionId: decision.context.state.revisionId, version: decision.context.state.version,
      actionKey, validUntil: Math.min(decision.context.state.periodEndsAt, decision.context.subscriptionEndsAt) } };
  } catch { return subscriptionFailure(503); }
}

/** The debit and contact claim commit together in the owning database transaction. */
export async function unlockRecruiterCandidateContact(input: RecruiterRequest, candidateId: string, operationId: string) {
  try {
    candidateId = uuid.parse(candidateId);
    const organizationId = uuid.parse(input.organizationId);
    const prepared = await prepareRecruiterSubscriptionCredit(input, 'recruiter.contact.unlock', operationId);
    if (prepared instanceof Response) return prepared;
    const result = await input.database.rpc('unlock_subscription_candidate_contact', { p_actor_id: input.actorId,
      p_organization_id: organizationId, p_candidate_id: candidateId, p_credit_command: prepared.command,
      p_authorization: prepared.authorization });
    if (result.error) {
      if (String(result.error.message).includes('INSUFFICIENT_SUBSCRIPTION_CREDITS')) return subscriptionFailure(402);
      if (result.error.code === '42501') return subscriptionFailure(403);
      throw new Error('Recruiter unlock persistence unavailable');
    }
    const receipt = z.object({ candidate: z.object({ id: uuid, name: z.string().nullable(), email: z.string().nullable(), phone: z.union([z.string(), z.number()]).nullable() }).strict(),
      alreadyUnlocked: z.boolean() }).strict().parse(result.data);
    if (receipt.candidate.id !== candidateId) throw new Error('Recruiter candidate acknowledgement differs');
    return receipt;
  } catch { return subscriptionFailure(503); }
}
