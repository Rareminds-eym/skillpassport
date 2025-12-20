/**
 * AI-Powered Skill Assessment Generator
 * Uses the structured template to generate course assessments
 */

const SYSTEM_PROMPT = `Create a structured skill assessment using the following inputs:

Course / Skill Name: {{COURSE_NAME}}
Assessment Level: {{LEVEL}}   // Beginner | Intermediate | Advanced
Assessment Purpose: Learning Evaluation + Skill Benchmarking
Number of Questions: {{QUESTION_COUNT}}

Difficulty Guidelines:
- Beginner: fundamental concepts, terminology, simple examples
- Intermediate: applied usage, real-world scenarios, debugging or logic
- Advanced: complex problem-solving, edge cases, architectural or optimization thinking

Question Design Rules:
1. Questions must be strictly relevant to the given course.
2. Avoid theoretical definitions where practical understanding is expected.
3. Mix question formats:
   - Multiple Choice (MCQ)
   - Scenario-based questions
   - Short answer questions
4. Each question must have exactly ONE correct answer.
5. No duplicate or overly similar questions.
6. Questions should reflect real-world industry expectations.
7. Do NOT include explanations or hints.
8. Do NOT reveal answers in the question text.
9. Content must be original and not copied from public test banks.

Output Rules:
- Respond ONLY in valid JSON
- Do NOT include markdown, commentary, or extra text

Required JSON format:
{
  "course": "{{COURSE_NAME}}",
  "level": "{{LEVEL}}",
  "total_questions": {{QUESTION_COUNT}},
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "{{LEVEL}}",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "skill_tag": "specific skill being tested"
    },
    {
      "id": 2,
      "type": "short_answer",
      "difficulty": "{{LEVEL}}",
      "question": "Question text",
      "correct_answer": "Expected answer",
      "skill_tag": "specific skill being tested"
    }
  ]
}`;

async function generateAssessmentWithAI(courseName, level, questionCount, apiKey) {
  const prompt = SYSTEM_PROMPT
    .replace(/\{\{COURSE_NAME\}\}/g, courseName)
    .replace(/\{\{LEVEL\}\}/g, level)
    .replace(/\{\{QUESTION_COUNT\}\}/g, questionCount);

  // Example using OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert assessment creator. Generate only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const assessmentJSON = data.choices[0].message.content;
  
  return JSON.parse(assessmentJSON);
}

function validateAssessment(assessment) {
  const errors = [];
  
  if (!assessment.course) errors.push('Missing course name');
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(assessment.level)) {
    errors.push('Invalid level');
  }
  if (assessment.questions.length !== assessment.total_questions) {
    errors.push('Question count mismatch');
  }
  
  assessment.questions.forEach((q, idx) => {
    if (!q.id) errors.push(`Question ${idx + 1}: Missing id`);
    if (!q.type) errors.push(`Question ${idx + 1}: Missing type`);
    if (!q.question) errors.push(`Question ${idx + 1}: Missing question text`);
    if (!q.correct_answer) errors.push(`Question ${idx + 1}: Missing correct answer`);
    if (!q.skill_tag) errors.push(`Question ${idx + 1}: Missing skill tag`);
    
    if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
      errors.push(`Question ${idx + 1}: MCQ must have at least 2 options`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

module.exports = {
  SYSTEM_PROMPT,
  generateAssessmentWithAI,
  validateAssessment
};
