/**
 * Middle School (Grade 6-8) Report Generation Prompts
 *
 * Per PRD Section 18 & BRD Section 8: Generates 7 required outputs for learners, parents, educators
 *
 * OUTPUTS:
 * 1. capability_insights - Personalized feedback per 8-area capability wheel
 * 2. assessmentReport - Educator report (PRD 18.3)
 * 3. mission_recommendations - Structured for future LTE RAG lookup
 * 4. my_interest_worlds - "My Interest Worlds" learner discovery display (BRD Section 8.1 - Exposure & Interest)
 * 5. character_strengths_descriptions - Learner-friendly descriptions for each character strength
 * 6. explorer_insights - Detailed insights for explored/to_explore worlds (left panel of explorer map)
 * 7. thinking_styles - "Thinking Style Snapshot" showing pattern recognition, problem-solving, visual, decision-making
 *
 * WORD LIMITS (Grade 6-8 friendly, optimized for tokens):
 * - capability_insights: 30-40 words per area (insight + next_step)
 * - assessmentReport: 200-250 words
 * - mission_recommendations: 3-5 structured missions (not text)
 * - my_interest_worlds: 5-8 worlds, 15-20 words per evidenceSummary
 *
 * Per BRD Section 10: Capability Wheel Areas (8-area model)
 * Per BRD Section 8.1: Interest & Exposure discovery
 * Per PRD Section 5: Non-comparative, developmental language guardrails
 */

export interface BuildMiddleSchoolReportPromptInput {
  growth_map: {
    interest_worlds?: Array<{ label: string; score_out_of_5: number; status: string }>;
    character_strengths?: Array<{ label: string; score_out_of_5: number; status: string }>;
    self_social?: {
      self_eq?: Array<{ label: string; score_out_of_5: number; status: string }>;
      social_sq?: Array<{ label: string; score_out_of_5: number; status: string }>;
    };
    explorer_map?: {
      explored?: Array<{ label: string; exploration_level: number }>;
      to_explore?: Array<{ label: string; exploration_level: number }>;
    };
    capability_wheel?: Array<{ capability_area: string; score_out_of_5: number; percentage: number; status: string }>;
    what_i_have?: Array<{ capability_area: string; score_out_of_5: number }>;
    what_i_need_next?: Array<{ capability_area: string; score_out_of_5: number }>;
  };
  aptitude_scores?: {
    aptitudeLevel?: string;
    confidenceTag?: string;
    tier?: number;
    overallAccuracy?: number;
    accuracyByDifficulty?: { easy?: number; medium?: number; hard?: number };
    accuracyBySubtag?: {
      logical_reasoning?: number;
      pattern_recognition?: number;
      spatial_reasoning?: number;
      decision_making?: number;
      problem_solving?: number;
    };
    pathClassification?: string;
    averageResponseTimeMs?: number;
  };
  learner_name: string;
  learner_grade: string;
  school_name: string;
}

export interface MiddleSchoolReportPromptOutput {
  system: string;
  user: string;
}

/**
 * Build the system + user prompts for middle school report generation.
 * OPTIMIZED FOR GRADE 6-8 LEARNERS (ages 11-14)
 */
