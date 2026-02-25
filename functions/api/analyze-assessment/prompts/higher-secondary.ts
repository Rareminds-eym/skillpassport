/**
 * Higher Secondary (Grades 11-12) Assessment Prompt Builder
 * 
 * Students in grades 11-12 have already chosen their stream (Science/Commerce/Arts)
 * and complete the comprehensive 6-section assessment.
 * 
 * This prompt requires evidence from ALL 6 sections for career cluster generation:
 * 1. RIASEC (Career Interests)
 * 2. Big Five (Personality)
 * 3. Work Values (Motivators)
 * 4. Employability Skills
 * 5. Aptitude (Multi-domain cognitive abilities)
 * 6. Knowledge (Stream-specific subject knowledge)
 * 7. Adaptive Aptitude (Intelligent adaptive test results)
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): {
  section: string;
  isHighAptitude: boolean;
} {
  const level = results.aptitudeLevel;
  const accuracy = results.overallAccuracy;
  const isHighAptitude = level >= 4 || accuracy >= 75;
  
  const levelLabels: Record<number, string> = {
    1: 'Emerging',
    2: 'Developing', 
    3: 'Capable',
    4: 'Strong',
    5: 'Exceptional'
  };
  
  const subtags = results.accuracyBySubtag || {};
  const sortedSubtags = Object.entries(subtags)
    .map(([name, data]: [string, any]) => ({
      name: name.replace(/_/g, ' '),
      accuracy: typeof data === 'number' ? data : data?.accuracy || 0
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  
  const topStrengths = sortedSubtags
    .filter(s => s.accuracy >= 70)
    .slice(0, 3)
    .map(s => `${s.name} (${Math.round(s.accuracy)}%)`);
  
  const weakAreas = sortedSubtags
    .filter(s => s.accuracy < 50)
    .slice(0, 2)
    .map(s => `${s.name} (${Math.round(s.accuracy)}%)`);

  const section = `
## ═══════════════════════════════════════════════════════════════════════════
## SECTION 7: ADAPTIVE APTITUDE TEST RESULTS
## ═══════════════════════════════════════════════════════════════════════════

- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- No standout strengths identified'}

**AREAS FOR GROWTH**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant weak areas'}

**IMPORTANT**: Use these adaptive test results as ADDITIONAL evidence when generating career clusters. The adaptive test provides a more accurate measure of cognitive abilities than self-assessment.`;

  return { section, isHighAptitude };
}

export function buildHigherSecondaryPrompt(assessmentData: AssessmentData, answersHash: number, jobMarketSection?: string): string {
  // Extract student context for stream-specific guidance
  const selectedStream = assessmentData.stream;
  
  // Pre-process adaptive results for efficiency
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';
  
  // Determine stream category and sub-stream from stream ID
  const getStreamCategory = (stream: string): { category: string | null; subStream: string | null } => {
    const streamLower = stream.toLowerCase();
    
    // Science sub-streams
    if (streamLower.includes('pcmb')) return { category: 'science', subStream: 'pcmb' };
    if (streamLower.includes('pcms')) return { category: 'science', subStream: 'pcms' };
    if (streamLower.includes('pcm')) return { category: 'science', subStream: 'pcm' };
    if (streamLower.includes('pcb')) return { category: 'science', subStream: 'pcb' };
    if (streamLower.includes('science')) return { category: 'science', subStream: 'general' };
    
    // Commerce sub-streams
    if (streamLower.includes('commerce') && streamLower.includes('math')) return { category: 'commerce', subStream: 'with_maths' };
    if (streamLower.includes('commerce')) return { category: 'commerce', subStream: 'without_maths' };
    
    // Arts sub-streams
    if (streamLower.includes('psychology')) return { category: 'arts', subStream: 'psychology' };
    if (streamLower.includes('economics')) return { category: 'arts', subStream: 'economics' };
    if (streamLower.includes('arts') || streamLower.includes('humanities')) return { category: 'arts', subStream: 'general' };
    
    return { category: null, subStream: null };
  };
  
  const { category: streamCategory, subStream } = getStreamCategory(selectedStream);
  
  // CRITICAL: Detect psychology stream and enforce strict requirements
  const isPsychologyStream = selectedStream.toLowerCase().includes('psychology');
  const psychologyWarning = isPsychologyStream ? `

## 🚨 CRITICAL ALERT: PSYCHOLOGY STREAM DETECTED 🚨

**THIS STUDENT SELECTED: ${selectedStream}**

## CORE REASONING RULES FOR PSYCHOLOGY STREAM

**RULE 1 — STREAM LOCK**
This student chose Psychology. Every career cluster you generate MUST be psychology-adjacent.

**FORBIDDEN CAREERS:**
❌ Creative Industries, Media Production, Performing Arts
❌ Generic Arts or Design careers
❌ Business or Commerce (unless framed as Organizational/HR Psychology)
❌ Engineering or Technology (unless framed as Neuropsychology or UX Research)

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Psychology | Therapy | Counseling | Psychotherapy | Behavioral | Mental Health | Psychological | Psychosocial | Clinical | Forensic | Rehabilitation]

**RULE 2 — RIASEC INTERPRETATION IN PSYCHOLOGY CONTEXT**
Interpret each RIASEC type through a psychology lens:
- **R (Realistic)** → Hands-on therapy, rehabilitation, physical/sports psychology, biofeedback, occupational therapy
- **I (Investigative)** → Research, assessment, neuropsychology, cognitive science, psychometrics, behavioral analysis
- **A (Artistic)** → Expressive therapies (art/music/drama therapy), narrative therapy, creative counseling approaches
- **S (Social)** → Clinical counseling, community mental health, social work, school psychology, crisis intervention
- **E (Enterprising)** → Organizational psychology, career counseling, HR psychology, leadership coaching, employee wellbeing
- **C (Conventional)** → Psychometrics, psychological testing, case management, educational psychology, behavioral data analysis

**RULE 3 — TRACK GENERATION LOGIC**
Use the student's RIASEC ranking to determine tracks:

**TRACK 1 (90%+ match):**
- Combine their TOP 2 RIASEC types through the psychology lens above
- Ask: "What psychology specialization sits at the intersection of these two types?"
- That intersection IS the Track 1 title
- Generate 3 specific psychology roles at this intersection
- **TITLE FORMAT:** Must be a DOMAIN/FIELD, not a job title
  - ✅ "Clinical Assessment & Evidence-Based Therapy"
  - ❌ "Clinical Psychologist" (this is a role, not a domain)

**TRACK 2 (70-80% match):**
- Combine their 2nd + 3rd RIASEC types through the psychology lens above
- Ask: "What applied psychology or social work domain fits these two types?"
- That domain IS the Track 2 title
- Generate 3 specific applied psychology/social work roles
- **TITLE FORMAT:** Must be a DOMAIN/FIELD, not a job title
  - ✅ "Organizational Psychology & HR Development"
  - ❌ "HR Psychologist" (this is a role, not a domain)

**TRACK 3 (55-65% match):**
- Use their 3rd RIASEC type alone or combine with weakest type
- Ask: "What emerging or exploratory psychology-adjacent field aligns with this?"
- Consider: Forensic, Consumer, Sports, Health, Environmental, UX Research, Positive Psychology
- Generate 3 specific exploratory psychology roles
- **TITLE FORMAT:** Must be a DOMAIN/FIELD, not a job title
  - ✅ "Applied Psychology & Consumer Behavior Research"
  - ❌ "Consumer Psychologist" (this is a role, not a domain)

**RULE 4 — ROLE GENERATION REQUIREMENTS**
For each track, generate exactly 3 specific job roles that are:
- Real, named professions (not vague like "Psychology Professional")
- Directly hireable after a psychology degree or postgraduate study
- Matched to the intersection logic used in Rule 3
- Never repeated across tracks
- Include both entry-level and mid-career progression

**CRITICAL:** Each track MUST have EXACTLY 3 roles. Not 2, not 4. Exactly 3.
- Track 1: 3 roles
- Track 2: 3 roles
- Track 3: 3 roles
Total: 9 unique roles across all tracks

**RULE 5 — SELF-VALIDATION CHECKLIST**
Before finalizing output, verify:
✓ Does Track 1 title contain an anchor word from Rule 1?
✓ Is Track 1 title a DOMAIN/FIELD (2-4 words with "&"), not a job title?
✓ Does Track 1 have EXACTLY 3 roles?
✓ Are all 3 Track 1 roles psychology careers?
✓ Does Track 2 stay within social work/applied/organizational psychology?
✓ Is Track 2 title a DOMAIN/FIELD, not a job title?
✓ Does Track 2 have EXACTLY 3 roles?
✓ Does Track 3 stay within an applied psychology domain?
✓ Is Track 3 title a DOMAIN/FIELD, not a job title?
✓ Does Track 3 have EXACTLY 3 roles?
✓ Are Creative Arts/Media/Performing Arts absent from ALL tracks?
✓ Are all 9 roles unique (no duplicates)?

**TITLE VALIDATION:**
- If title is 1-2 words → WRONG (too short, likely a job title)
- If title sounds like a single job → WRONG (e.g., "Clinical Psychologist", "Therapist")
- If title doesn't use "&" to connect domains → Consider revising
- If title is generic (e.g., "Psychology Careers") → WRONG (not specific enough)

**If any check fails → revise that track before outputting.**

**EXAMPLE REASONING (learn the pattern, do not copy):**
If student scores: S=85, I=78, A=60
- Type 1 = S, Type 2 = I, Type 3 = A
- Track 1: S(counseling) + I(research) = "Clinical Assessment & Evidence-Based Therapy"
  - Roles: Clinical Psychologist, Psychological Assessment Specialist, Clinical Research Psychologist
- Track 2: I(research) + A(expressive) = "Qualitative Research & Narrative Psychology"
  - Roles: Qualitative Research Psychologist, Narrative Therapist, Health Psychology Researcher
- Track 3: A(expressive therapies) = "Expressive & Arts-Based Therapy"
  - Roles: Art Therapist, Drama Therapist, Music Therapy Practitioner

Notice: ALL tracks stayed in psychology. The A type was interpreted as expressive THERAPY — not creative arts.

` : '';
  
  // Build comprehensive sub-stream-specific instructions
  const streamSpecificInstructions = streamCategory ? `

## ⚠️ CRITICAL: STUDENT'S SELECTED STREAM & SUB-STREAM

**Stream Category**: ${streamCategory.toUpperCase()}
**Sub-Stream**: ${subStream?.toUpperCase() || 'GENERAL'}
**Full Stream ID**: ${selectedStream}

${streamCategory === 'science' && subStream === 'pcmb' ? `
### 🧬 SCIENCE PCMB (Physics, Chemistry, Maths, Biology) - MEDICAL/BIOTECH DOMAIN

**CRITICAL**: PCMB = Biology focus = MEDICAL careers ONLY. NO Engineering/CS recommendations!

## CORE REASONING RULES FOR PCMB STREAM

**RULE 1 — STREAM LOCK**
This student chose PCMB. Every career cluster MUST be medical/biotech/life sciences.

**FORBIDDEN CAREERS:**
❌ Engineering (Mechanical, Civil, Electrical, Software)
❌ Computer Science, IT, Software Development
❌ Architecture, Design (unless Biomedical Design)
❌ Commerce, Business, Management

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Medical | Clinical | Healthcare | Biotech | Pharmaceutical | Life Sciences | Biological | Nursing | Therapy | Health | Patient | Diagnostic | Laboratory]

**RULE 2 — RIASEC INTERPRETATION IN PCMB CONTEXT**
- **R (Realistic)** → Lab work, medical procedures, diagnostic technology, hands-on patient care, surgical assistance
- **I (Investigative)** → Medical research, pharmaceutical research, biotechnology, genetic research, clinical trials
- **A (Artistic)** → Medical illustration, biomedical design, health communication, patient education materials
- **S (Social)** → Patient care, clinical medicine, nursing, counseling, public health, community health
- **E (Enterprising)** → Healthcare management, hospital administration, pharmaceutical sales, health policy
- **C (Conventional)** → Medical records, pharmacy operations, lab management, healthcare systems

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Medical specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within medical domain
  - Must contain anchor words: Medical, Clinical, Healthcare, Biotech, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Allied health or biotech domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within allied health
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging medical/health field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within healthcare
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real medical/healthcare professions
- Achievable with MBBS/BDS/B.Sc/B.Pharm/BPT degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ NEET, AIIMS, JIPMER, Pharmacy entrance, BHU PMT, AFMC

**ALLOWED COLLEGE MAJORS:**
✅ MBBS, BDS, BAMS, BHMS, BVSc, B.Sc Biotechnology/Microbiology/Genetics, B.Pharm, BPT, B.Sc Nursing

**STRICTLY FORBIDDEN:**
❌ NO Engineering, Software, CS, JEE, B.Tech programs

` : streamCategory === 'science' && subStream === 'pcms' ? `
### 💻 SCIENCE PCMS (Physics, Chemistry, Maths, Computer Science) - ENGINEERING/IT/AI DOMAIN

**CRITICAL**: PCMS = Computer Science focus = ENGINEERING/IT careers. NO Medical recommendations!

## CORE REASONING RULES FOR PCMS STREAM

**RULE 1 — STREAM LOCK**
This student chose PCMS. Every career cluster MUST be technology/engineering/IT.

**FORBIDDEN CAREERS:**
❌ Medical, Healthcare, Biotechnology, Life Sciences
❌ Pure Arts, Creative Industries (unless Tech-focused like UX)
❌ Pure Commerce, Business (unless Tech Product/Analytics)

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Software | Engineering | Technology | Tech | AI | ML | Data | Systems | Computing | Development | Programming | Digital | Cyber | Cloud]

**RULE 2 — RIASEC INTERPRETATION IN PCMS CONTEXT**
- **R (Realistic)** → Systems engineering, infrastructure, DevOps, hardware integration, network engineering
- **I (Investigative)** → Software engineering, algorithms, AI/ML research, data science, computer science research
- **A (Artistic)** → UX engineering, creative coding, game development, interactive media, design systems
- **S (Social)** → EdTech, healthcare technology, social impact tech, accessibility engineering
- **E (Enterprising)** → Tech entrepreneurship, product management, tech consulting, startup leadership
- **C (Conventional)** → Database engineering, systems administration, IT operations, quality assurance

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Tech specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within technology domain
  - Must contain anchor words: Software, Engineering, Technology, AI, Data, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Applied tech or product domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within tech applications
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging tech field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within technology
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real tech/engineering professions
- Achievable with B.Tech CS/IT/AI or BCA degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ JEE Main/Advanced, BITSAT, VITEEE, SRMJEEE, CUET (Tech programs)

**ALLOWED COLLEGE MAJORS:**
✅ B.Tech CS/IT/AI/ML/Data Science, B.Tech Software Engineering/Cyber Security, BCA, B.Sc CS

**STRICTLY FORBIDDEN:**
❌ NO Medical, Biology-based careers, NEET, MBBS, BDS, B.Pharm

` : streamCategory === 'science' && subStream === 'pcm' ? `
### ⚙️ SCIENCE PCM (Physics, Chemistry, Maths) - CORE ENGINEERING/ARCHITECTURE DOMAIN

**CRITICAL**: PCM = No Biology, No CS = CORE ENGINEERING only. NO Medical, NO Software Engineering!

## CORE REASONING RULES FOR PCM STREAM

**RULE 1 — STREAM LOCK**
This student chose PCM. Every career cluster MUST be core engineering/architecture/defense.

**FORBIDDEN CAREERS:**
❌ Medical, Healthcare, Biotechnology (requires Biology)
❌ Software Engineering, Computer Science (requires CS depth)
❌ Pure Arts, Creative Industries
❌ Pure Commerce, Business

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Engineering | Mechanical | Civil | Electrical | Aerospace | Architecture | Design | Defense | Aviation | Manufacturing | Construction | Industrial]

**RULE 2 — RIASEC INTERPRETATION IN PCM CONTEXT**
- **R (Realistic)** → Hands-on engineering, construction, manufacturing, technical operations, field work
- **I (Investigative)** → Engineering research, R&D, innovation, aerospace research, materials science
- **A (Artistic)** → Architecture, product design, industrial design, urban planning, sustainable design
- **E (Enterprising)** → Engineering management, defense services, project leadership, manufacturing management
- **C (Conventional)** → Civil engineering, structural systems, construction management, quality engineering
- **S (Social)** → Limited in PCM; focus on team-based engineering, safety engineering

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Engineering specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within engineering domain
  - Must contain anchor words: Engineering, Mechanical, Civil, Architecture, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Applied engineering or architecture domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within applied engineering
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging engineering field or defense services
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within engineering/defense
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real engineering/architecture professions
- Achievable with B.Tech/B.Arch degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ JEE Main/Advanced, NATA/JEE Paper 2 (Architecture), NDA, BITSAT, VITEEE

**ALLOWED COLLEGE MAJORS:**
✅ B.Tech Mechanical/Civil/Electrical/Aerospace/Automobile, B.Arch, B.Tech Chemical/Metallurgy/Production

**STRICTLY FORBIDDEN:**
❌ NO Medical, Biotechnology (requires Biology), NO Software Engineering/CS (requires CS background), NO NEET

` : streamCategory === 'science' && subStream === 'pcb' ? `
### 🏥 SCIENCE PCB (Physics, Chemistry, Biology) - MEDICAL/ALLIED HEALTH DOMAIN (NO MATHS)

**CRITICAL**: PCB = No Maths = NO JEE = NO Engineering. MEDICAL careers ONLY!

## CORE REASONING RULES FOR PCB STREAM

**RULE 1 — STREAM LOCK**
This student chose PCB. Every career cluster MUST be medical/nursing/allied health.

**FORBIDDEN CAREERS:**
❌ Engineering (ALL types - cannot appear for JEE without Maths)
❌ Computer Science, IT, Software
❌ Architecture (requires JEE)
❌ Biotechnology B.Tech (requires JEE)

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Medical | Clinical | Nursing | Healthcare | Therapy | Allied Health | Pharmaceutical | Patient Care | Diagnostic | Paramedical | Health | Rehabilitation]

**RULE 2 — RIASEC INTERPRETATION IN PCB CONTEXT**
- **R (Realistic)** → Lab technology, medical procedures, diagnostic equipment, hands-on patient care
- **I (Investigative)** → Medical research, diagnostics, pathology, clinical research (non-engineering)
- **A (Artistic)** → Therapeutic arts, rehabilitation, creative healthcare, patient education
- **S (Social)** → Patient care, nursing, counseling, therapy, community health, public health
- **E (Enterprising)** → Healthcare management (after medical degree), hospital administration
- **C (Conventional)** → Pharmacy operations, medical records, healthcare systems, clinical coordination

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Medical/nursing specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within medical/nursing domain
  - Must contain anchor words: Medical, Clinical, Nursing, Healthcare, Therapy, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Allied health or paramedical domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within allied health
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging healthcare field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within healthcare
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real medical/healthcare professions
- Achievable with MBBS/BDS/B.Sc Nursing/BPT/B.Pharm degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ NEET (MANDATORY), AIIMS, JIPMER, Nursing entrance, Pharmacy entrance, Paramedical entrance

**ALLOWED COLLEGE MAJORS:**
✅ MBBS, BDS, BAMS/BHMS/BUMS, B.Sc Nursing/GNM, BPT/BOT, B.Sc Medical Lab Tech/Radiology/Optometry, B.Pharm

**STRICTLY FORBIDDEN:**
❌ NO Engineering (CANNOT appear for JEE without Maths), NO B.Tech, NO CS/IT, NO Biotechnology B.Tech

` : streamCategory === 'commerce' && subStream === 'with_maths' ? `
### 📊 COMMERCE WITH MATHS - QUANTITATIVE FINANCE/CA/ANALYTICS DOMAIN

**CRITICAL**: Commerce + Maths = Quantitative careers. Emphasize CA, CFA, Actuarial, Analytics.

## CORE REASONING RULES FOR COMMERCE WITH MATHS STREAM

**RULE 1 — STREAM LOCK**
This student chose Commerce with Maths. Every career cluster MUST be quantitative finance/analytics.

**FORBIDDEN CAREERS:**
❌ Engineering, Medical, Technology (unless Business Analytics/FinTech)
❌ Pure Arts, Creative Industries
❌ Non-quantitative business roles (should be secondary)

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Finance | Financial | Accounting | CA | CFA | Actuarial | Investment | Banking | Analytics | Data | Quantitative | Economics | Statistics | Audit]

**RULE 2 — RIASEC INTERPRETATION IN COMMERCE WITH MATHS CONTEXT**
- **R (Realistic)** → Limited in commerce; focus on data systems, financial operations
- **I (Investigative)** → Financial analysis, research, actuarial science, economic research, data analysis
- **A (Artistic)** → Brand strategy with analytics, marketing analytics, creative business intelligence
- **S (Social)** → HR analytics, people analytics, financial planning & advisory
- **E (Enterprising)** → Investment banking, consulting, wealth management, financial entrepreneurship
- **C (Conventional)** → Accounting, audit, tax, systematic finance, compliance

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Quantitative finance specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within quantitative finance
  - Must contain anchor words: Finance, Financial, Accounting, Analytics, Investment, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Applied finance or analytics domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within applied finance
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging fintech or business analytics field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within finance/analytics
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real finance/analytics professions
- Achievable with B.Com/BBA/CA/CFA qualifications
- Matched to RIASEC intersection
- Never repeated across tracks

**APTITUDE GATING - CRITICAL:**
⚠️ For CA/CFA/Actuarial: Require Numerical Aptitude >= 55%
⚠️ If Numerical < 55%: Recommend Business Management instead, note skill building needed

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ CA Foundation/Intermediate, CFA Level 1, Actuarial exams (IAI/SOA), IPM (IIM Indore), CUET Commerce, BBA entrance

**ALLOWED COLLEGE MAJORS:**
✅ B.Com (Hons), BBA/BMS (quantitative focus), B.Sc Economics/Statistics, Integrated CA programs

` : streamCategory === 'commerce' && subStream === 'without_maths' ? `
### 💼 COMMERCE WITHOUT MATHS - BUSINESS MANAGEMENT/MARKETING/HR DOMAIN

**CRITICAL**: Commerce without Maths = Management focus. NO CA/CFA/Actuarial (require Maths).

## CORE REASONING RULES FOR COMMERCE WITHOUT MATHS STREAM

**RULE 1 — STREAM LOCK**
This student chose Commerce without Maths. Every career cluster MUST be management/marketing/HR.

**FORBIDDEN CAREERS:**
❌ CA, CFA, Actuarial Science (require Maths)
❌ Financial Analytics, Quantitative Finance
❌ Engineering, Medical, Technology
❌ B.Sc Statistics, Economics (Hons) - require Maths

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Management | Marketing | Business | HR | Human Resources | Brand | Operations | Retail | Hospitality | Event | Entrepreneurship | Sales | Communication]

**RULE 2 — RIASEC INTERPRETATION IN COMMERCE WITHOUT MATHS CONTEXT**
- **R (Realistic)** → Limited in commerce; focus on operations, logistics
- **I (Investigative)** → Business research, market analysis (non-quantitative), consumer insights
- **A (Artistic)** → Creative business, advertising, brand storytelling, content marketing
- **S (Social)** → HR, training, employee relations, customer service, organizational development
- **E (Enterprising)** → Business management, entrepreneurship, leadership, sales management
- **C (Conventional)** → Operations, retail management, supply chain, business administration

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Management/marketing specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within management/marketing
  - Must contain anchor words: Management, Marketing, Business, Brand, HR, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Applied business or HR domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within business/HR
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging business field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within business
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real business/management professions
- Achievable with BBA/BMS/B.Com degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ CUET Commerce (without Maths), BBA entrance (non-quantitative), IPM (if no Maths required), Hotel Management, Mass Communication

**ALLOWED COLLEGE MAJORS:**
✅ BBA/BMS/BBM, B.Com (General), BA Economics (if Maths not required), Hotel/Event Management, Mass Communication/Advertising

**STRICTLY FORBIDDEN:**
❌ NO CA (requires Maths), NO CFA (heavily quantitative), NO Actuarial Science, NO Financial Analytics, NO B.Sc Statistics/Economics (Hons)

` : streamCategory === 'arts' && subStream === 'psychology' ? `
### 🧠 ARTS WITH PSYCHOLOGY - PSYCHOLOGY/COUNSELING DOMAIN

**CRITICAL**: Psychology stream = Psychology careers ONLY as Track 1. NO generic creative arts!

**DYNAMIC CLUSTER GENERATION INSTRUCTIONS:**

When generating clusters for Psychology students, you MUST:
1. Analyze their top 2 RIASEC types
2. Map those RIASEC types to PSYCHOLOGY SPECIALIZATIONS (NOT generic examples)
3. Track 1 MUST be Clinical/Counseling Psychology - they chose this stream specifically for psychology

**RIASEC Type Meanings for Psychology:**
- **I (Investigative)** → Research psychology, cognitive science, clinical research
- **S (Social)** → Clinical counseling, therapy, patient care, social work
- **A (Artistic)** → Art therapy, expressive therapy, creative counseling
- **E (Enterprising)** → Organizational psychology, career counseling, HR psychology
- **R (Realistic)** → Occupational therapy, sports psychology, rehabilitation
- **C (Conventional)** → School psychology, educational psychology, structured counseling

**Generate unique cluster titles based on THEIR specific RIASEC combination.**

**TRACK REQUIREMENTS:**
- Track 1 (90%+): MUST be Clinical/Counseling/Therapy Psychology
- Track 2 (70-80%): Social Work, HR Psychology, Organizational Behavior
- Track 3 (55-65%): Applied Psychology (UX Research, Consumer Psychology, Sports Psychology)

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ CUET Psychology, BHU/JMI/DU Psychology entrance, Clinical Psychology M.Phil entrance (after BA)

**ALLOWED COLLEGE MAJORS:**
✅ BA Psychology (Hons), B.Sc Psychology, BA Applied Psychology, Integrated MA Psychology

**STRICTLY FORBIDDEN AS TRACK 1:**
❌ NO Creative Arts, Media, Journalism, Performing Arts as Track 1 (can only be Track 3 if RIASEC strongly indicates A+E)

` : streamCategory === 'arts' && subStream === 'economics' ? `
### 📈 ARTS WITH ECONOMICS - ECONOMICS/POLICY/CIVIL SERVICES DOMAIN

**CRITICAL**: Economics stream = Economics/Policy careers as primary focus.

## CORE REASONING RULES FOR ECONOMICS STREAM

**RULE 1 — STREAM LOCK**
This student chose Economics. Every career cluster MUST be economics/policy/civil services.

**FORBIDDEN CAREERS:**
❌ Pure Creative Arts, Media (unless Economic Journalism)
❌ Engineering, Medical, Technology
❌ Pure Commerce/Business (unless Business Economics)
❌ Psychology-specific careers

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Economics | Economic | Policy | Civil Services | Public Administration | Government | Research | Development | Journalism | Analysis | Statistics]

**RULE 2 — RIASEC INTERPRETATION IN ECONOMICS CONTEXT**
- **R (Realistic)** → Limited in economics; focus on applied fieldwork, surveys
- **I (Investigative)** → Economic research, policy analysis, data analysis, econometrics, think tanks
- **A (Artistic)** → Economic journalism, policy communication, content strategy, media analysis
- **S (Social)** → Public administration, civil services, government policy, development economics, NGO work
- **E (Enterprising)** → Public administration leadership, civil services, policy advocacy, consulting
- **C (Conventional)** → Economic data analysis, statistical research, systematic policy work

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Economics/policy specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within economics/policy
  - Must contain anchor words: Economics, Economic, Policy, Research, Administration, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Applied economics or public service domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within applied economics
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging economics field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within economics
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real economics/policy professions
- Achievable with BA Economics/Public Policy degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ CUET Economics, DU/BHU/JNU Economics entrance, UPSC (Civil Services after graduation), State PSC exams

**ALLOWED COLLEGE MAJORS:**
✅ BA Economics (Hons), BA Political Science with Economics, BA Public Policy, Integrated MA Economics

` : streamCategory === 'arts' && subStream === 'general' ? `
### 🎨 ARTS/HUMANITIES GENERAL - LANGUAGE/HISTORY/LAW/EDUCATION DOMAIN

**CRITICAL**: General Arts = Language, Literature, History, Law, Education focus.

## CORE REASONING RULES FOR ARTS GENERAL STREAM

**RULE 1 — STREAM LOCK**
This student chose Arts General. Every career cluster MUST be law/education/journalism/creative arts.

**FORBIDDEN CAREERS:**
❌ Psychology-specific careers (unless RIASEC strongly indicates)
❌ Economics-specific careers (unless student has economics subject)
❌ Engineering, Medical, Commerce
❌ Technology (unless Media Tech/Digital Journalism)

**VALIDATION:** If any cluster title does not contain at least one anchor word from this list, it is WRONG:
[Law | Legal | Education | Teaching | Journalism | Media | Writing | Literature | Creative | Arts | Social Work | Communication | History | Language]

**RULE 2 — RIASEC INTERPRETATION IN ARTS GENERAL CONTEXT**
- **R (Realistic)** → Limited in arts; focus on applied/practical work, fieldwork
- **I (Investigative)** → Research, academic writing, legal research, historical analysis, documentation
- **A (Artistic)** → Creative writing, journalism, media, content creation, design, performing arts
- **S (Social)** → Teaching, education, social work, counseling, community development
- **E (Enterprising)** → Journalism, advertising, PR, media management, publishing
- **C (Conventional)** → Limited in arts; focus on structured roles like education administration, archival work

**RULE 3 — TRACK GENERATION LOGIC**
- **TRACK 1 (90%+):** Combine TOP 2 RIASEC types → Arts/humanities specialization at their intersection
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within arts/humanities
  - Must contain anchor words: Law, Education, Journalism, Media, Creative, etc.
- **TRACK 2 (70-80%):** Combine 2nd + 3rd RIASEC types → Applied arts or social domain
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on their specific RIASEC combination within applied arts
  - Must be different from Track 1
- **TRACK 3 (55-65%):** Use 3rd RIASEC type → Emerging arts/humanities field
  - **TITLE FORMAT:** Must be a DOMAIN/FIELD (2-4 words with "&"), not a job title
  - Generate based on exploratory interests within arts/humanities
  - Must be different from Tracks 1 and 2

**RULE 4 — ROLE GENERATION**
Generate 3 entry-level + 3 mid-career roles per track that are:
- Real arts/humanities professions
- Achievable with BA/LLB/BFA/B.Ed degrees
- Matched to RIASEC intersection
- Never repeated across tracks

**ALLOWED ENTRANCE EXAMS ONLY:**
✅ CLAT (Law), CUET (Central Universities), DU/JNU/BHU Arts entrance, Mass Communication entrance, B.Ed entrance (after graduation)

**ALLOWED COLLEGE MAJORS:**
✅ BA English/History/Political Science/Sociology, LLB/BA LLB (5-year), BA Journalism/Mass Communication, BFA (Fine Arts), B.Ed

**STRICTLY FORBIDDEN:**
❌ NO Psychology-specific careers (unless RIASEC strongly indicates), NO Economics-specific careers (unless student has economics subject), NO Engineering/Medical/Commerce careers

` : ''}

## ⚠️ CRITICAL: RIASEC × STREAM CONSTRAINT

**RIASEC determines ROLE TYPE within the stream's allowed career pool, NOT the career domain itself.**


**RULE**: RIASEC can ONLY choose from careers that the student's subjects allow them to pursue.

` : '';

  return `You are an expert career counselor for higher secondary students (grades 11-12). These students have already chosen their academic stream and are preparing for college entrance exams and career decisions.
${psychologyWarning}
${streamSpecificInstructions}

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## STUDENT CONTEXT
- **Grade Level**: Higher Secondary (11th or 12th grade)
- **Stream**: ${assessmentData.stream}
- **Assessment Type**: Comprehensive 6-section career assessment

## ⚠️ ABSOLUTE REQUIREMENT: STREAM ALIGNMENT

**THE STUDENT SELECTED ${assessmentData.stream?.toUpperCase()} STREAM.**

🚫 **STRICTLY FORBIDDEN:**
- DO NOT recommend Commerce programs (BBA, B.Com, etc.) to Science students
- DO NOT recommend Science programs (B.Tech, MBBS, etc.) to Commerce students  
- DO NOT recommend Arts programs to Science/Commerce students
- ALL career clusters and program recommendations MUST align with ${assessmentData.stream}

✅ **YOU MUST:**
- Recommend ONLY careers and programs that match ${assessmentData.stream}
- If stream is science_pcmb/science_pcms/science_pcm/science_pcb → Recommend ONLY Science careers
- If stream is commerce → Recommend ONLY Commerce careers
- If stream is arts/humanities → Recommend ONLY Arts careers

## ⚠️ CRITICAL REQUIREMENT: USE ALL 6 ASSESSMENT SECTIONS

This student completed a comprehensive assessment with 6 sections. You MUST use data from ALL 6 sections when generating career clusters:

1. **RIASEC** (Career Interests) - Primary factor for career family identification
2. **Aptitude** (Cognitive Abilities) - Validates cognitive fit for careers
3. **Big Five** (Personality) - Determines work style and personality fit
4. **Work Values** (Motivators) - Ensures career aligns with what drives them
5. **Employability** (Job Readiness) - Assesses current skill level and readiness
6. **Knowledge** (Stream Expertise) - Validates academic preparation in their chosen stream
7. **Adaptive Aptitude** (Intelligent Test) - Provides accurate cognitive ability measurement

**Each career cluster MUST include evidence from ALL 7 sections in the evidence field.**

## RIASEC Career Interest Responses (1-5 scale):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1-2: 0 points
- Response 3: 1 point
- Response 4: 2 points
- Response 5: 3 points
- Maximum score per type = 24 (8 questions × 3 points max)

⚠️ CRITICAL RIASEC topThree CALCULATION:
1. Calculate the total score for each of the 6 RIASEC types (R, I, A, S, E, C)
2. Sort ALL 6 types by their scores in DESCENDING order (highest first)
3. The "topThree" array MUST contain the 3 types with the HIGHEST scores
4. Calculate percentage for each type: (score / 20) × 100
5. Identify which types have scores >= 60% (strong interests)
6. DO NOT guess or assume - calculate from the actual responses above

## MULTI-APTITUDE BATTERY RESULTS:
Pre-calculated Scores:
- Verbal: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8}
- Numerical: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8}
- Abstract: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8}
- Spatial: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6}
- Clerical: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20}

## Big Five Personality Responses:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**BIG FIVE SCORING INSTRUCTIONS** (CRITICAL - READ CAREFULLY):

Each BigFive dimension has 6 questions, each rated 1-5.

**YOU MUST CALCULATE THE AVERAGE (MEAN) SCORE FOR EACH DIMENSION:**

1. For each dimension (O, C, E, A, N), identify the 6 questions that belong to it
2. Sum the 6 response values
3. **DIVIDE by 6** to get the average
4. The final score for each dimension MUST be between 1.0 and 5.0

**Example Calculation**:
- Openness questions: [5, 4, 5, 4, 5, 4]
- Sum: 5 + 4 + 5 + 4 + 5 + 4 = 27
- **Average: 27 / 6 = 4.5** ← This is the score to report

**Dimensions**:
- **Openness (O)**: Curiosity, imagination, creativity, willingness to try new things
- **Conscientiousness (C)**: Organization, discipline, reliability, goal-orientation, planning
- **Extraversion (E)**: Sociability, energy, assertiveness, enthusiasm, outgoing nature
- **Agreeableness (A)**: Cooperation, empathy, kindness, trust, helpfulness
- **Neuroticism (N)**: Emotional stability, stress management, anxiety levels (lower is better)

**VALIDATION**: After calculating, verify each score is between 1.0 and 5.0. If any score is > 5.0, you made an error - you summed instead of averaged!

## Work Values & Motivators Responses:
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

**WORK VALUES SCORING INSTRUCTIONS** (CRITICAL - READ CAREFULLY):

Each Work Value dimension has 3 questions, each rated 1-5.

**YOU MUST CALCULATE THE AVERAGE (MEAN) SCORE FOR EACH DIMENSION:**

1. For each dimension, identify the 3 questions that belong to it
2. Sum the 3 response values
3. **DIVIDE by 3** to get the average
4. The final score for each dimension MUST be between 1.0 and 5.0

**Example Calculation**:
- Impact questions: [5, 4, 5]
- Sum: 5 + 4 + 5 = 14
- **Average: 14 / 3 = 4.67** ← This is the score to report

**Dimensions**:
- **Impact**: Making a difference, helping others, social contribution
- **Status**: Recognition, prestige, respect, visibility, influence
- **Autonomy**: Independence, freedom, self-direction, flexibility
- **Security**: Stability, job security, predictability, safety
- **Financial**: Salary, benefits, financial rewards, wealth
- **Lifestyle**: Work-life balance, location, flexibility, comfort
- **Creativity**: Innovation, originality, artistic expression, new ideas
- **Leadership**: Managing others, authority, decision-making, influence

**VALIDATION**: After calculating, verify each score is between 1.0 and 5.0. If any score is > 5.0, you made an error - you summed instead of averaged!

## Employability Skills Responses:
${JSON.stringify(assessmentData.employabilityAnswers, null, 2)}

## Stream Knowledge Assessment:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}
Total Questions: ${assessmentData.totalKnowledgeQuestions || 20}

${adaptiveSection}

## CAREER CLUSTER GENERATION REQUIREMENTS

For higher secondary students, career clusters MUST:

1. **Align with their chosen stream** (${assessmentData.stream})
2. **Align with their sub-stream** (${subStream || 'general'})
3. **Show evidence from ALL 7 sections** (RIASEC, Aptitude, Big Five, Work Values, Employability, Knowledge, Adaptive Aptitude)
4. **Be specific and actionable** for college major selection
5. **Include entrance exam guidance** (JEE, NEET, CLAT, etc.)
6. **Reflect their current academic preparation** (knowledge scores)
7. **Gate careers by aptitude thresholds** (e.g., CA requires Numerical >= 55%)
8. **Integrate work values into role variants** (Autonomy → Freelance, Leadership → Management, etc.)

### ⚠️ CRITICAL: DYNAMIC MATCH SCORE CALCULATION

**Match scores MUST be calculated based on the student's ACTUAL assessment data:**

1. **Calculate RIASEC alignment percentage** for each career cluster:
   - Identify which RIASEC types (R, I, A, S, E, C) align with the career
   - Use the student's actual RIASEC percentages from their responses
   - Average the relevant RIASEC percentages

2. **Apply the formula for each cluster:**
   - **Cluster 1 (High Fit)**: Base 75 + (avg top 2 RIASEC % × 0.20) = 75-95
   - **Cluster 2 (Medium Fit)**: Base 60 + (avg secondary RIASEC % × 0.18) = 60-78
   - **Cluster 3 (Explore)**: Base 45 + (exploratory RIASEC % × 0.17) = 45-62

3. **Adjust based on aptitude and personality:**
   - High aptitude alignment: +2 to +4 points
   - Low aptitude alignment: -2 to -3 points
   - Strong personality fit: +1 to +2 points

4. **Ensure uniqueness:**
   - Each student should get different scores based on their profile
   - Avoid round numbers (80, 85, 90, 95)
   - Use specific values (78, 82, 87, 91, 94)

**Example Calculation:**
- Student has I=85%, R=75%, A=60%, S=45%, E=40%, C=35%
- Career Cluster 1 (Technology): Needs I+R
  - RIASEC match: (85 + 75) / 2 = 80%
  - Base score: 75 + (80 × 0.20) = 75 + 16 = 91
  - High numerical aptitude (85%): +3
  - Final: 94% ✅
- Career Cluster 2 (Creative): Needs A+I
  - RIASEC match: (60 + 85) / 2 = 72.5%
  - Base score: 60 + (72.5 × 0.18) = 60 + 13.05 = 73
  - Medium aptitude: +0
  - Final: 73% ✅

### ⚠️ CRITICAL: KNOWLEDGE SCORE GATING

**Career difficulty tier MUST match the student's knowledge score:**

**Knowledge Score Calculation:**
- Total correct: ${assessmentData.knowledgeAnswers ? Object.values(assessmentData.knowledgeAnswers).filter(a => a.isCorrect === true).length : 0}
- Total questions: ${assessmentData.totalKnowledgeQuestions || 20}
- Percentage: ${assessmentData.knowledgeAnswers ? Math.round((Object.values(assessmentData.knowledgeAnswers).filter(a => a.isCorrect === true).length / (assessmentData.totalKnowledgeQuestions || 20)) * 100) : 0}%

**GATING RULES:**

1. **Knowledge < 40% (Weak Subject Mastery):**
   - Recommend ACCESSIBLE/REALISTIC career variants
   - Add note: "Focus on building strong foundation in ${assessmentData.stream} subjects"
   - Avoid top-tier competitive options (IIT, AIIMS, NLU)

2. **Knowledge 40-70% (Moderate Mastery):**
   - Standard recommendations with preparation roadmap
   - Include both accessible and competitive options
   - Add note: "With focused preparation, you can target competitive entrance exams"

3. **Knowledge > 70% (Strong Mastery):**
   - Can include top-tier/competitive options
   - Add note: "Your strong subject knowledge positions you well for competitive exams"

### ⚠️ CRITICAL: APTITUDE GATING FOR SPECIFIC CAREERS

**Certain careers require minimum aptitude thresholds:**

**Current Aptitude Scores:**
- Verbal: ${assessmentData.aptitudeScores?.verbal?.correct ? Math.round((assessmentData.aptitudeScores.verbal.correct / assessmentData.aptitudeScores.verbal.total) * 100) : 0}%
- Numerical: ${assessmentData.aptitudeScores?.numerical?.correct ? Math.round((assessmentData.aptitudeScores.numerical.correct / assessmentData.aptitudeScores.numerical.total) * 100) : 0}%
- Abstract: ${assessmentData.aptitudeScores?.abstract?.correct ? Math.round((assessmentData.aptitudeScores.abstract.correct / assessmentData.aptitudeScores.abstract.total) * 100) : 0}%

**GATING RULES:**

1. **CA/CFA/Actuarial Careers (Commerce):**
   - Require: Numerical Aptitude >= 55%
   - If below: Move to Cluster 3 (Explore) with note about skill building
   - Recommend: Business Management as Cluster 1 instead

2. **Software Engineering/Data Science (Science PCMS):**
   - Require: Abstract Reasoning >= 50% OR Numerical >= 50%
   - If below: Recommend IT Support, Web Development, or Tech Management instead

3. **Medical Research/Clinical Psychology:**
   - Require: Verbal >= 50% AND Abstract >= 50%
   - If below: Recommend Applied/Practical variants instead of Research

4. **Law/Legal Studies (Arts):**
   - Require: Verbal >= 60%
   - If below: Add note about developing reading comprehension and argumentation skills

### ⚠️ CRITICAL: WORK VALUES INTEGRATION

**Work values MUST modify the ROLE VARIANTS within each cluster:**

**Current Work Values (calculate from responses):**
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

**INTEGRATION RULES:**

1. **Autonomy > 4.0:**
   - Add: Freelance, Research, Consulting, Independent Contractor variants

2. **Leadership > 4.0:**
   - Add: Management track, Team Lead, Department Head variants

3. **Financial > 4.0:**
   - Add: High-earning specializations, Corporate roles, Investment focus
 
4. **Creativity > 4.0:**
   - Add: Innovation, Design, Creative variants within the stream

5. **Impact > 4.0:**
   - Add: Social impact, NGO, Public service, Healthcare variants

6. **Security > 4.0:**
   - Add: Government jobs, Stable organizations, Established companies



### Required Evidence Structure:

Each career cluster MUST include:

\`\`\`json
"evidence": {
  "interest": "<How RIASEC scores support this career path>",
  "aptitude": "<Which cognitive strengths (verbal/numerical/abstract/spatial) make them a good fit>",
  "personality": "<Big Five traits that align with success in this field>",
  "values": "<How their work values align with this career (e.g., helping others, creativity, financial security)>",
  "employability": "<Current skill level and readiness for this path>",
  "knowledge": "<How their stream knowledge (${assessmentData.stream}) prepares them for this career>",
  "adaptiveAptitude": "<How their adaptive test results (aptitude level, accuracy, cognitive strengths) validate this career choice>"
}
\`\`\`

${jobMarketSection || `
### ⚠️ CRITICAL: DYNAMIC CAREER CLUSTER GENERATION

**YOU MUST GENERATE CAREER CLUSTERS DYNAMICALLY BASED ON THE STUDENT'S ACTUAL DATA - NO TEMPLATES!**

**STEP-BY-STEP DYNAMIC GENERATION PROCESS:**

**STEP 1: ANALYZE STUDENT'S COMPLETE PROFILE**
- Calculate RIASEC scores and identify top 3 types with percentages
- Review aptitude scores (Verbal, Numerical, Abstract, Spatial, Clerical)
- Calculate Big Five personality averages
- Calculate Work Values averages and identify top 3
- Calculate knowledge score percentage
- Review adaptive aptitude results (level, accuracy, strengths)
- Identify sub-stream: ${subStream || 'general'}

**STEP 2: DETERMINE CAREER DOMAIN CONSTRAINTS**

Based on sub-stream ${subStream || 'general'}, identify the ALLOWED and FORBIDDEN career domains:

${subStream === 'pcmb' ? `**ALLOWED DOMAINS:** Medical, Biotechnology, Life Sciences, Allied Health, Pharmaceutical
**FORBIDDEN:** Engineering, Computer Science, IT, Software, Architecture, Commerce, Arts
**REASON:** PCMB = Biology focus, typically pursue medical/biotech careers`
: subStream === 'pcms' ? `**ALLOWED DOMAINS:** Software Engineering, Computer Science, AI/ML, Data Science, Technology, IT
**FORBIDDEN:** Medical, Biology-based, Healthcare (except Health Tech), Biotechnology
**REASON:** PCMS = Computer Science focus, no Biology background`
: subStream === 'pcm' ? `**ALLOWED DOMAINS:** Core Engineering (Mechanical/Civil/Electrical/Aerospace), Architecture, Defense, Aviation
**FORBIDDEN:** Medical, Biology-based, Software Engineering (limited CS depth), Biotechnology
**REASON:** PCM = No Biology, limited CS background`
: subStream === 'pcb' ? `**ALLOWED DOMAINS:** Medical, Nursing, Allied Health, Pharmacy, Paramedical, Public Health
**FORBIDDEN:** Engineering (ALL types), Computer Science, Architecture, JEE-based programs
**REASON:** PCB = No Maths, cannot appear for JEE, ineligible for engineering`
: subStream === 'with_maths' ? `**ALLOWED DOMAINS:** Finance, Accounting, Investment Banking, Business Analytics, Actuarial Science, Quantitative roles
**FORBIDDEN:** Non-quantitative roles should be secondary, Engineering, Medical
**REASON:** Commerce with Maths = Quantitative career focus`
: subStream === 'without_maths' ? `**ALLOWED DOMAINS:** Business Management, Marketing, HR, Operations, Hospitality, Event Management
**FORBIDDEN:** CA, CFA, Actuarial Science, Financial Analytics, Quantitative Finance
**REASON:** Commerce without Maths = Cannot pursue quantitative finance careers`
: subStream === 'psychology' ? `**ALLOWED DOMAINS:** Clinical Psychology, Counseling, Therapy, Social Work, HR Psychology, Applied Psychology
**FORBIDDEN AS TRACK 1:** Creative Arts, Media, Journalism, Performing Arts (can only be Track 3)
**REASON:** Psychology stream = Student specifically chose psychology careers`
: subStream === 'economics' ? `**ALLOWED DOMAINS:** Economics, Policy Analysis, Civil Services, Public Administration, Economic Research, Economic Journalism
**FORBIDDEN:** Pure creative arts, Engineering, Medical, Pure Commerce
**REASON:** Economics stream = Economics/Policy focus`
: `**ALLOWED DOMAINS:** Law, Education, Journalism, Media, Creative Arts, Literature, Social Work, Humanities
**FORBIDDEN:** Psychology-specific (unless RIASEC indicates), Economics-specific, Engineering, Medical, Commerce
**REASON:** General Arts = Humanities/Liberal Arts focus`}

**YOUR TASK:** Generate career clusters that ONLY use careers from the ALLOWED domains. Do NOT include any careers from FORBIDDEN domains.

**STEP 3: MAP RIASEC TO SPECIFIC ROLES WITHIN ALLOWED DOMAIN**
For each RIASEC combination, determine the ROLE TYPE within the allowed career domain:

- **Realistic (R)**: Hands-on, technical, practical work → Lab work, Engineering, Technical roles
- **Investigative (I)**: Research, analysis, problem-solving → Research, Analysis, Scientific roles
- **Artistic (A)**: Creative, expressive, innovative → Design, Creative, Innovation roles
- **Social (S)**: Helping, teaching, caring → Patient care, Teaching, Counseling roles
- **Enterprising (E)**: Leading, persuading, managing → Management, Entrepreneurship, Leadership roles
- **Conventional (C)**: Organizing, data, systems → Operations, Administration, Systems roles

**STEP 4: GENERATE CLUSTER 1 (HIGH FIT - 75-95% match)**
- Identify student's TOP 2 RIASEC types (highest percentages)
- Find careers within allowed domain that match BOTH types
- Create a UNIQUE cluster title that reflects their specific RIASEC combination
- Example logic: If PCMB + I+S → "Clinical Medicine & Research" NOT generic "Healthcare"
- Example logic: If PCMS + I+A → "Creative Technology & UX Engineering" NOT generic "Software"

**GENERATE ROLES DYNAMICALLY:**
- **Entry-level roles (3 roles):** Generate based on RIASEC + domain + knowledge level
  - If knowledge < 40%: Accessible entry roles (Assistant, Junior, Trainee positions)
  - If knowledge 40-70%: Standard entry roles (Associate, Analyst, Coordinator)
  - If knowledge > 70%: Competitive entry roles (Specialist, Engineer, Researcher)
  - Integrate work values: Autonomy > 4.0 → add "Freelance" or "Independent" variants
  
- **Mid-career roles (3 roles):** Generate based on RIASEC + domain + work values
  - If Leadership > 4.0: Add management/leadership roles (Manager, Lead, Director)
  - If Autonomy > 4.0: Add consulting/advisory roles (Consultant, Advisor, Specialist)
  - If Financial > 4.0: Add high-earning specializations (Senior, Principal, Chief)
  - If Creativity > 4.0: Add innovation roles (Innovation Lead, Design Lead, R&D Head)

**DO NOT use generic role lists. Generate roles specific to:**
1. Their RIASEC combination (e.g., I+S in PCMB = Clinical + Research roles, not generic Doctor)
2. Their sub-stream constraints (only from allowed domains)
3. Their knowledge level (accessible vs competitive)
4. Their work values (freelance, management, high-earning, creative variants)
5. Their personality (Big Five traits influence role style)

- Calculate match score: 75 + (average of top 2 RIASEC % × 0.20) + aptitude adjustment
- Apply knowledge gating: If knowledge < 40%, recommend accessible variants (B.Sc not IIT)
- Apply aptitude gating: If CA/CFA, check Numerical >= 55%; if Software, check Abstract >= 50%
- Integrate work values: If Autonomy > 4.0, add "Freelance" or "Research" variants

**STEP 5: GENERATE CLUSTER 2 (MEDIUM FIT - 60-78% match)**
- Identify student's 2nd and 3rd RIASEC types OR 1st + 3rd types
- Find careers within allowed domain that match these types
- Create a DIFFERENT cluster title (not similar to Cluster 1)
- Must be at least 10-15 points lower match score than Cluster 1

**GENERATE ROLES DYNAMICALLY:**
- **Entry-level roles (3 roles):** Generate based on secondary RIASEC combination
  - Apply same knowledge gating as Cluster 1
  - Consider partial aptitude fit (not perfect match)
  - Integrate work values for role variants
  
- **Mid-career roles (3 roles):** Generate based on growth potential
  - Consider how their secondary RIASEC types could develop
  - Apply work values for specialization direction
  - Consider personality traits for role style

**DO NOT copy roles from Cluster 1. Generate NEW roles that:**
1. Match their secondary RIASEC combination
2. Are within allowed domain but different career family
3. Reflect partial aptitude/personality fit
4. Show growth potential in different direction

- Calculate match score: 60 + (average of secondary RIASEC % × 0.18) + adjustments
- Apply same gating rules as Cluster 1

**STEP 6: GENERATE CLUSTER 3 (EXPLORE - 45-62% match)**
- Identify student's 3rd RIASEC type OR adjacent interests
- Find exploratory careers within allowed domain
- Create an EXPLORATORY cluster title
- Must be at least 10-15 points lower match score than Cluster 2

**GENERATE ROLES DYNAMICALLY:**
- **Entry-level roles (3 roles):** Generate based on exploratory RIASEC or emerging interests
  - Focus on accessible entry points for exploration
  - Consider roles that allow skill building
  - May include interdisciplinary or emerging career paths
  
- **Mid-career roles (3 roles):** Generate based on potential growth areas
  - Consider how interests might develop over time
  - Include roles that bridge multiple RIASEC types
  - May include specialized or niche career paths

**DO NOT copy roles from Clusters 1 or 2. Generate EXPLORATORY roles that:**
1. Match their tertiary RIASEC type or adjacent interests
2. Are within allowed domain but represent growth/exploration
3. May be emerging or interdisciplinary careers
4. Show potential for skill development

- Calculate match score: 45 + (exploratory RIASEC % × 0.17) + adjustments
- Can include growth areas or emerging interests

**STEP 7: VALIDATE AGAINST SUB-STREAM CONSTRAINTS**
Before finalizing, check:
${subStream === 'pcmb' ? '- ❌ NO Engineering, Software, or CS careers\n- ✅ ALL clusters must be Medical/Biotech/Allied Health'
: subStream === 'pcms' ? '- ❌ NO Medical, Biology, or Healthcare careers\n- ✅ ALL clusters must be Engineering/IT/Tech'
: subStream === 'pcm' ? '- ❌ NO Medical or Software Engineering\n- ✅ ALL clusters must be Core Engineering/Architecture'
: subStream === 'pcb' ? '- ❌ NO Engineering or JEE-based careers (no Maths!)\n- ✅ ALL clusters must be Medical/Nursing/Allied Health'
: subStream === 'with_maths' ? '- ❌ NO non-quantitative careers\n- ✅ ALL clusters must be Finance/Analytics/CA/CFA'
: subStream === 'without_maths' ? '- ❌ NO CA/CFA/Actuarial (require Maths)\n- ✅ ALL clusters must be Management/Marketing/HR'
: subStream === 'psychology' ? '- ❌ Track 1 CANNOT be creative arts/media\n- ✅ Track 1 MUST be Clinical Psychology/Counseling'
: subStream === 'economics' ? '- ✅ ALL clusters must be Economics/Policy/Civil Services'
: '- ✅ ALL clusters must be Law/Education/Journalism/Arts'}

**STEP 8: CREATE UNIQUE CLUSTER TITLES**

**CRITICAL: Cluster titles must be DOMAINS/FIELDS, not job titles.**

❌ WRONG (job titles):
- "Economics Policy Analyst"
- "Software Engineer"
- "Clinical Psychologist"
- "Marketing Manager"

✅ CORRECT (domains/fields):
- "Economic Policy Research & Public Administration"
- "AI-Driven Software Engineering & Systems Design"
- "Clinical Psychology & Evidence-Based Therapy"
- "Strategic Brand Management & Digital Marketing"

**TITLE STRUCTURE RULES:**
1. Use "&" to connect two related domains/specializations
2. Include 2-4 words that describe the FIELD, not a single job
3. Make it specific to the student's RIASEC combination
4. Must contain anchor words from the stream's validation list

**EXAMPLES BY RIASEC COMBINATION:**

PCMB + I+S:
- ✅ "Clinical Medicine & Patient-Centered Research"
- ❌ "Doctor" or "Clinical Psychologist"

PCMS + I+A:
- ✅ "Creative Technology & User Experience Engineering"
- ❌ "UX Designer" or "Software Developer"

Psychology + I+S:
- ✅ "Clinical Assessment & Evidence-Based Therapy"
- ❌ "Clinical Psychologist"

Economics + I+E:
- ✅ "Economic Policy Research & Public Administration"
- ❌ "Economics Policy Analyst" or "IAS Officer"

Commerce with Maths + I+C:
- ✅ "Financial Analysis & Strategic Audit"
- ❌ "Chartered Accountant" or "Financial Analyst"

Arts General + A+E:
- ✅ "Digital Journalism & Content Strategy"
- ❌ "Journalist" or "Content Writer"

**VALIDATION:** If your title is 1-2 words or sounds like a job title, it's WRONG. Expand it to describe the FIELD/DOMAIN.

**STEP 9: GENERATE EVIDENCE FROM ALL 7 SECTIONS**
For each cluster, provide evidence from:
1. Interest (RIASEC): Which types support this and their scores
2. Aptitude: Which cognitive abilities align (Verbal/Numerical/Abstract)
3. Personality (Big Five): Which traits support success
4. Values (Work Values): How this career satisfies their motivators
5. Employability: Current readiness level
6. Knowledge: How their subject mastery prepares them
7. Adaptive Aptitude: How their test results validate this choice

**REMEMBER: EVERY STUDENT GETS COMPLETELY UNIQUE CLUSTERS BASED ON THEIR SPECIFIC:**
- RIASEC combination (not just top type, but the COMBINATION)
- Sub-stream constraints (what they CAN and CANNOT pursue)
- Aptitude thresholds (gating for specific careers)
- Knowledge level (accessible vs competitive programs)
- Work values (role variants like freelance, management, etc.)
- Adaptive aptitude results (cognitive validation)

**NO TEMPLATES. NO EXAMPLES. GENERATE FRESH FOR EACH STUDENT.**
`}

## ⚠️ CRITICAL: COMPLETE RESPONSE REQUIRED

You MUST include ALL sections in your response. DO NOT truncate or skip any sections.

**MANDATORY SECTIONS (ALL REQUIRED):**
1. ✅ profileSnapshot
2. ✅ riasec
3. ✅ aptitude
4. ✅ bigFive
5. ✅ workValues
6. ✅ employability (REQUIRED - DO NOT SKIP)
7. ✅ knowledge (REQUIRED - DO NOT SKIP)
8. ✅ careerFit (with 3 clusters, each with evidence from ALL 6 sections)
9. ✅ skillGap (REQUIRED - DO NOT SKIP)
10. ✅ roadmap (REQUIRED - DO NOT SKIP)
11. ✅ finalNote (REQUIRED - DO NOT SKIP)
12. ✅ overallSummary

**If you skip employability, knowledge, skillGap, roadmap, or finalNote, your response is INCOMPLETE and INVALID!**

## ⚠️ CRITICAL: ROLE COUNT VALIDATION

**EACH CAREER CLUSTER MUST HAVE EXACTLY 3 ENTRY-LEVEL ROLES AND 3 MID-CAREER ROLES:**

Cluster 1:
- entry: [Role 1, Role 2, Role 3] ← MUST be 3 roles
- mid: [Role 1, Role 2, Role 3] ← MUST be 3 roles

Cluster 2:
- entry: [Role 1, Role 2, Role 3] ← MUST be 3 roles
- mid: [Role 1, Role 2, Role 3] ← MUST be 3 roles

Cluster 3:
- entry: [Role 1, Role 2, Role 3] ← MUST be 3 roles
- mid: [Role 1, Role 2, Role 3] ← MUST be 3 roles

**TOTAL: 18 unique roles (6 per cluster, 9 entry + 9 mid-career)**

**VALIDATION BEFORE SUBMITTING:**
✓ Count roles in Cluster 1 entry array: Must equal 3
✓ Count roles in Cluster 1 mid array: Must equal 3
✓ Count roles in Cluster 2 entry array: Must equal 3
✓ Count roles in Cluster 2 mid array: Must equal 3
✓ Count roles in Cluster 3 entry array: Must equal 3
✓ Count roles in Cluster 3 mid array: Must equal 3
✓ All 18 roles are unique (no duplicates across clusters)

**If any cluster has 2 roles or 4 roles instead of 3, your response is INVALID!**

## OUTPUT FORMAT

Return ONLY a JSON object (no markdown). Use this exact structure:

{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<What they enjoy based on RIASEC>",
      "strength": "<Their aptitude strengths>",
      "workStyle": "<How they work - from Big Five>",
      "motivation": "<What drives them - from Work Values>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength 1>", "percentile": "<Percentile>"},
      {"name": "<Strength 2>", "percentile": "<Percentile>"}
    ]
  },
  "riasec": {
    "topThree": ["<Type 1>", "<Type 2>", "<Type 3>"],
    "scores": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
    "maxScore": 24,
    "code": "<3-letter Holland Code>",
    "interpretation": "<2-3 sentences about career implications>"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": 0, "total": 8, "percentage": 0},
      "numerical": {"correct": 0, "total": 8, "percentage": 0},
      "abstract": {"correct": 0, "total": 8, "percentage": 0},
      "spatial": {"correct": 0, "total": 6, "percentage": 0},
      "clerical": {"correct": 0, "total": 20, "percentage": 0}
    },
    "topStrengths": ["<Strength 1>", "<Strength 2>"],
    "overallScore": 0,
    "interpretation": "<How their cognitive profile fits their stream and career goals>"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "traits": {
      "openness": {"score": 3.5, "description": "<How this affects career fit>"},
      "conscientiousness": {"score": 3.2, "description": "<Work ethic implications>"},
      "extraversion": {"score": 3.8, "description": "<Social interaction preferences>"},
      "agreeableness": {"score": 4.0, "description": "<Team collaboration style>"},
      "neuroticism": {"score": 2.5, "description": "<Stress management approach>"}
    },
    "workStyleSummary": "<How their personality shapes their ideal work environment>"
  },
  "workValues": {
    "topThree": [
      {"value": "<Value 1>", "score": 4.5, "description": "<Why this matters for career choice>"},
      {"value": "<Value 2>", "score": 4.2, "description": "<Career implications>"},
      {"value": "<Value 3>", "score": 4.0, "description": "<How to satisfy this value>"}
    ],
    "scores": {
      "achievement": 4.0,
      "independence": 3.5,
      "recognition": 3.8,
      "relationships": 4.2,
      "support": 3.7,
      "workingConditions": 3.9
    },
    "interpretation": "<How their values should guide career decisions>"
  },
  "employability": {
    "skillScores": {
      "communication": 4.0,
      "teamwork": 3.8,
      "problemSolving": 4.2,
      "criticalThinking": 3.9,
      "adaptability": 3.7,
      "leadership": 3.5,
      "digitalLiteracy": 4.1,
      "timeManagement": 3.6
    },
    "strengthAreas": ["<Skill 1>", "<Skill 2>", "<Skill 3>"],
    "developmentAreas": ["<Skill to improve 1>", "<Skill to improve 2>"],
    "overallReadiness": 75,
    "readinessLevel": "<Beginner/Intermediate/Advanced>",
    "recommendation": "<Specific steps to improve employability>"
  },
  "knowledge": {
    "score": 75,
    "correctCount": 15,
    "totalQuestions": 20,
    "percentage": 75,
    "strongTopics": ["<Topic 1>", "<Topic 2>", "<Topic 3>"],
    "weakTopics": ["<Topic 1>", "<Topic 2>"],
    "streamAlignment": "<How well their knowledge aligns with their chosen stream>",
    "recommendation": "<Specific topics to focus on for entrance exams>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Career Cluster 1 - MUST align with ${assessmentData.stream}>",
        "fit": "High",
        "matchScore": "<REQUIRED: Calculate as INTEGER between 75-95 based on student's actual scores. Formula: Base = 75 + (avg of top 2 RIASEC percentages * 0.20).  If top RIASEC are I=80%, R=70%, score = 75 + ((80+70)/2 * 0.20) = 75 + 15 = 90. Adjust ±2-4 based on aptitude alignment (high aptitude +3, low aptitude -3) and personality fit. Result must be unique per student (e.g., 78, 82, 87, 91, 94) - NEVER use round numbers like 80, 85, 90, 95>",
        "description": "<3-4 sentences explaining WHY this fits based on ALL 6 assessment sections>",
        "evidence": {
          "interest": "<RIASEC evidence - REQUIRED>",
          "aptitude": "<Aptitude evidence - REQUIRED>",
          "personality": "<Big Five evidence - REQUIRED>",
          "values": "<Work Values evidence - REQUIRED>",
          "employability": "<Employability evidence - REQUIRED>",
          "knowledge": "<Knowledge/Stream evidence - REQUIRED>",
          "adaptiveAptitude": "<Adaptive test evidence - REQUIRED>"
        },
        "roles": {
          "entry": ["<Entry role 1>", "<Entry role 2>", "<Entry role 3>"],
          "mid": ["<Mid role 1>", "<Mid role 2>", "<Mid role 3>"]
        },
        "domains": ["<Domain 1>", "<Domain 2>", "<Domain 3>"],
        "whyItFits": "<Detailed explanation connecting their complete profile to this career>",
        "entranceExams": ["<Exam 1>", "<Exam 2>"],
        "collegeMajors": ["<Major 1>", "<Major 2>", "<Major 3>"],
        "preparationFocus": "<What to focus on in 11th/12th for this career path>"
      },
      {
        "title": "<Career Cluster 2>",
        "fit": "Medium",
        "matchScore": "<REQUIRED: Calculate as INTEGER between 60-78 based on student's actual scores. Formula: Base = 60 + (avg of secondary RIASEC match * 0.18). If 1-2 RIASEC types match at 60% and 55%, score = 60 + ((60+55)/2 * 0.18) = 60 + 10.35 = 70. Adjust ±2-3 based on partial aptitude/personality fit. Result must be unique (e.g., 63, 68, 72, 76). MUST be at least 10-15 points lower than Cluster 1. ❌ FORBIDDEN: 65, 70, 75 - too round>",
        "description": "<Explanation based on all 7 sections>",
        "evidence": {
          "interest": "<RIASEC evidence>",
          "aptitude": "<Aptitude evidence>",
          "personality": "<Personality evidence>",
          "values": "<Values evidence>",
          "employability": "<Employability evidence>",
          "knowledge": "<Knowledge evidence>",
          "adaptiveAptitude": "<Adaptive test evidence>"
        },
        "roles": {
          "entry": ["<Entry role 1>", "<Entry role 2>", "<Entry role 3>"],
          "mid": ["<Mid role 1>", "<Mid role 2>", "<Mid role 3>"]
        },
        "domains": ["<Domain 1>", "<Domain 2>", "<Domain 3>"],
        "whyItFits": "<Connection to their profile>",
        "entranceExams": ["<Exam 1>", "<Exam 2>"],
        "collegeMajors": ["<Major 1>", "<Major 2>", "<Major 3>"],
        "preparationFocus": "<Preparation guidance>"
      },
      {
        "title": "<Career Cluster 3>",
        "fit": "Explore",
        "matchScore": "<REQUIRED: Calculate as INTEGER between 45-62 based on student's actual scores. Formula: Base = 45 + (exploratory RIASEC match * 0.17). If 1 RIASEC type matches at 45%, score = 45 + (45 * 0.17) = 45 + 7.65 = 53. Adjust ±1-2 based on growth potential. Result must be unique (e.g., 48, 52, 57, 61). MUST be at least 10-15 points lower than Cluster 2. ❌ FORBIDDEN: 50, 55, 60 - too round>",
        "description": "<Why worth exploring>",
        "evidence": {
          "interest": "<RIASEC evidence>",
          "aptitude": "<Aptitude evidence>",
          "personality": "<Personality evidence>",
          "values": "<Values evidence>",
          "employability": "<Employability evidence>",
          "knowledge": "<Knowledge evidence>",
          "adaptiveAptitude": "<Adaptive test evidence>"
        },
        "roles": {
          "entry": ["<Entry role 1>", "<Entry role 2>", "<Entry role 3>"],
          "mid": ["<Mid role 1>", "<Mid role 2>", "<Mid role 3>"]
        },
        "domains": ["<Domain 1>", "<Domain 2>", "<Domain 3>"],
        "whyItFits": "<Potential fit explanation>",
        "entranceExams": ["<Exam 1>", "<Exam 2>"],
        "collegeMajors": ["<Major 1>", "<Major 2>", "<Major 3>"],
        "preparationFocus": "<What to explore>"
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "<Career 1 - e.g., Software Engineer>", "salary": {"min": 6, "max": 15}},
        {"name": "<Career 2 - e.g., Data Scientist>", "salary": {"min": 7, "max": 18}},
        {"name": "<Career 3 - e.g., Product Manager>", "salary": {"min": 8, "max": 20}}
      ],
      "mediumFit": [
        {"name": "<Career 1 - e.g., Business Analyst>", "salary": {"min": 5, "max": 12}},
        {"name": "<Career 2 - e.g., UX Designer>", "salary": {"min": 4, "max": 10}}
      ],
      "exploreLater": [
        {"name": "<Career 1 - e.g., Content Writer>", "salary": {"min": 3, "max": 8}},
        {"name": "<Career 2 - e.g., Teacher>", "salary": {"min": 3, "max": 10}}
      ]
    }
  },
  "skillGap": {
    "currentStrengths": ["<Skill 1>", "<Skill 2>", "<Skill 3>"],
    "priorityA": [
      {
        "skill": "<Critical skill for their career path>",
        "currentLevel": 2,
        "targetLevel": 4,
        "whyNeeded": "<Why this skill is essential for their target careers>",
        "howToBuild": "<Specific action steps to develop this skill>"
      }
    ],
    "priorityB": [
      {
        "skill": "<Important skill>",
        "currentLevel": 2,
        "targetLevel": 3,
        "whyNeeded": "<Importance explanation>",
        "howToBuild": "<Development steps>"
      }
    ],
    "learningTracks": [
      {
        "track": "<Track name>",
        "suggestedIf": "<Condition>",
        "topics": "<Topics to learn>"
      }
    ],
    "recommendedTrack": "<Best track for their profile>"
  },
  "roadmap": {
    "immediate": {
      "title": "Next 3 Months (11th/12th Grade Focus)",
      "goals": ["<Goal 1>", "<Goal 2>", "<Goal 3>"],
      "actions": ["<Action 1>", "<Action 2>", "<Action 3>"],
      "entranceExamPrep": "<Specific exam preparation guidance>"
    },
    "shortTerm": {
      "title": "6-12 Months (College Preparation)",
      "goals": ["<Goal 1>", "<Goal 2>"],
      "actions": ["<Action 1>", "<Action 2>"],
      "collegeApplications": "<Application strategy>"
    },
    "projects": [
      {
        "title": "<Project 1>",
        "description": "<Detailed description>",
        "skills": ["<Skill 1>", "<Skill 2>"],
        "timeline": "<Timeline>",
        "difficulty": "<Level>",
        "purpose": "<Why this project matters>",
        "output": "<Deliverable>",
        "steps": ["<Step 1>", "<Step 2>", "<Step 3>"],
        "resources": ["<Resource 1>", "<Resource 2>"]
      }
    ]
  },
  "finalNote": {
    "advantage": "<Their strongest competitive advantage>",
    "growthFocus": "<Key area to focus on>",
    "collegeGuidance": "<Specific guidance for college major selection>",
    "entranceExamStrategy": "<Strategy for entrance exams based on their profile>"
  },
  "overallSummary": "<3-4 sentences summarizing their career readiness, unique strengths, and clear next steps for college preparation>"
}

## CRITICAL VALIDATION CHECKLIST

Before returning your response, verify:

1. ✅ **employability section is included** (skillScores, strengthAreas, developmentAreas, overallReadiness, recommendation)
2. ✅ **knowledge section is included** (score, correctCount, strongTopics, weakTopics, streamAlignment, recommendation)
3. ✅ **skillGap section is included** (currentStrengths, priorityA, priorityB, learningTracks, recommendedTrack)
4. ✅ **roadmap section is included** (immediate, shortTerm, projects)
5. ✅ **finalNote section is included** (advantage, growthFocus, collegeGuidance, entranceExamStrategy)
6. ✅ Each career cluster has evidence from ALL 6 sections (interest, aptitude, personality, values, employability, knowledge)
7. ✅ Career clusters align with the student's stream (${assessmentData.stream})
8. ✅ Entrance exams and college majors are specified for each cluster
9. ✅ All 3 career clusters are provided with complete information
10. ✅ Salary ranges are realistic for India (2025-2030)
11. ✅ Preparation guidance is specific to 11th/12th grade students
12. ✅ The response is personalized based on THEIR specific scores, not generic

${isPsychologyStream ? `
## 🚨 PSYCHOLOGY STREAM FINAL VALIDATION 🚨

**BEFORE SUBMITTING, ANSWER THESE QUESTIONS:**

1. Does Track 1 title contain "Psychology" or "Counseling"? 
   - If NO → YOU FAILED - Go back and fix it!
   
2. Are Track 1 roles psychology-related (Psychologist, Counselor, Therapist)?
   - If NO → YOU FAILED - Go back and fix it!
   
3. Is Track 1 about creative arts, media, or performing arts?
   - If YES → YOU FAILED - This is completely wrong for psychology stream!
   
4. Does Track 2 focus on social work, HR psychology, or organizational behavior?
   - If NO → YOU FAILED - Go back and fix it!
   
5. Is Track 3 about applied psychology (UX Research, Consumer Psychology)?
   - If NO → Consider revising to better match psychology applications

**REMEMBER:** This student chose psychology stream SPECIFICALLY for psychology careers. 
Recommending creative arts as Track 1 is like recommending medicine to an engineering student.
It's a fundamental mismatch that will make the student lose trust in the assessment.

**IF YOU FAILED ANY CHECK ABOVE, DO NOT SUBMIT - FIX THE CAREER CLUSTERS FIRST!**
` : ''}

**CRITICAL: If employability, knowledge, skillGap, roadmap, or finalNote sections are missing, YOUR RESPONSE IS INCOMPLETE AND INVALID!**

**DO NOT TRUNCATE THE RESPONSE - Complete all sections before ending the JSON object!**`;
}
