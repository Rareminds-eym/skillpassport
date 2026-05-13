/**
 * Environment Utility Functions
 *
 * Provides helpers for detecting and working with different environments.
 *
 * Runtime:   Vite + React (Browser)
 * Edge:      Cloudflare Pages / Workers
 *
 * Design decisions:
 * - Build-mode checks (`isDevelopment`, `isProduction`, `isStaging`) rely
 *   solely on Vite's compile-time `import.meta.env.MODE`. They never look
 *   at the hostname so they remain correct on any deployment URL.
 * - Runtime hostname checks (`isLocalhost`, `isDomain`) are kept separate
 *   and always guard against non-browser environments first.
 * - All public helpers are pure functions with no side-effects.
 */

// ---------------------------------------------------------------------------
// Internal constants — evaluated once at module load (Vite replaces these
// with string literals at build time, so there is zero runtime cost).
// ---------------------------------------------------------------------------

/** Vite build mode: "development" | "production" | "staging" | custom */
const BUILD_MODE = import.meta.env.MODE;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * All recognised environment names.
 * "unknown" is returned when the build mode is not one of the three
 * well-known values — never falls back silently to "development".
 */
export type EnvironmentName =
  | 'production'
  | 'staging'
  | 'development'
  | 'localhost'
  | 'unknown';

// ---------------------------------------------------------------------------
// Browser guard
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the code is executing inside a browser context.
 *
 * Use this before accessing `window`, `document`, or `location` to stay
 * safe in SSR / edge runtimes.
 *
 * @returns `true` in a browser, `false` in SSR or edge runtimes.
 */
export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.location !== 'undefined';

// ---------------------------------------------------------------------------
// Build-mode checks (Vite compile-time — no hostname involved)
// ---------------------------------------------------------------------------

/**
 * Returns `true` when Vite built the app in **development** mode
 * (`MODE === "development"`).
 *
 * This is a pure build-mode check. It does **not** consider the hostname,
 * so it will be `false` even when the dev server is accessed via localhost
 * if the mode was overridden at build time.
 *
 * @returns `true` if `MODE === "development"`.
 */
export const isDevelopment = (): boolean => BUILD_MODE === 'development';

/**
 * Returns `true` when Vite built the app in **production** mode
 * (`MODE === "production"`).
 *
 * @returns `true` if `MODE === "production"`.
 */
export const isProduction = (): boolean => BUILD_MODE === 'production';

/**
 * Returns `true` when Vite built the app in **staging** mode
 * (`MODE === "staging"`).
 *
 * @returns `true` if `MODE === "staging"`.
 */
export const isStaging = (): boolean => BUILD_MODE === 'staging';

// ---------------------------------------------------------------------------
// Runtime hostname checks (browser-only)
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the page is served from localhost.
 *
 * Recognised values:
 * - `localhost`
 * - `127.0.0.1`
 * - `::1`   (IPv6 — browsers expose this *without* brackets)
 * - `[::1]` (bracketed form — defensive, some environments include them)
 *
 * @returns `true` on localhost, `false` outside the browser or on any
 *          other hostname.
 */
export const isLocalhost = (): boolean => {
  if (!isBrowser()) return false;

  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||    // browsers usually omit brackets
    hostname === '[::1]'     // defensive — some environments include them
  );
};

// ---------------------------------------------------------------------------
// Composite environment name
// ---------------------------------------------------------------------------

/**
 * Returns the current environment as a narrow string literal.
 *
 * Priority order:
 * 1. `"production"`  — build mode is production
 * 2. `"staging"`     — build mode is staging
 * 3. `"development"` — build mode is development
 * 4. `"localhost"`   — runtime hostname is localhost (any build mode)
 * 5. `"unknown"`     — none of the above matched
 *
 * `"localhost"` is placed *after* the three build-mode checks so that a
 * production build served locally still reports `"production"`.
 *
 * @returns One of the {@link EnvironmentName} literals.
 */
