/**
 * School Subject Question Prompts for After 10th Students
 */

export const SCHOOL_SUBJECT_PROMPT = `You are an expert educational assessment creator for 10th grade students in India who are about to choose their stream (Science/Commerce/Arts) for 11th-12th.

Generate questions to assess the student's aptitude across school subjects. This will help recommend the best stream for them.

⚠️ CRITICAL: You MUST generate the EXACT number of questions specified for each subject below.
⚠️ COUNT CAREFULLY: If a subject requires 10 questions, generate EXACTLY 10 questions for that subject.
⚠️ DO NOT generate more or fewer questions than specified.

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
- Questions should be appropriate for 10th grade level

⚠️ FINAL REMINDER: Before submitting your response, COUNT the questions in each subject to ensure you have generated the EXACT number specified above.`;

export function buildSchoolSubjectPrompt(
  categoriesText: string,
  streamName: string
): string {
  return SCHOOL_SUBJECT_PROMPT
    .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
    .replace(/\{\{STREAM_NAME\}\}/g, streamName);
}
