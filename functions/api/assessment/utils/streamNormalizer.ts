/**
 * Stream ID Normalizer
 * 
 * Normalizes program names to short stream IDs (max 20 chars) that match STREAM_KNOWLEDGE_PROMPTS keys.
 * Handles both UG (undergraduate) and PG (postgraduate) programs.
 * 
 * @module functions/api/assessment/utils/streamNormalizer
 */

import { createLogger } from '../../../lib/logger';

const logger = createLogger('StreamNormalizer');

/**
 * Program name to stream ID mappings
 * ALL VALUES MUST BE <= 20 CHARACTERS
 */
const PROGRAM_MAPPINGS: Record<string, string> = {
  // ============================================================================
  // B.Tech (Undergraduate Engineering) -> short keys
  // ============================================================================
  'bachelor of technology in electronics': 'btech_ece',
  'bachelor of technology in electronics and communication': 'btech_ece',
  'b.tech electronics': 'btech_ece',
  'btech electronics': 'btech_ece',
  'b.tech ece': 'btech_ece',
  'btech ece': 'btech_ece',
  'electronics and communication': 'btech_ece',
  'electronics & communication': 'btech_ece',
  'ece': 'btech_ece',
  
  'bachelor of technology in computer science': 'btech_cse',
  'b.tech computer science': 'btech_cse',
  'b.tech cse': 'btech_cse',
  'btech cse': 'btech_cse',
  'computer science engineering': 'btech_cse',
  'computer science and engineering': 'btech_cse',
  'cse': 'btech_cse',
  
  'bachelor of technology in information technology': 'btech_it',
  'b.tech information technology': 'btech_it',
  'b.tech it': 'btech_it',
  'btech it': 'btech_it',
  'information technology': 'btech_it',
  
  'b.tech mechanical': 'btech_mech',
  'btech mechanical': 'btech_mech',
  'mechanical engineering': 'btech_mech',
  'bachelor of technology in mechanical': 'btech_mech',
  
  'b.tech civil': 'btech_civil',
  'civil engineering': 'btech_civil',
  'bachelor of technology in civil': 'btech_civil',
  
  'b.tech electrical': 'btech_eee',
  'electrical engineering': 'btech_eee',
  'b.tech eee': 'btech_eee',
  'bachelor of technology in electrical': 'btech_eee',
  
  'b.tech ai': 'btech_aiml',
  'b.tech ml': 'btech_aiml',
  'b.tech artificial intelligence': 'btech_aiml',
  'b.tech machine learning': 'btech_aiml',
  'artificial intelligence': 'btech_aiml',
  
  'b.tech data science': 'btech_ds',
  'data science': 'btech_ds',
  
  'b.tech biotechnology': 'btech_biotech',
  'biotechnology': 'btech_biotech',
  
  'b.tech chemical': 'btech_chem',
  'chemical engineering': 'btech_chem',
  
  // ============================================================================
  // M.Tech (Postgraduate Engineering) -> short keys
  // ============================================================================
  'master of technology in computer science': 'mtech_cse',
  'master of technology in computer science and engineering': 'mtech_cse',
  'm.tech computer science': 'mtech_cse',
  'm.tech cse': 'mtech_cse',
  'mtech cse': 'mtech_cse',
  'mtech computer science': 'mtech_cse',
  
  'm.tech cs': 'mtech_cs',
  'mtech cs': 'mtech_cs',
  
  'master of technology in electronics': 'mtech_ece',
  'master of technology in electronics and communication': 'mtech_ece',
  'm.tech electronics': 'mtech_ece',
  'm.tech ece': 'mtech_ece',
  'mtech ece': 'mtech_ece',
  'mtech electronics': 'mtech_ece',
  
  'master of technology in mechanical': 'mtech_mech',
  'm.tech mechanical': 'mtech_mech',
  'mtech mechanical': 'mtech_mech',
  
  'master of technology in civil': 'mtech_civil',
  'm.tech civil': 'mtech_civil',
  'mtech civil': 'mtech_civil',
  
  'master of technology in ai': 'mtech_aiml',
  'master of technology in artificial intelligence': 'mtech_aiml',
  'm.tech ai': 'mtech_aiml',
  'm.tech ml': 'mtech_aiml',
  'mtech aiml': 'mtech_aiml',
  
  'master of technology in data science': 'mtech_ds',
  'm.tech data science': 'mtech_ds',
  'mtech data science': 'mtech_ds',
  
  // ============================================================================
  // M.Sc (Postgraduate Science) -> short keys
  // ============================================================================
  'master of science in data science': 'msc_ds',
  'master of science data science': 'msc_ds',
  'm.sc data science': 'msc_ds',
  'msc data science': 'msc_ds',
  'm.sc ds': 'msc_ds',
  'msc ds': 'msc_ds',
  
  'master of science in computer science': 'msc_cs',
  'master of science computer science': 'msc_cs',
  'm.sc computer science': 'msc_cs',
  'msc computer science': 'msc_cs',
  'm.sc cs': 'msc_cs',
  'msc cs': 'msc_cs',
  
  'master of science in physics': 'msc_physics',
  'm.sc physics': 'msc_physics',
  'msc physics': 'msc_physics',
  
  'master of science in chemistry': 'msc_chemistry',
  'm.sc chemistry': 'msc_chemistry',
  'msc chemistry': 'msc_chemistry',
  
  'master of science in mathematics': 'msc_maths',
  'm.sc mathematics': 'msc_maths',
  'msc mathematics': 'msc_maths',
  'm.sc maths': 'msc_maths',
  'msc maths': 'msc_maths',
  
  'master of science in biology': 'msc_biology',
  'm.sc biology': 'msc_biology',
  'msc biology': 'msc_biology',
  
  'master of science in biotechnology': 'msc_biotech',
  'm.sc biotechnology': 'msc_biotech',
  'msc biotechnology': 'msc_biotech',
  
  'master of science in information technology': 'msc_it',
  'm.sc information technology': 'msc_it',
  'msc information technology': 'msc_it',
  'm.sc it': 'msc_it',
  'msc it': 'msc_it',
  
  'master of science in artificial intelligence': 'msc_ai',
  'm.sc artificial intelligence': 'msc_ai',
  'msc artificial intelligence': 'msc_ai',
  'm.sc ai': 'msc_ai',
  'msc ai': 'msc_ai',
  
  'master of science in statistics': 'msc_stats',
  'm.sc statistics': 'msc_stats',
  'msc statistics': 'msc_stats',
  
  // ============================================================================
  // B.Sc (Undergraduate Science)
  // ============================================================================
  'b.sc physics': 'bsc_physics',
  'bsc physics': 'bsc_physics',
  
  'b.sc chemistry': 'bsc_chemistry',
  'bsc chemistry': 'bsc_chemistry',
  
  'b.sc mathematics': 'bsc_maths',
  'bsc mathematics': 'bsc_maths',
  
  'b.sc computer science': 'bsc_cs',
  'bsc computer science': 'bsc_cs',
  
  'b.sc biology': 'bsc_biology',
  'bsc biology': 'bsc_biology',
  
  'b.sc biotechnology': 'bsc_biotech',
  'bsc biotechnology': 'bsc_biotech',
  
  'b.sc agriculture': 'bsc_agri',
  'bsc agriculture': 'bsc_agri',
  
  // ============================================================================
  // BBA (Undergraduate Business)
  // ============================================================================
  'bba marketing': 'bba_marketing',
  'bba finance': 'bba_finance',
  'bba hr': 'bba_hr',
  'bba human resources': 'bba_hr',
  'bba international business': 'bba_intl',
  'business administration': 'bba',
  
  // ============================================================================
  // MBA (Postgraduate Business)
  // ============================================================================
  'master of business administration': 'mba',
  'mba': 'mba',
  'mba marketing': 'mba_marketing',
  'mba finance': 'mba_finance',
  'mba hr': 'mba_hr',
  'mba human resources': 'mba_hr',
  'mba operations': 'mba_operations',
  'mba international business': 'mba_intl',
  
  // ============================================================================
  // BCA (Undergraduate Computer Applications)
  // ============================================================================
  'bca data science': 'bca_ds',
  'bca cloud computing': 'bca_cloud',
  'computer applications': 'bca',
  
  // ============================================================================
  // MCA (Postgraduate Computer Applications)
  // ============================================================================
  'master of computer applications': 'mca',
  'mca': 'mca',
  'm.c.a': 'mca',
  
  // ============================================================================
  // B.Com (Undergraduate Commerce)
  // ============================================================================
  'b.com': 'bcom',
  'bcom': 'bcom',
  'bachelor of commerce': 'bcom',
  'b.com accounting': 'bcom_accounts',
  'bcom accounting': 'bcom_accounts',
  'b.com banking': 'bcom_banking',
  'bcom banking': 'bcom_banking',
  'b.com taxation': 'bcom_tax',
  'bcom taxation': 'bcom_tax',
  
  // ============================================================================
  // M.Com (Postgraduate Commerce)
  // ============================================================================
  'master of commerce': 'mcom',
  'm.com': 'mcom',
  'mcom': 'mcom',
  
  // ============================================================================
  // Medical (UG & PG)
  // ============================================================================
  'medicine': 'mbbs',
  'mbbs': 'mbbs',
  'dental surgery': 'bds',
  'bds': 'bds',
  'ayurveda': 'bams',
  'bams': 'bams',
  'homeopathy': 'bhms',
  'bhms': 'bhms',
  'b.pharma': 'bpharma',
  'pharmacy': 'pharmacy',
  'b.sc nursing': 'nursing',
  'bpt': 'physiotherapy',
  'md': 'md',
  'ms': 'ms_medical',
  
  // ============================================================================
  // Arts (UG & PG)
  // ============================================================================
  'ba english': 'ba_english',
  'english literature': 'ba_english',
  'ba history': 'ba_history',
  'ba political science': 'ba_polsci',
  'ba economics': 'ba_economics',
  'ba sociology': 'ba_sociology',
  
  'ma english': 'ma_english',
  'ma history': 'ma_history',
  'ma political science': 'ma_polsci',
  'ma economics': 'ma_economics',
  'ma sociology': 'ma_sociology',
  
  // ============================================================================
  // Law (UG & PG)
  // ============================================================================
  'ba llb': 'ba_llb',
  'bba llb': 'bba_llb',
  'llb': 'law',
  'llm': 'llm',
  
  // ============================================================================
  // Design (UG & PG)
  // ============================================================================
  'b.des': 'bdes',
  'b.des fashion': 'bdes_fashion',
  'fashion design': 'bdes_fashion',
  'b.des interior': 'bdes_interior',
  'interior design': 'bdes_interior',
  'b.des graphic': 'bdes_graphic',
  'graphic design': 'bdes_graphic',
  
  'm.des': 'mdes',
  'master of design': 'mdes',
  
  // ============================================================================
  // Media (UG & PG)
  // ============================================================================
  'bjmc': 'bjmc',
  'journalism': 'journalism',
  'mass communication': 'bmc',
  
  // ============================================================================
  // Hospitality
  // ============================================================================
  'hotel management': 'bhm',
  'tourism management': 'bttm',
  
  // ============================================================================
  // Professional
  // ============================================================================
  'chartered accountancy': 'ca',
  'company secretary': 'cs',
  'cost accountant': 'cma',
};

