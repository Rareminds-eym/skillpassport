/**
 * Stream Configuration for Career Assessment
 * Contains topic mappings for non-college learners (after10, after12)
 * College/higher_secondary learners use dynamic AI topic generation
 */

// Stream-specific prompts for knowledge questions
export const STREAM_KNOWLEDGE_PROMPTS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY-LEVEL STREAMS (After 12th - Science/Commerce/Arts selection)
  // ═══════════════════════════════════════════════════════════════════════════
  science: {
    name: 'Science',
    topics: ['Scientific method', 'Physics fundamentals', 'Chemistry basics', 'Biology concepts', 'Mathematics', 'Laboratory techniques']
  },
  commerce: {
    name: 'Commerce',
    topics: ['Accounting principles', 'Business law', 'Economics', 'Financial management', 'Marketing basics', 'Business statistics']
  },
  arts: {
    name: 'Arts & Humanities',
    topics: ['Critical thinking', 'Communication skills', 'Social sciences', 'Cultural studies', 'Research methods', 'Analytical writing']
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AFTER 10TH STREAMS (11th/12th Class - PCMB, PCMS, PCM, PCB, Commerce, Arts)
  // ═══════════════════════════════════════════════════════════════════════════
  'science_pcmb': {
    name: 'Science (PCMB)',
    topics: ['Physics fundamentals', 'Chemistry basics', 'Mathematics', 'Biology concepts', 'Scientific method', 'Laboratory techniques']
  },
  'science_pcms': {
    name: 'Science (PCMS)',
    topics: ['Physics fundamentals', 'Chemistry basics', 'Mathematics', 'Computer Science basics', 'Programming logic', 'Scientific method']
  },
  'science_pcm': {
    name: 'Science (PCM)',
    topics: ['Physics fundamentals', 'Chemistry basics', 'Mathematics', 'Engineering concepts', 'Problem solving', 'Scientific method']
  },
  'science_pcb': {
    name: 'Science (PCB)',
    topics: ['Physics fundamentals', 'Chemistry basics', 'Biology concepts', 'Medical sciences basics', 'Laboratory techniques', 'Scientific method']
  },
  'commerce_maths': {
    name: 'Commerce with Maths',
    topics: ['Accountancy basics', 'Business Studies', 'Economics fundamentals', 'Mathematics for Commerce', 'Statistics', 'Financial literacy']
  },
  'commerce_general': {
    name: 'Commerce without Maths',
    topics: ['Accountancy basics', 'Business Studies', 'Economics fundamentals', 'Business Communication', 'Entrepreneurship', 'Financial literacy']
  },
  'arts_humanities': {
    name: 'Arts & Humanities',
    topics: ['English Literature', 'History concepts', 'Political Science basics', 'Psychology fundamentals', 'Sociology', 'Critical thinking']
  },
  'arts_psychology': {
    name: 'Arts with Psychology',
    topics: ['Psychology fundamentals', 'Sociology basics', 'English Literature', 'Human behavior', 'Social sciences', 'Counseling basics']
  },
  'arts_economics': {
    name: 'Arts with Economics',
    topics: ['Economics fundamentals', 'Political Science basics', 'English Literature', 'Public policy', 'International relations', 'Governance']
  },
  'arts': {
    name: 'Arts/Humanities General',
    topics: ['English Literature', 'History concepts', 'Geography basics', 'Critical thinking', 'Communication skills', 'Cultural studies']
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC/FALLBACK STREAMS (used for normalization only, topics not accessed)
  // ═══════════════════════════════════════════════════════════════════════════
  engineering: {
    name: 'Engineering',
    topics: ['Physics applications', 'Mathematics', 'Engineering mechanics', 'Technical drawing', 'Problem solving', 'Design thinking']
  },
  bsc: {
    name: 'B.Sc Pure Sciences',
    topics: ['Scientific method', 'Laboratory techniques', 'Data analysis', 'Research methodology', 'Core science concepts', 'Mathematical applications']
  },
  bba: {
    name: 'BBA Business Administration',
    topics: ['Management principles', 'Marketing basics', 'Organizational behavior', 'Business communication', 'Entrepreneurship', 'Strategic thinking']
  },
  bca: {
    name: 'BCA Computer Applications',
    topics: ['Programming basics', 'Database management', 'Web development', 'Software applications', 'IT fundamentals', 'System analysis']
  },
  bcom: {
    name: 'B.Com Commerce',
    topics: ['Accounting principles', 'Business law', 'Economics', 'Financial management', 'Taxation basics', 'Business statistics']
  },
  medical: {
    name: 'Medical Sciences',
    topics: ['Human anatomy', 'Biology fundamentals', 'Chemistry basics', 'Health sciences', 'Medical terminology', 'Patient care concepts']
  },
  ba: {
    name: 'BA Arts & Humanities',
    topics: ['Critical thinking', 'Communication skills', 'Social sciences', 'Cultural studies', 'Research methods', 'Analytical writing']
  },
  law: {
    name: 'Law',
    topics: ['Legal reasoning', 'Constitutional basics', 'Contract law', 'Legal research', 'Ethics', 'Argumentation']
  },
  design: {
    name: 'Design',
    topics: ['Design principles', 'Color theory', 'Typography', 'User experience', 'Visual communication', 'Creative thinking']
  },
  psychology: {
    name: 'BA/B.Sc Psychology',
    topics: ['Human behavior', 'Cognitive processes', 'Research methods', 'Developmental psychology', 'Social psychology', 'Mental health awareness']
  },
  pharmacy: {
    name: 'Pharmacy',
    topics: ['Pharmaceutical chemistry', 'Pharmacology basics', 'Drug interactions', 'Dosage forms', 'Healthcare systems', 'Patient counseling']
  },
  journalism: {
    name: 'Journalism & Mass Communication',
    topics: ['News writing', 'Media ethics', 'Digital journalism', 'Public relations', 'Broadcasting', 'Content creation']
  },
  animation: {
    name: 'Animation & Game Design',
    topics: ['Visual design principles', 'Animation basics', 'Storytelling', 'Digital tools', 'Character design', 'Game mechanics']
  },
  finearts: {
    name: 'Fine Arts',
    topics: ['Art history', 'Visual composition', 'Creative expression', 'Art criticism', 'Studio techniques', 'Contemporary art']
  },
  finance: {
    name: 'Finance & Banking',
    topics: ['Financial markets', 'Banking operations', 'Investment basics', 'Risk management', 'Financial analysis', 'Monetary policy']
  },
  dm: {
    name: 'Digital Marketing',
    topics: ['Social media marketing', 'SEO basics', 'Content marketing', 'Analytics', 'Brand management', 'Digital advertising']
  },
  general: {
    name: 'General Assessment',
    topics: ['Logical Reasoning', 'Verbal Ability', 'Numerical Aptitude', 'General Knowledge', 'Critical Thinking', 'Problem Solving']
  },
  college: {
    name: 'College/University',
    topics: ['Critical Thinking', 'Communication Skills', 'Problem Solving', 'Research Methods', 'Professional Ethics', 'Career Planning']
  },
  ug: {
    name: 'Undergraduate',
    topics: ['Critical Thinking', 'Communication Skills', 'Problem Solving', 'Research Methods', 'Professional Ethics', 'Career Planning']
  },
  pg: {
    name: 'Postgraduate',
    topics: ['Advanced Research Methods', 'Critical Analysis', 'Specialized Knowledge', 'Professional Development', 'Leadership Skills', 'Innovation']
  },
  btech: {
    name: 'B.Tech Engineering',
    topics: ['Engineering Mathematics', 'Physics Applications', 'Problem Solving', 'Technical Analysis', 'Design Thinking', 'Project Management']
  },
  'b.tech': {
    name: 'B.Tech Engineering',
    topics: ['Engineering Mathematics', 'Physics Applications', 'Problem Solving', 'Technical Analysis', 'Design Thinking', 'Project Management']
  },
  mtech: {
    name: 'M.Tech Engineering',
    topics: ['Advanced Engineering Concepts', 'Research Methodology', 'Technical Analysis', 'Innovation', 'Project Management', 'Specialized Engineering']
  },
  msc: {
    name: 'M.Sc Sciences',
    topics: ['Advanced Research Methods', 'Scientific Analysis', 'Data Interpretation', 'Laboratory Techniques', 'Critical Thinking', 'Research Methodology']
  }
};

// Aptitude categories
export const APTITUDE_CATEGORIES = [
  { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies' },
  { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation' },
  { id: 'logical', name: 'Logical Reasoning', description: 'Pattern recognition, deductive reasoning' },
  { id: 'spatial', name: 'Spatial Reasoning', description: 'Visual-spatial relationships, mental rotation' },
  { id: 'abstract', name: 'Abstract Reasoning', description: 'Pattern completion, sequence identification' }
];
