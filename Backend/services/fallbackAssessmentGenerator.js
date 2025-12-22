/**
 * Fallback Assessment Generator
 * Generates course-specific questions without AI when API is unavailable
 */

const questionTemplates = {
  // Programming & Development
  programming: [
    {
      question: "What is the primary purpose of {CONCEPT} in {COURSE}?",
      options: [
        "To manage data storage",
        "To handle user interactions",
        "To optimize performance",
        "To structure code organization"
      ],
      correct: 3
    },
    {
      question: "Which of the following best describes {FEATURE} in {COURSE}?",
      options: [
        "A built-in function",
        "A design pattern",
        "A data structure",
        "A programming paradigm"
      ],
      correct: 1
    },
    {
      question: "How would you implement {TASK} in {COURSE}?",
      options: [
        "Using built-in methods",
        "Creating custom functions",
        "Importing external libraries",
        "All of the above"
      ],
      correct: 3
    }
  ],
  
  // General courses
  general: [
    {
      question: "What is a key concept in {COURSE}?",
      options: [
        "Understanding fundamentals",
        "Practical application",
        "Advanced techniques",
        "All of the above"
      ],
      correct: 3
    },
    {
      question: "Which skill is most important when learning {COURSE}?",
      options: [
        "Theoretical knowledge",
        "Hands-on practice",
        "Problem-solving ability",
        "All of the above"
      ],
      correct: 3
    }
  ]
};

const courseKeywords = {
  react: ['components', 'hooks', 'state management', 'props', 'JSX', 'virtual DOM'],
  python: ['functions', 'classes', 'data types', 'loops', 'modules', 'decorators'],
  javascript: ['functions', 'promises', 'async/await', 'closures', 'prototypes', 'ES6'],
  sql: ['queries', 'joins', 'indexes', 'transactions', 'normalization', 'stored procedures'],
  java: ['classes', 'objects', 'inheritance', 'interfaces', 'collections', 'exceptions'],
  css: ['selectors', 'flexbox', 'grid', 'animations', 'responsive design', 'specificity'],
  html: ['elements', 'attributes', 'semantic tags', 'forms', 'accessibility', 'DOM'],
  node: ['modules', 'npm', 'async operations', 'streams', 'middleware', 'event loop'],
  angular: ['components', 'services', 'directives', 'modules', 'dependency injection', 'routing'],
  vue: ['components', 'directives', 'computed properties', 'watchers', 'Vuex', 'routing'],
  default: ['concepts', 'principles', 'techniques', 'methods', 'practices', 'applications']
};

function detectCourseType(courseName) {
  const name = courseName.toLowerCase();
  
  if (name.includes('react') || name.includes('angular') || name.includes('vue')) return 'react';
  if (name.includes('python')) return 'python';
  if (name.includes('javascript') || name.includes('js')) return 'javascript';
  if (name.includes('sql') || name.includes('database')) return 'sql';
  if (name.includes('java')) return 'java';
  if (name.includes('css') || name.includes('style')) return 'css';
  if (name.includes('html')) return 'html';
  if (name.includes('node')) return 'node';
  
  return 'default';
}

function getKeywords(courseName) {
  const type = detectCourseType(courseName);
  return courseKeywords[type] || courseKeywords.default;
}

export function generateFallbackAssessment(courseName, level = 'Intermediate', questionCount = 15) {
  const keywords = getKeywords(courseName);
  const questions = [];
  
  for (let i = 0; i < questionCount; i++) {
    const keyword = keywords[i % keywords.length];
    
    questions.push({
      id: i + 1,
      type: 'mcq',
      difficulty: level,
      question: `What is the purpose of ${keyword} in ${courseName}?`,
      options: [
        `To define basic ${keyword} structure`,
        `To implement ${keyword} functionality`,
        `To optimize ${keyword} performance`,
        `To manage ${keyword} lifecycle`
      ],
      correct_answer: `To implement ${keyword} functionality`,
      skill_tag: keyword.charAt(0).toUpperCase() + keyword.slice(1)
    });
  }
  
  return {
    course: courseName,
    level: level,
    total_questions: questionCount,
    questions: questions,
    note: 'Generated using fallback system (AI unavailable)'
  };
}
