/**
 * 👨‍💻 CODE MENTOR SERVICE
 * 
 * Provides:
 * - Intelligent code review
 * - Refactoring suggestions
 * - Best practices guidance
 * - Security analysis
 * - Performance optimization tips
 * - Learning-focused feedback
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export interface CodeReviewResult {
  overallQuality: 'Excellent' | 'Good' | 'Needs Improvement' | 'Problematic';
  score: number; // 0-100
  
  strengths: string[];
  improvements: Array<{
    type: 'critical' | 'important' | 'nice-to-have';
    category: 'security' | 'performance' | 'readability' | 'best-practices' | 'logic';
    issue: string;
    explanation: string;
    suggestedFix: string;
    codeExample?: string;
  }>;
  
  refactoredCode?: string;
  learningPoints: string[];
  resourceLinks: string[];
  encouragement: string;
}

export interface DebuggingHelp {
  problemAnalysis: string;
  likelyCauses: Array<{
    cause: string;
    probability: number;
    explanation: string;
  }>;
  
  debuggingSteps: Array<{
    step: number;
    action: string;
    whatToLookFor: string;
  }>;
  
  possibleSolutions: Array<{
    solution: string;
    codeExample: string;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
  
  preventionTips: string[];
  relatedConcepts: string[];
}

class CodeMentorService {
  
  /**
   * 📝 Review Code: Comprehensive analysis with mentorship tone
   */
  async reviewCode(
    code: string,
    language: string,
    context?: string,
    studentLevel?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<CodeReviewResult> {
    
    try {
      console.log('👨‍💻 Code Mentor: Analyzing code...');
      
      const prompt = `You are a friendly, experienced coding mentor reviewing a student's code. Be constructive, encouraging, and educational.

**STUDENT LEVEL:** ${studentLevel || 'intermediate'}

**PROGRAMMING LANGUAGE:** ${language}

${context ? `**CONTEXT:** ${context}\n` : ''}

**CODE TO REVIEW:**
\`\`\`${language}
${code}
\`\`\`

**YOUR REVIEW TASK:**

1️⃣ **Overall Assessment**
   - Quality rating: Excellent/Good/Needs Improvement/Problematic
   - Score: 0-100 (be honest but encouraging)

2️⃣ **What They Did Well** (Strengths - at least 2-3 things)
   - Specific positive observations
   - Good practices they're already following
   - Build their confidence!

3️⃣ **Areas for Improvement** (Categorized by priority)
   
   **CRITICAL** (Must fix - security/major bugs):
   - Security vulnerabilities
   - Logic errors that break functionality
   - Data integrity issues
   
   **IMPORTANT** (Should fix - quality/performance):
   - Performance bottlenecks
   - Poor error handling
   - Code organization issues
   - Important best practices
   
   **NICE-TO-HAVE** (Polish):
   - Better naming conventions
   - Additional comments
   - Minor optimizations
   - Code style improvements

   For EACH improvement:
   - Type: critical/important/nice-to-have
   - Category: security/performance/readability/best-practices/logic
   - Issue: What's wrong
   - Explanation: WHY it matters (educational)
   - Suggested Fix: HOW to fix it
   - Code Example: Show the fix (if applicable)

4️⃣ **Refactored Version** (Optional, if major improvements needed)
   - Show improved version of the code
   - Explain what changed

5️⃣ **Learning Points** (Key takeaways)
   - What concepts to study
   - What they learned from this
   - How to improve further

6️⃣ **Encouragement** (Motivational closing)
   - Personalized encouragement
   - Acknowledge their progress
   - Keep them motivated!

**MENTORSHIP GUIDELINES:**
- Be KIND and CONSTRUCTIVE, never harsh
- Explain the "why" behind each suggestion
- Celebrate what they did right
- For beginners: Extra patient, more explanations
- For advanced: Challenge them with optimization ideas
- Always end on a positive, encouraging note

**OUTPUT FORMAT (JSON only):**
{
  "overallQuality": "Good",
  "score": 75,
  "strengths": [
    "Clear variable naming makes code easy to read",
    "Good use of functions to separate concerns",
    "Proper error handling in the main function"
  ],
  "improvements": [
    {
      "type": "critical",
      "category": "security",
      "issue": "SQL Injection vulnerability in user input",
      "explanation": "Directly concatenating user input into SQL queries allows attackers to execute malicious SQL code. This could compromise your entire database.",
      "suggestedFix": "Use parameterized queries or an ORM to sanitize inputs",
      "codeExample": "// Instead of: db.query('SELECT * FROM users WHERE id = ' + userId)\\n// Use: db.query('SELECT * FROM users WHERE id = ?', [userId])"
    },
    {
      "type": "important",
      "category": "performance",
      "issue": "Inefficient loop causing O(n²) complexity",
      "explanation": "Nested loops over the same array create quadratic time complexity. With large datasets, this could slow down significantly.",
      "suggestedFix": "Use a hash map or Set for O(1) lookups instead of nested loops",
      "codeExample": "const seen = new Set();\\nfor (const item of array) {\\n  if (!seen.has(item)) { /* ... */ }\\n}"
    }
  ],
  "refactoredCode": "// Improved version here...",
  "learningPoints": [
    "Always sanitize user inputs to prevent injection attacks",
    "Consider time complexity when writing loops",
    "Use appropriate data structures (Sets, Maps) for better performance"
  ],
  "resourceLinks": [
    "OWASP SQL Injection Prevention Cheatsheet",
    "Big O Notation explained",
    "JavaScript Sets and Maps guide"
  ],
  "encouragement": "Great work on structuring your code with functions! You're clearly thinking about code organization. The security improvements will make your code production-ready. Keep coding - you're on the right path! 🚀"
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert coding mentor who provides detailed, educational code reviews. You are encouraging and constructive, focusing on teaching rather than criticizing. You explain WHY behind every suggestion.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      console.log('✅ Code Review Complete:',result.overallQuality, `(${result.score}/100)`);
      console.log('👍 Strengths:', result.strengths?.length || 0);
      console.log('⚠️  Improvements:', result.improvements?.length || 0);
      
      return result as CodeReviewResult;
      
    } catch (error) {
      console.error('Code review error:', error);
      throw new Error('Failed to review code');
    }
  }
  
  /**
   * 🐛 Debugging Help: Analyze error and provide solutions
   */
  async helpDebug(
    code: string,
    error: string,
    language: string,
    context?: string
  ): Promise<DebuggingHelp> {
    
    try {
      console.log('🐛 Code Mentor: Helping debug issue...');
      
      const prompt = `You are a patient debugging mentor helping a student fix their code.

**LANGUAGE:** ${language}

**ERROR MESSAGE:**
${error}

${context ? `**CONTEXT:** ${context}\n` : ''}

**CODE:**
\`\`\`${language}
${code}
\`\`\`

**YOUR DEBUGGING HELP:**

1️⃣ **Problem Analysis** (What's happening)
   - Explain the error in simple terms
   - What does this error mean?
   - Where is it likely occurring?

2️⃣ **Likely Causes** (Ranked by probability)
   - List 3-5 most probable causes
   - Explain WHY each could be the issue
   - Probability: 0.0 to 1.0

3️⃣ **Step-by-Step Debugging** (How to find the issue)
   - Action: What to do
   - What to look for: Expected results
   - Methodical approach

4️⃣ **Possible Solutions** (Multiple approaches)
   - Different ways to fix it
   - Code examples for each
   - Difficulty level
   - Pros/cons if applicable

5️⃣ **Prevention Tips** (Avoid this in future)
   - How to prevent this error
   - Best practices
   - Tools that can help

6️⃣ **Related Concepts** (What to study)
   - Concepts to understand better
   - Why this error happens
   - Deeper learning

**OUTPUT (JSON):**
{
  "problemAnalysis": "The error 'Cannot read property of undefined' means you're trying to access a property on a variable that hasn't been initialized or doesn't exist. This is happening on line 15.",
  "likelyCauses": [
    {
      "cause": "Variable not initialized before use",
      "probability": 0.7,
      "explanation": "You're accessing 'user.name' but 'user' might be undefined if the API call failed"
    },
    {
      "cause": "Async timing issue",
      "probability": 0.6,
      "explanation": "The code runs before the data is fetched from the API"
    },
    {
      "cause": "Typo in variable name",
      "probability": 0.3,
      "explanation": "Variable might be named differently than expected"
    }
  ],
  "debuggingSteps": [
    {
      "step": 1,
      "action": "Add console.log(user) before line 15",
      "whatToLookFor": "Check if user is undefined or null"
    },
    {
      "step": 2,
      "action": "Check the API response in Network tab",
      "whatToLookFor": "Verify data structure matches expectations"
    },
    {
      "step": 3,
      "action": "Add conditional check: if (user) { ... }",
      "whatToLookFor": "See if error goes away"
    }
  ],
  "possibleSolutions": [
    {
      "solution": "Optional Chaining",
      "codeExample": "const name = user?.name || 'Guest';",
      "explanation": "Safely access property even if user is undefined",
      "difficulty": "Easy"
    },
    {
      "solution": "Defensive Check",
      "codeExample": "if (user && user.name) {\\n  console.log(user.name);\\n}",
      "explanation": "Explicitly check if user exists before accessing",
      "difficulty": "Easy"
    },
    {
      "solution": "Default Values",
      "codeExample": "const user = await fetchUser() || { name: 'Guest' };",
      "explanation": "Provide fallback object if API fails",
      "difficulty": "Medium"
    }
  ],
  "preventionTips": [
    "Always initialize variables before use",
    "Use optional chaining (?.) for potentially undefined values",
    "Add error handling for API calls",
    "Use TypeScript for type safety",
    "Test edge cases (null, undefined, empty)"
  ],
  "relatedConcepts": [
    "Null vs Undefined in JavaScript",
    "Optional Chaining operator (?.)",
    "Defensive programming",
    "Error handling patterns",
    "Async/await best practices"
  ]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a patient debugging mentor. You help students understand errors, find the root cause methodically, and learn from mistakes. Be clear, educational, and encouraging.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      console.log('🐛 Debugging Help Generated');
      console.log('🔍 Likely causes identified:', result.likelyCauses?.length || 0);
      console.log('💡 Solutions provided:', result.possibleSolutions?.length || 0);
      
      return result as DebuggingHelp;
      
    } catch (error) {
      console.error('Debugging help error:', error);
      throw new Error('Failed to generate debugging help');
    }
  }
  
  /**
   * 💡 Explain Code: Help understand what code does
   */
  async explainCode(
    code: string,
    language: string,
    studentLevel?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<string> {
    
    try {
      const prompt = `Explain this ${language} code to a ${studentLevel || 'intermediate'} level student:

\`\`\`${language}
${code}
\`\`\`

**Explanation should include:**
1. What the code does (high level)
2. Step-by-step walkthrough (line by line for beginners, block by block for advanced)
3. Key concepts used
4. Why it's written this way
5. Real-world analogy if helpful

Be clear, educational, and adjust complexity to student level.`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a coding tutor who explains code clearly and patiently. You adapt explanations to student level.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1500
      });
      
      return completion.choices[0]?.message?.content || 'Unable to explain code at this time.';
      
    } catch (error) {
      console.error('Code explanation error:', error);
      return 'Unable to explain code at this time.';
    }
  }
}

export default new CodeMentorService();
