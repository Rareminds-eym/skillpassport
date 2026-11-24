import { SKILLPASSPORT_PRODUCT_ID } from '../subscription-config';
import { z } from 'zod';
import { getAuthInstance } from '../auth';
import { getAuthToken } from '../supabase';
import type { PagesFunction } from '../types';
import { applicationFeatureDefinition, catalogInventoryDatabase, loadSubscriptionCatalogInventory, readApplicationFeatureInventory } from './catalog-inventory';
import { loadPlanAuthoringContext } from './authoring-context';
import { loadCreditAuthoringContext } from './credit-authoring-context';
import { draftRequest, DraftRequestError, readDraftRequest, stageOrdinaryDraft } from './authoring';
import { stageApplicationPlanProjection } from './publication';
import { administrationCatalogSchema, verifyPublishedTermsAgainstProjections } from './discovery';

export type SubscriptionAdminOperation = 'catalog' | 'context' | 'creditContext' | 'drafts' | 'publications'
  | 'installation' | 'availability' | 'retirement' | 'hybridAdoption' | 'published';
const catalogCommands: readonly SubscriptionAdminOperation[] = ['installation', 'availability', 'retirement', 'hybridAdoption'];
const platform = '00000000-0000-0000-0000-000000000001';
const reference = z.string().uuid();
const publicationRequest = z.object({ planId: reference, revisionId: reference,
  expectedPreviousRevisionId: reference.nullable() }).strict();
const publicationReceipt = z.object({ planId: reference, revisionId: reference,
  previousRevisionId: reference.nullable(), publishedBy: reference, publishedAt: z.string().datetime({ offset: true }) }).strict();
const headers = { 'Cache-Control': 'private, no-store' };
const failure = (status: number) => Response.json({ error: status === 503
  ? 'Subscription administration is unavailable' : 'Subscription request denied' }, { status, headers });

