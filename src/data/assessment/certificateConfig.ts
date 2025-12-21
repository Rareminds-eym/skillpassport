/**
 * Certificate Assessment Configuration
 * Define how many questions each certificate/course should have
 */

export interface CertificateConfig {
  name: string;
  questionCount: number; // 1-15 questions
  timeLimit?: number; // in seconds
  passingScore?: number; // percentage
  difficulty?: 'easy' | 'medium' | 'hard';
  description?: string;
}

/**
 * Certificate configurations
 * Maps certificate/course names to their assessment settings
 */
export const certificateConfigs: Record<string, CertificateConfig> = {
  // Computer Science & Programming
  'javascript': {
    name: 'JavaScript',
    questionCount: 10,
    timeLimit: 600, // 10 minutes
    passingScore: 70,
    difficulty: 'medium'
  },
  'python': {
    name: 'Python',
    questionCount: 10,
    timeLimit: 600,
    passingScore: 70,
    difficulty: 'medium'
  },
  'react': {
    name: 'React',
    questionCount: 12,
    timeLimit: 720,
    passingScore: 75,
    difficulty: 'medium'
  },
  'node': {
    name: 'Node.js',
    questionCount: 10,
    timeLimit: 600,
    passingScore: 70,
    difficulty: 'medium'
  },

  // Science & Chemistry
  'green-chemistry': {
    name: 'Green Chemistry',
    questionCount: 15,
    timeLimit: 900, // 15 minutes
    passingScore: 70,
    difficulty: 'medium'
  },
  'chemistry': {
    name: 'Chemistry',
    questionCount: 12,
    timeLimit: 720,
    passingScore: 70,
    difficulty: 'medium'
  },

  // Engineering
  'ev-battery': {
    name: 'EV Battery Management',
    questionCount: 15,
    timeLimit: 900,
    passingScore: 75,
    difficulty: 'hard'
  },
  'ev-battery-management': {
    name: 'EV Battery Management',
    questionCount: 15,
    timeLimit: 900,
    passingScore: 75,
    difficulty: 'hard'
  },

  // Food Science
  'organic-food': {
    name: 'Organic Food Production',
    questionCount: 12,
    timeLimit: 720,
    passingScore: 70,
    difficulty: 'medium'
  },
  'food-analysis': {
    name: 'Food Analysis',
    questionCount: 15,
    timeLimit: 900,
    passingScore: 75,
    difficulty: 'hard'
  },

  // Data Science
  'data-science': {
    name: 'Data Science',
    questionCount: 15,
    timeLimit: 900,
    passingScore: 75,
    difficulty: 'hard'
  },
  'machine-learning': {
    name: 'Machine Learning',
    questionCount: 15,
    timeLimit: 900,
    passingScore: 80,
    difficulty: 'hard'
  },

  // Business & Management
  'digital-marketing': {
    name: 'Digital Marketing',
    questionCount: 10,
    timeLimit: 600,
    passingScore: 70,
    difficulty: 'easy'
  },
  'project-management': {
    name: 'Project Management',
    questionCount: 12,
    timeLimit: 720,
    passingScore: 75,
    difficulty: 'medium'
  },

  // Design
  'ui-ux': {
    name: 'UI/UX Design',
    questionCount: 10,
    timeLimit: 600,
    passingScore: 70,
    difficulty: 'medium'
  },
  'graphic-design': {
    name: 'Graphic Design',
    questionCount: 8,
    timeLimit: 480,
    passingScore: 70,
    difficulty: 'easy'
  },

  // Quick Assessments (1-5 questions)
  'quick-check': {
    name: 'Quick Skills Check',
    questionCount: 5,
    timeLimit: 300,
    passingScore: 60,
    difficulty: 'easy'
  },
  'basic-assessment': {
    name: 'Basic Assessment',
    questionCount: 3,
    timeLimit: 180,
    passingScore: 60,
    difficulty: 'easy'
  },

  // Default
  'csevbm': {
    name: 'CSEVBM',
    questionCount: 15,
    timeLimit: 900,
    passingScore: 70,
    difficulty: 'medium'
  },
  'default': {
    name: 'General Assessment',
    questionCount: 10,
    timeLimit: 600,
    passingScore: 70,
    difficulty: 'medium'
  }
};

/**
 * Get configuration for a certificate/course
 * @param certificateName - Name of the certificate or course
 * @returns Configuration object with question count and settings
 */
export function getCertificateConfig(certificateName?: string): CertificateConfig {
  if (!certificateName || certificateName === 'General Assessment') {
    return certificateConfigs['default'];
  }

  const name = certificateName.toLowerCase();

  // Try exact match first
  if (certificateConfigs[name]) {
    return certificateConfigs[name];
  }

  // Try partial matches
  for (const [key, config] of Object.entries(certificateConfigs)) {
    if (name.includes(key) || key.includes(name)) {
      console.log(`Matched certificate config: ${certificateName} → ${key}`);
      return config;
    }
  }

  // Check for common patterns
  if (name.includes('javascript') || name.includes('js')) {
    return certificateConfigs['javascript'];
  }
  if (name.includes('python')) {
    return certificateConfigs['python'];
  }
  if (name.includes('react')) {
    return certificateConfigs['react'];
  }
  if (name.includes('node')) {
    return certificateConfigs['node'];
  }
  if (name.includes('chemistry')) {
    return certificateConfigs['chemistry'];
  }
  if (name.includes('ev') || name.includes('battery')) {
    return certificateConfigs['ev-battery'];
  }
  if (name.includes('food') && name.includes('analysis')) {
    return certificateConfigs['food-analysis'];
  }
  if (name.includes('organic') || name.includes('food')) {
    return certificateConfigs['organic-food'];
  }
  if (name.includes('data') || name.includes('analytics')) {
    return certificateConfigs['data-science'];
  }
  if (name.includes('machine') || name.includes('ml') || name.includes('ai')) {
    return certificateConfigs['machine-learning'];
  }
  if (name.includes('marketing')) {
    return certificateConfigs['digital-marketing'];
  }
  if (name.includes('ui') || name.includes('ux') || name.includes('design')) {
    return certificateConfigs['ui-ux'];
  }

  // Default fallback
  console.log(`No specific config found for: ${certificateName}, using default`);
  return certificateConfigs['default'];
}

/**
 * Get random subset of questions based on certificate config
 * @param allQuestions - Full array of questions
 * @param certificateName - Name of certificate/course
 * @returns Subset of questions based on config
 */
export function getConfiguredQuestions<T>(allQuestions: T[], certificateName?: string): T[] {
  const config = getCertificateConfig(certificateName);
  const questionCount = Math.min(config.questionCount, allQuestions.length);

  if (questionCount >= allQuestions.length) {
    return allQuestions;
  }

  // Shuffle and take the configured number of questions
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, questionCount);
}
