/**
 * Assessment API Cloudflare Worker
 * Generates course-specific assessment questions using Claude AI
 * POST /generate - Generate assessment questions
 * POST /career-assessment/generate-aptitude - Generate aptitude questions
 * POST /career-assessment/generate-knowledge - Generate stream knowledge questions
 */

import { createClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  CLAUDE_API_KEY?: string;
  VITE_CLAUDE_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  VITE_OPENROUTER_API_KEY?: string;
}

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to repair and parse JSON from AI responses
function repairAndParseJSON(text: string): any {
  // Clean markdown
  let cleaned = text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find JSON boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON object found in response');
  }
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Initial JSON parse failed, attempting repair...');
  }

  // Repair common issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
    .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
    .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
    .replace(/\n/g, ' ')              // Remove newlines
    .replace(/\r/g, '')               // Remove carriage returns
    .replace(/\t/g, ' ')              // Replace tabs with spaces
    .replace(/"\s*\n\s*"/g, '", "')   // Fix broken string arrays
    .replace(/}\s*{/g, '},{')         // Fix missing commas between objects
    .replace(/]\s*\[/g, '],[')        // Fix missing commas between arrays
    .replace(/"\s+"/g, '","');        // Fix missing commas between strings

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Repair attempt 1 failed, trying more aggressive repair...');
  }

  // More aggressive: try to extract just the questions array
  const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
  if (questionsMatch) {
    try {
      // Try to parse individual question objects
      const questionsStr = questionsMatch[1];
      const questions: any[] = [];
      
      // Split by },{ pattern
      const parts = questionsStr.split(/}\s*,\s*{/);
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        if (!part.startsWith('{')) part = '{' + part;
        if (!part.endsWith('}')) part = part + '}';
        
        try {
          const q = JSON.parse(part);
          questions.push(q);
        } catch (qe) {
          console.log(`⚠️ Skipping malformed question ${i + 1}`);
        }
      }
      
      if (questions.length > 0) {
        console.log(`✅ Recovered ${questions.length} questions from malformed JSON`);
        return { questions };
      }
    } catch (e) {
      console.log('⚠️ Questions extraction failed');
    }
  }

  throw new Error('Failed to parse JSON after all repair attempts');
}

// List of models to try in order (using reliable free models)
const FREE_MODELS = [
  'xiaomi/mimo-v2-flash:free'  // Xiaomi's free model - fast and reliable
];

// Helper function to call OpenRouter with retry and model fallback
async function callOpenRouterWithRetry(
  openRouterKey: string,
  messages: Array<{role: string, content: string}>,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (const model of FREE_MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Trying ${model} (attempt ${attempt + 1}/${maxRetries})`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://skillpassport.pages.dev',
            'X-Title': 'SkillPassport Assessment'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4000,
            temperature: 0.7,
            messages: messages
          })
        });

        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${model} failed (${response.status}):`, errorText.substring(0, 200));
          lastError = new Error(`${model} failed: ${response.status}`);
          break; // Try next model
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(`✅ ${model} succeeded`);
          return content;
        }
        
        lastError = new Error('Empty response from API');
        break; // Try next model
      } catch (e: any) {
        console.error(`❌ ${model} error:`, e.message);
        lastError = e;
        if (attempt < maxRetries - 1) {
          await delay(1000);
        }
      }
    }
  }
  
  throw lastError || new Error('All models failed');
}

