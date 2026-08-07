/**
 * Deterministic synchronization matcher for resume re-import.
 *
 * For each supported entity, compares parsed resume records against the
 * learner's existing DB rows using a fixed key (per entity) plus a fixed set
 * of "compared" fields. Field-based equality only — no fuzzy/AI/Levenshtein
 * matching, no substring or word-level comparison. Every field is normalized
 * (trim, collapse whitespace, case-fold) before comparison so formatting
 * differences (extra spaces, casing) don't register as a change.
 *
 * Output: a `toUpsert` array shaped for `.upsert(records, {onConflict:'id'})`
 * — changed records carry the existing row's `id`, new records omit `id`
 * entirely (the DB assigns one via its default). Unchanged records are
 * excluded from `toUpsert` outright — a true no-op, not a redundant write.
 */

function normalizeField(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function fieldsEqual(a: unknown, b: unknown): boolean {
  return normalizeField(a) === normalizeField(b);
}

/** True when every field in `comparedFields` is equal (post-normalization) between two records. */
function isUnchanged(existing: Record<string, any>, parsed: Record<string, any>, comparedFields: string[]): boolean {
  return comparedFields.every((field) => fieldsEqual(existing[field], parsed[field]));
}

interface MatchResult<T> {
  toUpsert: T[];
  unchangedCount: number;
}

/**
 * Generic matcher: builds a key per record (existing + parsed), matches
 * parsed records against existing ones by key, and classifies each parsed
 * record as unchanged / changed / new. Parsed records are deduped by key
 * before matching, so two parsed rows sharing a key never both target an
 * insert (mirrors the existing skills dedup pattern in resume/save.ts).
 */
function matchByKey<E extends Record<string, any>, P extends Record<string, any>>(
  existing: E[],
  parsed: P[],
  keyOf: (record: Record<string, any>) => string,
  comparedFields: string[],
  buildUpsertRecord: (parsedRecord: P, existingId: string | undefined) => Record<string, any>,
): MatchResult<Record<string, any>> {
  const existingByKey = new Map<string, E>();
  existing.forEach((record) => {
    const key = keyOf(record);
    if (key) existingByKey.set(key, record);
  });

  const seenParsedKeys = new Set<string>();
  const toUpsert: Record<string, any>[] = [];
  let unchangedCount = 0;

  parsed.forEach((parsedRecord) => {
    const key = keyOf(parsedRecord);
    if (!key || seenParsedKeys.has(key)) return;
    seenParsedKeys.add(key);

    const existingRecord = existingByKey.get(key);

    if (!existingRecord) {
      toUpsert.push(buildUpsertRecord(parsedRecord, undefined));
      return;
    }

    if (isUnchanged(existingRecord, parsedRecord, comparedFields)) {
      unchangedCount++;
      return;
    }

    toUpsert.push(buildUpsertRecord(parsedRecord, existingRecord.id));
  });

  return { toUpsert, unchangedCount };
}

// ─── Education — key: degree + university ──────────────────────────────────

export interface EducationDbRecord {
  id: string;
  degree?: string | null;
  university?: string | null;
  department?: string | null;
  year_of_passing?: string | number | null;
  cgpa?: string | number | null;
  level?: string | null;
  status?: string | null;
}

export function matchEducation(
  existing: EducationDbRecord[],
  parsedAsDbShape: Omit<EducationDbRecord, 'id'>[],
): MatchResult<Record<string, any>> {
  const keyOf = (r: Record<string, any>) => {
    const degree = normalizeField(r.degree);
    const university = normalizeField(r.university);
    return degree && university ? `${degree}::${university}` : '';
  };
  const comparedFields = ['department', 'year_of_passing', 'cgpa', 'level', 'status'];

  return matchByKey(existing, parsedAsDbShape, keyOf, comparedFields, (parsedRecord, existingId) => ({
    ...parsedRecord,
    ...(existingId ? { id: existingId } : {}),
  }));
}

// ─── Experience — key: organization + role ──────────────────────────────────

export interface ExperienceDbRecord {
  id: string;
  organization?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration?: string | null;
  description?: string | null;
  verified?: boolean | null;
}

export function matchExperience(
  existing: ExperienceDbRecord[],
  parsedAsDbShape: Omit<ExperienceDbRecord, 'id'>[],
): MatchResult<Record<string, any>> {
  const keyOf = (r: Record<string, any>) => {
    const organization = normalizeField(r.organization);
    const role = normalizeField(r.role);
    return organization && role ? `${organization}::${role}` : '';
  };
  const comparedFields = ['start_date', 'end_date', 'duration', 'description'];

  return matchByKey(existing, parsedAsDbShape, keyOf, comparedFields, (parsedRecord, existingId) => ({
    ...parsedRecord,
    ...(existingId ? { id: existingId } : {}),
  }));
}

// ─── Projects — key: project name only (title text before the first "|") ────
// The stored `title` is the full "Name | Tech • Tech • Tech" string produced
// by the parser's pipe-delimited-title convention, so keying on the whole
// title makes the match key unstable whenever a re-imported resume changes
// only the tech-stack list (a realistic, common edit) — the project's name
// hasn't changed, but the full title string has, so a whole-title key
// misreads it as a different project and inserts a duplicate instead of
// updating. Keying on just the name segment keeps the match stable across
// tech-stack edits while the stored title/description are unaffected: only
// the KEY is derived from a substring, buildUpsertRecord still spreads the
// full, unmodified parsedRecord (including its complete title).

export interface ProjectDbRecord {
  id: string;
  title?: string | null;
  organization?: string | null;
  duration?: string | null;
  description?: string | null;
  status?: string | null;
  tech_stack?: string[] | null;
  demo_link?: string | null;
  github_link?: string | null;
}

/** The project-name portion of a title: everything before the first "|" (or the whole string if there's no "|"). */
function projectNameKey(title: unknown): string {
  const fullTitle = typeof title === 'string' ? title : '';
  const [namePart] = fullTitle.split('|');
  return normalizeField(namePart);
}

export function matchProjects(
  existing: ProjectDbRecord[],
  parsedAsDbShape: Omit<ProjectDbRecord, 'id'>[],
): MatchResult<Record<string, any>> {
  const keyOf = (r: Record<string, any>) => projectNameKey(r.title);
  const comparedFields = ['organization', 'duration', 'description', 'status', 'demo_link', 'github_link', 'title'];

  return matchByKey(existing, parsedAsDbShape, keyOf, comparedFields, (parsedRecord, existingId) => ({
    ...parsedRecord,
    ...(existingId ? { id: existingId } : {}),
  }));
}

// ─── Certificates — key: title + issuer ──────────────────────────────────────
// (title alone was considered, but issuer is already part of the agreed
// matching rule set from the earlier review and costs nothing extra here.)

export interface CertificateDbRecord {
  id: string;
  title?: string | null;
  issuer?: string | null;
  issued_on?: string | null;
  expiry_date?: string | null;
  description?: string | null;
  status?: string | null;
}

export function matchCertificates(
  existing: CertificateDbRecord[],
  parsedAsDbShape: Omit<CertificateDbRecord, 'id'>[],
): MatchResult<Record<string, any>> {
  const keyOf = (r: Record<string, any>) => {
    const title = normalizeField(r.title);
    const issuer = normalizeField(r.issuer);
    return title ? `${title}::${issuer}` : '';
  };
  const comparedFields = ['issuer', 'issued_on', 'expiry_date', 'description', 'status'];

  return matchByKey(existing, parsedAsDbShape, keyOf, comparedFields, (parsedRecord, existingId) => ({
    ...parsedRecord,
    ...(existingId ? { id: existingId } : {}),
  }));
}

// ─── Skills — key: name + type ───────────────────────────────────────────────
// Reuses the same key shape as the existing pre-insert dedup logic in
// resume/save.ts (getSkillKey), generalized here into the same match/update/
// insert flow as the other four entities instead of insert-only.

export interface SkillDbRecord {
  id: string;
  name?: string | null;
  type?: string | null;
  level?: number | null;
  description?: string | null;
  verified?: boolean | null;
}

export function matchSkills(
  existing: SkillDbRecord[],
  parsedAsDbShape: Omit<SkillDbRecord, 'id'>[],
): MatchResult<Record<string, any>> {
  const keyOf = (r: Record<string, any>) => {
    const name = normalizeField(r.name);
    const type = normalizeField(r.type);
    return name ? `${name}::${type}` : '';
  };
  const comparedFields = ['level', 'description'];

  return matchByKey(existing, parsedAsDbShape, keyOf, comparedFields, (parsedRecord, existingId) => ({
    ...parsedRecord,
    ...(existingId ? { id: existingId } : {}),
  }));
}
