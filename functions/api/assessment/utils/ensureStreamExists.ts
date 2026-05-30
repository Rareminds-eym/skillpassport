/**
 * Ensure Stream Exists Utility
 * 
 * Automatically creates stream records in personal_assessment_streams table
 * if they don't exist. This prevents foreign key constraint violations.
 * 
 * @module functions/api/assessment/utils/ensureStreamExists
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('EnsureStreamExists');

/**
 * Stream metadata for auto-creation
 */
interface StreamMetadata {
  label: string;
  description: string;
  name: string;
  gradeLevel: 'college' | 'higher_secondary' | 'after10' | 'after12' | 'middle' | 'highschool';
  displayOrder: number;
}

/**
 * Comprehensive stream metadata for all possible stream IDs
 */
const STREAM_METADATA: Record<string, StreamMetadata> = {
  // ============================================================================
  // Postgraduate Engineering (M.Tech)
  // ============================================================================
  'mtech_cse': {
    label: 'M.Tech CSE',
    description: 'Master of Technology in Computer Science & Engineering',
    name: 'M.Tech Computer Science',
    gradeLevel: 'college',
    displayOrder: 100,
  },
  'mtech_cs': {
    label: 'M.Tech CS',
    description: 'Master of Technology in Computer Science',
    name: 'M.Tech Computer Science',
    gradeLevel: 'college',
    displayOrder: 101,
  },
  'mtech_ece': {
    label: 'M.Tech ECE',
    description: 'Master of Technology in Electronics & Communication',
    name: 'M.Tech Electronics & Communication',
    gradeLevel: 'college',
    displayOrder: 102,
  },
  'mtech_it': {
    label: 'M.Tech IT',
    description: 'Master of Technology in Information Technology',
    name: 'M.Tech Information Technology',
    gradeLevel: 'college',
    displayOrder: 103,
  },
  'mtech_mech': {
    label: 'M.Tech Mechanical',
    description: 'Master of Technology in Mechanical Engineering',
    name: 'M.Tech Mechanical',
    gradeLevel: 'college',
    displayOrder: 104,
  },
  'mtech_civil': {
    label: 'M.Tech Civil',
    description: 'Master of Technology in Civil Engineering',
    name: 'M.Tech Civil',
    gradeLevel: 'college',
    displayOrder: 105,
  },
  'mtech_eee': {
    label: 'M.Tech EEE',
    description: 'Master of Technology in Electrical & Electronics',
    name: 'M.Tech Electrical & Electronics',
    gradeLevel: 'college',
    displayOrder: 106,
  },
  'mtech_aiml': {
    label: 'M.Tech AI/ML',
    description: 'Master of Technology in Artificial Intelligence & Machine Learning',
    name: 'M.Tech AI & ML',
    gradeLevel: 'college',
    displayOrder: 107,
  },
  'mtech_ds': {
    label: 'M.Tech Data Science',
    description: 'Master of Technology in Data Science',
    name: 'M.Tech Data Science',
    gradeLevel: 'college',
    displayOrder: 108,
  },
  
  // ============================================================================
  // Postgraduate Science (M.Sc)
  // ============================================================================
  'msc_cs': {
    label: 'M.Sc CS',
    description: 'Master of Science in Computer Science',
    name: 'M.Sc Computer Science',
    gradeLevel: 'college',
    displayOrder: 200,
  },
  'msc_ds': {
    label: 'M.Sc Data Science',
    description: 'Master of Science in Data Science',
    name: 'M.Sc Data Science',
    gradeLevel: 'college',
    displayOrder: 201,
  },
  'msc_physics': {
    label: 'M.Sc Physics',
    description: 'Master of Science in Physics',
    name: 'M.Sc Physics',
    gradeLevel: 'college',
    displayOrder: 202,
  },
  'msc_chemistry': {
    label: 'M.Sc Chemistry',
    description: 'Master of Science in Chemistry',
    name: 'M.Sc Chemistry',
    gradeLevel: 'college',
    displayOrder: 203,
  },
  'msc_maths': {
    label: 'M.Sc Mathematics',
    description: 'Master of Science in Mathematics',
    name: 'M.Sc Mathematics',
    gradeLevel: 'college',
    displayOrder: 204,
  },
  'msc_biology': {
    label: 'M.Sc Biology',
    description: 'Master of Science in Biology',
    name: 'M.Sc Biology',
    gradeLevel: 'college',
    displayOrder: 205,
  },
  'msc_biotech': {
    label: 'M.Sc Biotechnology',
    description: 'Master of Science in Biotechnology',
    name: 'M.Sc Biotechnology',
    gradeLevel: 'college',
    displayOrder: 206,
  },
  'msc_it': {
    label: 'M.Sc IT',
    description: 'Master of Science in Information Technology',
    name: 'M.Sc Information Technology',
    gradeLevel: 'college',
    displayOrder: 207,
  },
  'msc_ai': {
    label: 'M.Sc AI',
    description: 'Master of Science in Artificial Intelligence',
    name: 'M.Sc Artificial Intelligence',
    gradeLevel: 'college',
    displayOrder: 208,
  },
  'msc_stats': {
    label: 'M.Sc Statistics',
    description: 'Master of Science in Statistics',
    name: 'M.Sc Statistics',
    gradeLevel: 'college',
    displayOrder: 209,
  },
  
  // ============================================================================
  // Postgraduate Business (MBA)
  // ============================================================================
  'mba': {
    label: 'MBA',
    description: 'Master of Business Administration',
    name: 'MBA',
    gradeLevel: 'college',
    displayOrder: 300,
  },
  'mba_marketing': {
    label: 'MBA Marketing',
    description: 'MBA in Marketing',
    name: 'MBA Marketing',
    gradeLevel: 'college',
    displayOrder: 301,
  },
  'mba_finance': {
    label: 'MBA Finance',
    description: 'MBA in Finance',
    name: 'MBA Finance',
    gradeLevel: 'college',
    displayOrder: 302,
  },
  'mba_hr': {
    label: 'MBA HR',
    description: 'MBA in Human Resources',
    name: 'MBA Human Resources',
    gradeLevel: 'college',
    displayOrder: 303,
  },
  'mba_operations': {
    label: 'MBA Operations',
    description: 'MBA in Operations Management',
    name: 'MBA Operations',
    gradeLevel: 'college',
    displayOrder: 304,
  },
  'mba_intl': {
    label: 'MBA Intl Business',
    description: 'MBA in International Business',
    name: 'MBA International Business',
    gradeLevel: 'college',
    displayOrder: 305,
  },
  
  // ============================================================================
  // Postgraduate Computer Applications (MCA)
  // ============================================================================
  'mca': {
    label: 'MCA',
    description: 'Master of Computer Applications',
    name: 'MCA',
    gradeLevel: 'college',
    displayOrder: 400,
  },
  
  // ============================================================================
  // Postgraduate Commerce (M.Com)
  // ============================================================================
  'mcom': {
    label: 'M.Com',
    description: 'Master of Commerce',
    name: 'M.Com',
    gradeLevel: 'college',
    displayOrder: 500,
  },
  
  // ============================================================================
  // Postgraduate Arts (MA)
  // ============================================================================
  'ma_english': {
    label: 'MA English',
    description: 'Master of Arts in English',
    name: 'MA English',
    gradeLevel: 'college',
    displayOrder: 600,
  },
  'ma_history': {
    label: 'MA History',
    description: 'Master of Arts in History',
    name: 'MA History',
    gradeLevel: 'college',
    displayOrder: 601,
  },
  'ma_polsci': {
    label: 'MA Political Science',
    description: 'Master of Arts in Political Science',
    name: 'MA Political Science',
    gradeLevel: 'college',
    displayOrder: 602,
  },
  'ma_economics': {
    label: 'MA Economics',
    description: 'Master of Arts in Economics',
    name: 'MA Economics',
    gradeLevel: 'college',
    displayOrder: 603,
  },
  'ma_sociology': {
    label: 'MA Sociology',
    description: 'Master of Arts in Sociology',
    name: 'MA Sociology',
    gradeLevel: 'college',
    displayOrder: 604,
  },
  
  // ============================================================================
  // Postgraduate Design (M.Des)
  // ============================================================================
  'mdes': {
    label: 'M.Des',
    description: 'Master of Design',
    name: 'M.Des',
    gradeLevel: 'college',
    displayOrder: 700,
  },
  
  // ============================================================================
  // Postgraduate Law (LLM)
  // ============================================================================
  'llm': {
    label: 'LLM',
    description: 'Master of Laws',
    name: 'LLM',
    gradeLevel: 'college',
    displayOrder: 800,
  },
  
  // ============================================================================
  // Postgraduate Medical
  // ============================================================================
  'md': {
    label: 'MD',
    description: 'Doctor of Medicine',
    name: 'MD',
    gradeLevel: 'college',
    displayOrder: 900,
  },
  'ms_medical': {
    label: 'MS',
    description: 'Master of Surgery',
    name: 'MS',
    gradeLevel: 'college',
    displayOrder: 901,
  },
  
  // ============================================================================
  // School Learners (Grades 6-12)
  // ============================================================================
  'middle_school': {
    label: 'Middle School',
    description: 'Grades 6-8 (Middle School)',
    name: 'Middle School',
    gradeLevel: 'middle',
    displayOrder: 1,
  },
  'high_school': {
    label: 'High School',
    description: 'Grades 9-10 (High School)',
    name: 'High School',
    gradeLevel: 'highschool',
    displayOrder: 2,
  },
  'higher_secondary': {
    label: 'Higher Secondary',
    description: 'Grades 11-12 (Higher Secondary)',
    name: 'Higher Secondary',
    gradeLevel: 'higher_secondary',
    displayOrder: 3,
  },
  
  // ============================================================================
  // After 10th Streams (Grades 11-12 / Higher Secondary)
  // These streams are used for both 'after10' and 'higher_secondary' grade levels
  // The grade_level in the database should match the learner's actual grade_level
  // ============================================================================
  'science_pcmb': {
    label: 'Science (PCMB)',
    description: 'Physics, Chemistry, Maths, Biology - Medical & Engineering',
    name: 'Science (PCMB)',
    gradeLevel: 'higher_secondary',
    displayOrder: 10,
  },
  'science_pcms': {
    label: 'Science (PCMS)',
    description: 'Physics, Chemistry, Maths, Computer Science - Engineering/IT',
    name: 'Science (PCMS)',
    gradeLevel: 'higher_secondary',
    displayOrder: 11,
  },
  'science_pcm': {
    label: 'Science (PCM)',
    description: 'Physics, Chemistry, Maths - Engineering',
    name: 'Science (PCM)',
    gradeLevel: 'higher_secondary',
    displayOrder: 12,
  },
  'science_pcb': {
    label: 'Science (PCB)',
    description: 'Physics, Chemistry, Biology - Medical',
    name: 'Science (PCB)',
    gradeLevel: 'higher_secondary',
    displayOrder: 13,
  },
  'commerce_maths': {
    label: 'Commerce with Maths',
    description: 'For CA, Finance, Economics, Statistics',
    name: 'Commerce with Maths',
    gradeLevel: 'higher_secondary',
    displayOrder: 14,
  },
  'commerce_general': {
    label: 'Commerce without Maths',
    description: 'For Business, Accounting, Management',
    name: 'Commerce without Maths',
    gradeLevel: 'higher_secondary',
    displayOrder: 15,
  },
  'arts_psychology': {
    label: 'Arts with Psychology',
    description: 'Psychology, Sociology, English - For Counseling, HR, Social Work',
    name: 'Arts with Psychology',
    gradeLevel: 'higher_secondary',
    displayOrder: 16,
  },
  'arts_economics': {
    label: 'Arts with Economics',
    description: 'Economics, Political Science, English - For Civil Services, Policy',
    name: 'Arts with Economics',
    gradeLevel: 'higher_secondary',
    displayOrder: 17,
  },
  'arts': {
    label: 'Arts/Humanities General',
    description: 'English, History, Geography - For Journalism, Law, Teaching',
    name: 'Arts/Humanities General',
    gradeLevel: 'higher_secondary',
    displayOrder: 18,
  },
  
  // ============================================================================
  // Generic/Fallback
  // ============================================================================
  'college': {
    label: 'College General',
    description: 'General college program',
    name: 'College',
    gradeLevel: 'college',
    displayOrder: 9999,
  },
  'engineering': {
    label: 'Engineering General',
    description: 'General engineering program',
    name: 'Engineering',
    gradeLevel: 'college',
    displayOrder: 9998,
  },
  'bsc': {
    label: 'B.Sc General',
    description: 'Bachelor of Science',
    name: 'B.Sc',
    gradeLevel: 'college',
    displayOrder: 9997,
  },
  'bba': {
    label: 'BBA General',
    description: 'Bachelor of Business Administration',
    name: 'BBA',
    gradeLevel: 'college',
    displayOrder: 9996,
  },
  'bca': {
    label: 'BCA General',
    description: 'Bachelor of Computer Applications',
    name: 'BCA',
    gradeLevel: 'college',
    displayOrder: 9995,
  },
  'bcom': {
    label: 'B.Com General',
    description: 'Bachelor of Commerce',
    name: 'B.Com',
    gradeLevel: 'college',
    displayOrder: 9994,
  },
  'ba': {
    label: 'BA General',
    description: 'Bachelor of Arts',
    name: 'BA',
    gradeLevel: 'college',
    displayOrder: 9993,
  },
  'law': {
    label: 'Law General',
    description: 'Law program',
    name: 'Law',
    gradeLevel: 'college',
    displayOrder: 9992,
  },
  'medical': {
    label: 'Medical General',
    description: 'Medical program',
    name: 'Medical',
    gradeLevel: 'college',
    displayOrder: 9991,
  },
  'design': {
    label: 'Design General',
    description: 'Design program',
    name: 'Design',
    gradeLevel: 'college',
    displayOrder: 9990,
  },
  'pharmacy': {
    label: 'Pharmacy',
    description: 'Pharmacy program',
    name: 'Pharmacy',
    gradeLevel: 'college',
    displayOrder: 9989,
  },
  'nursing': {
    label: 'Nursing',
    description: 'Nursing program',
    name: 'Nursing',
    gradeLevel: 'college',
    displayOrder: 9988,
  },
  'physiotherapy': {
    label: 'Physiotherapy',
    description: 'Physiotherapy program',
    name: 'Physiotherapy',
    gradeLevel: 'college',
    displayOrder: 9987,
  },
  'journalism': {
    label: 'Journalism',
    description: 'Journalism & Mass Communication',
    name: 'Journalism',
    gradeLevel: 'college',
    displayOrder: 9986,
  },
  'bmc': {
    label: 'Mass Communication',
    description: 'Mass Communication',
    name: 'Mass Communication',
    gradeLevel: 'college',
    displayOrder: 9985,
  },
  'bjmc': {
    label: 'BJMC',
    description: 'Bachelor of Journalism & Mass Communication',
    name: 'BJMC',
    gradeLevel: 'college',
    displayOrder: 9984,
  },
  'bhm': {
    label: 'Hotel Management',
    description: 'Hotel Management',
    name: 'Hotel Management',
    gradeLevel: 'college',
    displayOrder: 9983,
  },
  'bttm': {
    label: 'Tourism Management',
    description: 'Tourism Management',
    name: 'Tourism Management',
    gradeLevel: 'college',
    displayOrder: 9982,
  },
  'ca': {
    label: 'CA',
    description: 'Chartered Accountancy',
    name: 'CA',
    gradeLevel: 'college',
    displayOrder: 9981,
  },
  'cs': {
    label: 'CS',
    description: 'Company Secretary',
    name: 'CS',
    gradeLevel: 'college',
    displayOrder: 9980,
  },
  'cma': {
    label: 'CMA',
    description: 'Cost & Management Accountant',
    name: 'CMA',
    gradeLevel: 'college',
    displayOrder: 9979,
  },
  'mbbs': {
    label: 'MBBS',
    description: 'Bachelor of Medicine, Bachelor of Surgery',
    name: 'MBBS',
    gradeLevel: 'college',
    displayOrder: 9978,
  },
  'bds': {
    label: 'BDS',
    description: 'Bachelor of Dental Surgery',
    name: 'BDS',
    gradeLevel: 'college',
    displayOrder: 9977,
  },
  'bams': {
    label: 'BAMS',
    description: 'Bachelor of Ayurvedic Medicine & Surgery',
    name: 'BAMS',
    gradeLevel: 'college',
    displayOrder: 9976,
  },
  'bhms': {
    label: 'BHMS',
    description: 'Bachelor of Homeopathic Medicine & Surgery',
    name: 'BHMS',
    gradeLevel: 'college',
    displayOrder: 9975,
  },
  'ba_llb': {
    label: 'BA LLB',
    description: 'BA LLB Integrated',
    name: 'BA LLB',
    gradeLevel: 'college',
    displayOrder: 9974,
  },
  'bba_llb': {
    label: 'BBA LLB',
    description: 'BBA LLB Integrated',
    name: 'BBA LLB',
    gradeLevel: 'college',
    displayOrder: 9973,
  },
};

