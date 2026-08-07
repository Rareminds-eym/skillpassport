/**
 * Regex-based extractors for the deterministic resume parser.
 *
 * Name/email/phone patterns are ported directly from the existing
 * parseFallback() in src/features/digital-portfolio/api/resumeParserService.ts
 * (kept behaviorally identical) rather than rewritten.
 */

import { Country, State } from 'country-state-city';

const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;
// Intentionally loose: {10,} counts characters (digits + spaces/dashes), not
// digits, so this alone can match candidates with fewer than 10 real digits.
// Left as-is to stay behaviorally identical to the ported parseFallback()
// pattern (see file docblock) — extractPhoneNumbers()'s downstream
// `.filter(m => m.replace(/\D/g, '').length >= 10)` is what actually
// enforces the 10-digit minimum before a match is ever returned.
const PHONE_PATTERN = /(?:\+91\s?)?[\d\s-]{10,}/g;

const LINKEDIN_PATTERN = /(https?:\/\/)?(www\.)?linkedin\.com\/[A-Za-z0-9_/.-]+/i;
const GITHUB_PATTERN = /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_/.-]+/i;
const TWITTER_PATTERN = /(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_/.-]+/i;
const FACEBOOK_PATTERN = /(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9_/.-]+/i;
const INSTAGRAM_PATTERN = /(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9_/.-]+/i;
// Generic URL, used to find a "portfolio" link that isn't one of the known
// social domains. Deliberately narrower than a bare "word.word" match (which
// would false-positive on things like "B.Tech" or "8.5"): a candidate must
// either have an http(s)/www prefix, or end in a recognized TLD.
const COMMON_TLDS = '(com|org|net|io|dev|me|in|co|info|app|xyz)';
// The domain-label quantifier ([A-Za-z0-9-]+) in the www./bare-TLD branches
// is bounded to {1,63} — the real DNS label-length limit (RFC 1035) — rather
// than left unbounded. Unbounded, a long run of label-legal characters (e.g.
// "a-" repeated thousands of times) with no terminating "." forces the regex
// engine into a backtracking search over every possible split point,
// producing measured polynomial-time blowup (confirmed: ~370ms at 8k chars
// growing to ~1600ms at 16k chars — a clean quadratic signature, not just a
// slow case). Bounding at 63 makes that search space constant-size instead
// of proportional to input length, with zero effect on real domains (no
// legitimate resume URL has a 63+ character label). The https?://[^\s]+
// branch is deliberately left unbounded: [^\s]+ terminates on the first
// whitespace character, which is excluded from its own character class, so
// there is exactly one way to partition a match — no ambiguity, no
// backtracking search, confirmed safe even at 32k adversarial characters.
const URL_PATTERN = new RegExp(
  `(https?://[^\\s]+)|(www\\.[A-Za-z0-9-]{1,63}\\.[A-Za-z]{2,})|([A-Za-z0-9-]{1,63}\\.${COMMON_TLDS}(/[A-Za-z0-9_/.\\-?=&%]*)?)`,
  'gi'
);
const KNOWN_SOCIAL_DOMAINS = /linkedin\.com|github\.com|twitter\.com|x\.com|facebook\.com|instagram\.com/i;
// Matches the synthetic "Portfolio: <url>" line ResumeParser.jsx injects
// when the resume's visible text only has the bare word "Portfolio" (no
// URL shown) but the PDF has a hyperlink annotation behind it — the real
// URL then only exists via that explicit label, not as ordinary body text.
const PORTFOLIO_LABEL_PATTERN = /^portfolio\s*:\s*(\S+)/im;

/** Extract the first email address found in the text. Ported from parseFallback(). */
export function extractEmail(text: string): string {
  const match = text.match(EMAIL_PATTERN);
  return match?.[0] || '';
}

/**
 * Extract up to two distinct phone numbers: [primary, alternate].
 * Primary-number regex/cleanup ported from parseFallback(); alternate is a
 * second distinct match from the same pattern, scanned globally.
 */
export function extractPhoneNumbers(text: string): { primary: string; alternate: string } {
  const matches = text.match(PHONE_PATTERN) || [];

  const cleaned = matches
    .map((m) => m.replace(/\s+/g, ' ').trim())
    .filter((m) => m.replace(/\D/g, '').length >= 10);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const number of cleaned) {
    const digitsOnly = number.replace(/\D/g, '');
    if (seen.has(digitsOnly)) continue;
    seen.add(digitsOnly);
    unique.push(number);
  }

  return {
    primary: unique[0] || '',
    alternate: unique[1] || '',
  };
}

