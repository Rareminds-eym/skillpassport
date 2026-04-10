/**
 * Stream Utility Functions
 * Handles stream ID normalization and fallback question generation
 */

import { STREAM_KNOWLEDGE_PROMPTS } from './streamPrompts.js';

/**
 * Normalize stream ID from student's program name to match STREAM_KNOWLEDGE_PROMPTS keys
 * Handles various formats like "Bachelor of Technology in Electronics", "B.Tech CSE", "BBA", etc.
 * 
 * IMPORTANT: Stream IDs must be <= 20 characters to fit in database column
 * 
 * @param {string} programName - The program name from student profile
 * @returns {string} - Normalized stream ID (max 20 chars) that matches STREAM_KNOWLEDGE_PROMPTS keys
 */
export function normalizeStreamId(programName) {
  if (!programName) return 'college';
  
  const normalized = programName.toLowerCase().trim();
  
  // Direct match first (if already a valid short key)
  if (STREAM_KNOWLEDGE_PROMPTS[normalized] && normalized.length <= 20) {
    return normalized;
  }
  
  // Common program name mappings - ALL VALUES MUST BE <= 20 CHARS
  const programMappings = {
    // B.Tech variations -> short keys
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
    
    // M.Tech variations -> short keys
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
    'mtech electronics': 'mtech_electronics',
    
    'master of technology in mechanical': 'mtech_mech',
    'm.tech mechanical': 'mtech_mech',
    'mtech mechanical': 'mtech_mechanical',
    
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
    
    // M.Sc variations -> short keys
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
    
    // B.Sc variations
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
    
    // BBA variations
    'bba marketing': 'bba_marketing',
    'bba finance': 'bba_finance',
    'bba hr': 'bba_hr',
    'bba human resources': 'bba_hr',
    'bba international business': 'bba_intl',
    'business administration': 'bba',
    
    // BCA variations
    'bca data science': 'bca_ds',
    'bca cloud computing': 'bca_cloud',
    'computer applications': 'bca',
    
    // B.Com variations
    'b.com': 'bcom',
    'bcom': 'bcom',
    'bachelor of commerce': 'bcom',
    'b.com accounting': 'bcom_accounts',
    'bcom accounting': 'bcom_accounts',
    'b.com banking': 'bcom_banking',
    'bcom banking': 'bcom_banking',
    'b.com taxation': 'bcom_tax',
    'bcom taxation': 'bcom_tax',
    
    // Medical
    'medicine': 'mbbs',
    'dental surgery': 'bds',
    'ayurveda': 'bams',
    'homeopathy': 'bhms',
    'b.pharma': 'bpharma',
    'pharmacy': 'pharmacy',
    'b.sc nursing': 'nursing',
    'bpt': 'physiotherapy',
    
    // Arts
    'ba english': 'ba_english',
    'english literature': 'ba_english',
    'ba history': 'ba_history',
    'ba political science': 'ba_polsci',
    'ba economics': 'ba_economics',
    'ba sociology': 'ba_sociology',
    
    // Law
    'ba llb': 'ba_llb',
    'bba llb': 'bba_llb',
    'llb': 'law',
    
    // Design
    'b.des': 'bdes',
    'b.des fashion': 'bdes_fashion',
    'fashion design': 'bdes_fashion',
    'b.des interior': 'bdes_interior',
    'interior design': 'bdes_interior',
    'b.des graphic': 'bdes_graphic',
    'graphic design': 'bdes_graphic',
    
    // Media
    'bjmc': 'bjmc',
    'journalism': 'journalism',
    'mass communication': 'bmc',
    
    // Hospitality
    'hotel management': 'bhm',
    'tourism management': 'bttm',
    
    // Professional
    'chartered accountancy': 'ca',
    'company secretary': 'cs',
    'cost accountant': 'cma'
  };
  
  // Check direct mapping
  if (programMappings[normalized]) {
    return programMappings[normalized];
  }
  
  // Try partial matching
  for (const [key, value] of Object.entries(programMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Fallback based on keywords - use short IDs
  if (normalized.includes('electronics')) {
    return 'btech_ece';
  }
  if (normalized.includes('computer') && normalized.includes('science')) {
    return 'btech_cse';
  }
  if (normalized.includes('mechanical')) {
    return 'btech_mech';
  }
  if (normalized.includes('civil')) {
    return 'btech_civil';
  }
  if (normalized.includes('electrical')) {
    return 'btech_eee';
  }
  if (normalized.includes('engineering') || normalized.includes('b.tech') || normalized.includes('btech')) {
    return 'engineering';
  }
  if (normalized.includes('b.sc') || normalized.includes('bsc')) {
    return 'bsc';
  }
  if (normalized.includes('bba') || normalized.includes('business')) {
    return 'bba';
  }
  if (normalized.includes('bca') || normalized.includes('computer application')) {
    return 'bca';
  }
  if (normalized.includes('b.com') || normalized.includes('bcom') || normalized.includes('commerce')) {
    return 'bcom';
  }
  if (normalized.includes('ba') || normalized.includes('arts')) {
    return 'ba';
  }
  if (normalized.includes('law') || normalized.includes('llb')) {
    return 'law';
  }
  if (normalized.includes('medical') || normalized.includes('mbbs')) {
    return 'medical';
  }
  if (normalized.includes('design')) {
    return 'design';
  }
  
  // Default fallback
  console.log(`⚠️ Unknown program "${programName}", using generic college stream`);
  return 'college';
}

/**
 * Get fallback knowledge questions if AI generation fails
 * NOTE: This function is currently not used but kept for potential future fallback scenarios
 */
export function getFallbackKnowledgeQuestions(streamId) {
  const streamInfo = STREAM_KNOWLEDGE_PROMPTS[streamId];
  if (!streamInfo) return [];

  return streamInfo.topics.map((topic, idx) => ({
    id: `knowledge_${streamId}_${idx + 1}`,
    type: 'mcq',
    question: `Which of the following best describes a key concept in ${topic}?`,
    options: [
      `A fundamental principle of ${topic}`,
      `An advanced technique in ${topic}`,
      `A common misconception about ${topic}`,
      `An unrelated concept`
    ],
    correct_answer: `A fundamental principle of ${topic}`,
    skill_tag: topic,
    difficulty: idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard'
  }));
}
