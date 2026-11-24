# Checkout verification report

Date: 2026-11-17. Scope: all checkout changes implemented in this session, including the approved D1 manual verification recovery. This is local verification, not a deployed-environment acceptance certificate. No deployment, migration application, real payment, real message, authenticated-account substitution or provisioning was performed.

## Measured results

| Check | Result |
|---|---|
| Payment entry and completion UI tests | 35 passed |
| Checkout service, API, guard, failure, logging, add-on and catalogue regressions | 73 passed |
| Verification handler and catalogue contracts | 34 passed |
| SSO fulfillment and purchase scope | 21 passed |
| Total automated tests | 163 passed, zero failed |
| Isolated PostgreSQL execution | Passed: activation, immediate/historical replay, mismatches, rollback, institution capacity and role privileges |
| Chromium component/browser scenarios | 15 passed |
| Built application anonymous smoke | Four routes checked, no uncaught page errors |
| Frontend production build | Passed |
| Scoped lint comparison | Zero new errors; 54 reviewed existing errors |
| Changed typed service/helper comparison | Zero added diagnostics; 81 baseline, 53 current |
| Affected server comparison | Zero added diagnostics; SkillPassport 38 baseline/27 current, SSO 41/41 |

The TypeScript comparisons use captured original or reconstructed pre-change surfaces as documented in [the fix plan](./payment-checkout-fix-plan.md). These results do not mean the complete repository passes lint or typecheck. The test count is scoped to the payment work and related regressions, not every test in this workspace. SQL assertions are additional checks, not included in the 163 Vitest test count.

## Browser scenarios

The browser loaded the actual [payment entry](../src/pages/subscription/PaymentCompletion.jsx), [success/recovery](../src/features/subscription/ui/shared/PaymentSuccess.jsx), [failure](../src/features/subscription/ui/shared/PaymentFailure.jsx), [SDK lifecycle service](../src/features/subscription/api/razorpayService.ts), [payment API client](../src/features/subscription/api/paymentsApiService.ts), route guard and query owner in React StrictMode. The isolated entrypoint replaces identity, external SDK events, and service responses with explicit synthetic test boundaries. It is a component integration test in Chromium, not a login or gateway transaction. No authentication was bypassed in the application. Production CSS loading and computed button styling were checked before responsive assertions.

| Scenario | Result |
|---|---|
| production stylesheet is loaded and applied to the actual payment form | Passed |
| decline then successful SDK retry preserves checkout and excludes same-tick duplicate orders | Passed |
| failed dismissal reaches failure once and explicit payment retry preserves full intent | Passed |
| dismissal without a failed attempt cancels without navigating to failure | Passed |
| verification errors require manual retry with the original proof and never another order | Passed |
| a pending manual retry locks duplicate clicks | Passed |
| bare creation flags stay unresolved and cannot grant cache access | Passed |
| confirmed direct-free activation needs neither paid SDK checkout nor verification | Passed |
| already-fulfilled active subscription renders success without another verification | Passed |
| missing proof blocks retry and leaves support available | Passed |
| changing buyer invalidates in-flight verification and rejects the old receipt | Passed |
| changing payment suppresses a late successful result for the previous payment | Passed |
| late previous-buyer profile cannot overwrite the new buyer form | Passed |
| organization change closes the obsolete checkout and ignores its success handler | Passed |
| payment, recovery and failure screens fit a 390-pixel mobile viewport | Passed |

The mobile checks use a 390 × 844 CSS-pixel viewport and assert no horizontal overflow for payment, recovery and failure views. [The inspected mobile recovery screenshot](../../.unlazy/payment-final-verification/recovery-mobile.png) includes a visible synthetic-test banner. No uncaught JavaScript page errors occurred in these scenarios. Browser console connection-refused messages after shutting down the temporary Vite fixture came from its HMR reconnect attempts; they are not a production-console-clean claim.

## Built application smoke

The existing built application was served locally with no worker/backend stack. External requests were blocked and local API requests explicitly reported backend unavailable. No identity or access state was injected into this app. The checks observed:

- `/login`: actual email/password login fields render.
- `/subscription/payment` without identity/plan state: redirects to login with the plans destination preserved.
- `/subscription/payment/success` without payment proof/identity: redirects to login through the protected plans destination.
- `/subscription/payment/failure`: renders the generic payment failure page and its recovery controls.

No uncaught page errors were captured. This checks bundle startup and anonymous navigation; it does not certify authenticated routes, remote APIs, receipts, email delivery or the real Razorpay modal. The production CSS/component assertions were rerun after correcting the fixture middleware ordering; earlier attempts without saved browser evidence were not used as final proof. Selectors were aligned with the existing Start Free button and actual login fields rather than treating label mismatches as product defects.

## Open integration requirements

The private profile loader rejected `TEST_LEARNER` for local SkillPassport because its EMAIL field is missing. Authenticated testing stopped there, following [the account policy](../../tests/TEST_ACCOUNTS.md); no alternate account, production profile or fabricated login was used. A valid matching local profile and server-verified learner identity/tenant are required before authenticated acceptance can proceed.

The prepared [fulfillment migration](../../sso-worker/supabase/migrations/20270314010000_subscription_payment_fulfillment.sql) remains unapplied. SQL execution used an isolated in-memory engine and checked-in table definitions with synthetic fixtures. Queued requests on one connection do not certify live multi-connection lock contention, deployed triggers/schema, or coordinated SSO/Pages rollout. A real gateway test, actual capture/webhook behavior, receipt/email delivery, dedicated organization/add-on flows, and the wider diagnostic persistence requirements remain outside the completed local checks.

No new production defect was reproduced by this verification pass. No production source changes were needed. These local results support review of the prepared patch; deployment still requires explicit approval for the exact target/action.

## Evidence

[The final acceptance ledger](../../.unlazy/payment-final-verification/GATES.md) records the native executions and fingerprints. [The saved browser report](../../.unlazy/payment-final-verification/browser-results.json) contains each scenario and the four actual application observations. Vitest JSON reports and scoped diagnostic comparisons are retained alongside the ledger. The final local verification scope has six met gates, zero unmet and zero abandoned; the integration requirements above remain explicit handoffs rather than being counted as successful live tests.