// ============================================
// APTITUDE QUESTION GENERATION
// ============================================
// Categories with specific question counts to match UI expectations (total: 50)
const APTITUDE_CATEGORIES = [
  { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies', count: 8 },
  { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation', count: 8 },
  { id: 'abstract', name: 'Abstract / Logical Reasoning', description: 'Pattern recognition, deductive reasoning, sequences', count: 8 },
  { id: 'spatial', name: 'Spatial / Mechanical Reasoning', description: 'Visual-spatial relationships, gears, rotation', count: 6 },
  { id: 'clerical', name: 'Clerical Speed & Accuracy', description: 'String comparison, attention to detail - mark Same or Different', count: 20 }
];

// School Subject Categories for After 10th students (total: 50 questions)
// These help determine which stream (Science/Commerce/Arts) is best suited
const SCHOOL_SUBJECT_CATEGORIES = [
  { id: 'mathematics', name: 'Mathematics', description: 'Algebra, geometry, arithmetic, problem-solving - tests analytical and numerical skills', count: 10 },
  { id: 'science', name: 'Science (Physics, Chemistry, Biology)', description: 'Scientific concepts, experiments, formulas, natural phenomena', count: 10 },
  { id: 'english', name: 'English Language', description: 'Grammar, vocabulary, comprehension, communication skills', count: 10 },
  { id: 'social_studies', name: 'Social Studies (History, Geography, Civics)', description: 'Historical events, geography, civics, current affairs, society', count: 10 },
  { id: 'computer', name: 'Computer & Logical Thinking', description: 'Basic computer concepts, logical reasoning, problem-solving, digital literacy', count: 10 }
];

// Prompt for After 10th students - School Subject Based Assessment
const SCHOOL_SUBJECT_PROMPT = `You are an expert educational assessment creator for 10th grade students in India who are about to choose their stream (Science/Commerce/Arts) for 11th-12th.

Generate questions to assess the student's aptitude across school subjects. This will help recommend the best stream for them.

Generate questions for these subjects with EXACT counts:
{{CATEGORIES}}

IMPORTANT CONTEXT:
- Student has selected interest in {{STREAM_NAME}} stream
- Questions should test fundamental understanding, not memorization
- Mix of conceptual and application-based questions
- Difficulty: 40% easy, 40% medium, 20% hard

Subject-wise Question Guidelines:
1. MATHEMATICS (10 questions):
   - Algebra: equations, expressions, factorization
   - Geometry: shapes, theorems, mensuration
   - Arithmetic: percentages, ratios, profit-loss
   - Data interpretation: graphs, tables, statistics

2. SCIENCE (10 questions):
   - Physics: motion, force, energy, electricity
   - Chemistry: elements, compounds, reactions, periodic table
   - Biology: human body, plants, ecosystems, cells

3. ENGLISH (10 questions):
   - Grammar: tenses, articles, prepositions
   - Vocabulary: synonyms, antonyms, word meanings
   - Comprehension: passage understanding
   - Sentence correction and completion

4. SOCIAL STUDIES (10 questions):
   - History: Indian history, world history, freedom struggle
   - Geography: maps, climate, resources, continents
   - Civics: constitution, government, rights, duties
   - Economics basics: money, trade, development

5. COMPUTER & LOGICAL THINKING (10 questions):
   - Basic computer concepts: hardware, software, internet
   - Logical reasoning: patterns, sequences, puzzles
   - Problem-solving: algorithmic thinking
   - Digital literacy: file management, basic applications

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "category": "mathematics",
      "subject": "Mathematics",
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "algebra",
      "estimated_time": 60
    }
  ]
}

IMPORTANT: 
- Use sequential numeric IDs (1, 2, 3, etc.)
- Each question must have exactly 4 options
- Include the "subject" field for each question
- Questions should be appropriate for 10th grade level`;

const APTITUDE_PROMPT = `You are an expert psychometric assessment creator. Generate aptitude test questions for {{STREAM_NAME}} stream career assessment.

Generate questions for these categories with EXACT counts:
{{CATEGORIES}}

CRITICAL REQUIREMENT - 100% STREAM-RELATED QUESTIONS:
This is for {{STREAM_NAME}} students. ALL questions MUST use {{STREAM_NAME}}-specific context, terminology, scenarios, and examples.

{{STREAM_CONTEXT}}

Question Requirements:
1. All questions must be MCQ with exactly 4 options (except Clerical which has 2 options: "Same" or "Different")
2. Each question must have exactly ONE correct answer
3. Mix difficulty levels: 40% easy, 40% medium, 20% hard
4. 100% of questions MUST be directly related to {{STREAM_NAME}} field - use domain-specific terminology, scenarios, and real-world examples from this field
5. NO generic questions - every question must have {{STREAM_NAME}} context
6. For Clerical Speed & Accuracy: Generate string comparison questions using {{STREAM_NAME}}-specific codes/IDs like "{{CLERICAL_EXAMPLE}}"

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "category": "verbal",
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "vocabulary",
      "estimated_time": 45
    }
  ]
}

IMPORTANT: Use sequential numeric IDs (1, 2, 3, etc.) for each question.`;

// Stream-specific context for aptitude questions - 100% stream-related
const STREAM_CONTEXTS: Record<string, { name: string; context: string; clericalExample: string }> = {
  'science': {
    name: 'Science',
    context: `ALL questions must use Science context:
- Verbal (100% science): Scientific terminology, research papers, lab reports, scientific method descriptions
- Numerical (100% science): Physics calculations, chemistry equations, biology statistics, scientific data analysis
- Abstract/Logical (100% science): Scientific method reasoning, hypothesis testing, experimental design patterns
- Spatial/Mechanical (100% science): Molecular structures, anatomical diagrams, physics diagrams, lab equipment
- Clerical (100% science): Lab sample IDs, chemical formulas, specimen codes comparison`,
    clericalExample: 'H2SO4-LAB-2024 — H2SO4-LAB-2024'
  },
  'commerce': {
    name: 'Commerce',
    context: `ALL questions must use Commerce/Business context:
- Verbal (100% commerce): Business terminology, financial reports, market analysis, corporate communication
- Numerical (100% commerce): Profit/loss calculations, interest rates, accounting problems, GST calculations
- Abstract/Logical (100% commerce): Business decision scenarios, market trend analysis, supply chain patterns
- Spatial/Mechanical (100% commerce): Financial charts, organizational structures, process flow diagrams
- Clerical (100% commerce): Invoice numbers, account codes, transaction IDs, GST numbers comparison`,
    clericalExample: 'INV-2024-0847-GST — INV-2024-0847-GST'
  },
  'arts': {
    name: 'Arts/Humanities',
    context: `ALL questions must use Arts/Humanities context:
- Verbal (100% arts): Literary terminology, historical texts, philosophical concepts, cultural analysis
- Numerical (100% arts): Social science statistics, historical data analysis, survey interpretation
- Abstract/Logical (100% arts): Ethical dilemmas, historical cause-effect, philosophical reasoning patterns
- Spatial/Mechanical (100% arts): Art compositions, architectural layouts, map reading, design elements
- Clerical (100% arts): Reference codes, catalog numbers, citation IDs, archive codes comparison`,
    clericalExample: 'ISBN-978-3-16-148410 — ISBN-978-3-16-148410'
  },
  // After 10th streams (11th/12th class)
  'science_pcmb': {
    name: 'Science (PCMB)',
    context: `ALL questions must use 11th/12th Science PCMB context:
- Verbal (100% PCMB): Scientific terminology, biology concepts, physics principles, chemistry reactions
- Numerical (100% PCMB): Physics calculations, chemistry stoichiometry, biology statistics, math problems
- Abstract/Logical (100% PCMB): Scientific reasoning, hypothesis testing, biological patterns, chemical reactions
- Spatial/Mechanical (100% PCMB): Molecular structures, anatomical diagrams, physics diagrams, cell structures
- Clerical (100% PCMB): Chemical formulas, biological names, physics units, lab codes comparison`,
    clericalExample: 'CHEM-H2SO4-2024 — CHEM-H2SO4-2024'
  },
  'science_pcms': {
    name: 'Science (PCMS)',
    context: `ALL questions must use 11th/12th Science PCMS context:
- Verbal (100% PCMS): Scientific terminology, programming concepts, physics principles, chemistry reactions
- Numerical (100% PCMS): Physics calculations, chemistry equations, programming logic, math problems
- Abstract/Logical (100% PCMS): Algorithm patterns, scientific reasoning, programming logic, chemical reactions
- Spatial/Mechanical (100% PCMS): Circuit diagrams, flowcharts, physics diagrams, molecular structures
- Clerical (100% PCMS): Variable names, chemical formulas, physics units, code snippets comparison`,
    clericalExample: 'CODE-VAR-2024 — CODE-VAR-2024'
  },
  'science_pcm': {
    name: 'Science (PCM)',
    context: `ALL questions must use 11th/12th Science PCM context:
- Verbal (100% PCM): Physics terminology, chemistry concepts, mathematical descriptions, engineering basics
- Numerical (100% PCM): Physics calculations, chemistry equations, calculus, algebra problems
- Abstract/Logical (100% PCM): Mathematical proofs, physics reasoning, chemical patterns, engineering logic
- Spatial/Mechanical (100% PCM): Physics diagrams, geometric figures, molecular structures, mechanical drawings
- Clerical (100% PCM): Physics units, chemical formulas, mathematical notations comparison`,
    clericalExample: 'PHY-9.8m/s²-2024 — PHY-9.8m/s²-2024'
  },
  'science_pcb': {
    name: 'Science (PCB)',
    context: `ALL questions must use 11th/12th Science PCB context:
- Verbal (100% PCB): Biology terminology, chemistry concepts, physics principles, medical basics
- Numerical (100% PCB): Biology statistics, chemistry calculations, physics problems, medical data
- Abstract/Logical (100% PCB): Biological patterns, chemical reactions, medical reasoning, scientific method
- Spatial/Mechanical (100% PCB): Anatomical diagrams, cell structures, molecular models, lab equipment
- Clerical (100% PCB): Biological names, chemical formulas, specimen codes, medical terms comparison`,
    clericalExample: 'BIO-DNA-2024 — BIO-DNA-2024'
  },
  // B.Tech / Engineering streams
  'btech_cse': {
    name: 'B.Tech Computer Science',
    context: `ALL questions must use Computer Science/Programming context:
- Verbal (100% CS): Programming terminology, algorithm descriptions, software documentation, code comments
- Numerical (100% CS): Time complexity calculations, binary/hex conversions, data structure operations, memory calculations
- Abstract/Logical (100% CS): Algorithm flowcharts, code logic patterns, debugging scenarios, recursion patterns
- Spatial/Mechanical (100% CS): Data structure diagrams, network topologies, UML diagrams, system architecture
- Clerical (100% CS): Variable names, function signatures, IP addresses, MAC addresses comparison`,
    clericalExample: 'git-a1b2c3d4e5f6 — git-a1b2c3d4e5f6'
  },
  'btech_ece': {
    name: 'B.Tech Electronics & Communication',
    context: `ALL questions must use Electronics & Communication context:
- Verbal (100% ECE): Electronics terminology, circuit descriptions, signal processing concepts, communication protocols
- Numerical (100% ECE): Ohm's law calculations, frequency/wavelength, decibel calculations, filter design values
- Abstract/Logical (100% ECE): Circuit logic patterns, signal flow analysis, modulation schemes, protocol sequences
- Spatial/Mechanical (100% ECE): Circuit diagrams, PCB layouts, antenna patterns, waveform analysis
- Clerical (100% ECE): Component codes, resistor color codes, IC part numbers, frequency bands comparison`,
    clericalExample: 'IC-ATmega328P-PU — IC-ATmega328P-PU'
  },
  'btech_mech': {
    name: 'B.Tech Mechanical Engineering',
    context: `ALL questions must use Mechanical Engineering context:
- Verbal (100% mech): Mechanical terminology, manufacturing processes, thermodynamics concepts, material properties
- Numerical (100% mech): Stress/strain calculations, heat transfer, fluid dynamics, gear ratios, torque calculations
- Abstract/Logical (100% mech): Machine operation sequences, manufacturing process flows, quality control patterns
- Spatial/Mechanical (100% mech): Machine drawings, gear assemblies, CAD views, isometric projections
- Clerical (100% mech): Part numbers, material grades, tolerance codes, drawing numbers comparison`,
    clericalExample: 'DWG-ASSY-2024-089 — DWG-ASSY-2024-089'
  },
  'btech_civil': {
    name: 'B.Tech Civil Engineering',
    context: `ALL questions must use Civil Engineering context:
- Verbal (100% civil): Construction terminology, structural concepts, surveying descriptions, building codes
- Numerical (100% civil): Load calculations, concrete mix ratios, surveying measurements, cost estimation
- Abstract/Logical (100% civil): Construction sequences, project scheduling (CPM/PERT), structural load paths
- Spatial/Mechanical (100% civil): Building plans, structural drawings, site layouts, elevation views
- Clerical (100% civil): Drawing numbers, material codes, project IDs, survey coordinates comparison`,
    clericalExample: 'BBS-COL-C1-2024 — BBS-COL-C1-2024'
  },
  'btech_eee': {
    name: 'B.Tech Electrical Engineering',
    context: `ALL questions must use Electrical Engineering context:
- Verbal (100% EEE): Electrical terminology, power systems concepts, motor descriptions, safety standards
- Numerical (100% EEE): Power calculations, transformer ratios, motor speed, electrical load analysis
- Abstract/Logical (100% EEE): Power distribution patterns, control system logic, protection schemes
- Spatial/Mechanical (100% EEE): Single line diagrams, motor assemblies, switchgear layouts, wiring diagrams
- Clerical (100% EEE): Equipment codes, cable specifications, breaker ratings, meter readings comparison`,
    clericalExample: 'CB-MCCB-400A-3P — CB-MCCB-400A-3P'
  },
  'btech_it': {
    name: 'B.Tech Information Technology',
    context: `ALL questions must use Information Technology context:
- Verbal (100% IT): IT terminology, network concepts, database descriptions, cybersecurity terms
- Numerical (100% IT): Bandwidth calculations, storage conversions, network latency, database queries
- Abstract/Logical (100% IT): Network flow patterns, database relationships, security protocols, system integration
- Spatial/Mechanical (100% IT): Network diagrams, ER diagrams, system architecture, cloud infrastructure
- Clerical (100% IT): Server names, database IDs, API endpoints, configuration codes comparison`,
    clericalExample: 'SRV-PROD-DB-01 — SRV-PROD-DB-01'
  },
  'btech_aiml': {
    name: 'B.Tech AI & Machine Learning',
    context: `ALL questions must use AI/ML context:
- Verbal (100% AI/ML): ML terminology, neural network concepts, algorithm descriptions, model documentation
- Numerical (100% AI/ML): Accuracy metrics, loss calculations, hyperparameter values, matrix operations
- Abstract/Logical (100% AI/ML): Decision tree patterns, neural network flows, training pipelines, model selection
- Spatial/Mechanical (100% AI/ML): Neural network architectures, confusion matrices, feature maps, data pipelines
- Clerical (100% AI/ML): Model versions, dataset IDs, hyperparameter configs, experiment IDs comparison`,
    clericalExample: 'MODEL-BERT-v2.3.1 — MODEL-BERT-v2.3.1'
  },
  // B.Sc streams
  'bsc_cs': {
    name: 'B.Sc Computer Science',
    context: `ALL questions must use Computer Science context:
- Verbal (100% CS): Programming concepts, algorithm terminology, software development descriptions
- Numerical (100% CS): Complexity analysis, number systems, data structure operations
- Abstract/Logical (100% CS): Algorithm patterns, code logic, debugging scenarios
- Spatial/Mechanical (100% CS): Flowcharts, data structure diagrams, system designs
- Clerical (100% CS): Variable names, function calls, file paths comparison`,
    clericalExample: 'func_getData_v2() — func_getData_v2()'
  },
  'bsc_physics': {
    name: 'B.Sc Physics',
    context: `ALL questions must use Physics context:
- Verbal (100% physics): Physics terminology, experimental descriptions, theoretical concepts
- Numerical (100% physics): Mechanics calculations, electromagnetic problems, quantum numbers
- Abstract/Logical (100% physics): Physical law applications, experimental design, cause-effect in physics
- Spatial/Mechanical (100% physics): Force diagrams, wave patterns, optical ray diagrams
- Clerical (100% physics): Physical constants, unit conversions, measurement codes comparison`,
    clericalExample: '9.81m/s²-g — 9.81m/s²-g'
  },
  'bsc_chemistry': {
    name: 'B.Sc Chemistry',
    context: `ALL questions must use Chemistry context:
- Verbal (100% chemistry): Chemical terminology, reaction descriptions, lab procedures
- Numerical (100% chemistry): Molarity calculations, stoichiometry, pH calculations
- Abstract/Logical (100% chemistry): Reaction mechanisms, periodic trends, molecular patterns
- Spatial/Mechanical (100% chemistry): Molecular structures, orbital diagrams, lab equipment
- Clerical (100% chemistry): Chemical formulas, IUPAC names, CAS numbers comparison`,
    clericalExample: 'C6H12O6-GLU — C6H12O6-GLU'
  },
  'bsc_maths': {
    name: 'B.Sc Mathematics',
    context: `ALL questions must use Mathematics context:
- Verbal (100% maths): Mathematical terminology, theorem statements, proof descriptions
- Numerical (100% maths): Calculus problems, algebra, statistics, number theory
- Abstract/Logical (100% maths): Mathematical proofs, pattern recognition, logical sequences
- Spatial/Mechanical (100% maths): Geometric figures, graphs, coordinate systems
- Clerical (100% maths): Mathematical notations, equation formats, formula codes comparison`,
    clericalExample: '∫f(x)dx=F(x) — ∫f(x)dx=F(x)'
  },
  // BBA/BCA/B.Com streams
  'bba': {
    name: 'BBA Business Administration',
    context: `ALL questions must use Business/Management context:
- Verbal (100% business): Management terminology, business communication, organizational concepts
- Numerical (100% business): Business math, profit analysis, market statistics
- Abstract/Logical (100% business): Business strategy patterns, organizational hierarchies, decision trees
- Spatial/Mechanical (100% business): Org charts, process flows, business model diagrams
- Clerical (100% business): Employee IDs, department codes, project numbers comparison`,
    clericalExample: 'PO-MKT-2024-156 — PO-MKT-2024-156'
  },
  'bca': {
    name: 'BCA Computer Applications',
    context: `ALL questions must use Computer Applications context:
- Verbal (100% BCA): Programming terminology, software concepts, IT documentation
- Numerical (100% BCA): Programming calculations, database queries, network math
- Abstract/Logical (100% BCA): Code logic patterns, database relationships, system flows
- Spatial/Mechanical (100% BCA): Flowcharts, ER diagrams, UI wireframes
- Clerical (100% BCA): Code snippets, database entries, file names comparison`,
    clericalExample: 'SELECT_usr_2024 — SELECT_usr_2024'
  },
  'bcom': {
    name: 'B.Com Commerce',
    context: `ALL questions must use Commerce/Accounting context:
- Verbal (100% commerce): Accounting terminology, financial concepts, business law terms
- Numerical (100% commerce): Accounting calculations, tax computations, financial ratios
- Abstract/Logical (100% commerce): Accounting cycles, audit trails, financial patterns
- Spatial/Mechanical (100% commerce): Balance sheets, financial charts, ledger formats
- Clerical (100% commerce): Account numbers, voucher codes, GST numbers comparison`,
    clericalExample: 'GSTIN-29ABCDE1234 — GSTIN-29ABCDE1234'
  },
  // Default/Generic college
  'college': {
    name: 'College/University',
    context: `ALL questions must use Academic/Higher Education context:
- Verbal (100% academic): Academic terminology, research concepts, scholarly writing
- Numerical (100% academic): Statistical analysis, research data, academic metrics
- Abstract/Logical (100% academic): Research methodology, critical thinking, analytical patterns
- Spatial/Mechanical (100% academic): Research diagrams, data visualizations, academic charts
- Clerical (100% academic): Reference codes, student IDs, course codes comparison`,
    clericalExample: 'STU-2024-UG-1234 — STU-2024-UG-1234'
  }
};

const KNOWLEDGE_PROMPT = `You are an expert assessment creator for {{STREAM_NAME}} education.

Generate {{QUESTION_COUNT}} knowledge assessment questions covering these topics:
{{TOPICS}}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization
5. Questions should be relevant for students entering this field

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "topic name",
      "estimated_time": 60
    }
  ]
}

IMPORTANT: Use sequential numeric IDs (1, 2, 3, etc.) for each question.`;

const SYSTEM_PROMPT = `You are an expert assessment creator. Generate a skill assessment SPECIFICALLY for the course: {{COURSE_NAME}}

CRITICAL REQUIREMENTS:
1. ALL questions MUST be directly related to {{COURSE_NAME}}
2. Questions should test practical knowledge of {{COURSE_NAME}}
3. Generate EXACTLY {{QUESTION_COUNT}} questions with this distribution:
   - First 5 questions: EASY difficulty
   - Next 5 questions: MEDIUM difficulty  
   - Last 5 questions: HARD difficulty

Difficulty Guidelines:
- EASY (Q1-5): Fundamental concepts (45-60 seconds per question)
- MEDIUM (Q6-10): Complex application, debugging (75-90 seconds per question)
- HARD (Q11-15): Advanced optimization, edge cases (100-120 seconds per question)

Question Rules:
1. All questions must be MCQ with exactly 4 options
2. Each MCQ must have exactly ONE correct answer
3. Options should be plausible but clearly distinguishable
4. Test understanding, not memorization

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting
- NO explanatory text

Required JSON structure:
{
  "course": "{{COURSE_NAME}}",
  "level": "{{LEVEL}}",
  "total_questions": {{QUESTION_COUNT}},
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "Skill being tested",
      "estimated_time": 45
    }
  ]
}`;

// ============================================
// APTITUDE QUESTION GENERATION (Per-student with save/resume)
// Generates 50 questions total
// For after10: School subjects (maths, science, english, social, computer)
// For after12/college: Aptitude categories (verbal, numerical, abstract, spatial, clerical)
// Split into 2 batches to avoid token limits
// ============================================
async function generateAptitudeQuestions(
  env: Env, 
  streamId: string, 
  questionsPerCategory: number = 5, // ignored, using category counts instead
  studentId?: string,
  attemptId?: string,
  gradeLevel?: string // 'after10', 'after12', 'college'
) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // ONLY use school subjects for after10 grade level (explicitly passed)
  // after12 and college use standard aptitude categories even if they select science/commerce/arts
  const isAfter10 = gradeLevel === 'after10';
  
  console.log(`📚 Grade level detection: streamId=${streamId}, gradeLevel=${gradeLevel}, isAfter10=${isAfter10}`);

  // If studentId provided, check for existing questions for this student
  if (studentId) {
    try {
      const { data: existing, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('stream_id', streamId)
        .eq('question_type', 'aptitude')
        .eq('is_active', true)
        .maybeSingle();

      if (!error && existing?.questions?.length >= 50) {
        console.log('✅ Returning saved aptitude questions for student:', studentId, 'count:', existing.questions.length);
        return { questions: existing.questions, cached: true };
      }
    } catch (e: any) {
      console.warn('⚠️ Error checking existing questions:', e.message);
    }
  }

  console.log('📝 Generating fresh aptitude questions in 2 batches for stream:', streamId, 'isAfter10:', isAfter10);

  const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
  
  if (!openRouterKey && !claudeKey) {
    throw new Error('No API key configured (OpenRouter or Claude)');
  }

  const streamContext = STREAM_CONTEXTS[streamId] || STREAM_CONTEXTS['science'];

  // Use different categories and prompts for after10 vs after12/college
  const categories = isAfter10 ? SCHOOL_SUBJECT_CATEGORIES : APTITUDE_CATEGORIES;
  const promptTemplate = isAfter10 ? SCHOOL_SUBJECT_PROMPT : APTITUDE_PROMPT;

  // Helper function to generate questions for specific categories
  async function generateBatch(batchNum: number, batchCategories: typeof categories): Promise<any[]> {
    const categoriesText = batchCategories.map(c => `- ${c.name} (${c.count} questions): ${c.description}`).join('\n');
    const totalQuestions = batchCategories.reduce((sum, c) => sum + c.count, 0);
    
    let prompt: string;
    if (isAfter10) {
      // School subject prompt for after10
      prompt = promptTemplate
        .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
        .replace(/\{\{STREAM_NAME\}\}/g, streamContext.name);
    } else {
      // Standard aptitude prompt for after12/college
      prompt = promptTemplate
        .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
        .replace(/\{\{STREAM_NAME\}\}/g, streamContext.name)
        .replace(/\{\{STREAM_CONTEXT\}\}/g, streamContext.context)
        .replace(/\{\{CLERICAL_EXAMPLE\}\}/g, streamContext.clericalExample);
    }

    let jsonText: string;
    const systemPrompt = isAfter10 
      ? `You are an expert educational assessment creator for 10th grade students. Generate EXACTLY ${totalQuestions} questions total covering school subjects. Generate ONLY valid JSON.`
      : `You are an expert psychometric assessment creator. Generate EXACTLY ${totalQuestions} questions total. Generate ONLY valid JSON.`;
    
    // Try Claude first, fallback to OpenRouter with retry
    if (claudeKey) {
      console.log(`🔑 Batch ${batchNum}: Using Claude API for ${totalQuestions} questions`);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 6000,
            temperature: 0.7 + (batchNum * 0.05),
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API failed: ${response.status}`);
        }

        const data = await response.json() as any;
        jsonText = data.content[0].text;
      } catch (claudeError: any) {
        console.error('Claude error:', claudeError.message);
        if (openRouterKey) {
          console.log(`🔑 Batch ${batchNum}: Claude failed, trying OpenRouter with retry`);
          jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]);
        } else {
          throw claudeError;
        }
      }
    } else if (openRouterKey) {
      console.log(`🔑 Batch ${batchNum}: Using OpenRouter with retry for ${totalQuestions} questions`);
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);
    } else {
      throw new Error('No API key configured');
    }

    // Use robust JSON parser
    const result = repairAndParseJSON(jsonText);
    return result.questions || [];
  }

  let batch1: any[];
  let batch2: any[];

  if (isAfter10) {
    // For after10: Split school subjects into 2 batches
    // Batch 1: Mathematics(10) + Science(10) + English(10) = 30 questions
    const batch1Categories = categories.filter(c => ['mathematics', 'science', 'english'].includes(c.id));
    console.log('📦 Generating batch 1 (Mathematics + Science + English = 30 questions)...');
    batch1 = await generateBatch(1, batch1Categories);
    console.log(`✅ Batch 1 complete: ${batch1.length} questions`);

    // Wait 3 seconds between batches to avoid rate limits
    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    // Batch 2: Social Studies(10) + Computer(10) = 20 questions
    const batch2Categories = categories.filter(c => ['social_studies', 'computer'].includes(c.id));
    console.log('📦 Generating batch 2 (Social Studies + Computer = 20 questions)...');
    batch2 = await generateBatch(2, batch2Categories);
    console.log(`✅ Batch 2 complete: ${batch2.length} questions`);
  } else {
    // For after12/college: Standard aptitude categories
    // Batch 1: verbal(8) + numerical(8) + abstract(8) = 24 questions
    const batch1Categories = categories.filter(c => ['verbal', 'numerical', 'abstract'].includes(c.id));
    console.log('📦 Generating batch 1 (verbal + numerical + abstract = 24 questions)...');
    batch1 = await generateBatch(1, batch1Categories);
    console.log(`✅ Batch 1 complete: ${batch1.length} questions`);

    // Wait 3 seconds between batches to avoid rate limits
    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    // Batch 2: spatial(6) + clerical(20) = 26 questions
    const batch2Categories = categories.filter(c => ['spatial', 'clerical'].includes(c.id));
    console.log('📦 Generating batch 2 (spatial + clerical = 26 questions)...');
    batch2 = await generateBatch(2, batch2Categories);
    console.log(`✅ Batch 2 complete: ${batch2.length} questions`);
  }

  // Combine batches and assign UUIDs + module info
  const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => {
    // Map category to moduleTitle for UI display
    const categoryToModule: Record<string, string> = isAfter10 ? {
      'mathematics': 'A) Mathematics',
      'science': 'B) Science',
      'english': 'C) English Language',
      'social_studies': 'D) Social Studies',
      'computer': 'E) Computer & Logical Thinking'
    } : {
      'verbal': 'A) Verbal Reasoning',
      'numerical': 'B) Numerical Ability',
      'abstract': 'C) Abstract / Logical Reasoning',
      'spatial': 'D) Spatial / Mechanical Reasoning',
      'clerical': 'E) Clerical Speed & Accuracy'
    };
    
    return {
      ...q,
      id: generateUUID(),
      originalIndex: idx + 1,
      subtype: q.category,
      subject: q.subject || q.category, // Include subject for after10
      moduleTitle: categoryToModule[q.category] || q.category
    };
  });

  console.log(`✅ Total aptitude questions generated: ${allQuestions.length}`);

  // Save to database for this student if studentId provided
  if (studentId) {
    try {
      await supabase.from('career_assessment_ai_questions').upsert({
        student_id: studentId,
        stream_id: streamId,
        question_type: 'aptitude',
        attempt_id: attemptId || null,
        questions: allQuestions,
        generated_at: new Date().toISOString(),
        grade_level: gradeLevel || 'Grade 10', // Add grade level field
        is_active: true
      }, { onConflict: 'student_id,stream_id,question_type' });
      console.log('✅ Aptitude questions saved for student:', studentId, 'grade:', gradeLevel);
    } catch (e: any) {
      console.warn('⚠️ Could not save questions:', e.message);
    }
  }

  return { questions: allQuestions, generated: true };
}

// ============================================
// STREAM KNOWLEDGE QUESTION GENERATION (Per-student with save/resume)
// Generates 20 questions in two batches of 10 each
// ============================================
async function generateKnowledgeQuestions(
  env: Env, 
  streamId: string, 
  streamName: string, 
  topics: string[], 
  questionCount: number = 20,
  studentId?: string,
  attemptId?: string,
  gradeLevel?: string // Add grade level parameter
) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // If studentId provided, check for existing questions for this student
  if (studentId) {
    try {
      const { data: existing, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('stream_id', streamId)
        .eq('question_type', 'knowledge')
        .eq('is_active', true)
        .maybeSingle();

      if (!error && existing?.questions?.length >= 20) {
        console.log('✅ Returning saved knowledge questions for student:', studentId, 'count:', existing.questions.length);
        return { questions: existing.questions, cached: true };
      }
    } catch (e: any) {
      console.warn('⚠️ Error checking existing questions:', e.message);
    }
  }

  console.log('📝 Generating fresh knowledge questions in 2 batches for:', streamName);

  const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
  
  if (!openRouterKey && !claudeKey) {
    throw new Error('No API key configured (OpenRouter or Claude)');
  }

  // Helper function to generate one batch of knowledge questions
  async function generateBatch(batchNum: number, count: number, topicSubset: string[]): Promise<any[]> {
    const topicsText = topicSubset.map(t => `- ${t}`).join('\n');
    const prompt = `You are an expert assessment creator for ${streamName} education.

Generate exactly ${count} knowledge assessment questions covering these topics:
${topicsText}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}`;

    let jsonText: string;
    
    if (claudeKey) {
      console.log(`🔑 Knowledge Batch ${batchNum}: Using Claude API`);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 3000,
            temperature: 0.7 + (batchNum * 0.05),
            system: `You are an expert assessment creator. Generate ONLY valid JSON with ${count} questions. No markdown.`,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API failed: ${response.status}`);
        }

        const data = await response.json() as any;
        jsonText = data.content[0].text;
      } catch (claudeError: any) {
        console.error('Claude error:', claudeError.message);
        if (openRouterKey) {
          console.log(`🔑 Knowledge Batch ${batchNum}: Claude failed, trying OpenRouter with retry`);
          jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: `Generate ONLY valid JSON with ${count} questions. No markdown.` },
            { role: 'user', content: prompt }
          ]);
        } else {
          throw claudeError;
        }
      }
    } else if (openRouterKey) {
      console.log(`🔑 Knowledge Batch ${batchNum}: Using OpenRouter with retry`);
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: `Generate ONLY valid JSON with ${count} questions. No markdown.` },
        { role: 'user', content: prompt }
      ]);
    } else {
      throw new Error('No API key configured');
    }

    // Use robust JSON parser
    const result = repairAndParseJSON(jsonText);
    return result.questions || [];
  }

  // Split topics into two groups for variety
  const halfTopics = Math.ceil(topics.length / 2);
  const topics1 = topics.slice(0, halfTopics);
  const topics2 = topics.slice(halfTopics);

  // Generate two batches of 10 questions each
  console.log('📦 Generating knowledge batch 1 (10 questions)...');
  const batch1 = await generateBatch(1, 10, topics1.length > 0 ? topics1 : topics);
  console.log(`✅ Knowledge batch 1 complete: ${batch1.length} questions`);

  // Wait 3 seconds between batches to avoid rate limits
  console.log('⏳ Waiting 3s before batch 2...');
  await delay(3000);

  console.log('📦 Generating knowledge batch 2 (10 questions)...');
  const batch2 = await generateBatch(2, 10, topics2.length > 0 ? topics2 : topics);
  console.log(`✅ Knowledge batch 2 complete: ${batch2.length} questions`);

  // Combine batches and assign UUIDs
  const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1
  }));

  console.log(`✅ Total knowledge questions generated: ${allQuestions.length}`);

  // Save to database for this student if studentId provided
  if (studentId) {
    try {
      await supabase.from('career_assessment_ai_questions').upsert({
        student_id: studentId,
        stream_id: streamId,
        question_type: 'knowledge',
        attempt_id: attemptId || null,
        questions: allQuestions,
        generated_at: new Date().toISOString(),
        grade_level: gradeLevel || 'Grade 10', // Add grade level field
        is_active: true
      }, { onConflict: 'student_id,stream_id,question_type' });
      console.log('✅ Knowledge questions saved for student:', studentId, 'grade:', gradeLevel);
    } catch (e: any) {
      console.warn('⚠️ Could not save questions:', e.message);
    }
  }

  return { questions: allQuestions, generated: true };
}

