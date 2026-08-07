/**
 * Section detection and block parsing for the deterministic resume parser.
 *
 * detectSections() scans resume text line-by-line for known section headings
 * (with common synonyms), then slices the raw text between each detected
 * heading and the next one.
 *
 * The parse*Block() functions below convert each section's raw text into the
 * array shape the existing schema (types.ts) expects. Standard resumes only —
 * entries are split on blank lines, fields are extracted with simple regex/
 * line-position rules. No NLP, no keyword dictionaries, no date parsing.
 */

import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  TechnicalSkillEntry,
  SoftSkillEntry,
  CertificateEntry,
} from './types';
import { scanEntries, type EntryClassifier, type RawEntry } from './entryParser';

export interface DetectedSections {
  education: string;
  experience: string;
  skills: string;
  projects: string;
  certifications: string;
  bio: string;
  languages: string;
  interests: string;
}

type SectionKey = keyof DetectedSections;

// Heading synonyms per section. Matched case-insensitively against a line's
// full (trimmed) content, so a line must be *just* the heading — not a
// sentence that happens to contain the word. Lists cover common real-world
// variants beyond a minimal set (e.g. "Internship Experience", "Professional
// Skills") — a heading synonym missing from this list doesn't just fail to
// extract its own section, its content merges into whichever known section
// came directly before it in the document, so err on the side of coverage.
const SECTION_HEADINGS: Record<SectionKey, string[]> = {
  education: [
    'education',
    'academic qualification',
    'academic qualifications',
    'qualifications',
    'educational qualifications',
    'academic background',
    'academic details',
  ],
  experience: [
    'experience',
    'work experience',
    'employment',
    'employment history',
    'internship experience',
    'internship',
    'internships',
    'professional experience',
    'work history',
  ],
  skills: [
    'skills',
    'technical skills',
    'technicalskills',
    'core skills',
    'professional skills',
    'key skills',
    'skill set',
    'competencies',
    'core competencies',
  ],
  projects: [
    'projects',
    'academic projects',
    'personal projects',
    'project experience',
    'key projects',
  ],
  certifications: [
    'certifications',
    'certificates',
    'certification',
    'licenses & certifications',
    'courses & certifications',
    'certifications & achievements',
    'achievements',
    'achievements & awards',
    'awards',
    'awards & achievements',
  ],
  bio: [
    'summary',
    'professional summary',
    'about',
    'about me',
    'objective',
    'career objective',
    'profile',
    'professional profile',
  ],
  languages: [
    'languages',
    'languages known',
    'language proficiency',
  ],
  interests: [
    'interest',
    'interests',
    'hobby',
    'hobbies',
    'hobbies & interests',
    'interests & hobbies',
    'hobbies and interests',
    'interests and hobbies',
    'personal interests',
  ],
};

/** Strip trailing colons/punctuation and collapse whitespace for heading comparison. */
function normalizeHeadingLine(line: string): string {
  return line.trim().replace(/[:\-–—]+$/, '').trim().toLowerCase();
}

/** Find which section (if any) a line matches, based on the synonym table. */
function matchSection(line: string): SectionKey | null {
  const normalized = normalizeHeadingLine(line);
  if (!normalized) return null;

  for (const key of Object.keys(SECTION_HEADINGS) as SectionKey[]) {
    if (SECTION_HEADINGS[key].includes(normalized)) {
      return key;
    }
  }
  return null;
}

/**
 * Detect section headings in the resume text and return the raw text found
 * between each detected heading and the next detected heading — or end of
 * document. Sections that aren't found are returned as empty strings.
 *
 * Only lines matching a known synonym in SECTION_HEADINGS act as section
 * boundaries. An earlier version also treated any short, Title-Case/ALL-CAPS
 * line as an "unknown heading" boundary (to stop an unrecognized section
 * name from bleeding into the previous section) — but that heuristic is
 * indistinguishable from ordinary resume content (job titles, degree names,
 * project titles are also short and Title-Case), so it was truncating
 * sections after their very first content line. Removed in favor of keeping
 * SECTION_HEADINGS comprehensive — a missed synonym merges one section into
 * the previous one, which is a smaller, more predictable failure than
 * losing content from every section.
 */