/**
 * Normalize program name to stream ID
 * 
 * @param programName - The program name from student profile
 * @returns Normalized stream ID (max 20 chars) that matches STREAM_KNOWLEDGE_PROMPTS keys
 */
export function normalizeStreamId(programName: string | null | undefined): string {
  // Handle null/undefined/empty
  if (!programName || programName.trim() === '') {
    logger.info('No program name provided, using default: college');
    return 'college';
  }

  const normalized = programName.toLowerCase().trim();
  
  logger.info('Normalizing stream ID', { 
    original: programName, 
    normalized,
    length: normalized.length
  });

  // Direct match first (if already a valid short key and <= 20 chars)
  if (normalized.length <= 20 && PROGRAM_MAPPINGS[normalized]) {
    logger.info('Direct match found', { streamId: normalized });
    return normalized;
  }

  // Check direct mapping
  if (PROGRAM_MAPPINGS[normalized]) {
    const streamId = PROGRAM_MAPPINGS[normalized];
    logger.info('Mapping found', { streamId });
    return streamId;
  }

  // Try partial matching (check if normalized contains any key or vice versa)
  // IMPORTANT: Sort by key length (longest first) to match more specific patterns first
  // This prevents "computer science" from matching before "master of technology in computer science"
  const sortedMappings = Object.entries(PROGRAM_MAPPINGS).sort((a, b) => b[0].length - a[0].length);
  
  logger.info('Attempting partial match', { 
    totalMappings: sortedMappings.length,
    firstFewKeys: sortedMappings.slice(0, 5).map(([k]) => k)
  });
  
  for (const [key, value] of sortedMappings) {
    if (normalized.includes(key) || key.includes(normalized)) {
      logger.info('Partial match found', { 
        matchedKey: key, 
        keyLength: key.length,
        streamId: value,
        matchType: normalized.includes(key) ? 'normalized includes key' : 'key includes normalized'
      });
      return value;
    }
  }
  
  logger.info('No partial match found, trying fallback logic');

  // ============================================================================
  // Fallback based on keywords - use short IDs
  // IMPORTANT: Check for specific degree patterns first before generic keywords
  // ============================================================================
  
  // Check for postgraduate indicators first (more specific)
  const isPG = normalized.includes('master') || 
               normalized.includes('m.tech') || 
               normalized.includes('mtech') ||
               normalized.includes('m.sc') || 
               normalized.includes('msc') ||
               normalized.includes('m.com') || 
               normalized.includes('mcom') ||
               normalized.includes('mba') ||
               normalized.includes('mca') ||
               normalized.includes('m.des') ||
               normalized.includes('ma ') ||
               normalized.includes('llm') ||
               normalized.includes('md ') ||
               normalized.includes('ms ');

  // Check for undergraduate indicators
  const isUG = normalized.includes('bachelor') ||
               normalized.includes('b.tech') || 
               normalized.includes('btech') ||
               normalized.includes('b.sc') || 
               normalized.includes('bsc') ||
               normalized.includes('b.com') || 
               normalized.includes('bcom') ||
               normalized.includes('bba') ||
               normalized.includes('bca') ||
               normalized.includes('b.des') ||
               normalized.includes('ba ') ||
               normalized.includes('llb');

  // Computer Science - check degree level first
  if (normalized.includes('computer') && normalized.includes('science')) {
    if (isPG) {
      // Postgraduate: M.Tech CSE or M.Sc CS
      if (normalized.includes('m.sc') || normalized.includes('msc') || normalized.includes('master of science')) {
        return 'msc_cs';
      }
      return 'mtech_cse'; // Default PG is M.Tech
    }
    if (isUG) {
      // Undergraduate: B.Tech CSE or B.Sc CS
      if (normalized.includes('b.sc') || normalized.includes('bsc') || normalized.includes('bachelor of science')) {
        return 'bsc_cs';
      }
      return 'btech_cse'; // Default UG is B.Tech
    }
    // No degree indicator - default to B.Tech
    return 'btech_cse';
  }

  // Electronics - check degree level
  if (normalized.includes('electronics')) {
    if (isPG) {
      return 'mtech_ece';
    }
    return 'btech_ece';
  }

  // Information Technology
  if (normalized.includes('information') && normalized.includes('technology')) {
    if (isPG) {
      if (normalized.includes('m.sc') || normalized.includes('msc')) {
        return 'msc_it';
      }
      return 'mtech_it';
    }
    return 'btech_it';
  }

  // Mechanical
  if (normalized.includes('mechanical')) {
    if (isPG) {
      return 'mtech_mech';
    }
    return 'btech_mech';
  }

  // Civil
  if (normalized.includes('civil')) {
    if (isPG) {
      return 'mtech_civil';
    }
    return 'btech_civil';
  }

  // Electrical
  if (normalized.includes('electrical')) {
    if (isPG) {
      return 'mtech_eee';
    }
    return 'btech_eee';
  }

  // AI/ML
  if (normalized.includes('artificial intelligence') || 
      normalized.includes('machine learning') ||
      (normalized.includes('ai') && normalized.includes('ml'))) {
    if (isPG) {
      return 'mtech_aiml';
    }
    return 'btech_aiml';
  }

  // Data Science
  if (normalized.includes('data science')) {
    if (isPG) {
      if (normalized.includes('m.sc') || normalized.includes('msc')) {
        return 'msc_ds';
      }
      return 'mtech_ds';
    }
    return 'btech_ds';
  }

  // Generic Engineering
  if (normalized.includes('engineering') || 
      normalized.includes('b.tech') || 
      normalized.includes('btech')) {
    return 'engineering';
  }

  // Science
  if (normalized.includes('b.sc') || normalized.includes('bsc')) {
    return 'bsc';
  }

  // Business Administration
  if (normalized.includes('business administration')) {
    if (isPG) {
      return 'mba';
    }
    return 'bba';
  }

  if (normalized.includes('bba')) {
    return 'bba';
  }

  if (normalized.includes('mba')) {
    return 'mba';
  }

  // Computer Applications
  if (normalized.includes('computer application')) {
    if (isPG) {
      return 'mca';
    }
    return 'bca';
  }

  if (normalized.includes('bca')) {
    return 'bca';
  }

  if (normalized.includes('mca')) {
    return 'mca';
  }

  // Commerce
  if (normalized.includes('b.com') || 
      normalized.includes('bcom') || 
      normalized.includes('commerce')) {
    if (isPG) {
      return 'mcom';
    }
    return 'bcom';
  }

  // Arts
  if (normalized.includes('ba') || normalized.includes('arts')) {
    return 'ba';
  }

  // Law
  if (normalized.includes('law') || normalized.includes('llb')) {
    return 'law';
  }

  // Medical
  if (normalized.includes('medical') || normalized.includes('mbbs')) {
    return 'mbbs';
  }

  // Design
  if (normalized.includes('design')) {
    return 'design';
  }

  // Default fallback
  logger.warn('No match found for program, using generic college stream', { 
    programName 
  });
  
  return 'college';
}

/**
 * Validate that a stream ID is within the 20 character limit
 */
export function validateStreamId(streamId: string): boolean {
  return streamId.length <= 20;
}

/**
 * Get all valid stream IDs from mappings
 */
export function getAllValidStreamIds(): string[] {
  return Array.from(new Set(Object.values(PROGRAM_MAPPINGS)));
}