// ============================================
// COURSE ASSESSMENT GENERATION (existing)
// ============================================
async function generateAssessment(env: Env, courseName: string, level: string, questionCount: number) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // Check cache first (but don't fail if database is unavailable)
  try {
    const { data: existing, error: cacheError } = await supabase
      .from('generated_external_assessment')
      .select('*')
      .eq('certificate_name', courseName)
      .single();

    if (!cacheError && existing) {
      console.log('✅ Returning cached questions for:', courseName);
      return {
        course: courseName,
        level: existing.assessment_level,
        total_questions: existing.total_questions,
        questions: existing.questions,
        cached: true
      };
    }
    
    if (cacheError && cacheError.code !== 'PGRST116') {
      console.warn('⚠️ Cache check failed, will generate new:', cacheError.message);
    }
  } catch (dbError: any) {
    console.warn('⚠️ Database unavailable, will generate new questions:', dbError.message);
  }

  console.log('📝 Generating new questions for:', courseName);

  const apiKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const prompt = SYSTEM_PROMPT
    .replace(/\{\{COURSE_NAME\}\}/g, courseName)
    .replace(/\{\{LEVEL\}\}/g, level)
    .replace(/\{\{QUESTION_COUNT\}\}/g, String(questionCount));


  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      system: `You are an expert assessment creator for ${courseName}. Generate ONLY valid JSON.`,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || 'Failed to generate assessment');
  }

  const data = await response.json() as any;
  let assessmentJSON = data.content[0].text;

  console.log('Raw Claude response length:', assessmentJSON.length);

  // Clean up response - more robust parsing
  assessmentJSON = assessmentJSON
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find the JSON object boundaries
  const startIdx = assessmentJSON.indexOf('{');
  const endIdx = assessmentJSON.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error('Invalid JSON structure in response');
    throw new Error('Failed to parse assessment response');
  }
  
  assessmentJSON = assessmentJSON.substring(startIdx, endIdx + 1);

  // Fix common JSON issues from AI responses
  assessmentJSON = assessmentJSON
    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
    .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters

  let assessment;
  try {
    assessment = JSON.parse(assessmentJSON);
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError.message);
    console.error('Problematic JSON (first 500 chars):', assessmentJSON.substring(0, 500));
    throw new Error('Failed to parse assessment JSON: ' + parseError.message);
  }

  // Validate and fix questions
  if (assessment.questions) {
    assessment.questions = assessment.questions.map((q: any, idx: number) => {
      if (!q.correct_answer && q.options?.length > 0) {
        q.correct_answer = q.options[0];
      }
      if (!q.estimated_time) {
        q.estimated_time = q.difficulty === 'easy' ? 50 : q.difficulty === 'medium' ? 80 : 110;
      }
      // Shuffle options
      if (q.type === 'mcq' && q.options?.length > 0) {
        const correctAnswer = q.correct_answer;
        q.options = [...q.options].sort(() => Math.random() - 0.5);
        q.correct_answer = correctAnswer;
      }
      return { ...q, id: idx + 1 };
    });
  }

  // Cache to database (don't fail if this doesn't work)
  try {
    const { error: insertError } = await supabase.from('generated_external_assessment').insert({
      certificate_name: courseName,
      assessment_level: level,
      total_questions: questionCount,
      questions: assessment.questions,
      generated_by: 'claude-ai'
    });
    
    if (insertError) {
      console.warn('⚠️ Could not cache assessment to database:', insertError.message, insertError.code);
    } else {
      console.log('✅ Assessment cached to database');
    }
  } catch (cacheError: any) {
    console.warn('⚠️ Database insert exception:', cacheError.message);
  }

  console.log('✅ Assessment generated successfully');
  return assessment;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/health' || path === '/api/health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Generate assessment
    if ((path === '/generate' || path === '/api/assessment/generate') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { courseName, level = 'Intermediate', questionCount = 15 } = body;

        if (!courseName) {
          return jsonResponse({ error: 'Course name is required' }, 400);
        }

        const assessment = await generateAssessment(env, courseName, level, questionCount);
        return jsonResponse(assessment);
      } catch (error: any) {
        console.error('❌ Error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate assessment' }, 500);
      }
    }

    // Generate aptitude questions for career assessment
    if ((path === '/career-assessment/generate-aptitude' || path === '/api/career-assessment/generate-aptitude') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { streamId, questionsPerCategory = 10, studentId, attemptId, gradeLevel } = body;

        if (!streamId) {
          return jsonResponse({ error: 'Stream ID is required' }, 400);
        }

        console.log('📚 Aptitude request:', { streamId, gradeLevel, studentId });
        const result = await generateAptitudeQuestions(env, streamId, questionsPerCategory, studentId, attemptId, gradeLevel);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Aptitude generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate aptitude questions' }, 500);
      }
    }

    // Generate stream knowledge questions for career assessment
    if ((path === '/career-assessment/generate-knowledge' || path === '/api/career-assessment/generate-knowledge') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        console.log('📥 Knowledge request body:', JSON.stringify(body));
        const { streamId, streamName, topics, questionCount = 20, studentId, attemptId, gradeLevel } = body;

        if (!streamId || !streamName || !topics) {
          console.error('❌ Missing required fields:', { streamId, streamName, topics: !!topics });
          return jsonResponse({ error: 'Stream ID, name, and topics are required', received: { streamId, streamName, hasTopics: !!topics } }, 400);
        }

        console.log('🎯 Generating knowledge questions for:', streamName, 'topics:', topics.length, 'grade:', gradeLevel);
        const result = await generateKnowledgeQuestions(env, streamId, streamName, topics, questionCount, studentId, attemptId, gradeLevel);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Knowledge generation error:', error.message, error.stack);
        return jsonResponse({ error: error.message || 'Failed to generate knowledge questions', stack: error.stack?.substring(0, 500) }, 500);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
