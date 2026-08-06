  /**
 * Deterministic (script-based) resume parser — entry point.
 *
 * Basic details (name, email, phone, social links) come from regex.ts.
 * Sectioned fields (education, experience, projects, skills, certifications,
 * bio) come from detectSections() + the parse*Block() functions in
 * sectionParser.ts. bio is a plain string — the section's raw text is used
 * verbatim, no per-entry parsing. training has no dedicated section per this
 * phase's scope and stays empty, same as it would if no "Training" heading
 * were detected.
 */

import {
  extractEmail,
  extractPhoneNumbers,
  extractName,
  extractLinkedIn,
  extractGithub,
  extractTwitter,
  extractFacebook,
  extractInstagram,
  extractPortfolio,
  extractLocation,
  extractPincode,
} from './regex';
import {
  detectSections,
  parseEducationBlock,
  parseExperienceBlock,
  parseProjectsBlock,
  parseSkillsBlock,
  parseCertificationsBlock,
  parseLanguagesBlock,
  parseInterestsBlock,
} from './sectionParser';
import type { EducationEntry, ParsedResumeData } from './types';

/** Collapse whitespace and normalize line endings before extraction. */
function normalizeText(resumeText: string): string {
  return resumeText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// Degree keywords ranked by education level, highest first. Used to pick the
// most advanced education entry for the top-level university/college/branch
// fields — no dictionary of full degree names, just enough to rank entries
// against each other (e.g. prefer "B.Tech" over "10th Standard").
//
// Patterns anchor a word boundary (\b) only at the START of each free-text
// keyword, not the end. PDF/OCR text extraction can fuse a keyword directly
// onto the next word with no space (e.g. "Bachelorof Engineering" instead of
// "Bachelor of Engineering") — a trailing \b would never match that, since
// there's no boundary between "Bachelor" and "of" in the fused text. A
// missing trailing boundary risks matching a keyword as a prefix of a longer,
// unrelated word, but that's a negligible false-positive risk for words this
// specific (no common English word starts with "bachelor", "diploma", etc.),
// so it's the right trade for resilience against fused resume text. Short
// abbreviations (b.tech, m.sc, 10th, ...) are self-delimiting by punctuation/
// digits and unaffected either way.
const DEGREE_LEVEL_RANK: Array<{ pattern: RegExp; rank: number }> = [
  { pattern: /\b(phd|ph\.d|doctorate|doctoral)/i, rank: 5 },
  { pattern: /\b(m\.?tech|m\.?e\b|mba|m\.?sc|m\.?a\b|m\.?com|master'?s?|pg\b)/i, rank: 4 },
  { pattern: /\b(b\.?tech|b\.?e\b|bba|b\.?sc|b\.?a\b|b\.?com|bachelor'?s?|ug\b)/i, rank: 3 },
  { pattern: /\bdiploma/i, rank: 2 },
  { pattern: /\b(12th|hsc|higher secondary|intermediate)/i, rank: 1 },
  { pattern: /\b(10th|sslc|ssc|matriculation)/i, rank: 0 },
];

function degreeRank(degree: string): number {
  for (const { pattern, rank } of DEGREE_LEVEL_RANK) {
    if (pattern.test(degree)) return rank;
  }
  return -1; // unrecognized degree text — ranked below every known level
}

/**
 * Pick the most advanced education entry to source the top-level
 * university/college_school_name/branch_field values from. Falls back to
 * the last entry (resumes typically list education chronologically, so the
 * last entry is usually the most recent/advanced) when no entry's degree
 * text matches a known level.
 */
function pickPrimaryEducationEntry(education: EducationEntry[]): EducationEntry | undefined {
  if (education.length === 0) return undefined;

  return education.reduce((best, entry) =>
    degreeRank(entry.degree) >= degreeRank(best.degree) ? entry : best
  );
}

export function parseResumeDeterministic(resumeText: string): ParsedResumeData {
  const text = normalizeText(resumeText);
  const { primary, alternate } = extractPhoneNumbers(text);

  const sections = detectSections(text);
  const { technicalSkills, softSkills } = parseSkillsBlock(sections.skills);
  const education = parseEducationBlock(sections.education);
  const primaryEducation = pickPrimaryEducationEntry(education);
  const { city, state, country } = extractLocation(text);

  return {
    name: extractName(text),
    email: extractEmail(text),
    contact_number: primary,
    alternate_number: alternate,
    date_of_birth: '',
    address: '',
    city,
    state,
    country,
    pincode: extractPincode(text),
    college_school_name: primaryEducation?.university || '',
    university: primaryEducation?.university || '',
    branch_field: primaryEducation?.department || primaryEducation?.degree || '',
    registration_number: '',
    bio: sections.bio,
    linkedin_link: extractLinkedIn(text),
    github_link: extractGithub(text),
    portfolio_link: extractPortfolio(text),
    twitter_link: extractTwitter(text),
    facebook_link: extractFacebook(text),
    instagram_link: extractInstagram(text),
    interests: parseInterestsBlock(sections.interests),
    languages: parseLanguagesBlock(sections.languages),
    hobbies: [],
    education,
    experience: parseExperienceBlock(sections.experience),
    projects: parseProjectsBlock(sections.projects),
    technicalSkills,
    softSkills,
    certificates: parseCertificationsBlock(sections.certifications),
    training: [],
  };
}
