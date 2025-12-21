import express from 'express';
import { generateFallbackAssessment } from '../services/fallbackAssessmentGenerator.js';
const router = express.Router();

/**
 * Assessment Generation API
 * Proxies requests to Claude AI to avoid CORS issues
 */

const SYSTEM_PROMPT = `You are an expert assessment creator. Generate a skill assessment SPECIFICALLY for the course: {{COURSE_NAME}}

CRITICAL REQUIREMENTS:
1. ALL questions MUST be directly related to {{COURSE_NAME}}
2. Questions should test practical knowledge of {{COURSE_NAME}}
3. Use terminology, concepts, and examples from {{COURSE_NAME}}
4. DO NOT generate generic programming or general knowledge questions
5. Focus on the specific skills taught in {{COURSE_NAME}}
6. Generate EXACTLY {{QUESTION_COUNT}} questions with this distribution:
   - First 5 questions: EASY difficulty
   - Next 5 questions: MEDIUM difficulty
   - Last 5 questions: HARD difficulty

Course Details:
- Course Name: {{COURSE_NAME}}
- Assessment Level: {{LEVEL}}
- Number of Questions: {{QUESTION_COUNT}} (5 easy + 5 medium + 5 hard)
- Purpose: Evaluate student's understanding of {{COURSE_NAME}}

Difficulty Guidelines:
- EASY (Questions 1-5): Fundamental concepts requiring understanding, not just recall about {{COURSE_NAME}} (45-60 seconds per question)
  * Conceptual understanding
  * Basic application
  * Fundamental problem-solving
  * Example: "Why would you use a specific feature in {{COURSE_NAME}}?"
  
- MEDIUM (Questions 6-10): Complex application, debugging, and analysis in {{COURSE_NAME}} (75-90 seconds per question)
  * Multi-step problem-solving
  * Code analysis
  * Debugging scenarios
  * Comparing multiple approaches
  * Example: "What would be the output of this code?"
  
- HARD (Questions 11-15): Advanced optimization, edge cases, architectural decisions in {{COURSE_NAME}} (100-120 seconds per question)
  * Complex scenarios
  * Performance optimization
  * Best practices in production
  * Edge cases and error handling
  * Example: "How would you optimize this for large-scale applications?"

Question Design Rules:
1. Every question MUST mention or relate to {{COURSE_NAME}} concepts
2. Use specific terminology from {{COURSE_NAME}}
3. Include practical scenarios relevant to {{COURSE_NAME}}
4. All questions must be MCQ (multiple choice) with 4 options
5. Each MCQ must have exactly 4 options with exactly ONE correct answer
6. Options should be plausible but clearly distinguishable
7. Avoid trick questions or ambiguous wording
8. Test understanding, not memorization
9. STRICTLY follow the difficulty distribution: 5 easy, 5 medium, 5 hard

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting (no \`\`\`json)
- NO explanatory text before or after JSON
- NO comments in the JSON

CRITICAL: Every question MUST have ALL these fields:
- id (number: 1 to {{QUESTION_COUNT}})
- type (string: always "mcq")
- difficulty (string: "easy" for Q1-5, "medium" for Q6-10, "hard" for Q11-15)
- question (string: the actual question text)
- options (array of exactly 4 strings)
- correct_answer (string - REQUIRED! Must match one of the options exactly)
- skill_tag (string: specific skill being tested)
- estimated_time (number: 30-45 for easy, 60-75 for medium, 90-120 for hard)

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
      "question": "Basic question about {{COURSE_NAME}}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "{{COURSE_NAME}} Fundamentals",
      "estimated_time": 40
    },
    {
      "id": 6,
      "type": "mcq",
      "difficulty": "medium",
      "question": "Intermediate question about {{COURSE_NAME}}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option C",
      "skill_tag": "{{COURSE_NAME}} Application",
      "estimated_time": 65
    },
    {
      "id": 11,
      "type": "mcq",
      "difficulty": "hard",
      "question": "Advanced question about {{COURSE_NAME}}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "skill_tag": "{{COURSE_NAME}} Advanced Concepts",
      "estimated_time": 100
    }
  ]
}

IMPORTANT: Generate questions that someone studying {{COURSE_NAME}} would expect to see. Make it obvious this is a {{COURSE_NAME}} assessment, not a general test.`;

