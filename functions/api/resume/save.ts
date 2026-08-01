import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { ADMIN_ROLES } from '../../lib/roleCategories';
import { getServiceClient } from '../../lib/supabase';

// Type definitions for resume data structures
interface ExperienceInput {
  startDate?: string | Date | null;
  start_date?: string | Date | null;
  endDate?: string | Date | null;
  end_date?: string | Date | null;
  duration?: string;
  organization?: string;
  role?: string;
  description?: string;
  verified?: boolean;
}

interface SkillRecord {
  name?: string;
  level?: number | string;
  category?: string;
  type?: string;
  description?: string;
  verified?: boolean;
}

interface EducationRecord {
  level?: string;
  degree?: string;
  department?: string;
  university?: string;
  yearOfPassing?: string | number;
  cgpa?: string | number;
  status?: string;
}

interface CertificateRecord {
  title?: string;
  issuer?: string;
  level?: string;
  credentialId?: string;
  link?: string;
  issuedOn?: string | Date | null;
  issued_on?: string | Date | null;
  expiryDate?: string | Date | null;
  expiry_date?: string | Date | null;
  description?: string;
  status?: string;
}

interface ProjectRecord {
  title?: string;
  organization?: string;
  duration?: string;
  description?: string;
  status?: string;
  technologies?: string[];
  techStack?: string[];
  tech?: string[];
  skills?: string[];
  demoLink?: string;
  demo?: string;
  link?: string;
  url?: string;
  github?: string;
}

interface TrainingRecord {
  course?: string;
  skill?: string;
  trainer?: string;
  status?: string;
  progress?: number;
}

const LEVEL_MAP: Record<string, number> = {
  beginner: 1, '1': 1,
  intermediate: 2, '2': 2,
  advanced: 3, '3': 3,
  expert: 4, '4': 4,
};

function normalizeLevel(level: number | string | undefined | null): number {
  if (typeof level === 'number') return level;
  if (typeof level === 'string') return LEVEL_MAP[level.trim().toLowerCase()] || 3;
  return 3;
}

function normalizeDate(value: string | Date | number | null | undefined, options: { yearOnlyAsEnd?: boolean; monthOnlyAsEnd?: boolean } = {}): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const rawValue = String(value).trim();
  if (!rawValue || /^(present|current|ongoing|n\/a|na|-|--)$/i.test(rawValue)) return null;

  const isoDate = rawValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return buildIsoDate(Number(year), Number(month), Number(day));
  }

  const isoMonth = rawValue.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMonth) {
    const [, year, month] = isoMonth;
    const day = options.monthOnlyAsEnd ? getLastDayOfMonth(Number(year), Number(month)) : 1;
    return buildIsoDate(Number(year), Number(month), day);
  }

  const yearOnly = rawValue.match(/^(19|20)\d{2}$/);
  if (yearOnly) return options.yearOnlyAsEnd ? `${rawValue}-12-31` : `${rawValue}-01-01`;

  const monthYear = rawValue.match(/^([A-Za-z]+)\s+((?:19|20)\d{2})$/);
  if (monthYear) {
    const [, monthName, year] = monthYear;
    const monthIndex = monthNameToIndex(monthName);
    if (monthIndex < 0) return null;
    const month = monthIndex + 1;
    const day = options.monthOnlyAsEnd ? getLastDayOfMonth(Number(year), month) : 1;
    return buildIsoDate(Number(year), month, day);
  }

  const parsed = new Date(rawValue);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return null;
}

function monthNameToIndex(monthName: string): number {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const normalized = monthName.trim().toLowerCase().slice(0, 3);
  return months.indexOf(normalized);
}

function buildIsoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function getLastDayOfMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return 1;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function normalizeSkillName(value: string | number | null | undefined): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeText(value: string | number | null | undefined): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function assignText(updateData: Record<string, any>, key: string, value: string | number | null | undefined) {
  const normalized = normalizeText(value);
  if (normalized) updateData[key] = normalized;
}

function collectStringItems(value: any, output: any[]) {
  if (Array.isArray(value)) {
    value.forEach((item: any) => collectStringItems(item, output));
    return;
  }

  if (typeof value !== 'string') {
    if (value !== null && value !== undefined) output.push(value);
    return;
  }

  const trimmed = value.trim();
  if (!trimmed) return;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed !== value) {
      collectStringItems(parsed, output);
      return;
    }
  } catch {
    // Non-JSON text is handled below.
  }

  if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes('\n')) {
    trimmed.split(/[,;\n]/).forEach((item) => collectStringItems(item, output));
    return;
  }

  output.push(trimmed);
}

function normalizeStringArray(value: any): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  const rawItems: any[] = [];

  collectStringItems(value, rawItems);
  rawItems.forEach((item) => {
    const normalized = normalizeText(item)
      .replace(/\\"/g, '"')
      .replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, '');
    const key = normalized.toLowerCase();
    if (!normalized || normalized === '[]' || normalized === '{}' || seen.has(key)) return;
    seen.add(key);
    items.push(normalized);
  });

  return items;
}