/**
 * Extract the person's name from the first few lines of the resume.
 * Ported from parseFallback(): looks for a short, capitalized, non-email,
 * non-phone line near the top of the document.
 */
export function extractName(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 50 && !line.includes('@') && !/\d{10}/.test(line)) {
      const words = line.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && /^[A-Z]/.test(line)) {
        return line;
      }
    }
  }

  return '';
}

export function extractLinkedIn(text: string): string {
  return text.match(LINKEDIN_PATTERN)?.[0] || '';
}

export function extractGithub(text: string): string {
  return text.match(GITHUB_PATTERN)?.[0] || '';
}

export function extractTwitter(text: string): string {
  return text.match(TWITTER_PATTERN)?.[0] || '';
}

export function extractFacebook(text: string): string {
  return text.match(FACEBOOK_PATTERN)?.[0] || '';
}

export function extractInstagram(text: string): string {
  return text.match(INSTAGRAM_PATTERN)?.[0] || '';
}

/**
 * Extract a "portfolio" URL. Checks the explicit "Portfolio: <url>" label
 * first — present only when ResumeParser.jsx recovered the URL from a PDF
 * hyperlink annotation because the visible text alone had no URL (see
 * extractPortfolioLinkFromAnnotations() in ResumeParser.jsx) — since that
 * label is an unambiguous, deterministic signal the generic scan below
 * can't produce by itself. Falls back to the first URL found in the body
 * text that isn't the email address's domain and isn't one of the known
 * social-media domains (those are captured by their own dedicated
 * extractors).
 */
export function extractPortfolio(text: string): string {
  const labelMatch = text.match(PORTFOLIO_LABEL_PATTERN);
  if (labelMatch) return labelMatch[1];

  // Strip email addresses first so the generic URL pattern can't match an
  // email's domain portion (e.g. "example.com" from "name@example.com").
  const textWithoutEmails = text.replace(new RegExp(EMAIL_PATTERN, 'g'), '');
  const matches = textWithoutEmails.match(URL_PATTERN) || [];
  const candidate = matches.find((url) => !KNOWN_SOCIAL_DOMAINS.test(url));
  return candidate || '';
}

/**
 * Remove the synthetic "Portfolio: <url>" line ResumeParser.jsx appends
 * after all page text (see extractPortfolioLinkFromAnnotations() there) —
 * used only to build the text passed to detectSections(), never the text
 * passed to extractPortfolio() itself.
 *
 * That injected line carries no section heading of its own and is appended
 * after the last page's real content, so detectSections() (which has no
 * closing boundary for whichever section heading appears last in the
 * document — its content runs to end-of-text by design) was folding it into
 * that trailing section's content, producing a bogus entry there (observed:
 * a fake Certificate titled "Portfolio: <url>"). Stripping it out of the
 * section-detection input — but not out of the text extractPortfolio()
 * reads — keeps the annotation-recovered URL flowing through its intended
 * PORTFOLIO_LABEL_PATTERN path while making it invisible to every
 * parseXBlock() function.
 *
 * Matched with the 'gm' flags (global + multiline) so every line matching
 * the pattern is removed, not just the first — PORTFOLIO_LABEL_PATTERN
 * itself only needs the first match (extractPortfolio() takes the earliest
 * occurrence), but stripping must remove all occurrences to guarantee none
 * reach section detection.
 */
export function stripInjectedPortfolioLabel(text: string): string {
  return text.replace(new RegExp(PORTFOLIO_LABEL_PATTERN.source, 'gim'), '').trim();
}

// ---------------------------------------------------------------------------
// Location (city / state / country) — reuses the country-state-city package
// as the source of truth for country and state names instead of a
// hand-maintained lookup table. Only Country/State are imported (not City,
// which is ~7.7MB of data this parser doesn't need and which bundle-size
// verification confirmed tree-shakes out when unused).
// ---------------------------------------------------------------------------

// Built once at module load, not per call. Name keys are lowercased for
// case-insensitive exact-match lookup (never substring/fuzzy).
const COUNTRY_NAME_SET = new Set(Country.getAllCountries().map((c) => c.name.toLowerCase()));
const COUNTRY_BY_CODE = new Map(Country.getAllCountries().map((c) => [c.isoCode, c.name]));