export const getEnvironment = (): EnvironmentName => {
  if (isProduction()) return 'production';
  if (isStaging()) return 'staging';
  if (isDevelopment()) return 'development';
  if (isLocalhost()) return 'localhost';
  return 'unknown';
};

// ---------------------------------------------------------------------------
// Domain helper — internal utilities
// ---------------------------------------------------------------------------

/**
 * Normalises a raw domain string for safe comparison.
 *
 * Steps:
 * 1. Trim surrounding whitespace.
 * 2. Lower-case everything.
 * 3. Strip a trailing dot (FQDN notation).
 *
 * @internal
 */
const normaliseDomain = (raw: string): string =>
  raw.trim().toLowerCase().replace(/\.$/, '');

/**
 * Validates that a string looks like a bare hostname / domain and not a
 * full URL, a port-suffixed address, or an obviously malformed value.
 *
 * Rejected inputs (examples):
 * - `""`                 — empty string
 * - `"  "`               — blank / whitespace only
 * - `".example.com"`     — leading dot
 * - `"https://..."`      — full URL with scheme
 * - `"example.com:8080"` — port present
 * - `"example com"`      — internal whitespace
 *
 * @internal
 */
const isValidDomainInput = (domain: string): boolean => {
  // Reject empty or whitespace-only strings
  if (!domain.trim()) return false;

  // Reject leading dot
  if (domain.trim().startsWith('.')) return false;

  // Reject if it looks like a URL (contains a scheme separator)
  if (domain.includes('://')) return false;

  // Reject if a port is present
  if (/:\d+$/.test(domain.trim())) return false;

  // Reject internal whitespace
  if (/\s/.test(domain.trim())) return false;

  return true;
};

// ---------------------------------------------------------------------------
// Domain helper — public API
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the page hostname **exactly** matches `domain` or is
 * a **valid subdomain** of it.
 *
 * Examples (assuming `domain = "example.com"`):
 * | Current hostname    | Result  |
 * |---------------------|---------|
 * | `example.com`       | `true`  |
 * | `app.example.com`   | `true`  |
 * | `evil-example.com`  | `false` |
 * | `notexample.com`    | `false` |
 *
 * Invalid `domain` arguments (full URLs, ports, leading dots, empty
 * strings) always return `false`.
 *
 * @param domain - Bare hostname to test, e.g. `"example.com"`.
 * @returns `true` on an exact or subdomain match, `false` otherwise.
 */
export const isDomain = (domain: string): boolean => {
  // Cheap runtime guard first, then validate the input
  if (!isBrowser()) return false;
  if (!isValidDomainInput(domain)) return false;

  const target   = normaliseDomain(domain);
  const hostname = normaliseDomain(window.location.hostname);

  // Exact match
  if (hostname === target) return true;

  // Valid subdomain: hostname must end with ".<target>"
  // This prevents "evil-example.com" from matching "example.com".
  return hostname.endsWith(`.${target}`);
};

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Returns the origin of the current page (e.g. `"https://example.com"`).
 *
 * Returns `null` outside the browser (SSR / edge runtimes) instead of an
 * empty string so callers can distinguish "not available" from a valid
 * origin value.
 *
 * @returns The origin string, or `null` when not in a browser.
 */
export const getBaseUrl = (): string | null => {
  if (!isBrowser()) return null;
  try {
    return window.location.origin;
  } catch {
    return null;
  }
};

/**
 * Returns `true` when the current page is served over HTTPS.
 *
 * Named `isHttps` rather than `isSecure` so the meaning is unambiguous —
 * "secure" could refer to many things (CSP, HSTS, mixed-content, …).
 *
 * @returns `true` on HTTPS, `false` on HTTP or outside the browser.
 */
export const isHttps = (): boolean => {
  if (!isBrowser()) return false;
  try {
    return window.location.protocol === 'https:';
  } catch {
    return false;
  }
};
