/**
 * 🎯 STUDENT PROBLEM SOLVER SERVICE
 *
 * Addresses REAL student struggles:
 * - Imposter syndrome ("I'm not good enough")
 * - Learning overwhelm ("Too much to learn")
 * - Time management ("Can't balance everything")
 * - Project completion anxiety ("Can't finish projects")
 * - Interview fear ("Nervous about interviews")
 * - Skill validation ("Am I actually learning?")
 * - Career uncertainty ("Don't know what path to take")
 * - Comparison trap ("Everyone is better than me")
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export type StudentProblem =
  | 'imposter-syndrome'
  | 'learning-overwhelm'
  | 'time-management'
  | 'project-completion'
  | 'interview-anxiety'
  | 'skill-validation'
  | 'career-uncertainty'
  | 'comparison-trap'
  | 'motivation-loss'
  | 'technical-confusion';

export interface ProblemSolution {
  problemIdentified: StudentProblem;
  empathyStatement: string; // "I understand you're feeling..."
  rootCause: string; // Why this happens
  immediateActions: Array<{
    action: string;
    why: string;
    howTo: string;
  }>;
  longTermStrategy: string[];
  mindsetShift: string;
  successStories: string; // Relatable examples
  resources: string[];
  encouragement: string;
}

class StudentProblemSolverService {
  /**
   * 🎯 Identify and Solve Student Problem
   * Detects underlying issues and provides actionable solutions
   */
  async solveStudentProblem(
    studentMessage: string,
    emotionalTone?: string,
    studentContext?: {
      skills: string[];
      learningDuration?: string;
      recentActivity?: string;
    }
  ): Promise<ProblemSolution> {
    try {
      console.log('🎯 Student Problem Solver: Analyzing issue...');

      const prompt = `You are an empathetic student mentor who understands the REAL struggles students face. Not just technical problems, but emotional and psychological challenges.

**STUDENT'S MESSAGE:**
"${studentMessage}"

**EMOTIONAL TONE:** ${emotionalTone || 'neutral'}

${
  studentContext
    ? `**STUDENT CONTEXT:**
- Skills: ${studentContext.skills.join(', ')}
- Learning for: ${studentContext.learningDuration || 'Unknown'}
- Recent activity: ${studentContext.recentActivity || 'Unknown'}`
    : ''
}

**YOUR TASK:**
Identify the REAL problem and provide practical, empathetic solutions.

**COMMON STUDENT PROBLEMS:**

1️⃣ **IMPOSTER SYNDROME** 🎭
   Signals: "not good enough", "everyone better", "don't belong", "fake", "luck"
   Feeling: Inadequate despite evidence of competence

2️⃣ **LEARNING OVERWHELM** 😵
   Signals: "too much", "don't know where to start", "so many things", "overwhelming"
   Feeling: Paralyzed by the amount to learn

3️⃣ **TIME MANAGEMENT** ⏰
   Signals: "no time", "can't balance", "too busy", "juggling"
   Feeling: Stretched too thin

4️⃣ **PROJECT COMPLETION ANXIETY** 😰
   Signals: "can't finish", "start many projects", "stuck halfway", "give up"
   Feeling: Unable to complete what they start

5️⃣ **INTERVIEW ANXIETY** 😨
   Signals: "nervous", "scared of interviews", "freeze up", "blanking"
   Feeling: Fear of technical interviews

6️⃣ **SKILL VALIDATION** ❓
   Signals: "am I actually learning", "is this enough", "doubt progress"
   Feeling: Unsure if they're truly improving

7️⃣ **CAREER UNCERTAINTY** 🤔
   Signals: "don't know what to do", "confused about career", "many options"
   Feeling: Lost about career direction

8️⃣ **COMPARISON TRAP** 📊
   Signals: "others are ahead", "X already knows Y", "I'm behind"
   Feeling: Constantly comparing to others

9️⃣ **MOTIVATION LOSS** 😔
   Signals: "lost interest", "not motivated", "don't feel like learning"
   Feeling: Burnt out or demotivated

🔟 **TECHNICAL CONFUSION** 🤷
   Signals: "don't understand", "concept is hard", "not clicking"
   Feeling: Struggling with specific concepts

**SOLUTION STRUCTURE:**

1️⃣ **Empathy First** 
   - Validate their feelings
   - Show you understand
   - "You're not alone in feeling this"

2️⃣ **Root Cause Analysis**
   - Why does this happen?
   - It's normal and common
   - Explain the psychology

3️⃣ **Immediate Actions** (3-5 actionable steps)
   - What to do RIGHT NOW
   - Specific, not generic
   - Quick wins

4️⃣ **Long-Term Strategy**
   - Sustainable approach
   - Habits to build
   - Mindset changes

5️⃣ **Mindset Shift**
   - Reframe the problem
   - New perspective
   - Empowering belief

6️⃣ **Success Stories**
   - Relatable examples
   - "Others felt this way too"
   - They overcame it

7️⃣ **Resources**
   - Tools, articles, communities
   - Practical help

8️⃣ **Encouragement**
   - Warm, genuine closing
   - Believe in them
   - They CAN do this

**OUTPUT (JSON):**
{
  "problemIdentified": "imposter-syndrome",
  "empathyStatement": "I completely understand feeling like you're not good enough, even when you've achieved things. This is called imposter syndrome, and you're definitely not alone - about 70% of developers experience this at some point.",
  "rootCause": "Imposter syndrome often comes from comparing your behind-the-scenes struggles to everyone else's highlight reel. You see others' finished work but not their learning journey. The tech field moves fast, making everyone feel like they're always catching up.",
  "immediateActions": [
    {
      "action": "Document your wins",
      "why": "Your brain forgets progress quickly. Writing it down makes it real and visible.",
      "howTo": "Start a 'wins journal' - every day, write ONE thing you learned or accomplished. Even small wins count: 'understood closures', 'fixed that bug', 'helped a classmate'."
    },
    {
      "action": "Talk to 3 peers",
      "why": "You'll discover they feel the same way. Imposter syndrome thrives in isolation.",
      "howTo": "Ask: 'Do you ever feel like you don't know enough?' You'll be surprised how many say YES."
    },
    {
      "action": "Review your GitHub/projects",
      "why": "Evidence defeats feelings. Your code is proof of your skills.",
      "howTo": "Look at a project you built 3 months ago. See how much you've improved? That's real growth."
    }
  ],
  "longTermStrategy": [
    "Share your learning journey publicly (Twitter, blog) - teaching solidifies knowledge",
    "Find a mentor or peer group - regular reality checks help",
    "Focus on YOUR timeline, not others' - everyone's path is different",
    "Embrace 'not knowing' as part of learning - experts were once beginners too"
  ],
  "mindsetShift": "Instead of 'I'm a fraud', try 'I'm a learner'. Every expert was once a confused beginner. The fact that you CARE about being good enough shows you're already on the right path. Confidence comes from doing, not from feeling ready.",
  "successStories": "Many successful developers openly share their imposter syndrome stories: - A senior engineer at Google once said she felt like a fraud for 5 years - The creator of Ruby on Rails talks about constantly feeling inadequate - Most tech Twitter is full of 'I don't know what I'm doing' confessions. You're in good company.",
  "resources": [
    "Book: 'The Imposter Cure' by Dr. Jessamy Hibberd",
    "Article: 'Overcoming Imposter Syndrome' on Dev.to",
    "Community: r/learnprogramming (full of people feeling the same way)",
    "Talk: 'Imposter Syndrome and Individual Competence' (YouTube)"
  ],
  "encouragement": "The fact that you're worried about being good enough actually proves you care about quality - that's a STRENGTH, not a weakness. You belong here. Every line of code you write, every bug you fix, every concept you grasp is proof that you're not an imposter - you're a developer in the making. Keep going. You've got this. 💪"
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an exceptionally empathetic student mentor. You understand that learning to code is as much emotional as it is technical. You provide practical, actionable advice while validating feelings. You are warm, genuine, and never dismissive.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7, // Slightly higher for more empathetic, human responses
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      console.log('🎯 Problem Identified:', result.problemIdentified);
      console.log('💚 Empathy provided');
      console.log('🎬 Immediate actions:', result.immediateActions?.length || 0);
      console.log('📚 Resources:', result.resources?.length || 0);

      return result as ProblemSolution;
    } catch (error) {
      console.error('Problem solving error:', error);
      throw new Error('Failed to analyze student problem');
    }
  }

  /**
   * 💪 Generate Motivational Boost
   * For when students just need encouragement
   */
  async generateMotivation(studentContext: {
    recentAchievements?: string[];
    currentChallenge?: string;
    skillLevel?: string;
  }): Promise<string> {
    try {
      const prompt = `Generate a personalized, genuine motivational message for a student.

${studentContext.recentAchievements ? `Recent wins: ${studentContext.recentAchievements.join(', ')}` : ''}
${studentContext.currentChallenge ? `Current challenge: ${studentContext.currentChallenge}` : ''}
Skill level: ${studentContext.skillLevel || 'Learning'}

Create a SHORT (3-4 sentences), warm, GENUINE motivational message. Not generic platitudes. Acknowledge their specific situation and encourage them forward.

Be personal, honest, and energizing. Like a mentor who really cares.`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You write genuine, personalized encouragement that actually motivates people. No generic quotes.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      return (
        completion.choices[0]?.message?.content ||
        "Keep pushing forward - you're doing better than you think! 💪"
      );
    } catch (error) {
      return 'Every expert was once a beginner. Your consistency will compound. Keep going! 🚀';
    }
  }

  /**
   * 📋 Quick Problem Detection
   * Fast check if message contains common student problems
   */
  detectProblemType(message: string): StudentProblem | null {
    const lowerMessage = message.toLowerCase();

    // Imposter syndrome indicators
    if (
      /(not good enough|everyone.{1,20}better|don't belong|feel like.{1,20}fraud|fake|luck)/i.test(
        lowerMessage
      )
    ) {
      return 'imposter-syndrome';
    }

    // Learning overwhelm
    if (/(too much|overwhelm|don't know where to start|so many things)/i.test(lowerMessage)) {
      return 'learning-overwhelm';
    }

    // Time management
    if (/(no time|can't balance|too busy|juggling)/i.test(lowerMessage)) {
      return 'time-management';
    }

    // Project completion
    if (/(can't finish|start many|stuck halfway|give up|never complete)/i.test(lowerMessage)) {
      return 'project-completion';
    }

    // Interview anxiety
    if (/(nervous.{1,20}interview|scared.{1,20}interview|freeze|blank)/i.test(lowerMessage)) {
      return 'interview-anxiety';
    }

    // Skill validation
    if (
      /(am i.{1,30}learning|is this enough|doubt.{1,20}progress|actually learning)/i.test(
        lowerMessage
      )
    ) {
      return 'skill-validation';
    }

    // Career uncertainty
    if (
      /(don't know what|confused.{1,20}career|many options|what should i do)/i.test(lowerMessage)
    ) {
      return 'career-uncertainty';
    }

    // Comparison trap
    if (/(others.{1,20}ahead|already knows|i'm behind|comparing myself)/i.test(lowerMessage)) {
      return 'comparison-trap';
    }

    // Motivation loss
    if (/(lost interest|not motivated|don't feel like|burnt out|demotivated)/i.test(lowerMessage)) {
      return 'motivation-loss';
    }

    // Technical confusion
    if (/(don't understand|hard to understand|not clicking|confusing)/i.test(lowerMessage)) {
      return 'technical-confusion';
    }

    return null;
  }
}

export default new StudentProblemSolverService();
