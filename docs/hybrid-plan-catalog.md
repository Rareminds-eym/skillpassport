# Hybrid catalog rollout

Hybrid follows the same catalog path as the standard plans:

`SSO public.plans → SkillPassport public.plans_cache → /api/payments/subscription-plans → dashboard`

Apply `sso-worker/supabase/seed/seed_hybrid_sales_plan.sql`
to the SSO database first. Apply the matching seed in `skillpassport/supabase/seed/seed_hybrid_sales_plan.sql`
to the application database to initialize its projection. Both use the same plan UUID.
The existing `syncPlanCache` preserves the catalog fields on subsequent synchronization.
These are seed files (pure DML), not migrations — they do not run automatically.

Deploy the catalog API and checkout guards before applying the migrations. Deploy the
frontend with that API version. Until the active row is available, no Hybrid card is
shown. Setting `is_active = false` in the source catalog and syncing the cache removes
it from the catalog on the next fetch.

The plan applies to school, college, and university B2B catalogs. `entity_config.all`
stores `purchase_mode: contact_sales`, display copy, sales highlights, the sales email,
and the pricing label. Entity-specific configuration can override display content.

`sales_highlights` are marketing descriptions, not granted feature keys. The initial
`base_features` array and `pricing_matrix` are empty. The API returns null prices and
capacity for sales-only plans, and checkout, verification, and webhook fulfillment reject them before creating
an order, activating a subscription, or upgrading an existing subscription. Standard plans retain their existing prices.

The sales enquiry still prepares an email for the administrator to send. Negotiated
quotes, contracts, and custom entitlement activation remain a separate workflow;
adding this catalog record does not activate a Hybrid subscription.


## Audit: outstanding rollout and product work

- Database migrations and deployment have not been executed by this implementation.
- The enquiry is an email draft, not a persisted sales request or CRM assignment.
- Quote configuration, approval, acceptance, billing terms, and institution-specific
  entitlement activation are not implemented by this catalog change.
- No live payment or sales-email delivery has been verified.
- Existing organization payment integration needs separate repair: the dashboard's
  `organizationPaymentService` sends camelCase order fields and a nested
  `purchaseData` verification payload; the current handlers require snake_case
  fields. Its purchase call also lacks the amount required by the purchase endpoint.
  The separate `OrganizationSubscriptionService` still reads a flat pricing matrix,
  although the current catalog uses entity-specific pricing. These are pre-existing
  standard-plan integration gaps, not resolved by the Hybrid catalog work.