function getSkillKey(name: string | number | null | undefined, type: string | null | undefined): string {
  return `${normalizeSkillName(name).toLowerCase()}::${String(type || '').trim().toLowerCase()}`;
}

function parseExperienceDates(experience: ExperienceInput): { startDate: string | null; endDate: string | null } {
  const explicitStart = normalizeDate(experience.startDate || experience.start_date);
  const explicitEnd = normalizeDate(experience.endDate || experience.end_date, { yearOnlyAsEnd: true, monthOnlyAsEnd: true });

  if (explicitStart || explicitEnd) {
    return { startDate: explicitStart, endDate: explicitEnd };
  }

  if (!experience.duration || typeof experience.duration !== 'string') {
    return { startDate: null, endDate: null };
  }

  const duration = experience.duration
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+(to|until|through)\s+/gi, ' - ')
    .trim();

  const parts = duration.split(/\s*-\s*/).filter(Boolean);
  if (parts.length < 2) return { startDate: normalizeDate(duration), endDate: null };

  const [startRaw, endRaw] = parts;
  const startDate = normalizeDate(startRaw);
  const isPresent = /^(present|current|ongoing|now)$/i.test(endRaw.trim());
  const endDate = isPresent ? null : normalizeDate(endRaw, { yearOnlyAsEnd: true, monthOnlyAsEnd: true });

  return { startDate, endDate };
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { learnerId } = body;
  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'learnerId is required', context.request);
  }

  // Ownership-scoped: a learner saves their OWN resume data (learner.user_id ===
  // user.id); admins (shared ADMIN_ROLES group) may save on behalf of any
  // learner. This is a NON-GUARD role check (ownership bypass), so it uses
  // ADMIN_ROLES rather than `requireAdmin` — replacing the prior inline admin
  // literal (bug §7.1) while preserving the exact allow/deny outcome.
  //
  // REVIEW (deferred): the RBAC guard-matrix flags an ownership-vs-admin
  // ambiguity here (should this be purely the learner's own resume?). That
  // product question is intentionally NOT decided in task 11.2 — current
  // behavior (own-resume OR admin) is preserved unchanged.
  const isAdmin = user?.roles?.some((r: string) => ADMIN_ROLES.includes(r));
  if (!isAdmin) {
    const { data: learner } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', learnerId)
      .maybeSingle();
    if (!learner || learner.user_id !== user.id) {
      return apiError(403, 'FORBIDDEN', 'You can only access your own data', context.request);
    }
  }

  const results: any = { education: 0, experience: 0, skills: 0, certificates: 0, projects: 0, trainings: 0 };
  const errors: any[] = [];

  if (body.education?.length) {
    const records = (body.education as EducationRecord[]).map((e) => ({
      learner_id: learnerId,
      level: e.level || "Bachelor's",
      degree: e.degree || '',
      department: e.department || '',
      university: e.university || '',
      year_of_passing: e.yearOfPassing || '',
      cgpa: e.cgpa || '',
      status: e.status || 'completed',
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('education').insert(records).select();
    if (error) errors.push({ table: 'education', error: error.message });
    else results.education = data?.length || 0;
  }

  if (body.experience?.length) {
    const records = (body.experience as ExperienceInput[]).map((e) => {
      const { startDate, endDate } = parseExperienceDates(e);
      return {
        learner_id: learnerId,
        organization: e.organization || '',
        role: e.role || '',
        start_date: startDate,
        end_date: endDate,
        duration: typeof e.duration === 'string' ? e.duration : '',
        description: e.description || '',
        verified: e.verified || false,
        approval_status: 'pending',
      };
    });
    const { data, error } = await supabase.from('experience').insert(records).select();
    if (error) errors.push({ table: 'experience', error: error.message });
    else results.experience = data?.length || 0;
  }

  const allSkills: any[] = [];
  const queuedSkillKeys = new Set<string>();
  const queueSkill = (skill: SkillRecord) => {
    const name = normalizeSkillName(skill.name);
    if (!name) return;

    const normalizedSkill = { ...skill, name };
    const key = getSkillKey(normalizedSkill.name, normalizedSkill.type);
    if (queuedSkillKeys.has(key)) return;

    queuedSkillKeys.add(key);
    allSkills.push(normalizedSkill);
  };

  if (body.technicalSkills?.length) {
    (body.technicalSkills as SkillRecord[]).forEach((s) => {
      queueSkill({ learner_id: learnerId, name: s.name || '', type: 'technical', level: normalizeLevel(s.level), description: s.category || '', verified: s.verified || false, approval_status: 'pending' } as any);
    });
  }
  if (body.softSkills?.length) {
    (body.softSkills as SkillRecord[]).forEach((s) => {
      queueSkill({ learner_id: learnerId, name: s.name || '', type: 'soft', level: normalizeLevel(s.level), description: s.description || s.type || '', verified: false, approval_status: 'pending' } as any);
    });
  }
  if (allSkills.length > 0) {
    const { data: existingSkills, error: existingSkillsError } = await supabase
      .from('skills')
      .select('name, type')
      .eq('learner_id', learnerId);

    if (existingSkillsError) {
      errors.push({ table: 'skills', error: existingSkillsError.message });
    } else {
      const existingSkillKeys = new Set((existingSkills || []).map((s: any) => getSkillKey(s.name, s.type)));
      const newSkills = allSkills.filter((s) => !existingSkillKeys.has(getSkillKey(s.name, s.type)));

      if (newSkills.length > 0) {
        const { data, error } = await supabase.from('skills').insert(newSkills).select();
        if (error) errors.push({ table: 'skills', error: error.message });
        else results.skills = data?.length || 0;
      }
    }
  }

  if (body.certificates?.length) {
    const records = (body.certificates as CertificateRecord[]).map((c) => ({
      learner_id: learnerId,
      title: c.title || '',
      issuer: c.issuer || '',
      level: c.level || 'Professional',
      credential_id: c.credentialId || '',
      link: c.link || '',
      issued_on: normalizeDate(c.issuedOn || c.issued_on),
      expiry_date: normalizeDate(c.expiryDate || c.expiry_date),
      description: c.description || '',
      status: c.status || 'pending',
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('certificates').insert(records).select();
    if (error) errors.push({ table: 'certificates', error: error.message });
    else results.certificates = data?.length || 0;
  }

  if (body.projects?.length) {
    const records = (body.projects as ProjectRecord[]).map((p) => ({
      learner_id: learnerId,
      title: p.title || '',
      organization: p.organization || '',
      duration: p.duration || '',
      description: p.description || '',
      status: p.status || 'Completed',
      tech_stack: p.technologies || p.techStack || p.tech || p.skills || [],
      demo_link: p.demoLink || p.demo || p.link || p.url || '',
      github_link: p.github || '',
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('projects').insert(records).select();
    if (error) errors.push({ table: 'projects', error: error.message });
    else results.projects = data?.length || 0;
  }

  if (body.training?.length) {
    const records = (body.training as TrainingRecord[]).map((t) => ({
      learner_id: learnerId,
      title: t.course || t.skill || '',
      organization: t.trainer || '',
      status: t.status || 'ongoing',
      description: `Progress: ${t.progress || 0}%`,
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('trainings').insert(records).select();
    if (error) errors.push({ table: 'trainings', error: error.message });
    else results.trainings = data?.length || 0;
  }

  const updateData: any = {};
  assignText(updateData, 'name', body.name);
  assignText(updateData, 'contact_number', body.contact_number);
  assignText(updateData, 'alternate_number', body.alternate_number);
  if (body.age) updateData.age = parseInt(body.age);
  if (body.date_of_birth) updateData.date_of_birth = normalizeDate(body.date_of_birth);
  assignText(updateData, 'university', body.university);
  assignText(updateData, 'branch_field', body.branch_field);
  assignText(updateData, 'college_school_name', body.college_school_name);
  assignText(updateData, 'registration_number', body.registration_number);
  assignText(updateData, 'district_name', body.district_name);
  assignText(updateData, 'address', body.address);
  assignText(updateData, 'city', body.city);
  assignText(updateData, 'state', body.state);
  assignText(updateData, 'country', body.country);
  assignText(updateData, 'pincode', body.pincode);
  assignText(updateData, 'bio', body.bio);
  assignText(updateData, 'linkedin_link', body.linkedin_link || body.linkedin || body.linkedIn);
  assignText(updateData, 'github_link', body.github_link || body.github || body.gitHub);
  assignText(updateData, 'portfolio_link', body.portfolio_link || body.portfolio || body.website);
  assignText(updateData, 'twitter_link', body.twitter_link || body.twitter);
  assignText(updateData, 'facebook_link', body.facebook_link || body.facebook);
  assignText(updateData, 'instagram_link', body.instagram_link || body.instagram);

  const interests = normalizeStringArray(body.interests);
  const languages = normalizeStringArray(body.languages);
  const hobbies = normalizeStringArray(body.hobbies);
  if (Object.prototype.hasOwnProperty.call(body, 'interests')) updateData.interests = interests;
  if (Object.prototype.hasOwnProperty.call(body, 'languages')) updateData.languages = languages;
  if (Object.prototype.hasOwnProperty.call(body, 'hobbies')) updateData.hobbies = hobbies;

  updateData.resume_imported_at = new Date().toISOString();

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from('learners').update(updateData).eq('id', learnerId);
    if (error) errors.push({ table: 'learners', error: error.message });
  }

  return apiSuccess({
    saved: results,
    errors: errors.length > 0 ? errors : undefined,
    success: errors.length === 0,
  }, context.request);
});
