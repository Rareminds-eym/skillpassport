import { z } from 'zod';

const id = z.string().uuid();
const text = z.string().trim().min(1).max(10000);
const outcome = z.object({ text, bloomLevel: z.string().max(20).optional(), assessments: z.array(z.object({ assessmentType: z.string().min(1).max(100), weightage: z.number().min(0).max(100).optional() })).max(20) });
const unit = z.object({ name: text.max(255), code: text.max(50), description: z.string().max(10000), credits: z.number().min(0).max(99), duration: z.number().int().min(0).max(10000), order: z.number().int().min(0), outcomes: z.array(outcome).max(100) });
const course = z.object({ code: text.max(20), title: text.max(255), credits: z.number().positive().max(99).multipleOf(0.1), description: z.string().max(10000), units: z.array(unit).min(1).max(100) });

export const collegeCourseRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create-assessment-type'), payload: z.object({ courseId: id, programId: id, name: text.max(100), description: z.string().trim().max(1000).optional() }).strict() }),
  z.object({ action: z.literal('propose-add'), payload: z.object({ courseId: id, programId: id, academicYear: text.max(20), curriculumId: id.optional(), entityType: z.enum(['unit','outcome']), name: text.max(255).optional(), code: text.max(50).optional(), description: z.string().max(10000).optional(), outcomes: z.array(z.union([text, outcome])).max(100).optional(), unitId: id.optional(), outcome_text: text.optional(), bloom_level: z.enum(['Remember','Understand','Apply','Analyze','Evaluate','Create']).optional(), assessment_mappings: outcome.shape.assessments.optional() }).strict() }),
  z.object({ action: z.literal('courses'), payload: z.object({}).strict() }),
  z.object({ action: z.literal('admin-overview'), payload: z.object({}).strict() }),
  z.object({ action: z.literal('rareminds-content'), payload: z.object({ courseId: id }).strict() }),
  z.object({ action: z.literal('content'), payload: z.object({ courseId: id, programId: id }).strict() }),
  z.object({ action: z.literal('set-access'), payload: z.object({ mappingId: id, access: z.enum(['read','edit']) }).strict() }),
  z.object({ action: z.literal('review'), payload: z.object({ requestId: id, decision: z.enum(['approved','rejected']), note: z.string().max(2000).optional() }).strict() }),
  z.object({ action: z.literal('propose'), payload: z.object({ curriculumId: id, entityType: z.enum(['unit','outcome']), entityId: id,
    changes: z.union([z.object({ name: text.max(255), description: z.string().max(10000) }).strict(),z.object({ outcome_text: text }).strict()]) }).strict() }),
  z.object({ action: z.literal('import'), payload: z.object({ departmentId: id, programId: id, semester: z.number().int().min(1).max(12),
    academicYear: text.max(20), courses: z.array(course).min(1).max(100) }).strict() }),
]);

export function parseCollegeCourseRequest(value: unknown) {
  const result = collegeCourseRequest.parse(value);
  if (result.action === 'propose-add') {
    const value = result.payload;
    if (value.entityType === 'unit' && (!value.name || !value.code || value.unitId || value.outcome_text || value.bloom_level || value.assessment_mappings)) throw new Error('Unit name and code are required');
    if (value.entityType === 'outcome' && (!value.curriculumId || !value.unitId || !value.outcome_text || value.name || value.code || value.outcomes)) throw new Error('Choose an existing unit and enter a learning outcome');
  }
  if (result.action === 'import') {
    const courses = result.payload.courses;
    if (new Set(courses.map(c => c.code)).size !== courses.length) throw new Error('Duplicate course codes');
    for (const course of courses) {
      if (new Set(course.units.map(u => u.code)).size !== course.units.length) throw new Error('Duplicate unit codes');
    }
    if (courses.reduce((n,c) => n+c.units.reduce((s,u) => s+Math.max(1,u.outcomes.length),0),0)>2000) throw new Error('Import exceeds 2000 rows');
  }
  if (result.action === 'propose' && ((result.payload.entityType === 'unit') !== ('name' in result.payload.changes))) throw new Error('Changes do not match entity');
  return result;
}