export function buildMiddleSchoolReportPrompt(input: BuildMiddleSchoolReportPromptInput): MiddleSchoolReportPromptOutput {
  const { growth_map, learner_name, learner_grade } = input;

  const system = `You are creating short, friendly reports for Grade ${learner_grade} learner ${learner_name}.

WRITE FOR 11-14 YEAR OLDS:
✓ SHORT sentences (10-15 words each)
✓ Simple words (avoid "capability", "assessment", "competency")
✓ Exciting & positive tone
✓ Use "you" when talking to learner
✓ Celebrate wins FIRST, then growth areas
✓ NO scores, percentages, or comparisons
✓ NO jargon or academic words

FORBIDDEN:
✗ "Below average", "weak", "poor", "struggling"
✗ Long paragraphs (max 3 sentences per section)
✗ Complex sentences
✗ Capability wheel terms
✗ Comparing to other students
✗ Diagnostic language

USE SIMPLE LANGUAGE:
✓ Instead of "emotional intelligence" → "understanding your feelings"
✓ Instead of "collaboration" → "working with friends"
✓ Instead of "digital literacy" → "using technology safely"
✓ Instead of "executive function" → "getting things done"
✓ Instead of "creativity" → "coming up with new ideas"`;

  // Exact world lists so REPORT 4 coverage can be stated (and later validated) explicitly
  const exploredLabels = (growth_map.explorer_map?.explored || []).map((w) => w.label);
  const toExploreLabels = (growth_map.explorer_map?.to_explore || []).map((w) => w.label);

  const user = `Create 8 short reports for ${learner_name} (Grade ${learner_grade}).

GROWTH MAP DATA:
${JSON.stringify(growth_map, null, 2)}

${
  input.aptitude_scores
    ? `
ADAPTIVE APTITUDE TEST DATA (for thinking_styles):
${JSON.stringify(input.aptitude_scores, null, 2)}
`
    : ''
}

---

RETURN THIS JSON (8 OUTPUTS ONLY - NO markdown, NO extra text):
{
  "character_strengths_descriptions": [
    {"label": "Curious", "description": "I love asking questions and learning new things about the world.", "tag": "Love Learning"},
    {"label": "Creative", "description": "I enjoy thinking of new ideas and finding different ways to solve problems.", "tag": "Idea Maker"},
    {"label": "Responsible", "description": "I complete my tasks carefully and do what I promise to do.", "tag": "Reliable"}
  ],
  "my_interest_worlds": [
    {"worldName": "Science & Inquiry", "evidenceSummary": "You love asking questions and figuring out how things work.", "status": "Explored"},
    {"worldName": "Technology & Making", "evidenceSummary": "You enjoy creating things and learning new tech skills.", "status": "Started Exploring"},
    {"worldName": "Creative Design", "evidenceSummary": "You like thinking of new ideas and expressing yourself.", "status": "Recommended Next"}
  ],
  "capability_insights": {
    "Self / EQ": {"insight": "You're learning to understand your feelings. This helps with confidence.", "next_step": "Try talking about your emotions with a friend."},
    "Social / SQ": {"insight": "You're great at teamwork and helping friends. People enjoy working with you.", "next_step": "Lead a group project."},
    "Thinking & Problem Solving": {"insight": "You're curious and ask good questions. You're learning to solve problems.", "next_step": "Try solving puzzles or figuring out how things work."},
    "Communication": {"insight": "You can explain your ideas clearly. You're developing your voice.", "next_step": "Practice speaking up in class."},
    "Digital & AI Literacy": {"insight": "You're learning to use technology safely and smartly.", "next_step": "Explore new apps or learn a digital skill."},
    "Execution & Independence": {"insight": "You're learning to finish tasks and take responsibility.", "next_step": "Complete a project on your own."},
    "Exposure & Career Awareness": {"insight": "You've explored some careers. Keep discovering new possibilities.", "next_step": "Research a job that interests you."},
    "Portfolio & Evidence": {"insight": "You're building a collection of your work and achievements.", "next_step": "Save something you're proud of."}
  },
  "assessmentReport": "[Summary] ${learner_name} shows strengths in... [Next section] Growth areas... [Action items]...[200-250 WORDS]",
  "mission_recommendations": [
    {"priority": 1, "mission_name": "Teamwork Challenge", "capability_target": "Social / SQ", "why_recommended": "You're already good at this. Let's go deeper!", "difficulty": "Medium", "estimated_duration_days": 7},
    {"priority": 2, "mission_name": "Tech Basics", "capability_target": "Digital & AI Literacy", "why_recommended": "You're learning this. Build confidence!", "difficulty": "Beginner", "estimated_duration_days": 5}
  ],
  "explorer_insights": {
    "exploredWorlds": [
      {"worldName": "Science & Inquiry", "icon": "lightbulb", "whyThisWorld": "You love asking questions and figuring out how things work.", "evidenceFromGrowth": "You showed strong curiosity and problem-solving.", "whatItMeans": "Science is about discovering how the world works through questions and exploration.", "nextStep": "Try a science experiment or visit a science museum!"}
    ],
    "toExploreWorlds": [
      {"worldName": "Creative Design", "icon": "palette", "whyThisWorld": "You enjoy thinking of new ideas and expressing yourself.", "evidenceFromGrowth": "You showed strong creativity and imagination.", "whatItMeans": "Creative Design is about making beautiful and useful things with your ideas.", "nextStep": "Try creating art, design, or a DIY project!"}
    ]
  },
  "thinking_styles": [
    {"title": "Pattern Recognition", "description": "You're wonderful at spotting connections and patterns! Your mind naturally sees how things link together.", "icon": "BrainCircuit"},
    {"title": "Problem Solving", "description": "You tackle challenging problems with confidence! You break them down and work through them.", "icon": "Lightbulb"},
    {"title": "Visual Thinking", "description": "You think in pictures and spaces! You can imagine how things fit together beautifully.", "icon": "Sparkles"},
    {"title": "Decision Making", "description": "You make thoughtful decisions! You carefully think through your choices.", "icon": "BarChart3"}
  ],
  "what_i_have": [
    {"capability_area": "Social / SQ", "score_out_of_5": 4.5},
    {"capability_area": "Communication", "score_out_of_5": 4.2}
  ],
  "what_i_need": [
    {"capability_area": "Digital & AI Literacy", "score_out_of_5": 2.5},
    {"capability_area": "Execution & Independence", "score_out_of_5": 2.8}
  ]
}

---

REPORT 0: CHARACTER STRENGTHS DESCRIPTIONS
For: Learner-facing "My Strengths & Character" section
Source: Use growth_map.character_strengths (list of strength labels and scores)
Format: Array of objects with "label", "description", and "tag" fields

PURPOSE: Generate learner-friendly descriptions that help 11-14 year olds understand who they are
TONE: First-person, positive, actionable (use "I" statements)
LENGTH: description 10-15 words, tag 2-3 words

CONTEXT - HOW CHARACTER STRENGTHS WORK:
These are behavioral strengths shown through how the learner acts and chooses, not academic scores.
Think of the question: "Write one moment you felt proud of yourself this year. What strength did you use?"
Each character strength is something they DID, not something they scored well in.

RULES FOR DESCRIPTION:
✓ Use first-person ("I love...", "I enjoy...", "I help...")
✓ Focus on BEHAVIOR and ACTIONS, not scores
✓ Be specific and encouraging
✓ NO scores, NO percentages, NO rankings
✓ Match the strength label to its real-world meaning
✓ Describe what the learner DOES when they use this strength

TAG GENERATION (2-3 words):
✓ Create an uplifting, action-oriented tag that captures the essence of the strength
✓ Use kid-friendly language (suitable for ages 11-14)
✓ Examples: "Love Learning", "Idea Maker", "Reliable", "Problem Solver", "People Person", "Detail Detective", "Truth Teller", "Team Leader"
✓ NO academic jargon, NO scores, NO negative language

EXAMPLES (With Tags):
- "Curious" → description: "I love asking questions and learning new things about the world." tag: "Love Learning"
- "Creative" → description: "I enjoy thinking of new ideas and finding different ways to solve problems." tag: "Idea Maker"
- "Responsible" → description: "I complete my tasks carefully and do what I promise to do." tag: "Reliable"
- "Persistent" → description: "I don't give up easily when things are difficult." tag: "Never Give Up"
- "Kind" → description: "I help others and care about how people feel." tag: "People Person"
- "Observant" → description: "I notice small details and changes that others might miss." tag: "Detail Detective"
- "Honest" → description: "I tell the truth and own up to my mistakes." tag: "Truth Teller"
- "Leader" → description: "I can bring people together and help guide a group." tag: "Team Leader"

FOR EACH STRENGTH IN growth_map.character_strengths:
1. Take the "label" field (e.g., "Curious")
2. Generate a description showing what they DO when they use this strength
3. Generate a short, uplifting tag (2-3 words) that captures the strength's essence
4. Write both as if celebrating the learner's behavior

OUTPUT ARRAY: 6-8 strongest character strengths with descriptions and tags (those with highest scores)

---

REPORT 1: CAPABILITY INSIGHTS (For each of 8 areas)
For: Dashboard display (personalized per capability area)
Format: Object with 8 keys (exact names below), each with "insight" and "next_step"

8 Areas (use EXACT names):
1. "Self / EQ" - understanding feelings, confidence
2. "Social / SQ" - teamwork, helping friends
3. "Thinking & Problem Solving" - curiosity, figuring things out
4. "Communication" - explaining ideas, speaking up
5. "Digital & AI Literacy" - using tech safely
6. "Execution & Independence" - finishing tasks, responsibility
7. "Exposure & Career Awareness" - exploring careers
8. "Portfolio & Evidence" - collecting your achievements

For each area:
- "insight": 2 sentences about what they're doing well + what they're learning (30-40 words)
- "next_step": 1 sentence action they can take (20-25 words)

Example:
"Self / EQ": {
  "insight": "You're learning to understand your feelings. This helps you feel more confident.",
  "next_step": "Talk about your emotions with a friend or family member."
}

---

REPORT 1: ASSESSMENT REPORT (200-250 WORDS)
For: Teachers/school leaders
Tone: Professional but simple

1. SUMMARY: [Name] shows strengths in [areas].
2. STRONG AREAS: [List 3-4 with what they do well]
3. GROWING AREAS: [List 2-3 with why they're learning]
4. SUGGESTIONS: [3-4 bullet points for classroom support]

---

REPORT 2: MISSION RECOMMENDATIONS (STRUCTURED)
3-5 missions, each with:
- priority: 1, 2, 3
- mission_name: Simple name (e.g., "Teamwork Challenge")
- capability_target: One of 8 areas
- why_recommended: 1-2 sentences explaining why (use friendly language)
- difficulty: "Beginner", "Medium", or "Advanced"
- estimated_duration_days: 5-14 days

Note: Stored for future LTE RAG lookup.

---

REPORT 3: MY INTEREST WORLDS (LEARNER DISCOVERY DISPLAY)
For: Learner-facing "My Interest Worlds" section showing discovered career/interest areas
Source: Use growth_map.my_interest_worlds (base data)
Format: Array of discovery objects (5-8 worlds minimum) - MINIMAL STRUCTURE

SIMPLIFIED STRUCTURE - ONLY 3 ESSENTIAL FIELDS:

1. **worldName** (string) - REQUIRED
   Career/interest world name only (e.g., "Science & Inquiry", "Technology & Making", "Creative Design", "Helping People", "Building & Making")

2. **evidenceSummary** (string) - REQUIRED
   Brief, learner-friendly evidence of why this is a good fit (15-25 words)
   MUST reference specific strengths they showed in assessment:
   - "You showed strong [strength] when [evidence from their answers]."
   - "Your [strength] makes you great at [what they can do in this world]."
   - "You care about [values shown] and enjoy [interests from assessment]."
   Examples:
   - "You're strong in problem-solving and love discovering how things work."
   - "You enjoy creating things and thinking of new ideas. You're imaginative!"
   - "You care deeply about helping others and working with people."
   NO scores, NO percentages, NO technical jargon - ONLY positive, specific evidence

3. **status** (string) - OPTIONAL
   One of: "Explored", "Started Exploring", "Recommended Next"
   Based on their capability scores in related areas

RULES FOR GENERATION:
✓ Generate 5-8 worlds ONLY (sorted by relevance to their strengths)
✓ Map strongest capabilities AND interests → matching worlds
✓ Make evidenceSummary PERSONAL and SPECIFIC to their assessment results
✓ Keep evidenceSummary SHORT, punchy, and learner-friendly
✓ Use first-person ("You...") or direct language
✓ Reference their actual strengths shown in the assessment
✓ NO capability area names in output
✓ NO mission triggers
✓ NO status insights
✓ NO percentages or scores

FORBIDDEN:
✗ Complex explanations
✗ Scores or percentages
✗ Capability wheel terms in output
✗ Technical language
✗ Status insight field

EXAMPLE OUTPUT:
{
  "worldName": "Science & Inquiry",
  "evidenceSummary": "You love asking questions and figuring out how things work.",
  "status": "Explored"
}

---

REPORT 4: EXPLORER MAP INSIGHTS (For left panel details)
For: Learner-facing "My Explorer Map" section (left panel showing world details on click)
Source: Use growth_map.explorer_map.explored and growth_map.explorer_map.to_explore (actual learner data)
Format: Two arrays - exploredWorlds and toExploreWorlds

⚠️ CRITICAL REQUIREMENTS (response will be REJECTED if not met):
1. exploredWorlds MUST contain EXACTLY ${exploredLabels.length} items — one for each of: ${exploredLabels.join(' | ') || '(none)'}
2. toExploreWorlds MUST contain EXACTLY ${toExploreLabels.length} items — one for each of: ${toExploreLabels.join(' | ') || '(none)'}
3. worldName MUST EXACTLY MATCH the labels listed above (same spelling and casing)
4. Do NOT create generic template insights - use actual learner strengths/interests to personalize each world
5. Do NOT skip, merge, or invent worlds — cover every listed label exactly once

ICON SELECTION:
- briefcase: Business, commerce, leadership, management
- hammer: Building, making, construction, hands-on work
- palette: Creative, design, art, expression
- users: Community, social, helping, teamwork
- leaf: Nature, environment, sustainability
- laptop: Technology, digital, coding, IT
- heart: Healthcare, caring, wellness, emotions
- lightbulb: Innovation, ideas, problem-solving, discovery

FOR EACH EXPLORED/TO_EXPLORE WORLD:
1. **icon** - Pick ONE from list above (must match world type)
2. **whyThisWorld** (20-30 words) - Why this world matches their strengths/interests
3. **evidenceFromGrowth** (15-20 words) - What they showed in assessment proving fit
4. **whatItMeans** (25-35 words) - What this world is about and why it matters
5. **nextStep** (15-20 words) - One action they can try to explore this world

TONE: Grade 6-8 friendly, encouraging, specific
LENGTH: Keep all sections brief and punchy
RULES:
✓ First-person or "you" language
✓ No scores, NO percentages
✓ Be specific and positive
✓ Make it actionable

EXAMPLE (Generate for EVERY world, not just 2-3):
{
  "exploredWorlds": [
    {
      "worldName": "Business / Commerce",
      "icon": "briefcase",
      "whyThisWorld": "You're organized and great with people. Business needs those skills!",
      "evidenceFromGrowth": "You scored high in teamwork and communication skills.",
      "whatItMeans": "Business people solve problems, lead teams, and create plans. You have these strengths!",
      "nextStep": "Try planning a school project or event. See how you organize it!"
    },
    {
      "worldName": "Construction / Civil",
      "icon": "hammer",
      "whyThisWorld": "You love hands-on work and building things. You're practical and resourceful!",
      "evidenceFromGrowth": "You showed strength in problem-solving and spatial reasoning.",
      "whatItMeans": "Construction workers create buildings and structures using plans and teamwork. You have the skills!",
      "nextStep": "Try a building or design project. See what you can create!"
    }
  ],
  "toExploreWorlds": [
    {
      "worldName": "Healthcare",
      "icon": "heart",
      "whyThisWorld": "You care deeply about helping people. Healthcare is perfect for you!",
      "evidenceFromGrowth": "You showed strong empathy and care for others in your answers.",
      "whatItMeans": "Healthcare workers help people feel better and stay healthy. This matches who you are!",
      "nextStep": "Help someone in your community or learn first aid. See if you enjoy it!"
    }
  ]
}

---

REPORT 5: THINKING STYLE SNAPSHOT
For: Learner-facing display of actual thinking patterns from Adaptive Aptitude Test
Source: Use aptitude_scores.accuracyBySubtag, pathClassification, confidenceTag, accuracyByDifficulty
Format: Array of 4 thinking styles based on actual problem-solving patterns

4 THINKING STYLES (based on Adaptive Aptitude performance):
1. Pattern Recognition - Score from accuracyBySubtag.pattern_recognition
2. Problem Solving - Score from accuracyBySubtag.problem_solving
3. Visual Thinking - Score from accuracyBySubtag.spatial_reasoning + pathClassification
4. Decision Making - Score from accuracyBySubtag.decision_making + confidenceTag

For each style, generate:
- title: Exact name from list above
- description: How they performed on this thinking style during the Adaptive Aptitude Test (15-25 words, learner-friendly)
- icon: BrainCircuit, Lightbulb, Sparkles, or BarChart3 (choose appropriate one)

LOGIC FOR EACH STYLE (NO percentages, NO harsh words):
1. Pattern Recognition
   - Source: accuracyBySubtag["pattern_recognition"]
   - If score > 85%: "You're wonderful at spotting connections and patterns. Your mind naturally sees how things link together!"
   - If score 70-85%: "You're developing great pattern-spotting skills. You can see connections in interesting ways!"
   - If score < 70%: "You're learning to spot patterns. Each time you look for connections, you get better!"

2. Problem Solving
   - Source: accuracyBySubtag["problem_solving"] + accuracyByDifficulty["hard"]
   - If both > 80%: "You tackle challenging problems with confidence! You break them down and work through them beautifully!"
   - If score > 75%: "You're good at working through problems step-by-step. You don't give up!"
   - If score < 75%: "You're learning to solve problems. With practice, you get more confident!"

3. Visual Thinking
   - Source: accuracyBySubtag["spatial_reasoning"] + pathClassification
   - If "visual" in pathClassification AND score > 75%: "You think in pictures and spaces! You can imagine how things fit together beautifully!"
   - If score > 75%: "You're great at visualizing and imagining. You see the bigger picture!"
   - If score < 75%: "You're learning to think visually. Imagination is a skill that grows!"

4. Decision Making
   - Source: accuracyBySubtag["decision_making"] + confidenceTag
   - If confidenceTag "High" and score > 80%: "You make thoughtful decisions! You carefully think through your choices and feel sure about them."
   - If score > 75%: "You're good at thinking through choices. You weigh options carefully!"
   - If score < 75%: "You're developing your decision-making skills. It gets easier with practice!"

EXAMPLE (friendly, no percentages):
{
  "title": "Pattern Recognition",
  "description": "You're wonderful at spotting connections and patterns! Your mind naturally sees how things link together and relate to each other.",
  "icon": "BrainCircuit"
}

RULES:
✓ Generate ALL 4 thinking styles based on actual aptitude test performance
✓ Use scores to judge level (high/medium/low) - do NOT mention percentages
✓ Use FRIENDLY, ENCOURAGING language suitable for ages 11-14
✓ Match strength level to actual performance
✓ Use second-person language ("You...")
✓ NO harsh words like "poor", "weak", "struggling", "failing"
✓ NO comparison language - focus only on learner's own thinking style
✓ Say "You're learning" not "You're not good at"
✓ Be positive and growth-focused throughout

---

REPORT 7: WHAT I HAVE / WHAT I NEED (Per BRD FR-33 & PRD Section 18.1)
For: Learner-facing display showing strengths and growth areas
Source: Use capability_wheel scores to identify highest and lowest performers
Format: Two arrays - what_i_have (strengths) and what_i_need (growth areas)

LOGIC (Critical - use actual scores):
- "what_i_have": Top 2-3 capability areas with HIGHEST scores (Confident or Ready for Next Level status, score ≥ 3.0)
- "what_i_need": Bottom 2-3 capability areas with LOWEST scores (Starting or Practicing status, score < 3.0)

RULES:
✓ Select based on actual capability_wheel scores
✓ what_i_have = highest scores sorted descending
✓ what_i_need = lowest scores sorted ascending
✓ Include 2-3 items in each array
✓ Show scores to 1 decimal place
✓ Use positive, encouraging language in both sections
✓ what_i_need should be framed as growth opportunities, not weaknesses

EXAMPLE:
{
  "what_i_have": [
    {"capability_area": "Social / SQ", "score_out_of_5": 4.5},
    {"capability_area": "Communication", "score_out_of_5": 4.2}
  ],
  "what_i_need": [
    {"capability_area": "Digital & AI Literacy", "score_out_of_5": 2.5},
    {"capability_area": "Execution & Independence", "score_out_of_5": 2.8}
  ]
}

---

JSON RULES:
✓ ALL 8 fields present (character_strengths_descriptions, capability_insights, assessmentReport, mission_recommendations, my_interest_worlds, explorer_insights, thinking_styles, what_i_have, what_i_need)
✓ character_strengths_descriptions is an array of 6-8 objects with "label", "description", "tag" fields
✓ thinking_styles is an array of exactly 4 objects with "title", "description", "icon" fields
✓ explorer_insights has "exploredWorlds" and "toExploreWorlds" arrays
✓ exploredWorlds array must match ALL worlds from growth_map.explorer_map.explored (do not limit)
✓ toExploreWorlds array must match ALL worlds from growth_map.explorer_map.to_explore (do not limit)
✓ Each world in explorer_insights has: icon, worldName, whyThisWorld, evidenceFromGrowth, whatItMeans, nextStep
✓ what_i_have is an array of 2-3 highest-scoring capabilities (Confident/Ready for Next Level)
✓ what_i_need is an array of 2-3 lowest-scoring capabilities (Starting/Practicing)
✓ Each capability item has: capability_area (string), score_out_of_5 (number, 1 decimal)
✓ Thinking style icons must be one of: BrainCircuit, Lightbulb, Sparkles, BarChart3
✓ Explorer map icons must be one of: briefcase, hammer, palette, users, leaf, laptop, heart, lightbulb
✓ Each text field is a single string (NO line breaks, NO markdown)
✓ Tags must be 2-3 words, kid-friendly, uplifting, no academic jargon
✓ worldName MUST EXACTLY match the world labels from growth_map.explorer_map arrays
✓ Return ONLY the JSON, nothing else`;

  return { system, user };
}
