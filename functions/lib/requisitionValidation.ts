import { z } from 'zod';
import { requirementsSchema } from './learning-eligibility';

const shortText = z.string().trim().min(1, 'Required fields cannot be blank').max(500);
const textItems = z.array(z.string().trim().min(1).max(20000)).max(500);
const salary = z.number().int().min(0).max(2147483647).nullable();

// Strip server-owned and unknown fields before either write path.
const fields = z.object({
  job_title: shortText,
  company_name: shortText,
  department: shortText,
  location: shortText,
  company_logo: z.union([z.string().trim().url().max(2048).refine(v => /^https?:\/\//i.test(v), 'Logo must use HTTP or HTTPS'), z.literal(''), z.null()]).optional(),
  mode: z.string().trim().toLowerCase().pipe(z.enum(['on-site', 'remote', 'hybrid'])).optional(),
  employment_type: shortText,
  experience_level: shortText.optional(),
  experience_required: z.string().trim().max(500).nullable().optional(),
  skills_required: textItems.optional(),
  description: z.string().trim().min(1, 'Job description is required').max(20000),
  requirements: textItems.optional(),
  learning_requirements: requirementsSchema.optional(),
  learning_requirements_version: z.number().int().positive().optional(),
  responsibilities: textItems.optional(),
  benefits: textItems.optional(),
  salary_range_min: salary.optional(),
  salary_range_max: salary.optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(['draft', 'open', 'on_hold', 'closed']).optional(),
  recruiter_id: z.string().uuid().nullable().optional(),
});

export const createRequisitionSchema = fields;
export const updateRequisitionSchema = fields.partial().superRefine((value,ctx)=>{
  if(value.learning_requirements!==undefined&&value.learning_requirements_version===undefined)ctx.addIssue({code:z.ZodIssueCode.custom,path:['learning_requirements_version'],message:'Refresh the job before changing its learning requirements.'});
});
export function validSalaryRange(values: { salary_range_min?: number | null; salary_range_max?: number | null }) {
  return values.salary_range_min == null || values.salary_range_max == null || values.salary_range_min <= values.salary_range_max;
}
