/**
 * Canonical worker gateway route: POST /api/internal/ai/v1
 * (matches the ai-worker internal client + the gateway docstring).
 * The legacy ./index route re-exports the same handler; both agree on
 * route and response shape by construction.
 */
export { onRequestPost } from "./index.js";
