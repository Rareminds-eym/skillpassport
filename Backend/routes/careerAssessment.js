import express from 'express';
const router = express.Router();

/**
 * Career Assessment AI Question Generation API
 * Generates Aptitude and Stream Knowledge questions using Claude AI
 */

// System prompt for knowledge questions
const KNOWLEDGE_SYSTEM_PROMPT = `You are an expert assessment creator for career guidance. Generate stream-specific knowledge questions for: {{STREAM_NAME}}

REQUIREMENTS:
1. Questions must test practical knowledge relevant to {{STREAM_NAME}}
2. Use terminology and concepts specific to {{STREAM_NAME}}
3. Mix difficulty levels: 40% easy, 40% medium, 20% hard
4. All questions must be MCQ with 4 options
5. Each question must have exactly ONE correct answer

Topics to cover: {{TOPICS}}

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting
- NO explanatory text

Required JSON structure:
{
  "stream": "{{STREAM_ID}}",
  "questions": [
    {
      "id": "knowledge_{{STREAM_ID}}_1",
      "type": "mcq",
      "question": "Question text about {{STREAM_NAME}}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "skill_tag": "Topic name",
      "difficulty": "easy|medium|hard",
      "estimated_time": 60
    }
  ]
}`;

// System prompt for aptitude questions
const APTITUDE_SYSTEM_PROMPT = `You are an expert psychometric assessment creator. Generate aptitude questions for career assessment.

REQUIREMENTS:
1. Create questions for these categories: {{CATEGORIES}}
2. Questions should be stream-agnostic but professionally relevant
3. Mix difficulty: 30% easy, 50% medium, 20% hard
4. All questions must be MCQ with 4 options
5. Each question must have exactly ONE correct answer
6. Include time estimates based on difficulty

Category Guidelines:
- Verbal: Reading comprehension, vocabulary, analogies, sentence completion
- Numerical: Basic math, percentages, ratios, data interpretation
- Logical: Syllogisms, patterns, deductive reasoning, sequences
- Spatial: Shape rotation, pattern matching, visual puzzles
- Abstract: Non-verbal patterns, figure series, odd one out

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting

Required JSON structure:
{
  "questions": [
    {
      "id": "aptitude_{{CATEGORY}}_1",
      "type": "mcq",
      "category": "verbal|numerical|logical|spatial|abstract",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "skill_tag": "Specific skill being tested",
      "difficulty": "easy|medium|hard",
      "estimated_time": 45
    }
  ]
}`;

/**
 * POST /api/career-assessment/generate-knowledge
 * Generate stream-specific knowledge questions
 */
router.post('/generate-knowledge', async (req, res) => {
  try {
    const { streamId, streamName, topics, questionCount = 20 } = req.body;

    if (!streamId || !streamName) {
      return res.status(400).json({ error: 'Stream ID and name are required' });
    }

    console.log('🎯 Generating knowledge questions for:', streamName);

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Check for existing questions
    const { data: existing } = await supabase
      .from('career_assessment_ai_questions')
      .select('questions')
      .eq('stream_id', streamId)
      .eq('question_type', 'knowledge')
      .eq('is_active', true)
      .single();

    if (existing?.questions?.length >= questionCount) {
      console.log('✅ Returning cached knowledge questions');
      return res.json({ questions: existing.questions, cached: true });
    }

    // Build prompt
    const prompt = KNOWLEDGE_SYSTEM_PROMPT
      .replace(/\{\{STREAM_NAME\}\}/g, streamName)
      .replace(/\{\{STREAM_ID\}\}/g, streamId)
      .replace(/\{\{TOPICS\}\}/g, topics.join(', '));

    // Get API key
    const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

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
        max_tokens: 8000,
        temperature: 0.7,
        system: `Generate ${questionCount} knowledge questions for ${streamName}. Output ONLY valid JSON.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to generate questions' });
    }

    const data = await response.json();
    let jsonText = data.content[0].text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const result = JSON.parse(jsonText);

    // Validate and fix questions
    const questions = result.questions.map((q, idx) => ({
      ...q,
      id: q.id || `knowledge_${streamId}_${idx + 1}`,
      type: 'mcq',
      estimated_time: q.estimated_time || 60
    }));

    // Save to database
    await supabase
      .from('career_assessment_ai_questions')
      .upsert({
        stream_id: streamId,
        question_type: 'knowledge',
        questions: questions,
        generated_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'stream_id,question_type' });

    console.log('✅ Generated and saved', questions.length, 'knowledge questions');
    res.json({ questions, cached: false });

  } catch (error) {
    console.error('Error generating knowledge questions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-assessment/generate-aptitude
 * Generate aptitude questions
 */
router.post('/generate-aptitude', async (req, res) => {
  try {
    const { streamId, categories, questionCount = 50, questionsPerCategory = 10 } = req.body;

    console.log('🎯 Generating aptitude questions');

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Check for existing questions
    const { data: existing } = await supabase
      .from('career_assessment_ai_questions')
      .select('questions')
      .eq('stream_id', streamId || 'general')
      .eq('question_type', 'aptitude')
      .eq('is_active', true)
      .single();

    if (existing?.questions?.length >= questionCount) {
      console.log('✅ Returning cached aptitude questions');
      return res.json({ questions: existing.questions, cached: true });
    }

    // Get API key
    const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    const categoryNames = categories.map(c => `${c.name} (${c.description})`).join('\n- ');
    
    const prompt = APTITUDE_SYSTEM_PROMPT
      .replace(/\{\{CATEGORIES\}\}/g, categoryNames)
      .replace(/\{\{CATEGORY\}\}/g, 'mixed');

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
        max_tokens: 12000,
        temperature: 0.7,
        system: `Generate ${questionCount} aptitude questions (${questionsPerCategory} per category). Output ONLY valid JSON.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to generate questions' });
    }

    const data = await response.json();
    let jsonText = data.content[0].text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const result = JSON.parse(jsonText);

    // Validate and fix questions
    const questions = result.questions.map((q, idx) => ({
      ...q,
      id: q.id || `aptitude_${q.category || 'general'}_${idx + 1}`,
      type: 'mcq',
      estimated_time: q.estimated_time || (q.difficulty === 'easy' ? 45 : q.difficulty === 'hard' ? 90 : 60)
    }));

    // Save to database
    await supabase
      .from('career_assessment_ai_questions')
      .upsert({
        stream_id: streamId || 'general',
        question_type: 'aptitude',
        questions: questions,
        generated_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'stream_id,question_type' });

    console.log('✅ Generated and saved', questions.length, 'aptitude questions');
    res.json({ questions, cached: false });

  } catch (error) {
    console.error('Error generating aptitude questions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
