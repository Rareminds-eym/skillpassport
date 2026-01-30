/**
 * Field Domain Service
 * AI-powered service to generate domain-specific keywords for any field of study
 * This replaces hardcoded field mappings with dynamic AI generation
 * 
 * Now uses career-api worker instead of calling OpenRouter directly
 */

import { CAREER_API_URL } from './config';

/**
 * Generate domain-specific keywords for a field of study using AI
 * This ensures ALL fields (not just hardcoded ones) get proper domain keywords
 * 
 * @param {string} fieldOfStudy - The student's field/stream (e.g., "B.COM", "Mechanical Engineering", "Animation")
 * @returns {Promise<string>} - Domain-specific keywords for course matching
 */
export async function generateDomainKeywords(fieldOfStudy) {
  if (!fieldOfStudy || typeof fieldOfStudy !== 'string') {
    return '';
  }

  const field = fieldOfStudy.trim();
  if (!field) {
    return '';
  }

  if (!CAREER_API_URL) {
    console.warn('[Course Recommendations] VITE_CAREER_API_URL not configured, using fallback');
    return getFallbackKeywords(field);
  }

  try {
    console.log(`[Course Recommendations] Generating keywords for field: "${field}"`);
    
    // Call career-api worker to generate keywords
    const response = await fetch(`${CAREER_API_URL}/generate-field-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED for "${field}": ${response.status}`);
      console.log(`[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)`);
      
      // If worker says to use fallback, do so
      if (errorData.useFallback) {
        return getFallbackKeywords(field);
      }
      
      return getFallbackKeywords(field);
    }

    const data = await response.json();
    const keywords = data.keywords;

    if (!keywords) {
      console.warn(`[Course Recommendations] ⚠️ LAYER 1 (AI Service) returned empty for "${field}"`);
      console.log(`[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)`);
      return getFallbackKeywords(field);
    }

    // Success - AI generated keywords
    console.log(`[Course Recommendations] ✅ LAYER 1 (AI Service) SUCCESS for "${field}"`);
    console.log(`[Course Recommendations] Keywords: ${keywords}`);
    return keywords;

  } catch (error) {
    console.error(`[Course Recommendations] ❌ LAYER 1 (AI Service) ERROR for "${field}":`, error.message);
    console.log(`[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)`);
    return getFallbackKeywords(field);
  }
}

/**
 * Fallback keyword generation using pattern matching
 * Used when AI service is unavailable
 * 
 * @param {string} field - Field of study
 * @returns {string} - Fallback keywords
 */