/**
 * Ensure a stream exists in the database
 * If it doesn't exist, create it automatically
 * 
 * @param supabase - Supabase client with service role
 * @param streamId - Stream ID to ensure exists
 * @returns Promise<boolean> - true if stream exists or was created successfully
 */
export async function ensureStreamExists(
  supabase: SupabaseClient,
  streamId: string | null
): Promise<boolean> {
  // Null stream_id is allowed (no foreign key constraint)
  if (!streamId) {
    logger.info('Stream ID is null, skipping check');
    return true;
  }

  try {
    logger.info('Checking if stream exists', { streamId });

    // Check if stream already exists
    const { data: existingStream, error: checkError } = await supabase
      .from('personal_assessment_streams')
      .select('id')
      .eq('id', streamId)
      .maybeSingle();

    if (checkError) {
      logger.error('Error checking stream existence', { error: checkError, streamId });
      return false;
    }

    if (existingStream) {
      logger.info('Stream already exists', { streamId });
      return true;
    }

    // Stream doesn't exist - create it
    logger.info('Stream does not exist, creating...', { streamId });

    const metadata = STREAM_METADATA[streamId];
    
    if (!metadata) {
      logger.warn('No metadata found for stream, using generic metadata', { streamId });
      // Create generic metadata
      const genericMetadata: StreamMetadata = {
        label: streamId.toUpperCase(),
        description: `${streamId} program`,
        name: streamId.toUpperCase(),
        gradeLevel: 'college',
        displayOrder: 10000,
      };
      
      const { error: insertError } = await supabase
        .from('personal_assessment_streams')
        .insert({
          id: streamId,
          label: genericMetadata.label,
          description: genericMetadata.description,
          name: genericMetadata.name,
          grade_level: genericMetadata.gradeLevel,
          display_order: genericMetadata.displayOrder,
          is_active: true,
        });

      if (insertError) {
        logger.error('Failed to create generic stream', { error: insertError, streamId });
        return false;
      }

      logger.info('Generic stream created successfully', { streamId });
      return true;
    }

    // Create stream with proper metadata
    const { error: insertError } = await supabase
      .from('personal_assessment_streams')
      .insert({
        id: streamId,
        label: metadata.label,
        description: metadata.description,
        name: metadata.name,
        grade_level: metadata.gradeLevel,
        display_order: metadata.displayOrder,
        is_active: true,
      });

    if (insertError) {
      logger.error('Failed to create stream', { error: insertError, streamId, metadata });
      return false;
    }

    logger.info('Stream created successfully', { streamId, metadata });
    return true;
  } catch (error) {
    logger.error('Unexpected error in ensureStreamExists', { error, streamId });
    return false;
  }
}
