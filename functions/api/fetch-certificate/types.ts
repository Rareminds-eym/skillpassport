/**
 * Platform-agnostic shape the frontend consumes. Fields the extractor cannot
 * reliably determine are `null` rather than guessed — callers must not invent data.
 */
export interface NormalizedCertificateData {
  title: string | null;
  instructor: string | null;
  learnerName: string | null;
  completionDate: string | null;
  duration: string | null;
  certificateId: string | null;
  extractionSource: 'platform-adapter' | 'generic-meta' | 'none';
  confidence: 'high' | 'low';
}

export interface RawMetadata {
  title: string;
  ogTitle: string;
  ogDescription: string;
  description: string;
  ogImage: string;
  finalUrl: string;
}

/**
 * Declarative strategy for platforms whose course title lives in a single
 * meta-tag field via one fixed regex template — covers every platform verified
 * so far. `sourceField`/`fallbackField` name keys on RawMetadata; the pattern's
 * first capture group is the title. Nothing here is executable — it's pure
 * data, so adding a verified platform never means writing extraction logic again.
 *
 * `type` is a discriminant so the engine can dispatch to different (future)
 * strategies without every platform needing its own file or function. Add a
 * new strategy type only once real R&D on a real certificate proves this
 * shape can't represent it.
 */
export interface RegexFieldStrategy {
  type: 'regex-field';
  sourceField: keyof RawMetadata;
  fallbackField?: keyof RawMetadata;
  pattern: RegExp;
}

/**
 * Escape hatch for platforms whose structure genuinely doesn't fit any
 * declarative strategy (e.g. JSON embedded in a script tag, multi-step
 * extraction, unusual page structure). Only use this when no declarative
 * strategy can represent the platform — verified against a real certificate first.
 */
export interface CustomStrategy {
  type: 'custom';
  extract: (html: string, raw: RawMetadata) => Partial<NormalizedCertificateData>;
}

export type PlatformStrategy = RegexFieldStrategy | CustomStrategy;