/** Domain-specific owner API. No arbitrary table, RPC, registry or actor forwarding. */
export function subscriptionAdminEndpoint(operation: SubscriptionAdminOperation): PagesFunction {
  return async context => {
    try {
      if (context.request.method !== (operation === 'drafts' || operation === 'publications' || catalogCommands.includes(operation) ? 'POST' : 'GET')) return failure(405);
      // This server-to-server contract accepts explicit bearer authority only, never ambient cookies.
      const token = getAuthToken(context.request);
      if (!token) return failure(401);
      const auth = getAuthInstance(context.env as unknown as Record<string, unknown>);
      const response = await auth.authenticate(async (_request, verified) => {
        try {
          const user = verified.user;
          const claims = z.object({ sub: reference, org_id: reference,
            membership_status: z.literal('active'), roles: z.array(z.string()),
            is_email_verified: z.literal(true), user_metadata: z.record(z.unknown()).nullish() }).passthrough().safeParse(user);
          if (!claims.success || claims.data.org_id !== platform || !claims.data.roles.includes('super_admin')
            || claims.data.user_metadata?.must_change_password === true) return failure(403);
          const sso = context.env.SSO_SERVICE;
          if (!sso) return failure(503);
          const [identity, memberships] = await Promise.all([
            sso.getUserById(claims.data.sub), sso.getUserMemberships(claims.data.sub),
          ]);
          if (!identity || identity.id !== claims.data.sub || identity.is_blocked !== false
            || identity.is_email_verified !== true || identity.user_metadata?.must_change_password === true
            || !memberships?.memberships?.some(row => row.org_id === platform && row.status === 'active'
              && Array.isArray(row.roles) && row.roles.includes('super_admin'))) return failure(403);

          const product = reference.parse(SKILLPASSPORT_PRODUCT_ID).toLowerCase();
          const parameters = [...new URL(context.request.url).searchParams];
          let planId = '';
          if (operation === 'context' || operation === 'creditContext') {
            if (parameters.length !== 1 || parameters[0][0] !== 'planId'
              || !reference.safeParse(parameters[0][1]).success) return failure(400);
            planId = parameters[0][1];
          } else if (operation === 'published') {
            // At most one opaque page cursor; nothing else is accepted.
            if (parameters.length > 1 || (parameters.length === 1 && (parameters[0][0] !== 'cursor' || !reference.safeParse(parameters[0][1]).success))) return failure(400);
          } else if (parameters.length) return failure(400);
          // Requests are authenticated, authorized and validated before constructing an app DB client.
          if (operation === 'publications') {
            const request = publicationRequest.safeParse(await readDraftRequest(context.request));
            if (!request.success) return failure(400);
            const planId = request.data.planId.toLowerCase(), revisionId = request.data.revisionId.toLowerCase();
            const previous = request.data.expectedPreviousRevisionId?.toLowerCase() ?? null;
            const database = catalogInventoryDatabase(context.env);
            const features = (await readApplicationFeatureInventory(database)).map(item => {
              const { id, key, type, ...definition } = applicationFeatureDefinition(item);
              return { id, key, type, ...('options' in definition ? { options: definition.options } : {}) };
            });
            const prepare = z.discriminatedUnion('kind', [
              z.object({ kind: z.literal('forbidden') }).strict(), z.object({ kind: z.literal('invalid') }).strict(),
              z.object({ kind: z.literal('prepared'), projection: z.unknown(), preparedBy: reference }).strict(),
            ]).parse(await sso.prepareSubscriptionPlanPublication(token, planId, revisionId, product, features));
            if (prepare.kind !== 'prepared') return failure(prepare.kind === 'forbidden' ? 403 : 400);
            if (prepare.preparedBy.toLowerCase() !== claims.data.sub.toLowerCase()) throw new Error('Publication preparation actor differs');
            const preparedScope = z.object({ bundle: z.object({ draft: z.object({ id: reference,
              plan: z.object({ id: reference, productId: reference }).passthrough() }).passthrough() }).passthrough() })
              .passthrough().parse(prepare.projection).bundle.draft;
            if (preparedScope.id.toLowerCase() !== revisionId || preparedScope.plan.id.toLowerCase() !== planId
              || preparedScope.plan.productId.toLowerCase() !== product) throw new Error('Prepared publication scope differs');
            const stored = await stageApplicationPlanProjection(database, prepare.projection, product, claims.data.sub.toLowerCase());
            if (stored.projection.bundle.draft.id !== revisionId || stored.projection.bundle.draft.plan.id !== planId) {
              throw new Error('Application projection differs from requested revision');
            }
            // The SSO owner independently reads this immutable projection before its own atomic CAS.
            // An uncertain failure is surfaced; neither database is automatically compensated/retried.
            const outcome = z.discriminatedUnion('kind', [
              z.object({ kind: z.literal('forbidden') }).strict(), z.object({ kind: z.literal('invalid') }).strict(),
              z.object({ kind: z.literal('published'), receipt: publicationReceipt }).strict(),
            ]).parse(await sso.publishSubscriptionPlanRevision(token, planId, revisionId, previous, product, features));
            if (outcome.kind !== 'published') return failure(outcome.kind === 'forbidden' ? 403 : 400);
            const receipt = outcome.receipt;
            if (receipt.planId.toLowerCase() !== planId || receipt.revisionId.toLowerCase() !== revisionId
              || (receipt.previousRevisionId?.toLowerCase() ?? null) !== previous
              || receipt.publishedBy.toLowerCase() !== claims.data.sub.toLowerCase()) throw new Error('Publication acknowledgement differs');
            return Response.json(receipt, { headers });
          }
          if (catalogCommands.includes(operation)) {
            // Requests carry references and reviewed source mappings only; the SSO owner derives and validates every term.
            const request = await readDraftRequest(context.request);
            const database = catalogInventoryDatabase(context.env);
            const features = (await readApplicationFeatureInventory(database)).map(item => {
              const { id, key, type, ...definition } = applicationFeatureDefinition(item);
              return { id, key, type, ...('options' in definition ? { options: definition.options } : {}) };
            });
            const raw = operation === 'installation' ? await sso.installSubscriptionCatalog(token, product, request, features)
              : operation === 'availability' ? await sso.makeSubscriptionCatalogAvailable(token, product, request, features)
                : operation === 'hybridAdoption' ? await sso.adoptHybridCatalogOffer(token, product, request, features)
                  : await sso.retireLegacySubscriptionCatalog(token, product, request);
            const expected = operation === 'installation' ? 'installed' : operation === 'availability' ? 'available'
              : operation === 'hybridAdoption' ? 'adopted' : 'retired';
            const result = z.discriminatedUnion('kind', [
              z.object({ kind: z.literal('forbidden') }).strict(), z.object({ kind: z.literal('invalid') }).strict(),
              z.object({ kind: z.literal(expected), receipt: z.object({ operationId: reference }).passthrough() }).strict(),
            ]).parse(raw);
            if (result.kind !== expected) return failure(result.kind === 'forbidden' ? 403 : 400);
            return Response.json(result.receipt, { headers });
          }
          if (operation === 'published') {
            const database = catalogInventoryDatabase(context.env);
            const inventory = await readApplicationFeatureInventory(database);
            const features = inventory.map(item => {
              const { key, type, ...definition } = applicationFeatureDefinition(item);
              return { key, type, ...('options' in definition ? { options: definition.options } : {}) };
            });
            const cursor = parameters.length ? parameters[0][1].toLowerCase() : null;
            const raw = await sso.listPublishedCatalogForAdministration(token, product, features, cursor);
            const denied = z.object({ kind: z.enum(['forbidden', 'invalid']) }).strict().safeParse(raw);
            if (denied.success) return failure(denied.data.kind === 'forbidden' ? 403 : 400);
            const page = administrationCatalogSchema.parse(raw);
            if (page.actorId !== claims.data.sub.toLowerCase() || page.productId !== product) throw new Error('Published catalog scope differs');
            await verifyPublishedTermsAgainstProjections(database, page.plans, product, inventory);
            return Response.json(page, { headers });
          }
          if (operation === 'drafts') {
            const parsed = draftRequest.safeParse(await readDraftRequest(context.request));
            if (!parsed.success) return failure(400);
            const outcome = await stageOrdinaryDraft(sso, catalogInventoryDatabase(context.env), token, parsed.data, product);
            if (outcome.kind !== 'staged') return failure(outcome.kind === 'forbidden' ? 403 : 400);
            if (outcome.receipt.stagedBy.toLowerCase() !== claims.data.sub.toLowerCase()) throw new Error('Staging actor differs');
            return Response.json(outcome.receipt, { headers });
          }
          const database = catalogInventoryDatabase(context.env);
          if (operation === 'catalog') {
            const result = await loadSubscriptionCatalogInventory(sso, database);
            // Unscoped legacy rows do not establish ownership of this product.
            return Response.json({ ...result, plans: result.plans.filter(plan => plan.productId === product) }, { headers });
          }
          const result = operation === 'context'
            ? await loadPlanAuthoringContext(sso, database, planId, product)
            : await loadCreditAuthoringContext(sso, database, planId, product);
          return Response.json(result, { headers });
        } catch (error) {
          // Handle domain failures before auth-core classifies thrown handler failures.
          return failure(error instanceof DraftRequestError ? error.status : 503);
        }
      })(context.request);
      // Include no-store on authentication failures produced by the existing auth-core boundary too.
      const result = new Response(response.body, response);
      result.headers.set('Cache-Control', 'private, no-store');
      return result;
    } catch (error) {
      return failure(error instanceof DraftRequestError ? error.status : 503);
    }
  };
}
