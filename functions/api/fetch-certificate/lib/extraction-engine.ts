import type { NormalizedCertificateData, RawMetadata, RegexFieldStrategy } from '../types';
import { PLATFORM_STRATEGIES } from '../platforms/configs';

export const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

/**
 * Titles that are the platform's own homepage/marketing copy rather than
 * certificate-specific content. Generic extraction must never surface these.
 */
export const isGenericPlatformTitle = (title: string): boolean => {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return true;
  const boilerplatePatterns = [
    /online courses/,
    /learn anything/,
    /top educators/,
    /join for free/,
    /^udemy\b/,
    /^coursera\b/,
    /^linkedin\b/,
    /^edx\b/,
  ];
  return boilerplatePatterns.some(pattern => pattern.test(normalized));
};

/**
 * Shared handler for the 'regex-field' strategy: reads the configured source
 * field (falling back to fallbackField if present and the primary is empty),
 * decodes entities, applies the configured pattern, and rejects boilerplate.
 * This is the one piece of logic every regex-field platform shares — platform
 * configs supply only the field name(s) and pattern, never their own copy of
 * this behavior.
 */
const runRegexFieldStrategy = (
  strategy: RegexFieldStrategy,
  raw: RawMetadata
): Partial<NormalizedCertificateData> => {
  const source = raw[strategy.sourceField] || (strategy.fallbackField ? raw[strategy.fallbackField] : '');
  if (!source) return {};

  const decodedSource = decodeHtmlEntities(source);
  const match = decodedSource.match(strategy.pattern);
  if (!match) return {};

  const title = match[1].trim();
  if (!title || isGenericPlatformTitle(title)) return {};

  return { title, extractionSource: 'platform-adapter', confidence: 'high' };
};

/**
 * Fallback for platforms with no registered strategy. Intentionally does NOT use
 * og:title as a Course Title source: confirmed across multiple real platforms that
 * og:title is unreliable in different ways per platform (site-wide boilerplate on
 * some, the learner's own name on others) with no safe generic way to tell those
 * cases apart. og:description carries course-like context more reliably, but without
 * platform-specific template knowledge it cannot be cleaned into a precise title, so
 * it is only ever returned as a low-confidence suggestion for the caller to confirm
 * before using it - never auto-filled directly.
 */
export const genericFallback = (raw: RawMetadata): Partial<NormalizedCertificateData> => {
  const candidate = raw.ogDescription;
  if (!candidate || isGenericPlatformTitle(candidate)) return {};
  return { title: candidate.trim(), extractionSource: 'generic-meta', confidence: 'low' };
};

/**
 * Common extraction engine. Dispatches to the platform's registered strategy
 * by its `type` discriminant, or to genericFallback() when no strategy is
 * registered for the platform. This is the single place platform count/growth
 * is handled — adding platform #100 never changes this function.
 */
export const normalizeCertificateData = (
  platform: string,
  html: string,
  raw: RawMetadata,
  certificateIdFromUrl: string | null
): NormalizedCertificateData => {
  const strategy = PLATFORM_STRATEGIES[platform];

  let extracted: Partial<NormalizedCertificateData>;
  if (!strategy) {
    extracted = genericFallback(raw);
  } else if (strategy.type === 'custom') {
    extracted = strategy.extract(html, raw);
  } else {
    extracted = runRegexFieldStrategy(strategy, raw);
  }

  return {
    title: extracted.title ?? null,
    instructor: extracted.instructor ?? null,
    learnerName: extracted.learnerName ?? null,
    completionDate: extracted.completionDate ?? null,
    duration: extracted.duration ?? null,
    certificateId: extracted.certificateId ?? certificateIdFromUrl,
    extractionSource: extracted.extractionSource ?? 'none',
    confidence: extracted.confidence ?? 'low',
  };
};