const ALL_STATES = State.getAllStates();
// Full-name lookup first (unambiguous: state names collide far less often
// than 2-letter codes do across 195 countries' subdivisions).
const STATES_BY_NAME = new Map(ALL_STATES.map((s) => [s.name.toLowerCase(), s]));
// Code lookup only used as a fallback, and only trusted when a code maps to
// exactly one country's state — an ambiguous code (e.g. "NY" is both New
// York, US and Nyíregyháza, Hungary) is deliberately left unresolved rather
// than guessing which country it belongs to.
const STATES_BY_CODE = new Map<string, typeof ALL_STATES>();
for (const s of ALL_STATES) {
  const key = s.isoCode.toLowerCase();
  const existing = STATES_BY_CODE.get(key) || [];
  existing.push(s);
  STATES_BY_CODE.set(key, existing);
}

// Common resume shorthand for country names that don't match the package's
// canonical ISO names exactly (e.g. "USA" vs. "United States"). Maps each
// alias to the canonical name so the rest of the logic only ever deals with
// canonical names.
const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'u.s.a': 'United States',
  'u.s': 'United States',
  uk: 'United Kingdom',
  'u.k': 'United Kingdom',
  uae: 'United Arab Emirates',
};

// Work-mode / non-location tokens that can appear in the same header
// position as a real location but must never be read as one.
const NON_LOCATION_TOKENS = new Set(['remote', 'hybrid', 'onsite', 'on-site', 'work from home', 'wfh']);

function resolveCountryName(part: string): string | null {
  const normalized = part.trim().toLowerCase();
  if (!normalized) return null;
  if (COUNTRY_ALIASES[normalized]) return COUNTRY_ALIASES[normalized];
  if (COUNTRY_NAME_SET.has(normalized)) return part.trim();
  return null;
}

/**
 * Resolve a segment to a state, returning both the state's own name and its
 * country (derived from the matched state's countryCode, never assumed).
 * Tries an exact full-name match first (least ambiguous). Falls back to an
 * ISO code match — 2-letter state/province codes collide across countries
 * (e.g. "CA" matches 11 different countries' subdivisions, "NY" matches 2),
 * so a code match is only trusted when it's unambiguous, with one narrow,
 * deliberate exception: US state codes are resume writers' overwhelmingly
 * dominant convention for this shape ("San Francisco, CA", "New York, NY"),
 * so when a code collides across countries but exactly one of the matches
 * is a US state, that match wins rather than leaving the whole segment
 * unresolved.
 */
function resolveState(part: string): { name: string; country: string } | null {
  const normalized = part.trim().toLowerCase();
  if (!normalized) return null;

  const byName = STATES_BY_NAME.get(normalized);
  if (byName) {
    const countryName = COUNTRY_BY_CODE.get(byName.countryCode);
    return countryName ? { name: byName.name, country: countryName } : null;
  }

  const byCode = STATES_BY_CODE.get(normalized);
  if (!byCode || byCode.length === 0) return null;

  const match = byCode.length === 1 ? byCode[0] : byCode.find((s) => s.countryCode === 'US');
  if (!match) return null;

  const countryName = COUNTRY_BY_CODE.get(match.countryCode);
  return countryName ? { name: match.name, country: countryName } : null;
}

// A location candidate segment: 1-3 comma-separated Title-Case word groups,
// nothing else in the segment (no email/phone/URL mixed in, so the contact
// line's other fields can't bleed into a location match).
const LOCATION_LINE_PATTERN = /^[A-Za-z][A-Za-z .'-]*(,\s*[A-Za-z][A-Za-z .'-]*){0,2}$/;

type LocationResult = { city: string; state: string; country: string };

function isCandidateSegment(segment: string): boolean {
  return (
    !segment.includes('@') &&
    !/\d{3,}/.test(segment) &&
    LOCATION_LINE_PATTERN.test(segment) &&
    !NON_LOCATION_TOKENS.has(segment.toLowerCase())
  );
}

/**
 * Classify one comma-separated location segment (2+ parts). Extracted so
 * both a dedicated location line and a single "|"-delimited segment of a
 * combined contact line (e.g. "email | phone | City, State, Country") can
 * share the same table-driven classification instead of duplicating it —
 * the same "|"-delimited-contact-line convention splitPipeDelimitedLine()
 * already handles for experience entries.
 */
