/**
 * Assessment API Prompts and Stream Contexts
 * Separated for better maintainability
 */

export const SCHOOL_SUBJECT_PROMPT = `You are an expert educational assessment creator for 10th grade students in India who are about to choose their stream (Science/Commerce/Arts) for 11th-12th.

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

export const APTITUDE_PROMPT = `You are an expert psychometric assessment creator. Generate aptitude test questions for {{STREAM_NAME}} stream career assessment.

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

export const KNOWLEDGE_PROMPT = `You are an expert assessment creator for {{STREAM_NAME}} education.

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

export const SYSTEM_PROMPT = `You are an expert assessment creator. Generate a skill assessment SPECIFICALLY for the course: {{COURSE_NAME}}

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