function getFallbackKeywords(field) {
  const fieldLower = field.toLowerCase();
  let keywords = '';
  let matchedCategory = '';

  // Engineering/Tech patterns
  if (fieldLower.includes('computer') || fieldLower.includes('software') || 
      fieldLower.includes('bca') || fieldLower.includes('cs') || 
      fieldLower.includes('it') || fieldLower.includes('tech')) {
    keywords = 'Software Development, Programming, Technical Skills, Engineering, Computer Science, Coding, Web Development, Data Structures, Algorithms, Database Management, SQL, NoSQL, Cloud Computing, AWS, Azure, DevOps, CI/CD, Version Control, Git, Python, Java, JavaScript, C++, React, Angular, Node.js, API Development, Microservices, System Design, Software Architecture, Testing, Debugging, Agile, Scrum, Machine Learning, Artificial Intelligence, Data Science, Big Data, Cybersecurity, Network Security, Mobile Development, Android, iOS, Full Stack Development, Frontend, Backend, UI/UX Design, Software Engineering, Object-Oriented Programming, Functional Programming, Design Patterns, Code Review, Technical Documentation';
    matchedCategory = 'Computer Science/IT';
  }
  // Commerce/Business patterns
  else if (fieldLower.includes('bcom') || fieldLower.includes('b.com') || 
      fieldLower.includes('commerce') || fieldLower.includes('bba') || 
      fieldLower.includes('business') || fieldLower.includes('management')) {
    keywords = 'Finance, Accounting, Business Management, Economics, Financial Analysis, Budgeting, Corporate Finance, Marketing, Financial Accounting, Cost Accounting, Management Accounting, Auditing, Taxation, Income Tax, GST, Banking, Insurance, Investment Management, Portfolio Management, Financial Markets, Business Law, Corporate Law, Company Law, Strategic Management, Human Resources, HR Management, Operations Management, Supply Chain Management, Project Management, Entrepreneurship, Business Ethics, Corporate Governance, International Business, Financial Reporting, Risk Management, Business Analytics, Data Analysis, Excel, Tally, SAP, ERP, Financial Modeling, Valuation, Investment Banking, Commercial Banking, Sales Management, Marketing Management, Brand Management, Digital Marketing, E-commerce, Consumer Behavior, Market Research, Business Communication, Leadership, Organizational Behavior, Business Strategy, SWOT Analysis, Financial Planning, Working Capital Management, Cash Flow Management';
    matchedCategory = 'Commerce/Business';
  }
  // Engineering (non-CS) patterns
  else if (fieldLower.includes('mechanical') || fieldLower.includes('electrical') || 
      fieldLower.includes('civil') || fieldLower.includes('electronics') || 
      fieldLower.includes('ece') || fieldLower.includes('eee')) {
    keywords = 'Engineering Design, Technical Analysis, CAD, AutoCAD, SolidWorks, Manufacturing, Production Engineering, Quality Control, Systems Design, Project Management, Problem Solving, Innovation, Mechanical Systems, Thermodynamics, Fluid Mechanics, Heat Transfer, Machine Design, Materials Science, Metallurgy, Strength of Materials, Engineering Drawing, Technical Drawing, 3D Modeling, Simulation, ANSYS, MATLAB, Control Systems, Automation, Robotics, Industrial Engineering, Operations Research, Supply Chain, Lean Manufacturing, Six Sigma, Process Optimization, Electrical Circuits, Electronics, Digital Electronics, Analog Electronics, Microprocessors, Embedded Systems, Signal Processing, Power Systems, Renewable Energy, Civil Engineering, Structural Engineering, Construction Management, Surveying, Geotechnical Engineering, Transportation Engineering, Environmental Engineering, Water Resources, Building Design, Architecture, Safety Engineering, Maintenance Engineering';
    matchedCategory = 'Engineering (Non-CS)';
  }
  // Science patterns
  else if (fieldLower.includes('science') || fieldLower.includes('bsc') || 
      fieldLower.includes('b.sc') || fieldLower.includes('physics') || 
      fieldLower.includes('chemistry') || fieldLower.includes('biology')) {
    keywords = 'Scientific Research, Data Analysis, Laboratory Skills, Research Methodology, Experimentation, Critical Thinking, Scientific Writing, Physics, Classical Mechanics, Quantum Mechanics, Thermodynamics, Electromagnetism, Optics, Nuclear Physics, Particle Physics, Astrophysics, Chemistry, Organic Chemistry, Inorganic Chemistry, Physical Chemistry, Analytical Chemistry, Biochemistry, Chemical Analysis, Spectroscopy, Chromatography, Biology, Molecular Biology, Cell Biology, Genetics, Microbiology, Biotechnology, Ecology, Zoology, Botany, Physiology, Anatomy, Evolution, Bioinformatics, Laboratory Techniques, Microscopy, Data Collection, Statistical Analysis, SPSS, R Programming, Scientific Method, Hypothesis Testing, Peer Review, Academic Writing, Research Papers, Literature Review, Scientific Communication, Mathematics, Calculus, Statistics, Probability, Linear Algebra';
    matchedCategory = 'Science';
  }
  // Arts/Humanities patterns
  else if (fieldLower.includes('arts') || fieldLower.includes('ba') || 
      fieldLower.includes('humanities') || fieldLower.includes('journalism') || 
      fieldLower.includes('media')) {
    keywords = 'Communication, Creative Skills, Social Sciences, Humanities, Writing, Critical Analysis, Cultural Studies, Media Production, Journalism, News Writing, Reporting, Editing, Investigative Journalism, Broadcast Journalism, Digital Journalism, Content Writing, Copywriting, Creative Writing, Technical Writing, English Literature, Literary Analysis, Poetry, Fiction, Drama, History, Political Science, Sociology, Psychology, Philosophy, Anthropology, Economics, International Relations, Public Policy, Social Work, Media Studies, Mass Communication, Public Relations, Advertising, Marketing Communication, Social Media Management, Content Strategy, Photography, Videography, Film Making, Documentary Production, Audio Production, Podcasting, Storytelling, Narrative Techniques, Interview Skills, Research Skills, Critical Thinking, Analytical Skills, Presentation Skills, Public Speaking';
    matchedCategory = 'Arts/Humanities';
  }
  // Animation/Design patterns
  else if (fieldLower.includes('animation') || fieldLower.includes('design') || 
      fieldLower.includes('graphic') || fieldLower.includes('multimedia') || 
      fieldLower.includes('dm')) {
    keywords = 'Creative Design, Animation, Visual Arts, Multimedia Production, Graphic Design, Digital Media, Storytelling, Adobe Tools, Adobe Photoshop, Adobe Illustrator, Adobe After Effects, Adobe Premiere Pro, Adobe InDesign, 2D Animation, 3D Animation, Character Design, Character Animation, Motion Graphics, Visual Effects, VFX, CGI, Maya, Blender, 3ds Max, Cinema 4D, ZBrush, Substance Painter, UI Design, UX Design, User Interface, User Experience, Wireframing, Prototyping, Figma, Sketch, Adobe XD, Web Design, Responsive Design, Typography, Color Theory, Layout Design, Brand Identity, Logo Design, Illustration, Digital Illustration, Concept Art, Storyboarding, Video Editing, Sound Design, Game Design, Game Art, Level Design, Digital Painting, Photo Manipulation, Print Design, Packaging Design, Portfolio Development, Creative Thinking, Visual Communication, Design Principles, Composition';
    matchedCategory = 'Animation/Design';
  }
  // School level patterns
  else if (fieldLower.includes('school') || fieldLower.includes('grade') || 
      fieldLower.includes('middle') || fieldLower.includes('high')) {
    keywords = 'Academic Skills, Study Techniques, Critical Thinking, Communication, Problem Solving, Time Management, Learning Strategies, Mathematics, Science, English, Social Studies, Reading Comprehension, Writing Skills, Grammar, Vocabulary, Essay Writing, Research Skills, Note Taking, Test Preparation, Exam Strategies, Memory Techniques, Concentration, Focus, Organization, Planning, Goal Setting, Self-Discipline, Motivation, Confidence Building, Presentation Skills, Group Work, Collaboration, Digital Literacy, Computer Skills, Internet Research, Information Literacy, Creative Thinking, Analytical Thinking, Logical Reasoning, Numerical Skills, Scientific Method, Experimentation, Observation Skills';
    matchedCategory = 'School Level';
  }
  // Generic fallback
  else {
    keywords = 'Professional Skills, Communication, Problem Solving, Critical Thinking, Teamwork, Leadership, Time Management, Adaptability, Interpersonal Skills, Collaboration, Project Management, Decision Making, Analytical Skills, Research Skills, Presentation Skills, Public Speaking, Written Communication, Verbal Communication, Active Listening, Conflict Resolution, Negotiation, Emotional Intelligence, Self-Awareness, Stress Management, Work Ethics, Professionalism, Attention to Detail, Organization, Planning, Goal Setting, Creativity, Innovation, Flexibility, Resilience, Learning Agility, Digital Literacy, Technical Skills, Data Analysis, Microsoft Office, Excel, PowerPoint, Word, Email Etiquette, Professional Development, Career Planning, Networking, Personal Branding';
    matchedCategory = 'Generic (No Pattern Match)';
    console.log(`[Course Recommendations] ⚠️ LAYER 2 (Pattern Matching) - No match found for "${field}"`);
    console.log(`[Course Recommendations] → Using LAYER 3 (Generic Keywords)`);
  }

  if (matchedCategory !== 'Generic (No Pattern Match)') {
    console.log(`[Course Recommendations] ✅ LAYER 2 (Pattern Matching) SUCCESS for "${field}"`);
    console.log(`[Course Recommendations] Matched Category: ${matchedCategory}`);
  }
  
  console.log(`[Course Recommendations] Keywords: ${keywords}`);
  return keywords;
}

/**
 * In-memory cache for generated keywords (session-level)
 * Prevents redundant AI calls for the same field
 */
const keywordCache = new Map();

/**
 * Get domain keywords with caching
 * 
 * @param {string} fieldOfStudy - Field of study
 * @returns {Promise<string>} - Domain keywords
 */
export async function getDomainKeywordsWithCache(fieldOfStudy) {
  if (!fieldOfStudy) {
    return '';
  }

  const cacheKey = fieldOfStudy.toLowerCase().trim();

  // Check cache first
  if (keywordCache.has(cacheKey)) {
    console.log(`[Course Recommendations] 🚀 CACHE HIT for "${fieldOfStudy}" (instant)`);
    return keywordCache.get(cacheKey);
  }

  console.log(`[Course Recommendations] 💾 CACHE MISS for "${fieldOfStudy}" - generating keywords...`);
  
  // Generate and cache
  const keywords = await generateDomainKeywords(fieldOfStudy);
  keywordCache.set(cacheKey, keywords);

  return keywords;
}

/**
 * Clear the keyword cache (useful for testing)
 */
export function clearKeywordCache() {
  keywordCache.clear();
}