export function detectSections(resumeText: string): DetectedSections {
  const lines = resumeText.split('\n');

  const result: DetectedSections = {
    education: '',
    experience: '',
    skills: '',
    projects: '',
    certifications: '',
    bio: '',
    languages: '',
    interests: '',
  };

  // Record each heading match as { key, lineIndex }.
  const matches: Array<{ key: SectionKey; lineIndex: number }> = [];
  lines.forEach((line, index) => {
    const key = matchSection(line);
    if (key) {
      matches.push({ key, lineIndex: index });
    }
  });

  // Slice content between each heading and the next detected heading.
  for (let i = 0; i < matches.length; i++) {
    const { key, lineIndex } = matches[i];
    const nextLineIndex = i + 1 < matches.length ? matches[i + 1].lineIndex : lines.length;

    const contentLines = lines.slice(lineIndex + 1, nextLineIndex);
    const content = contentLines.join('\n').trim();

    // If the same section heading appears more than once, keep the first
    // occurrence's content rather than silently overwriting it.
    if (!result[key]) {
      result[key] = content;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block parsing — converts raw section text into schema-shaped arrays.
// ---------------------------------------------------------------------------

/** Split a section's raw text into entries, separated by one or more blank lines. */
function splitEntries(sectionText: string): string[] {
  if (!sectionText.trim()) return [];

  return sectionText
    .split(/\n\s*\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Split an entry into its non-empty, trimmed lines. */
function entryLines(entry: string): string[] {
  return entry
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const YEAR_PATTERN = /(19|20)\d{2}/;
// Matches both orderings resumes commonly use: "CGPA: 8.5" and "8.5 CGPA".
const CGPA_PATTERN = /\b(CGPA|GPA)\s*:?\s*\d{1,2}(\.\d{1,2})?\b|\b\d{1,2}(\.\d{1,2})?\s*(CGPA|GPA)\b/i;
const PERCENTAGE_PATTERN = /\b\d{1,3}(\.\d+)?\s*%/;
const DURATION_PATTERN = /\b((19|20)\d{2}|[A-Za-z]{3,9}\s+(19|20)\d{2})\s*(-|–|—|to)\s*(present|current|((19|20)\d{2})|([A-Za-z]{3,9}\s+(19|20)\d{2}))\b/i;

/**
 * The institution line often trails off into comma-separated year/CGPA/
 * percentage clauses on the same line (e.g. "Anna University, 2021, CGPA:
 * 8.5"). Keep only the leading clause(s) that aren't a year/grade marker, so
 * the extracted name is just the institution.
 */
function extractInstitutionName(line: string): string {
  const clauses = line.split(',').map((c) => c.trim());
  const nameClauses = clauses.filter(
    (clause) => !YEAR_PATTERN.test(clause) && !CGPA_PATTERN.test(clause) && !PERCENTAGE_PATTERN.test(clause)
  );
  return (nameClauses.length > 0 ? nameClauses : clauses).join(', ');
}

const DEGREE_KEYWORD_PATTERN = /\b(b\.?tech|b\.?e\b|bachelor'?s?|m\.?tech|m\.?e\b|master'?s?|mba|bba|b\.?sc|m\.?sc|b\.?a\b|m\.?a\b|b\.?com|m\.?com|phd|ph\.d|diploma|hsc|ssc|sslc|10th|12th|matriculation)\b/i;
const INSTITUTION_KEYWORD_PATTERN = /\b(university|college|institute|school|academy|polytechnic)\b/i;

/**
 * Resumes lay out each education entry as either "Degree" then "Institution"
 * or "Institution" then "Degree" — both are common. Rather than assuming a
 * fixed order, classify the first two lines using structural cues (degree
 * keywords, institution keywords, presence of a year) and assign degree/
 * university accordingly. Falls back to the original "line 1 = degree, line
 * 2 = institution" assumption when neither line gives a clear signal.
 */
function splitDegreeAndInstitution(lines: string[]): { degree: string; university: string } {
  const first = lines[0] || '';
  const second = lines[1] || '';

  // An explicit institution keyword (University/College/Institute/...) on the
  // first line is a strong, reliable signal on its own — it doesn't need
  // confirmation from the second line looking like a degree, since OCR/PDF
  // text can fuse a degree keyword into an adjacent word (e.g. "Bachelorof")
  // and lose its word boundary, making that check unreliable in practice.
  const firstLooksLikeInstitution =
    INSTITUTION_KEYWORD_PATTERN.test(first) || (YEAR_PATTERN.test(first) && !DEGREE_KEYWORD_PATTERN.test(first));

  if (firstLooksLikeInstitution) {
    return { degree: second, university: first ? extractInstitutionName(first) : '' };
  }

  // Default (and most common) layout: degree first, institution second.
  return { degree: first, university: second ? extractInstitutionName(second) : '' };
}

export function parseEducationBlock(sectionText: string): EducationEntry[] {
  return splitEntries(sectionText).map((entry, index) => {
    const lines = entryLines(entry);

    const yearMatch = entry.match(YEAR_PATTERN);
    const cgpaMatch = entry.match(CGPA_PATTERN) || entry.match(PERCENTAGE_PATTERN);
    const { degree, university } = splitDegreeAndInstitution(lines);

    return {
      id: index + 1,
      degree,
      department: '',
      university,
      yearOfPassing: yearMatch?.[0] || '',
      cgpa: cgpaMatch?.[0] || '',
      level: '',
      status: '',
    };
  });
}

const JOB_TITLE_KEYWORD_PATTERN = /\b(engineer|developer|intern|manager|analyst|designer|consultant|lead|architect|specialist|coordinator|administrator|associate|director|executive)\b/i;
const ORGANIZATION_KEYWORD_PATTERN = /\b(pvt\.?\s*ltd|private\s+limited|inc\.?|llc|llp|technologies|solutions|systems|corp\.?|company|labs?)\b/i;
// A short duration given as a plain quantity rather than a date range, e.g.
// "6 Months", "1 Year" — DURATION_PATTERN only covers year-based ranges.
const SHORT_DURATION_PATTERN = /\b\d+\s*(month|months|year|years|yr|yrs)\b/i;

/**
 * Some resumes put organization, role, and duration on a single pipe-
 * delimited line, e.g. "Rareminds Technologies | Software Developer Intern |
 * 6 Months". When the first line has 2-3 "|"-separated parts, classify each
 * part by keyword (job-title vs. organization vs. duration) instead of
 * relying on line position at all.
 */
function splitPipeDelimitedLine(line: string): { role: string; organization: string; duration: string } | null {
  const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  let role = '';
  let organization = '';
  let duration = '';

  for (const part of parts) {
    if (SHORT_DURATION_PATTERN.test(part) || DURATION_PATTERN.test(part)) {
      duration = duration || part;
    } else if (JOB_TITLE_KEYWORD_PATTERN.test(part)) {
      role = role || part;
    } else if (ORGANIZATION_KEYWORD_PATTERN.test(part)) {
      organization = organization || part;
    }
  }

  // Assign any still-unclassified parts positionally, in order, to whichever
  // of organization/role is still empty — keeps this deterministic even when
  // a part matches none of the keyword patterns (e.g. a company name with no
  // recognizable suffix).
  const unclassified = parts.filter((p) => p !== role && p !== organization && p !== duration);
  for (const part of unclassified) {
    if (!organization) organization = part;
    else if (!role) role = part;
  }

  return { role, organization, duration };
}

/**
 * Resumes lay out each experience entry as either "Role" then "Organization"
 * or "Organization" then "Role" — both are common. Classify the first two
 * lines using structural cues (job-title keywords, company-suffix keywords)
 * and assign role/organization accordingly. Falls back to the original
 * "line 1 = role, line 2 = organization" assumption when neither line gives
 * a clear signal.
 */
function splitRoleAndOrganization(lines: string[]): { role: string; organization: string } {
  const first = lines[0] || '';
  const second = lines[1] || '';

  const firstLooksLikeOrganization = ORGANIZATION_KEYWORD_PATTERN.test(first) && !JOB_TITLE_KEYWORD_PATTERN.test(first);
  const secondLooksLikeRole = JOB_TITLE_KEYWORD_PATTERN.test(second);

  if (firstLooksLikeOrganization && (secondLooksLikeRole || !second)) {
    return { role: second, organization: first };
  }

  // Default (and most common) layout: role first, organization second.
  return { role: first, organization: second };
}

// A line short enough to plausibly be a title/heading rather than a
// description sentence. Threshold is deliberately generous (most project
// titles and job roles are well under this) to avoid false negatives on
// short titles. Shared by both the Projects and Experience classifiers.
const PROJECT_TITLE_MAX_LENGTH = 80;

// Description lines are sentences describing work done, and consistently
// open with one of these verbs across real resumes. A line starting with one
// of these is treated as description content even when short, so a title
// detector based on length/shape alone doesn't misclassify a short sentence
// as a new entry. Shared by both the Projects and Experience classifiers.
const DESCRIPTION_VERB_PATTERN = /^(developed|implemented|built|designed|integrated|collaborated|debugged|used|created|managed|led|worked|wrote|added|fixed|improved|optimized|refactored|deployed|maintained|tested)\b/i;

// A line carrying a standalone duration (e.g. "Jan 2022 - Present" on its own
// line, distinct from DURATION_PATTERN/SHORT_DURATION_PATTERN which also
// match a duration embedded inside a longer pipe-delimited line) is always
// header content, never the start of a new job or a description sentence —
// resumes commonly wrap role/organization/dates across 2-3 physical lines.
function looksLikeStandaloneDuration(line: string): boolean {
  const trimmed = line.trim();
  return DURATION_PATTERN.test(trimmed) || SHORT_DURATION_PATTERN.test(trimmed);
}

// Description content: a bullet, a sentence ending in a period, or a line
// opening with a description verb. The same shape used for Projects
// (DESCRIPTION_VERB_PATTERN, defined below) applies equally to Experience
// bullets, since both describe work done in the same sentence style.
function looksLikeExperienceDescriptionLine(line: string): boolean {
  return line.startsWith('•') || line.startsWith('-') || line.endsWith('.') || DESCRIPTION_VERB_PATTERN.test(line);
}

/**
 * Experience classifier for the shared scanEntries() engine.
 *
 * Header phase: role, organization, and duration lines — including a
 * pipe-delimited single-line combination of all three, and dates wrapped
 * onto their own following line. A line only leaves the header phase once it
 * reads as real description content or as strong evidence of a new job
 * starting; blank lines and page breaks never leave the header phase or end
 * an entry, since scanEntries() already withholds those from the classifier
 * entirely.
 *
 * New-entry evidence, once already in the description phase: a
 * pipe-delimited role/org/duration line, or a job-title-keyword line
 * immediately followed on the NEXT non-blank line by an organization-keyword
 * or duration line (checked once that next line arrives, via lookback on the
 * entry's own just-appended header — see isNewEntryStart). A bare short line
 * with no such corroboration is treated as a continuation of the current
 * job's description (e.g. a stray wrapped bullet fragment), not a new job —
 * this is deliberately conservative, since a false "new entry" split is the
 * exact failure mode this redesign exists to eliminate.
 */
const experienceClassifier: EntryClassifier = {
  isHeaderContinuation(line, current) {
    if (current.headerLines.length >= 3) return false; // role + org + duration is the max realistic wrap
    if (splitPipeDelimitedLine(line)) return true;
    if (looksLikeStandaloneDuration(line)) return true;
    if (looksLikeExperienceDescriptionLine(line)) return false;
    // A short, non-description second/third header line — treat as the
    // organization (or a wrapped continuation of the role/org) filling out
    // the header, the same "line 1 vs line 2" ambiguity splitRoleAndOrganization
    // already resolves once the header is complete.
    return line.length <= PROJECT_TITLE_MAX_LENGTH;
  },

  isNewEntryStart(line) {
    // A pipe-delimited role|organization|duration line is unambiguous —
    // nothing else produces that shape.
    if (splitPipeDelimitedLine(line)) return true;
    // A job-title-keyword line is strong evidence on its own once we're past
    // the header phase of the current entry (i.e. the current entry already
    // has description content) — a genuine new role heading, not a
    // description sentence, since description sentences are excluded by
    // looksLikeExperienceDescriptionLine below.
    if (looksLikeExperienceDescriptionLine(line)) return false;
    return JOB_TITLE_KEYWORD_PATTERN.test(line) || ORGANIZATION_KEYWORD_PATTERN.test(line);
  },
};

function buildExperienceEntry(raw: RawEntry, index: number): ExperienceEntry {
  const pipeSplit = raw.headerLines[0] ? splitPipeDelimitedLine(raw.headerLines[0]) : null;

  if (pipeSplit) {
    // Any additional header lines beyond the pipe-delimited one (e.g. a
    // wrapped duration continuation) have no dedicated field — fold them
    // into the description rather than discarding them.
    const extraHeaderLines = raw.headerLines.slice(1);
    return {
      id: index + 1,
      role: pipeSplit.role,
      organization: pipeSplit.organization,
      duration: pipeSplit.duration || '',
      description: [...extraHeaderLines, ...raw.descriptionLines].join(' ').trim(),
      verified: false,
    };
  }

  const headerText = raw.headerLines.join(' ');
  const durationMatch = headerText.match(DURATION_PATTERN) || headerText.match(SHORT_DURATION_PATTERN);
  // A header line can be entirely a duration (drop it) or carry a duration
  // as a trailing/leading fragment alongside real role/organization text
  // (e.g. "Web Developer Oct 2024 - Present") — strip just the matched
  // duration substring from each line instead of discarding the whole line,
  // so the role/organization text sharing that line survives.
  const nonDurationHeaderLines = raw.headerLines
    .map((line) => (durationMatch ? line.replace(durationMatch[0], '').trim() : line))
    .filter((line) => line.length > 0);
  const { role, organization } = splitRoleAndOrganization(nonDurationHeaderLines);

  return {
    id: index + 1,
    role,
    organization,
    duration: durationMatch?.[0] || '',
    description: raw.descriptionLines.join(' ').trim(),
    verified: false,
  };
}

export function parseExperienceBlock(sectionText: string): ExperienceEntry[] {
  return scanEntries(sectionText, experienceClassifier).map(buildExperienceEntry);
}

// A metadata line attached to the current project (a repo/demo link), never
// the start of a new one — even though it's short, period-less, and
// verb-less, which would otherwise satisfy the general title fallback below.
const PROJECT_METADATA_LINE_PATTERN = /^(github|gitlab|bitbucket|demo|live demo|link|url)\s*:/i;

// A title/tech-list line contains a "•" or "|" delimiter somewhere but
// doesn't end in a period — read as "not yet a finished sentence," i.e. the
// shape a title or its delimited tech list has while PDF line-wrapping is
// still in progress. This alone is deliberately loose (a complete one-line
// title also matches it — e.g. "Hideaway Booking System | Java • JDBC •
// MySQL") and must always be paired with looksLikeContinuationFragment() on
// the *next* line before treating anything as a wrap-in-progress: a real
// description's first line reliably fails that second check (it ends in a
// period or opens with a description verb), which is what stops the pairing
// from misfiring on an already-complete title.
function looksLikeUnfinishedTitleLine(line: string): boolean {
  return /[•|]/.test(line) && !line.endsWith('.');
}

// A bullet line — the standard shape of description content across both
// Projects and Experience — is never a title/heading fragment, regardless
// of its length or trailing punctuation. Checked ahead of the more general
// looksLikeContinuationFragment() so a short, period-less bullet like
// "• Deployed via Cloudflare Pages" is never mistaken for a wrapped title
// continuation or a new project heading.
function looksLikeBulletLine(line: string): boolean {
  return line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
}

/**
 * True when `line` reads as a short, title-shaped fragment rather than a
 * description sentence — used both for the general "is this a new project
 * title" fallback and, paired with looksLikeUnfinishedTitleLine(), to
 * recognize a wrapped title continuation. Bullets are excluded outright:
 * description content always starts with a bullet marker in practice, so
 * that shape is reserved exclusively for the description phase.
 */
function looksLikeContinuationFragment(line: string): boolean {
  if (looksLikeBulletLine(line)) return false;
  const looksShort = line.length > 0 && line.length <= PROJECT_TITLE_MAX_LENGTH;
  const looksLikeSentence = line.endsWith('.') || DESCRIPTION_VERB_PATTERN.test(line);
  return looksShort && !looksLikeSentence;
}

/**
 * Projects classifier for the shared scanEntries() engine.
 *
 * Header phase: the title, plus any wrapped continuation of the title or
 * its pipe-delimited tech-stack list (looksLikeUnfinishedTitleLine /
 * looksLikeContinuationFragment — the same wrap-detection pairing the old
 * joinWrappedTitle() used, now applied live during the scan instead of as a
 * separate post-pass). A metadata line (GitHub:/Demo:) never continues the
 * header — it's description-phase content attached to the project, exactly
 * like a bullet.
 *
 * New-entry evidence, once already in the description phase: only a line
 * containing "|" — the one shape unique to a title/tech-stack line that
 * description content never produces. This is deliberately the sole signal
 * (earlier drafts also treated any short, non-sentence, non-metadata line as
 * a possible new title, but that shape is indistinguishable from a short
 * bullet fragment and caused genuine two-project boundaries to be missed as
 * often as it caught them). Because this is only ever consulted after the
 * current entry already has description content (scanEntries() keeps a line
 * in the header phase otherwise), a genuinely wrapped title fragment is
 * caught by isHeaderContinuation before this ever runs, and blank lines/page
 * breaks never reach either predicate as a boundary signal at all.
 */
const projectClassifier: EntryClassifier = {
  isHeaderContinuation(line, current) {
    if (PROJECT_METADATA_LINE_PATTERN.test(line)) return false;
    const lastHeaderLine = current.headerLines[current.headerLines.length - 1];
    return looksLikeUnfinishedTitleLine(lastHeaderLine) && looksLikeContinuationFragment(line);
  },

  isNewEntryStart(line) {
    if (PROJECT_METADATA_LINE_PATTERN.test(line)) return false;
    if (looksLikeBulletLine(line)) return false;
    return line.includes('|');
  },
};

function buildProjectEntry(raw: RawEntry, index: number): ProjectEntry {
  return {
    id: index + 1,
    title: raw.headerLines.join(' ').trim(),
    description: raw.descriptionLines.join(' ').trim(),
    technologies: [],
    link: '',
    status: '',
  };
}

export function parseProjectsBlock(sectionText: string): ProjectEntry[] {
  return scanEntries(sectionText, projectClassifier).map(buildProjectEntry);
}

// A short category label at the start of a line, e.g. "Languages :", "Tools:",
// "Frontend : " — resumes commonly group skills under one of these per line.
// The label itself isn't a skill name and must be stripped before splitting.
const LINE_LABEL_PATTERN = /^[A-Za-z][A-Za-z\s/&-]{0,30}:\s*/;

/**
 * Split section text on commas, bullets, or newlines into individual items.
 * Shared by skills (technical/soft) and languages — any section whose
 * content is a flat, delimited list of short names. Each line has its
 * leading "Label :" category prefix (if any) stripped first, so the label
 * itself never becomes part of the first extracted name on that line.
 */
function splitDelimitedNames(sectionText: string): string[] {
  if (!sectionText.trim()) return [];

  const withoutLineLabels = sectionText
    .split('\n')
    .map((line) => line.replace(LINE_LABEL_PATTERN, ''))
    .join('\n');

  return withoutLineLabels
    .split(/[,\n••\-*]+/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

const SOFT_SKILLS_HEADING_PATTERN = /^soft skills\s*:?\s*$/im;

export function parseSkillsBlock(sectionText: string): {
  technicalSkills: TechnicalSkillEntry[];
  softSkills: SoftSkillEntry[];
} {
  if (!sectionText.trim()) {
    return { technicalSkills: [], softSkills: [] };
  }

  // Only populate softSkills if there's an explicit "Soft Skills" sub-heading
  // within the block; everything else goes into technicalSkills.
  const softHeadingMatch = sectionText.match(SOFT_SKILLS_HEADING_PATTERN);

  let technicalText = sectionText;
  let softText = '';

  if (softHeadingMatch && softHeadingMatch.index !== undefined) {
    technicalText = sectionText.slice(0, softHeadingMatch.index);
    softText = sectionText.slice(softHeadingMatch.index + softHeadingMatch[0].length);
  }

  const technicalSkills: TechnicalSkillEntry[] = splitDelimitedNames(technicalText).map((name, index) => ({
    id: index + 1,
    name,
    category: '',
    level: 3,
    verified: false,
  }));

  const softSkills: SoftSkillEntry[] = splitDelimitedNames(softText).map((name, index) => ({
    id: index + 1,
    name,
    level: 3,
  }));

  return { technicalSkills, softSkills };
}

/** Split the Languages section into a flat array of language names. */
export function parseLanguagesBlock(sectionText: string): string[] {
  return splitDelimitedNames(sectionText);
}

/** Split the Interests/Hobbies section into a flat array of interest names. */
export function parseInterestsBlock(sectionText: string): string[] {
  return splitDelimitedNames(sectionText);
}

// A single line that already reads as one complete "Title – Issuer"
// certificate (resumes sometimes list several certificates as consecutive
// single lines with no blank line between them, rather than one multi-line
// block per certificate).
const SINGLE_LINE_CERTIFICATE_PATTERN = /^.+\s[-–—]\s.+$/;

/**
 * Split a certifications block into one raw chunk per certificate. Blank
 * lines are the primary separator (splitEntries), but a block containing
 * multiple lines that each independently look like a complete "Title –
 * Issuer" certificate is further split one-line-per-entry, so consecutive
 * single-line certificates with no blank line between them aren't merged
 * into one entry.
 */
function splitCertificateEntries(sectionText: string): string[] {
  const blocks = splitEntries(sectionText);

  return blocks.flatMap((block) => {
    const lines = entryLines(block);
    const allLinesLookLikeOwnCertificate = lines.length > 1 && lines.every((line) => SINGLE_LINE_CERTIFICATE_PATTERN.test(line));

    return allLinesLookLikeOwnCertificate ? lines : [block];
  });
}

export function parseCertificationsBlock(sectionText: string): CertificateEntry[] {
  return splitCertificateEntries(sectionText).map((entry, index) => {
    const lines = entryLines(entry);

    const yearMatch = entry.match(YEAR_PATTERN);
    // For a single-line "Title – Issuer" entry, split on the dash instead of
    // taking line 2 as the issuer (there is no line 2).
    const dashMatch = lines.length === 1 ? lines[0].match(/^(.+?)\s[-–—]\s(.+)$/) : null;

    return {
      id: index + 1,
      title: dashMatch ? dashMatch[1].trim() : (lines[0] || ''),
      issuer: dashMatch ? dashMatch[2].trim() : (lines[1] || ''),
      issuedOn: yearMatch?.[0] || '',
      credentialId: '',
      link: '',
    };
  });
}
