/** Bounded, deterministic search intent. This helper never invokes inference. */
export interface OpportunityFilters {
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string[];
  searchQuery?: string;
  limit?: number;
}

const STOP_WORDS = new Set('a an the i me my we our you your please show find get list want need looking search seeking job jobs role roles position positions opportunity opportunities work working in near at for with as and or of to is are can could would should only about based available help remote hybrid full time part contract internship internships'.split(' '));

export function deriveOpportunityFilters(input: {
  message: string;
  skills: readonly string[];
  department?: string;
  experienceCount: number;
}): OpportunityFilters {
  const message = input.message.slice(0, 8000);
  const lower = message.toLowerCase();
  const filters: OpportunityFilters = {
    limit: 15,
    experienceLevel: input.experienceCount === 0 ? 'entry' : input.experienceCount <= 2 ? 'junior' : 'mid',
  };
  if (/\bremote\b/i.test(message) && !/\b(?:not|no)\s+remote\b/i.test(message)) filters.location = 'Remote';
  else {
    // Explicit location phrase only. Never infer a city from profile/history.
    const location = message.match(/\b(?:in|near|based in)\s+([a-z][a-z .'-]{1,47}?)(?=\s+(?:with|for|as|and|using)\b|[?!,;]|$)/i)?.[1]?.trim();
    if (location && !/\b(?:job|role|position|opportunit|field|skill)/i.test(location)) filters.location = location;
  }
  const types: Array<[RegExp, string]> = [[/\bintern(?:ship)?s?\b/i, 'Internship'], [/\bfull[ -]time\b/i, 'Full-time'], [/\bpart[ -]time\b/i, 'Part-time'], [/\bcontract\b/i, 'Contract']];
  const explicitTypes = types.filter(([pattern]) => pattern.test(message));
  // Do not impose one restrictive type when the user explicitly asks for alternatives.
  if (explicitTypes.length === 1) filters.employmentType = explicitTypes[0]![1];
  const withoutLocation = filters.location && filters.location !== 'Remote'
    ? lower.replace(filters.location.toLowerCase(), ' ') : lower;
  const terms = [...new Set(withoutLocation.split(/[^\p{L}\p{N}+#.]+/u).filter(term => term.length > 1 && term.length <= 64 && !STOP_WORDS.has(term)))].slice(0, 5);
  const fallback = input.skills.filter(skill => typeof skill === 'string' && skill.trim()).slice(0, 3).map(skill => skill.slice(0, 64));
  filters.searchQuery = (terms.length ? terms.join(' ') : fallback.length ? fallback.join(' ') : (input.department ?? '').slice(0, 128)).trim();
  return filters;
}
