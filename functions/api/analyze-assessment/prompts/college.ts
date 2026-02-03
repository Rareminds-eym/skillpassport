/**
 * College (After 12th) Assessment Prompt Builder
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
## ADAPTIVE APTITUDE TEST RESULTS:
- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- No standout strengths identified'}

**AREAS FOR GROWTH**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant weak areas'}

**IMPORTANT**: Use these adaptive test results as ADDITIONAL evidence when generating career clusters.`;

  return { section, isHighAptitude };
}

export function buildCollegePrompt(assessmentData: AssessmentData, answersHash: number): string {
  const isAfter10 = assessmentData.gradeLevel === 'after10';
  const ruleBasedHint = (assessmentData as any).ruleBasedStreamHint;
  const profileAnalysis = ruleBasedHint?.profileAnalysis;
  const isFlatProfile = profileAnalysis?.isFlatProfile;
  
  // Pre-process adaptive results for efficiency
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';
  
  // Student context for program-specific recommendations
  const studentContext = assessmentData.studentContext;
  const hasStudentContext = studentContext && (studentContext.rawGrade || studentContext.programName || studentContext.degreeLevel || studentContext.selectedStream);
  
  // Extract stream information for higher secondary students
  const isHigherSecondary = assessmentData.gradeLevel === 'higher_secondary';
  const selectedStream = studentContext?.selectedStream || assessmentData.stream;
  const selectedCategory = studentContext?.selectedCategory;
  
  // Determine stream category (arts/science/commerce) from stream ID
  const getStreamCategory = (stream: string | undefined): string | null => {
    if (!stream) return null;
    const streamLower = stream.toLowerCase();
    if (streamLower.includes('arts') || streamLower.includes('humanities')) return 'arts';
    if (streamLower.includes('science') || streamLower.includes('pcm') || streamLower.includes('pcb')) return 'science';
    if (streamLower.includes('commerce')) return 'commerce';
    return null;
  };
  
  const streamCategory = selectedCategory || getStreamCategory(selectedStream);
  
  const streamInfo = isHigherSecondary && selectedStream ? `
**⚠️ CRITICAL: STUDENT'S SELECTED STREAM**: ${selectedStream.toUpperCase()}
**Stream Category**: ${streamCategory ? streamCategory.toUpperCase() : 'Not specified'}
**This student has ALREADY CHOSEN their stream. You MUST provide career recommendations aligned with ${streamCategory ? streamCategory.toUpperCase() : selectedStream.toUpperCase()} stream ONLY.**
` : '';
  
  // Build student context section
  const studentContextSection = hasStudentContext ? `
## 🎓 STUDENT ACADEMIC CONTEXT (CRITICAL - READ CAREFULLY)

**Current Academic Level**: ${studentContext.rawGrade || 'Not specified'}
**Program/Course**: ${studentContext.programName || 'Not specified'}
**Program Code**: ${studentContext.programCode || 'Not specified'}
**Degree Level**: ${studentContext.degreeLevel || 'Not specified'}
${streamInfo}

${studentContext.degreeLevel === 'postgraduate' ? `
### ⚠️ POSTGRADUATE STUDENT - SPECIAL INSTRUCTIONS ⚠️

This student is pursuing a POSTGRADUATE degree (Master's/PG Diploma). Your recommendations MUST reflect this:

**MANDATORY REQUIREMENTS:**
1. **NO Undergraduate Programs**: Do NOT recommend Bachelor's degrees (B.Tech, BCA, B.Sc, etc.)
2. **Advanced Roles Only**: Focus on mid-level to senior positions, not entry-level
3. **Higher Salary Expectations**: 
   - Entry (0-2 years): ₹6-15 LPA
   - Mid-level (3-5 years): ₹15-30 LPA
   - Senior (5+ years): ₹30-60 LPA
4. **Specialized Skills**: Recommend advanced certifications and specializations
5. **Industry-Specific Roles**: Match recommendations to their field of study

**Program Field Alignment:**

⚠️ CRITICAL: The student is studying **${studentContext.programName || 'their chosen program'}**. 
You MUST analyze this program and provide career recommendations that are DIRECTLY ALIGNED with this field of study.

**MANDATORY INSTRUCTIONS FOR PROGRAM-SPECIFIC RECOMMENDATIONS:**

1. **Analyze the Program Field:**
   - Identify the domain: Technology/IT, Engineering, Business/Management, Healthcare/Medical, Science, Pharmacy, Arts/Humanities, Law, etc.
   - Understand the specialization within that domain
   - Consider the degree level (UG/PG/Diploma) for role seniority

2. **Generate Field-Aligned Career Clusters:**
   - **Cluster 1 (High Fit)**: Core careers directly related to the program
   - **Cluster 2 (Medium Fit)**: Adjacent careers that leverage the program's skills
   - **Cluster 3 (Explore)**: Interdisciplinary careers that combine the program with other interests

3. **Common Program Mappings (USE AS REFERENCE, NOT EXHAUSTIVE):**

   **Technology & IT Programs:**
   - MCA, BCA, B.Tech/M.Tech CS/IT, Computer Science, Information Technology
   - → Software Engineer, Data Scientist, AI/ML Engineer, Cloud Architect, Full Stack Developer, DevOps Engineer
   - → Certifications: AWS, Azure, GCP, Kubernetes, Docker, Python, Java

   **Engineering Programs:**
   - B.Tech/M.Tech (Mechanical, Civil, Electrical, Electronics, etc.)
   - → Design Engineer, Project Engineer, R&D Engineer, Quality Engineer, Technical Consultant
   - → Certifications: AutoCAD, MATLAB, PMP, Six Sigma, Domain-specific tools

   **Business & Management:**
   - MBA, BBA, B.Com, M.Com, Management Studies
   - → Product Manager, Business Analyst, Management Consultant, Financial Analyst, Marketing Manager
   - → Certifications: PMP, Six Sigma, CFA, Digital Marketing, Agile/Scrum

   **Healthcare & Medical:**
   - MBBS, BDS, BAMS, BHMS, Nursing, Physiotherapy, Medical Lab Technology
   - → Doctor, Dentist, Medical Officer, Healthcare Consultant, Clinical Researcher, Hospital Administrator
   - → Certifications: Medical specializations, Healthcare Management, Clinical Research

   **Pharmacy:**
   - B.Pharm, M.Pharm, Pharm.D
   - → Pharmacist, Clinical Pharmacist, Drug Safety Associate, Regulatory Affairs, Medical Writer, Pharmaceutical Sales
   - → Certifications: Drug Regulatory Affairs, Clinical Research, Pharmacovigilance, Quality Assurance

   **Life Sciences & Biotechnology:**
   - B.Sc/M.Sc Biotechnology, Microbiology, Biochemistry, Genetics
   - → Research Scientist, Biotech Analyst, Quality Control Analyst, Clinical Research Associate, Lab Technician
   - → Certifications: Good Laboratory Practice (GLP), Clinical Research, Bioinformatics tools

   **Pure Sciences:**
   - B.Sc/M.Sc Physics, Chemistry, Mathematics, Statistics
   - → Research Scientist, Data Analyst, Quality Analyst, Lab Technician, Academic Researcher, Science Educator
   - → Certifications: Data Science, Statistical Analysis, Research Methodology, Lab certifications

   **Commerce & Finance:**
   - B.Com, M.Com, CA, CMA, CS
   - → Chartered Accountant, Financial Analyst, Tax Consultant, Auditor, Investment Banker, Accountant
   - → Certifications: CA, CMA, CFA, ACCA, Taxation, GST

   **Arts & Humanities:**
   - BA/MA English, History, Psychology, Sociology, Political Science
   - → Content Writer, Journalist, Psychologist, Social Worker, HR Professional, Civil Services, Teacher
   - → Certifications: Content Writing, Counseling, HR Management, Public Administration

   **Law:**
   - LLB, LLM, BA LLB
   - → Lawyer, Legal Advisor, Corporate Counsel, Legal Analyst, Compliance Officer, Judge
   - → Certifications: Specialized law courses, Corporate Law, IPR, Cyber Law

   **Design & Creative:**
   - B.Des, M.Des, Fashion Design, Graphic Design
   - → UI/UX Designer, Graphic Designer, Fashion Designer, Product Designer, Creative Director
   - → Certifications: Adobe Suite, Figma, Sketch, Design Thinking

   **Agriculture & Food Science:**
   - B.Sc/M.Sc Agriculture, Food Technology, Horticulture
   - → Agricultural Officer, Food Technologist, Quality Assurance Manager, Agronomist, Research Scientist
   - → Certifications: Food Safety, Organic Farming, Agricultural Extension

   **Architecture & Planning:**
   - B.Arch, M.Arch, Urban Planning
   - → Architect, Urban Planner, Interior Designer, Landscape Architect, Project Manager
   - → Certifications: AutoCAD, Revit, LEED, Project Management

4. **If Program is NOT in the list above:**
   - Analyze the program name to identify the field
   - Research typical career paths for that program
   - Generate relevant career clusters based on the field's industry demand
   - Provide realistic salary ranges for that field in India

5. **CRITICAL VALIDATION:**
   - ✅ DO: Ensure ALL 3 career clusters are related to the student's program field
   - ✅ DO: Match salary ranges to the field's industry standards
   - ✅ DO: Recommend certifications relevant to the field
   - ✅ DO: Consider degree level (UG = entry-level, PG = mid-senior level)
   - ❌ DON'T: Recommend careers from completely unrelated fields
   - ❌ DON'T: Ignore the program information and give generic recommendations
   - ❌ DON'T: Recommend UG programs to PG students or vice versa

**FILTERING RULES (STRICTLY ENFORCE):**
- ❌ Remove any "Complete your Bachelor's degree" suggestions
- ❌ Remove any UG program recommendations
- ❌ Remove any entry-level roles meant for fresh graduates
- ❌ Remove any basic certifications (recommend advanced ones only)
- ✅ Include only roles that value PG qualifications
- ✅ Include only advanced/specialized certifications
- ✅ Adjust salary ranges to PG level

` : ''}

${studentContext.degreeLevel === 'undergraduate' ? `
### 📚 UNDERGRADUATE STUDENT INSTRUCTIONS

This student is pursuing an UNDERGRADUATE degree (Bachelor's).

**RECOMMENDATIONS SHOULD INCLUDE:**
1. **Entry-Level Roles**: Focus on campus placements and fresher positions
2. **Salary Expectations**: ₹3-8 LPA for entry-level
3. **Foundational Skills**: Basic to intermediate certifications
4. **Internship Opportunities**: Emphasize internships and training programs
5. **Career Growth Path**: Show progression from entry to mid-level

` : ''}

${studentContext.degreeLevel === 'diploma' ? `
### 🔧 DIPLOMA STUDENT INSTRUCTIONS

This student is pursuing a DIPLOMA program.

**RECOMMENDATIONS SHOULD INCLUDE:**
1. **Technical/Vocational Roles**: Focus on hands-on, skill-based positions
2. **Salary Expectations**: ₹2-6 LPA for entry-level
3. **Industry Certifications**: Practical, industry-recognized certifications
4. **Skill Development**: Emphasize technical skills and on-the-job training
5. **Career Pathways**: Show how to progress to higher qualifications if desired

` : ''}
` : '';

  // After 10th stream recommendation section
  const after10StreamSection = isAfter10 ? `
## ⚠️ CRITICAL: AFTER 10TH STREAM RECOMMENDATION (MANDATORY FOR THIS STUDENT) ⚠️
This student is completing 10th grade and needs guidance on which 11th/12th stream to choose.

${ruleBasedHint ? `
## 🎯 RULE-BASED RECOMMENDATION (STRONGLY CONSIDER THIS):
Our precise scoring algorithm analyzed this student's RIASEC scores and suggests:

**Recommended Stream**: ${ruleBasedHint.stream}
**Confidence**: ${ruleBasedHint.confidence}%
**Match Level**: ${ruleBasedHint.matchLevel}
**RIASEC Scores**: ${JSON.stringify(ruleBasedHint.riasecScores)}
**Alternative**: ${ruleBasedHint.alternativeStream || 'N/A'}

**Top 3 Stream Matches**:
${ruleBasedHint.allScores?.map((s: any, i: number) => `${i + 1}. ${s.stream} (${s.score}% match, ${s.category})`).join('\n') || 'N/A'}

${isFlatProfile ? `
## ⚠️ FLAT PROFILE WARNING ⚠️
**This student has an UNDIFFERENTIATED interest profile!**
- RIASEC Score Range: ${profileAnalysis.riasecRange} points
- Standard Deviation: ${profileAnalysis.riasecStdDev}
- Warning: ${profileAnalysis.warning}

**IMPORTANT INSTRUCTIONS FOR FLAT PROFILES:**
1. DO NOT give high confidence (max 70%) - the student's interests are too similar across all areas
2. MUST present MULTIPLE valid stream options (at least 2-3 equally valid choices)
3. Emphasize that the student should explore different fields before deciding
4. Recommend the student consider their APTITUDE scores more heavily since interests are undifferentiated
5. Suggest the student talk to counselors, attend career fairs, or try internships in different fields
6. In the streamRecommendation.reasoning, explicitly mention that interests are undifferentiated
` : ''}

⚠️ IMPORTANT: This recommendation is based on ACTUAL assessment scores using a validated algorithm.
You should STRONGLY AGREE with this recommendation unless you have compelling evidence otherwise.
If you recommend a different stream, you MUST provide clear reasoning based on the scores below.
` : ''}

**PERSONALIZATION REQUIREMENT - READ CAREFULLY:**
You are analyzing a UNIQUE student with UNIQUE scores. Their assessment responses are DIFFERENT from other students.
You MUST provide a PERSONALIZED recommendation based on THEIR SPECIFIC scores below.

❌ DO NOT default to PCMS for everyone!
❌ DO NOT assume all students want technology careers!
❌ DO NOT give the same recommendation to different students!

✅ DO analyze THEIR actual RIASEC scores
✅ DO analyze THEIR actual aptitude scores
✅ DO match THEIR pattern to the appropriate stream
✅ DO provide reasoning based on THEIR specific profile

**Available Streams (Choose ONE as primary recommendation based on ACTUAL scores):**

**Science Streams:**
- **PCMB** (Physics, Chemistry, Maths, Biology) - Best for: High I (Investigative) + Strong Numerical + Interest in Biology/Medicine
  * Choose if: I >= 60% AND Numerical >= 70% AND (S >= 60% OR biology interest shown)
  * Career paths: Doctor, Dentist, Biotechnologist, Medical Researcher
  
- **PCMS** (Physics, Chemistry, Maths, Computer Science) - Best for: High I + Strong Numerical + Strong Abstract/Logical + Interest in Technology
  * Choose if: I >= 60% AND Numerical >= 70% AND Abstract >= 70%
  * Career paths: Software Engineer, Data Scientist, AI/ML Engineer
  
- **PCM** (Physics, Chemistry, Maths) - Best for: High I + Strong Numerical + Strong Spatial/Mechanical
  * Choose if: I >= 60% AND Numerical >= 70% AND (R >= 60% OR Spatial >= 70%)
  * Career paths: Mechanical Engineer, Civil Engineer, Architect
  
- **PCB** (Physics, Chemistry, Biology) - Best for: High I + High S (Social) + Interest in Healthcare/Life Sciences
  * Choose if: I >= 60% AND S >= 60% AND biology interest
  * Career paths: Physiotherapist, Pharmacist, Biotechnologist

**Commerce Stream:**
- **Commerce with Maths** - Best for: High E (Enterprising) + High C (Conventional) + Strong Numerical
  * Choose if: E >= 60% AND C >= 60% AND Numerical >= 70%
  * Career paths: Chartered Accountant, Financial Analyst, Economist
  
- **Commerce without Maths** - Best for: High E + High C + Strong Verbal + Moderate Numerical
  * Choose if: E >= 60% AND C >= 60% AND Verbal >= 70% AND Numerical < 70%
  * Career paths: Business Manager, Marketing Professional, HR Specialist

**Arts/Humanities Stream:**
- **Arts with Psychology** - Best for: High S (Social) + High A (Artistic) + Interest in Human Behavior
  * Choose if: S >= 70% AND (A >= 60% OR psychology interest)
  * Career paths: Psychologist, Counselor, Social Worker
  
- **Arts with Economics** - Best for: High I + High E + Strong Verbal + Interest in Society/Policy
  * Choose if: I >= 60% AND E >= 60% AND Verbal >= 70%
  * Career paths: Economist, Policy Analyst, Journalist
  
- **Arts General** - Best for: High A (Artistic) + Strong Verbal + Creative Interests
  * Choose if: A >= 70% AND Verbal >= 70%
  * Career paths: Writer, Designer, Artist, Teacher

## EXACT SCORING-BASED RECOMMENDATION ALGORITHM (FOLLOW STEP-BY-STEP):

**Step 1: Calculate RIASEC Percentages from Actual Responses**
- Look at the RIASEC responses provided below
- Calculate percentage for each type (R, I, A, S, E, C)
- Identify which types have scores >= 60%
- Identify top 2-3 dominant types

**Step 2: Analyze Aptitude Scores from Actual Results**
- Numerical >= 70%: Strong fit for Science/Commerce with Maths
- Verbal >= 70%: Strong fit for Arts/Commerce
- Abstract/Logical >= 70%: Strong fit for Science (especially PCMS)
- Spatial >= 70%: Strong fit for Engineering (PCM/PCMS)
- Clerical >= 70%: Strong fit for Commerce

**Step 3: Match THIS Student's Pattern to Stream**
| THIS Student's Pattern | Recommended Stream |
|---------|-------------------|
| High I + High Numerical + High Abstract | PCMS or PCM |
| High I + High Numerical + Biology Interest | PCMB or PCB |
| High I + High S + Biology Interest | PCB |
| High E + High C + High Numerical | Commerce with Maths |
| High E + High C + High Verbal | Commerce without Maths |
| High A + High S + High Verbal | Arts with Psychology |
| High I + High E + High Verbal | Arts with Economics |
| High A + High Verbal | Arts General |

**Step 4: Determine Confidence Based on Pattern Clarity**
- High Fit (85-100%): Pattern matches clearly (3+ indicators align)
- Medium Fit (75-84%): Pattern partially matches (2 indicators align)

**Step 5: Provide Alternative Stream**
- Suggest a second-best option if scores are close
- Explain what would make the alternative a better fit

## EXAMPLE DIFFERENTIATION (to show you MUST personalize):

**Example Student A:**
- RIASEC: I=85%, R=70%, A=45%, S=40%, E=35%, C=50%
- Aptitude: Numerical=85%, Abstract=80%, Verbal=65%
- **Recommendation**: PCMS (Physics, Chemistry, Maths, Computer Science)
- **Reasoning**: High investigative interest + exceptional numerical & abstract reasoning = perfect for technology/engineering

**Example Student B:**
- RIASEC: I=80%, S=75%, A=50%, R=45%, E=40%, C=55%
- Aptitude: Numerical=75%, Verbal=80%, Abstract=65%
- **Recommendation**: PCMB (Physics, Chemistry, Maths, Biology)
- **Reasoning**: High investigative + social interests + strong verbal skills = ideal for medical/healthcare field

**Example Student C:**
- RIASEC: E=85%, C=80%, I=50%, S=60%, A=40%, R=35%
- Aptitude: Numerical=75%, Verbal=85%, Abstract=60%
- **Recommendation**: Commerce with Maths
- **Reasoning**: High enterprising + conventional + strong numerical & verbal = perfect for business/finance

**Example Student D:**
- RIASEC: A=85%, S=75%, I=55%, E=50%, R=35%, C=40%
- Aptitude: Verbal=85%, Numerical=55%, Abstract=70%
- **Recommendation**: Arts with Psychology
- **Reasoning**: High artistic + social interests + exceptional verbal skills = ideal for humanities/social sciences

YOUR STUDENT IS DIFFERENT FROM THESE EXAMPLES!
Analyze THEIR scores below and recommend THEIR best stream!

IMPORTANT: Base your recommendation on the ACTUAL scores provided, not assumptions!

## CRITICAL: CAREER CLUSTERS MUST ALIGN WITH STUDENT'S STREAM

${isHigherSecondary ? `
### ⚠️ HIGHER SECONDARY (11th/12th) STUDENT - STREAM ALREADY SELECTED ⚠️

This student is in ${selectedStream?.toUpperCase() || 'UNKNOWN'} stream. They have ALREADY made their stream choice.

**YOU MUST:**
1. Provide career recommendations ONLY for ${selectedStream?.toUpperCase() || 'their selected'} stream
2. Do NOT recommend careers from other streams
3. All 3 career clusters MUST be from ${selectedStream?.toUpperCase() || 'their selected'} stream

**STREAM-SPECIFIC CAREER CLUSTERS:**

${selectedStream === 'science' ? `
**SCIENCE STREAM CAREERS (Use these for all 3 clusters):**
- Cluster 1 (High Fit): Engineering & Technology (Software Engineer, Data Scientist, Mechanical Engineer)
- Cluster 2 (Medium Fit): Healthcare & Medicine (Doctor, Pharmacist, Medical Researcher, Biotechnologist)
- Cluster 3 (Explore): Research & Academia (Research Scientist, Lab Technician, Science Educator)
` : ''}

${selectedStream === 'commerce' ? `
**COMMERCE STREAM CAREERS (Use these for all 3 clusters):**
- Cluster 1 (High Fit): Finance & Accounting (Chartered Accountant, Financial Analyst, Investment Banker)
- Cluster 2 (Medium Fit): Business & Management (Business Manager, Entrepreneur, Marketing Manager)
- Cluster 3 (Explore): Banking & Insurance (Bank Manager, Actuary, Risk Analyst)
` : ''}

${selectedStream === 'arts' ? `
**ARTS STREAM CAREERS (Use these for all 3 clusters):**
- Cluster 1 (High Fit): Law & Legal Services (Lawyer, Legal Advisor, Judge, Corporate Counsel)
- Cluster 2 (Medium Fit): Media & Communication (Journalist, Content Creator, PR Manager, Editor)
- Cluster 3 (Explore): Social Sciences & Humanities (Psychologist, Social Worker, Teacher, Civil Services)
` : ''}

` : `
### FOR AFTER 10TH STUDENTS ONLY:

For after 10th students, the career clusters in "careerFit.clusters" MUST be directly related to the streams:`}
- **Cluster 1 (High Fit)** and **Cluster 2 (Medium Fit)**: Based on the PRIMARY recommended stream
- **Cluster 3 (Explore)**: Based on the ALTERNATIVE stream recommendation (the second-best stream option)

Use this mapping to select appropriate career clusters:

**PCMB (Physics, Chemistry, Maths, Biology):**
- Cluster 1 (High Fit): Healthcare & Medicine (Doctor, Medical Researcher, Pharmacist)
- Cluster 2 (Medium Fit): Biotechnology & Life Sciences (Biotech Researcher, Geneticist, Microbiologist)

**PCMS (Physics, Chemistry, Maths, Computer Science):**
- Cluster 1 (High Fit): Technology & Software (Software Engineer, Data Scientist, AI/ML Engineer)
- Cluster 2 (Medium Fit): Engineering & Innovation (Systems Engineer, Product Developer, Tech Architect)

**PCM (Physics, Chemistry, Maths):**
- Cluster 1 (High Fit): Engineering (Mechanical/Civil/Electrical Engineer, Architect)
- Cluster 2 (Medium Fit): Defense & Aviation (Pilot, Defense Services, Aerospace Engineer)

**PCB (Physics, Chemistry, Biology):**
- Cluster 1 (High Fit): Healthcare & Nursing (Doctor, Nurse, Physiotherapist, Dentist)
- Cluster 2 (Medium Fit): Allied Health Sciences (Medical Lab Technician, Radiologist, Nutritionist)

**Commerce with Maths:**
- Cluster 1 (High Fit): Finance & Accounting (Chartered Accountant, Financial Analyst, Investment Banker)
- Cluster 2 (Medium Fit): Banking & Insurance (Bank Manager, Actuary, Risk Analyst)

**Commerce without Maths:**
- Cluster 1 (High Fit): Business & Management (Business Manager, Entrepreneur, Marketing Manager)
- Cluster 2 (Medium Fit): Human Resources & Administration (HR Manager, Company Secretary, Admin Head)

**Arts with Psychology:**
- Cluster 1 (High Fit): Psychology & Counseling (Psychologist, Counselor, Therapist)
- Cluster 2 (Medium Fit): Human Resources & Training (HR Professional, Corporate Trainer, Life Coach)

**Arts with Economics:**
- Cluster 1 (High Fit): Civil Services & Policy (IAS/IPS Officer, Policy Analyst, Government Administrator)
- Cluster 2 (Medium Fit): Economics & Research (Economist, Research Analyst, Think Tank Researcher)

**Arts General:**
- Cluster 1 (High Fit): Law & Legal Services (Lawyer, Legal Advisor, Judge)
- Cluster 2 (Medium Fit): Media & Communication (Journalist, Content Creator, PR Manager)

**FOR CLUSTER 3 (Explore) - USE THE ALTERNATIVE STREAM:**
- Look at the "alternativeStream" you recommend in streamRecommendation
- Pick a career cluster from THAT alternative stream's mapping above
- Example: If primary is PCMS and alternative is Commerce with Maths, Cluster 3 should be Finance & Accounting or Banking & Insurance

**IMPORTANT:** 
- Clusters 1 & 2 MUST match the PRIMARY recommended stream
- Cluster 3 MUST match the ALTERNATIVE stream recommendation
- This gives students visibility into careers from both their best-fit and second-best stream options
` : '';

  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Grade Level: ${assessmentData.gradeLevel.toUpperCase()}
## Student Stream: ${assessmentData.stream.toUpperCase()}
${studentContextSection}
${after10StreamSection}

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
4. The "code" string MUST be these 3 letters joined (e.g., if C=19, E=17, S=15, then code="CES")
5. VERIFY: The first letter in topThree MUST have the highest score, second letter the second-highest, etc.
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

## Work Values Responses:
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

## Employability Skills:
Self-Rating: ${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}
SJT: ${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

## Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

${adaptiveSection}

## Section Timings:
${JSON.stringify(assessmentData.sectionTimings, null, 2)}

---

Return ONLY a valid JSON object with this EXACT structure (no markdown, no extra text):

{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<Pattern>",
      "strength": "<Pattern>",
      "workStyle": "<Pattern>",
      "motivation": "<Pattern>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength>", "percentile": "<Percentile>"}
    ]
  },
  "riasec": {
    "scores": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
    "maxScore": 24,
    "code": "<3-letter code>",
    "topThree": ["<letter>", "<letter>", "<letter>"],
    "interpretation": "<2-3 sentences>"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": 0, "total": 8, "percentage": 0},
      "numerical": {"correct": 0, "total": 8, "percentage": 0},
      "abstract": {"correct": 0, "total": 8, "percentage": 0},
      "spatial": {"correct": 0, "total": 6, "percentage": 0},
      "clerical": {"correct": 0, "total": 20, "percentage": 0}
    },
    "overallScore": 0,
    "topStrengths": ["<strength>"],
    "areasToImprove": ["<area>"],
    "cognitiveProfile": "<2-3 sentences>",
    "careerImplications": "<1-2 sentences>"
  },
  "bigFive": {
    "O": 0, "C": 0, "E": 0, "A": 0, "N": 0,
    "dominantTraits": ["<trait>"],
    "workStyleSummary": "<2-3 sentences>"
  },
  "workValues": {
    "scores": {"Security": 0, "Autonomy": 0, "Creativity": 0, "Status": 0, "Impact": 0, "Financial": 0, "Leadership": 0, "Lifestyle": 0},
    "topThree": [
      {"value": "<value>", "score": 0}
    ],
    "motivationSummary": "<2-3 sentences>"
  },
  "employability": {
    "skillScores": {"Communication": 0, "Teamwork": 0, "ProblemSolving": 0, "Adaptability": 0, "Leadership": 0, "DigitalFluency": 0, "Professionalism": 0, "CareerReadiness": 0},
    "sjtScore": 0,
    "overallReadiness": "<High/Medium/Low>",
    "strengthAreas": ["<skill>"],
    "improvementAreas": ["<skill>"]
  },
  "knowledge": {
    "score": 0,
    "correctCount": 0,
    "totalQuestions": 0,
    "strongTopics": ["<topic>"],
    "weakTopics": ["<topic>"],
    "recommendation": "<1-2 sentences>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Career Cluster 1 - REQUIRED>",
        "fit": "High",
        "matchScore": 85,
        "description": "<2-3 sentences explaining WHY this fits based on assessment - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Specific connection to student's profile - REQUIRED>"
      },
      {
        "title": "<Career Cluster 2 - REQUIRED>",
        "fit": "Medium",
        "matchScore": 75,
        "description": "<2-3 sentences explaining fit - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Connection to student's profile - REQUIRED>"
      },
      {
        "title": "<Career Cluster 3 - REQUIRED>",
        "fit": "Explore",
        "matchScore": 65,
        "description": "<2-3 sentences explaining potential - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Why worth exploring - REQUIRED>"
      }
    ],
    "specificOptions": {
      "highFit": [{"name": "<role 1>", "salary": {"min": 4, "max": 12}}, {"name": "<role 2>", "salary": {"min": 4, "max": 10}}, {"name": "<role 3>", "salary": {"min": 3, "max": 8}}],
      "mediumFit": [{"name": "<role 1>", "salary": {"min": 3, "max": 8}}, {"name": "<role 2>", "salary": {"min": 3, "max": 7}}],
      "exploreLater": [{"name": "<role 1>", "salary": {"min": 3, "max": 7}}, {"name": "<role 2>", "salary": {"min": 2, "max": 6}}]
    }
  },
  "skillGap": {
    "currentStrengths": ["<skill>"],
    "priorityA": [{"skill": "<skill>", "currentLevel": 1, "targetLevel": 3, "whyNeeded": "<reason>", "howToBuild": "<action>"}],
    "priorityB": [{"skill": "<skill>"}],
    "learningTracks": [{"track": "<track>", "suggestedIf": "<condition>", "topics": "<topics>"}],
    "recommendedTrack": "<track>"
  },
  "streamRecommendation": {
    "isAfter10": ${isAfter10},
    "recommendedStream": "${isAfter10 ? '<REQUIRED: PCMB/PCMS/PCM/PCB/Commerce with Maths/Commerce without Maths/Arts>' : 'N/A'}",
    "streamFit": "${isAfter10 ? '<High/Medium>' : 'N/A'}",
    "confidenceScore": "${isAfter10 ? '<75-100>' : 'N/A'}",
    "reasoning": {"interests": "<RIASEC scores>", "aptitude": "<aptitude scores>", "personality": "<traits>"},
    "scoreBasedAnalysis": {"riasecTop3": ["<type>"], "strongAptitudes": ["<aptitude>"], "matchingPattern": "<pattern>"},
    "alternativeStream": "<stream>",
    "alternativeReason": "<reason>",
    "subjectsToFocus": ["<subject>"],
    "careerPathsAfter12": ["<career>"],
    "entranceExams": ["<exam>"],
    "collegeTypes": ["<type>"]
  },
  "roadmap": {
    "projects": [{"title": "<title>", "purpose": "<purpose>", "output": "<output>"}],
    "internship": {"types": ["<type>"], "timeline": "<timeline>", "preparation": {"resume": "<focus>", "portfolio": "<focus>", "interview": "<focus>"}},
    "exposure": {"activities": ["<activity>"], "certifications": ["<cert>"]}
  },
  "finalNote": {
    "advantage": "<advantage>",
    "growthFocus": "<focus>",
    "nextReview": "<timeline>"
  },
  "timingAnalysis": {
    "overallPace": "<Fast/Moderate/Deliberate>",
    "decisionStyle": "<Intuitive/Balanced/Analytical>",
    "confidenceIndicator": "<High/Medium/Low>",
    "sectionInsights": {"riasec": "<insight>", "personality": "<insight>", "values": "<insight>", "employability": "<insight>", "knowledge": "<insight>"},
    "recommendation": "<1-2 sentences>"
  },
  "overallSummary": "<4-5 sentences>"
}

CRITICAL REQUIREMENTS - YOU MUST FOLLOW ALL:
1. EXACTLY 3 CAREER CLUSTERS ARE MANDATORY - You MUST provide 3 different career clusters:
   - Cluster 1: High fit (matchScore 80-95%)
   - Cluster 2: Medium fit (matchScore 70-85%)
   - Cluster 3: Explore fit (matchScore 60-75%)
2. Each cluster MUST have: title, fit, matchScore, description, evidence (all 3 fields), roles (entry + mid), domains, whyItFits
3. ALL arrays must have at least 2 items - NO empty arrays
4. ALL career clusters must have roles.entry, roles.mid, and domains filled with real job titles
5. For after10 students, streamRecommendation is MANDATORY with a specific stream choice
6. **FOR AFTER 10TH STUDENTS: Career clusters MUST align with streams as follows:**
   - **Cluster 1 (High Fit) & Cluster 2 (Medium Fit)**: Must be from the PRIMARY recommended stream
   - **Cluster 3 (Explore)**: Must be from the ALTERNATIVE stream (second-best option)
   - Example: If primary=PCMS, alternative=Commerce → Clusters 1&2 are Tech/Engineering, Cluster 3 is Finance/Business
   - This shows students career options from both their best-fit AND second-best stream choices
7. Use EXACT scoring formulas provided - Be DETERMINISTIC (same input = same output)
8. Provide SPECIFIC, ACTIONABLE career guidance based on the student's actual scores
9. DO NOT truncate the response - complete ALL fields`;
}
