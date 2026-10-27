/** Build a bounded PostgREST predicate; values stay quoted inside its filter grammar. */
export function opportunitySearchPredicate(search: string) {
  const literal = `%${search
    .trim()
    .slice(0, 200)
    .replace(/[\\%_]/g, '\\$&')}%`;
  return [
    'title',
    'job_title',
    'company_name',
    'description',
    'department',
    'location',
  ]
    .map((column) => `${column}.ilike.${JSON.stringify(literal)}`)
    .join(',');
}

export function workModeVariants(value: string): string[] {
  const aliases: Record<string, string[]> = {
    onsite: [
      'On-site',
      'on-site',
      'On-Site',
      'ON-SITE',
      'Onsite',
      'onsite',
      'On Site',
      'on site',
    ],
    remote: ['Remote', 'remote', 'REMOTE'],
    hybrid: ['Hybrid', 'hybrid', 'HYBRID'],
  };
  return [
    ...new Set(
      value
        .split(',')
        .flatMap(
          (item) => aliases[item.toLowerCase().replace(/[\s-]/g, '')] || [item],
        ),
    ),
  ];
}

export function skillsPredicate(skills: string[]) {
  const values = [
    ...new Set(
      skills.flatMap((skill) => [
        skill,
        skill.toLowerCase(),
        skill.toUpperCase(),
      ]),
    ),
  ];
  // JSONB containment matches any selected skill before count/range are evaluated.
  return values
    .map((skill) => `skills_required.cs.${JSON.stringify([skill])}`)
    .join(',');
}

export function parseSalaryBound(value: string | null) {
  if (value === null || value === '') return undefined;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new Error('Salary must be a non-negative whole amount.');
  return Number(value);
}
