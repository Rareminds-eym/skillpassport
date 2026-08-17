import type { PlatformStrategy } from '../types';

/**
 * One table of platform → extraction strategy. Each entry is declarative data
 * (a `type` discriminant plus its parameters), not a function — adding a
 * verified platform means adding one row here, not one new file. Reserve the
 * 'custom' strategy type for platforms proven (via a real certificate) to need
 * logic a declarative strategy can't express.
 *
 * Only add a platform here once its certificate structure has been verified
 * against a real certificate. Platforms without a proven structure should
 * rely on genericFallback() rather than a speculative entry.
 */
export const PLATFORM_STRATEGIES: Record<string, PlatformStrategy> = {
  udemy: {
    type: 'regex-field',
    // Udemy renders certificate details (instructor, learner, date, duration)
    // client-side — none of that is present in the raw server HTML. The course
    // title, however, is reliably embedded in the og:description/description
    // meta tags via a fixed template: `My course completion certificate for "COURSE_TITLE"`.
    sourceField: 'ogDescription',
    fallbackField: 'description',
    pattern: /certificate for ["“]([^"”]+)["”]/i,
  },
  codechef: {
    type: 'regex-field',
    // CodeChef exposes the course/lesson name in og:description via a fixed
    // template: `Certificate for completing all the lessons in COURSE_NAME`.
    // og:title on CodeChef certificate pages contains the learner's name, not
    // the course — it must never be used as a title source (confirmed: a
    // duplicate, unrelated pair of generic og tags also exists further down
    // the page and must not be picked up instead).
    sourceField: 'ogDescription',
    pattern: /completing all the lessons in (.+)$/i,
  },
  coursera: {
    type: 'regex-field',
    // Verified against a real, live coursera.org/verify/{id} certificate page
    // (unauthenticated server-side fetch, HTTP 200, full content returned —
    // no login wall). og:title uses a fixed template:
    // `Completion Certificate for COURSE_TITLE`.
    sourceField: 'ogTitle',
    pattern: /completion certificate for (.+)$/i,
  },
};
