/**
 * Stream and Category Configuration
 *
 * Defines available streams/courses grouped by category with RIASEC mappings
 * for AI-powered career recommendations.
 *
 * @module features/assessment/career-test/config/streams
 */

export interface StreamCategory {
  id: string;
  label: string;
  description: string;
}

export interface Stream {
  id: string;
  label: string;
  riasec?: string[];
  aptitudeStrengths?: string[];
}

export interface StreamsByCategory {
  science: Stream[];
  commerce: Stream[];
  arts: Stream[];
}

/**
 * Stream categories for After 10th/12th students
 */
export const STREAM_CATEGORIES: StreamCategory[] = [
  {
    id: 'science',
    label: 'Science',
    description: 'Engineering, Medical, Pure Sciences',
  },
  {
    id: 'commerce',
    label: 'Commerce',
    description: 'Business, Finance, Accounting',
  },
  {
    id: 'arts',
    label: 'Arts/Humanities',
    description: 'Literature, Social Sciences, Design',
  },
];

/**
 * Streams grouped by category with RIASEC mappings for AI recommendations
 */
export const STREAMS_BY_CATEGORY: StreamsByCategory = {
  science: [
    {
      id: 'cs',
      label: 'B.Sc Computer Science / B.Tech CS/IT',
      riasec: ['I', 'C', 'R'],
      aptitudeStrengths: ['logical', 'numerical', 'abstract'],
    },
    {
      id: 'engineering',
      label: 'B.Tech / B.E (Other Engineering)',
      riasec: ['R', 'I', 'C'],
      aptitudeStrengths: ['numerical', 'spatial', 'logical'],
    },
    {
      id: 'medical',
      label: 'MBBS / BDS / Nursing',
      riasec: ['I', 'S', 'R'],
      aptitudeStrengths: ['verbal', 'logical', 'numerical'],
    },
    {
      id: 'pharmacy',
      label: 'B.Pharm / Pharm.D',
      riasec: ['I', 'C', 'S'],
      aptitudeStrengths: ['numerical', 'verbal', 'logical'],
    },
    {
      id: 'bsc',
      label: 'B.Sc (Physics/Chemistry/Biology/Maths)',
      riasec: ['I', 'R', 'C'],
      aptitudeStrengths: ['numerical', 'logical', 'abstract'],
    },
    {
      id: 'animation',
      label: 'B.Sc Animation / Game Design',
      riasec: ['A', 'I', 'R'],
      aptitudeStrengths: ['spatial', 'abstract', 'logical'],
    },
  ],
  commerce: [
    {
      id: 'bba',
      label: 'BBA General',
      riasec: ['E', 'S', 'C'],
      aptitudeStrengths: ['verbal', 'numerical', 'logical'],
    },
    {
      id: 'bca',
      label: 'BCA General',
      riasec: ['I', 'C', 'E'],
      aptitudeStrengths: ['logical', 'numerical', 'abstract'],
    },
    {
      id: 'dm',
      label: 'BBA Digital Marketing',
      riasec: ['E', 'A', 'S'],
      aptitudeStrengths: ['verbal', 'abstract', 'logical'],
    },
    {
      id: 'bcom',
      label: 'B.Com / B.Com (Hons)',
      riasec: ['C', 'E', 'I'],
      aptitudeStrengths: ['numerical', 'logical', 'verbal'],
    },
    {
      id: 'ca',
      label: 'CA / CMA / CS',
      riasec: ['C', 'I', 'E'],
      aptitudeStrengths: ['numerical', 'logical', 'verbal'],
    },
    {
      id: 'finance',
      label: 'BBA Finance / Banking',
      riasec: ['E', 'C', 'I'],
      aptitudeStrengths: ['numerical', 'logical', 'verbal'],
    },
  ],
  arts: [
    {
      id: 'ba',
      label: 'BA (English/History/Political Science)',
      riasec: ['S', 'A', 'I'],
      aptitudeStrengths: ['verbal', 'abstract', 'logical'],
    },
    {
      id: 'journalism',
      label: 'BA Journalism / Mass Communication',
      riasec: ['A', 'S', 'E'],
      aptitudeStrengths: ['verbal', 'abstract', 'logical'],
    },
    {
      id: 'design',
      label: 'B.Des / Fashion Design',
      riasec: ['A', 'R', 'E'],
      aptitudeStrengths: ['spatial', 'abstract', 'verbal'],
    },
    {
      id: 'law',
      label: 'BA LLB / BBA LLB',
      riasec: ['E', 'S', 'I'],
      aptitudeStrengths: ['verbal', 'logical', 'abstract'],
    },
    {
      id: 'psychology',
      label: 'BA/B.Sc Psychology',
      riasec: ['S', 'I', 'A'],
      aptitudeStrengths: ['verbal', 'logical', 'abstract'],
    },
    {
      id: 'finearts',
      label: 'BFA / Visual Arts',
      riasec: ['A', 'R', 'S'],
      aptitudeStrengths: ['spatial', 'abstract', 'verbal'],
    },
  ],
};

/**
 * Get all streams as a flat array
 */
export const getAllStreams = (): Stream[] => [
  ...STREAMS_BY_CATEGORY.science,
  ...STREAMS_BY_CATEGORY.commerce,
  ...STREAMS_BY_CATEGORY.arts,
];

/**
 * Get streams for a specific category
 */
export const getStreamsByCategory = (categoryId: string): Stream[] => {
  return STREAMS_BY_CATEGORY[categoryId as keyof StreamsByCategory] || [];
};

/**
 * Find which category a stream belongs to
 */
export const getCategoryForStream = (streamId: string): string | null => {
  for (const [category, streams] of Object.entries(STREAMS_BY_CATEGORY)) {
    if (streams.some((s: Stream) => s.id === streamId)) {
      return category;
    }
  }
  return null;
};
