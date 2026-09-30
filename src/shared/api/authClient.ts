import { createAuthClient } from "@rareminds-eym/auth-client";

export const authClient = createAuthClient({
  namespace: "skillpassport-auth",
  // Origin must exactly match runtimeOrigin (location.origin) per skill-echosystem-packages/auth-client/src/private/runtime.ts:173
  // Previously undefined on http://localhost:8788, causing requireBrowser mismatch on http local dev.
  // Now: use window.location.origin always when available - runtime probe validates https || localhost http as secure.
  origin: typeof window !== "undefined" ? window.location.origin : undefined,
  csrf: { name: "X-RM-CSRF", value: "1" },
});
