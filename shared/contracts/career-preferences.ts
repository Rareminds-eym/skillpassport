import { z } from 'zod';

export const careerPreferencesRevisionSchema = z.string().uuid().nullable();

const choices = z.array(z.string().trim().min(1).max(100)).max(20)
  .transform(values => values.filter((value, index) => values.findIndex(other => other.normalize('NFKC').toLowerCase() === value.normalize('NFKC').toLowerCase()) === index));
export const careerPreferencesSchema = z.object({
  targetRoles: choices.default([]),
  employmentTypes: z.array(z.enum(['full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance'])).max(6).default([]),
  locations: choices.default([]),
  departments: choices.default([]),
  workModes: z.array(z.enum(['remote', 'hybrid', 'onsite'])).max(3).default([]),
  willingToRelocate: z.boolean().nullable().default(null),
  strictLocations: z.boolean().default(false),
  strictEmploymentTypes: z.boolean().default(false),
  strictWorkModes: z.boolean().default(false),
  useAssessmentRecommendations: z.boolean().default(true),
  useVerifiedLearning: z.boolean().default(true),
}).strict().superRefine((value, context) => {
  for (const [strict, options] of [['strictLocations', 'locations'], ['strictEmploymentTypes', 'employmentTypes'], ['strictWorkModes', 'workModes']] as const) {
    if (value[strict] && !value[options].length) context.addIssue({ code: z.ZodIssueCode.custom, path: [options], message: 'Choose at least one value for a required preference.' });
  }
});
export type CareerPreferences = z.infer<typeof careerPreferencesSchema>;
export const emptyCareerPreferences = (): CareerPreferences => careerPreferencesSchema.parse({});