/**
 * POST /api/assessment/generate
 * Generate course-specific assessment questions
 * Checks for existing questions first, only generates if not found
 */
router.post('/generate', async (req, res) => {
  try {
    const { courseName, level = 'Intermediate', questionCount = 15, studentId } = req.body;

    if (!courseName) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    console.log('🎯 Checking for existing questions for:', courseName, 'Level:', level);

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Check if questions already exist for this certificate
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('generated_external_assessment')
      .select('*')
      .eq('certificate_name', courseName)
      .single();

    if (existingQuestions && !fetchError) {
      console.log('✅ Found existing questions for:', courseName);
      return res.json({
        course: courseName,
        level: existingQuestions.assessment_level,
        total_questions: existingQuestions.total_questions,
        questions: existingQuestions.questions,
        cached: true
      });
    }

    console.log('📝 No existing questions found, generating new ones...');

    // Build prompt
    const prompt = SYSTEM_PROMPT
      .replace(/\{\{COURSE_NAME\}\}/g, courseName)
      .replace(/\{\{LEVEL\}\}/g, level)
      .replace(/\{\{QUESTION_COUNT\}\}/g, questionCount);

    // Get API key from environment
    const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      console.error('❌ Claude API key not configured');
      return res.status(500).json({ 
        error: 'Claude API key not configured on server' 
      });
    }

    console.log('📡 Calling Claude AI API...');

    // Call Claude API - using claude-3-haiku (cheapest and most available)
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
        system: `You are an expert assessment creator specializing in ${courseName}. Generate ONLY valid JSON without any markdown formatting. Every question must be specifically about ${courseName}.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Claude API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to generate assessment' 
      });
    }

    const data = await response.json();
    let assessmentJSON = data.content[0].text;

    console.log('📝 Raw AI response received');

    // Clean up response
    assessmentJSON = assessmentJSON
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .trim();

    const assessment = JSON.parse(assessmentJSON);

    // Validate and fix questions
    if (assessment.questions) {
      // Ensure we have exactly the requested number of questions
      if (assessment.questions.length < questionCount) {
        console.warn(`⚠️ Only ${assessment.questions.length} questions generated, expected ${questionCount}`);
      }
      
      assessment.questions = assessment.questions.map((q, idx) => {
        // Fix missing correct_answer
        if (!q.correct_answer && q.options && q.options.length > 0) {
          console.warn(`⚠️ Question ${idx + 1} missing correct_answer, using first option`);
          q.correct_answer = q.options[0];
        }
        
        // Add estimated_time if missing
        if (!q.estimated_time) {
          const timeByDifficulty = {
            'easy': 50,
            'medium': 80,
            'hard': 110,
            'Beginner': 50,
            'Intermediate': 80,
            'Advanced': 110
          };
          q.estimated_time = timeByDifficulty[q.difficulty] || 80;
        }
        
        // Randomize option order for MCQ
        if (q.type === 'mcq' && q.options && q.options.length > 0) {
          const correctAnswer = q.correct_answer;
          const shuffled = [...q.options].sort(() => Math.random() - 0.5);
          q.options = shuffled;
          // Ensure correct_answer still matches after shuffle
          q.correct_answer = correctAnswer;
        }
        
        return q;
      });
      
      // Re-assign IDs
      assessment.questions = assessment.questions.map((q, idx) => ({
        ...q,
        id: idx + 1
      }));
    }

    console.log('✅ Assessment generated:', {
      course: assessment.course,
      questionCount: assessment.questions?.length,
      hasEstimatedTime: assessment.questions?.every(q => q.estimated_time)
    });

    // Save questions to database for future use
    const { error: insertError } = await supabase
      .from('generated_external_assessment')
      .insert({
        certificate_name: courseName,
        assessment_level: level,
        total_questions: questionCount,
        questions: assessment.questions,
        generated_by: 'claude-ai'
      });

    if (insertError) {
      console.error('⚠️ Failed to save questions to database:', insertError);
      // Continue anyway - we still have the questions
    } else {
      console.log('💾 Questions saved to database for future use');
    }

    // Return the assessment
    res.json(assessment);

  } catch (error) {
    console.error('❌ Error generating assessment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate assessment' 
    });
  }
});

export default router;