function classifyCommaSeparated(parts: string[]): LocationResult | null {
  if (parts.length < 2) return null;

  const last = parts[parts.length - 1];
  const countryFromLast = resolveCountryName(last);
  const stateFromLast = resolveState(last);

  if (countryFromLast) {
    const secondToLast = parts.length >= 3 ? parts[parts.length - 2] : null;
    // Only trust the second-to-last segment as a state if it resolves to a
    // state that actually belongs to the country already identified from
    // the last segment — otherwise a same-named state/province in an
    // unrelated country could attach itself to the wrong line.
    const state = secondToLast ? resolveState(secondToLast) : null;
    const stateMatchesCountry = state && state.country === countryFromLast;
    const cityParts = parts.slice(0, stateMatchesCountry ? parts.length - 2 : parts.length - 1);
    return {
      city: cityParts.join(', '),
      state: stateMatchesCountry ? state!.name : '',
      country: countryFromLast,
    };
  }

  if (stateFromLast) {
    const cityParts = parts.slice(0, parts.length - 1);
    return { city: cityParts.join(', '), state: stateFromLast.name, country: stateFromLast.country };
  }

  // Last segment matched neither table — don't guess which role the
  // remaining segments play; city alone is still a safe partial result.
  return { city: parts[0], state: '', country: '' };
}

/**
 * Extract city/state/country from the resume header (first ~7 lines, same
 * region extractName()/extractEmail() already scan). Deterministic,
 * table-driven classification — no fuzzy/AI matching:
 *   - a header line is checked as a whole first; if it's a single-line
 *     contact line combining email/phone/location with "|" (the same
 *     convention splitPipeDelimitedLine() already handles for experience
 *     entries), each "|"-segment is checked independently instead, so the
 *     location doesn't need its own dedicated line;
 *   - only comma-separated segments are treated as location candidates in
 *     the main pass — a bare single word/phrase (no comma) is structurally
 *     identical to a person's name (also a short Title-Case header line),
 *     so it is never confidently a location on shape alone; the one
 *     exception is a single token that itself matches the country table
 *     (e.g. a lone "India" or "Singapore" line), handled as a second,
 *     narrower pass;
 *   - the LAST comma-separated part is classified first, via exact lookup
 *     against the country-state-city package's country and state data
 *     (plus a small alias table for common shorthand). States are looked
 *     up globally (every country's subdivisions, not just the US), so a
 *     matched state's own countryCode determines the country — e.g.
 *     "Karnataka" resolves to India, "NY"/"New York" resolves to the
 *     United States — never assumed from the segment's position alone;
 *   - a part matching the country table sets country directly;
 *   - once the last part is classified, the remaining leading part(s)
 *     become city.
 * Fields the rules can't confidently resolve are left empty rather than
 * guessed — see the module-level design rationale for why (partial
 * correctness over confident wrongness). A bare, unclassified single-word
 * segment (e.g. "Hyderabad" with no comma) is deliberately NOT treated as a
 * city, since it's indistinguishable in shape from a name-header line and
 * guessing wrong there is worse than leaving it empty.
 */
export function extractLocation(text: string): LocationResult {
  const empty: LocationResult = { city: '', state: '', country: '' };

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 7);

  // Every candidate segment to try, in order: each full header line, plus
  // (for lines using the "|"-delimited contact convention) each of that
  // line's own segments — so a combined "email | phone | City, State,
  // Country" line is checked segment-by-segment, not just as one whole.
  const candidateSegments: string[] = [];
  for (const line of lines) {
    candidateSegments.push(line);
    if (line.includes('|')) {
      line.split('|').forEach((seg) => candidateSegments.push(seg.trim()));
    }
  }

  // Main pass: comma-separated segments only.
  for (const segment of candidateSegments) {
    if (!isCandidateSegment(segment)) continue;

    const parts = segment.split(',').map((p) => p.trim()).filter(Boolean);
    const result = classifyCommaSeparated(parts);
    if (result) return result;
  }

  // Narrower second pass: a single token (no comma) that independently
  // matches the country table (e.g. a lone "India" line). This is the only
  // single-token case confident enough to accept, since it's resolved by an
  // exact table hit rather than shape alone.
  for (const segment of candidateSegments) {
    if (!isCandidateSegment(segment)) continue;
    if (segment.includes(',')) continue;

    const countryOnly = resolveCountryName(segment);
    if (countryOnly) return { city: '', state: '', country: countryOnly };
  }

  return empty;
}

// 6-digit Indian PIN code or 5-digit (optionally +4) US ZIP code, matched
// against the same header region as extractLocation() so a project's
// "port 8080"-style number elsewhere in the document is never picked up.
const PINCODE_PATTERN = /\b(\d{6}|\d{5}(-\d{4})?)\b/;

export function extractPincode(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines.slice(0, 7)) {
    if (line.includes('@')) continue; // an email header line can contain digits; not a pincode source
    const match = line.match(PINCODE_PATTERN);
    if (match) return match[0];
  }

  return '';
}
