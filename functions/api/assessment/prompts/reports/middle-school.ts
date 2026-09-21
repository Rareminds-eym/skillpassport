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
 * 8. stage_guidance - Per-Growth-Map-stage guidance content (v2: app-owned section structure — see
 *    REPORT 8 below for exactly which section KINDS each of the 8 stages requires), plus an optional
 *    per-stage "sectionIntro" (learner-specific heading + one-sentence description that replaces the
 *    app's hardcoded stage heading/description when present and valid). Gemini supplies ONLY desc/
 *    highlights content per section kind — never a title, section list, or section order; those are
 *    fixed by the application (STAGE_GUIDANCE_SECTIONS in growthStageConfig.ts).
 *
 * WORD LIMITS (Grade 6-8 friendly, optimized for tokens):
 * - capability_insights: 30-40 words per area (insight + next_step)
 * - assessmentReport: 200-250 words
 * - mission_recommendations: EXACTLY 3 structured missions (not text)
 * - my_interest_worlds: 5-8 worlds, 15-20 words per evidenceSummary
 * - stage_guidance: ~12-18 word desc + 2-3 highlights (8-12 words each) per section, only for the
 *   section kinds each stage requires (most stages: 3 kinds; whatIHaveNeed: 2 kinds; missions: 1 kind)
 * - stage_guidance.sectionIntro (optional, per stage): heading 2-5 words, description under 20 words
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

  const stageIds = [
    'capabilityWheel',
    'interestWorlds',
    'characterConstellation',
    'selfSocial',
    'explorerMap',
    'thinkingStyle',
    'whatIHaveNeed',
    'missions',
  ] as const;

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
    {"priority": 1, "mission_name": "<short mission name>", "capability_target": "<one of the 8 capability areas>", "why_recommended": "<1-2 sentences grounded in this learner's real evidence>", "difficulty": "Beginner|Medium|Advanced", "estimated_duration_days": 5},
    {"priority": 2, "mission_name": "<short mission name>", "capability_target": "<one of the 8 capability areas>", "why_recommended": "<1-2 sentences grounded in this learner's real evidence>", "difficulty": "Beginner|Medium|Advanced", "estimated_duration_days": 7},
    {"priority": 3, "mission_name": "<short mission name>", "capability_target": "<one of the 8 capability areas>", "why_recommended": "<1-2 sentences grounded in this learner's real evidence>", "difficulty": "Beginner|Medium|Advanced", "estimated_duration_days": 10}
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
    {"title": "Logical Reasoning", "description": "You're learning to work through logical steps. Each puzzle you try helps you build this skill!", "icon": "Lightbulb"},
    {"title": "Spatial Reasoning", "description": "You think in pictures and spaces! You can imagine how things fit together beautifully.", "icon": "Sparkles"},
    {"title": "Numerical Reasoning", "description": "You're building confidence working with numbers. Practice is helping you grow this skill!", "icon": "BarChart3"}
  ],
  // NOTE: the 4 titles above are only an EXAMPLE — you select the actual 4 (from the 6
  // legitimate categories) based on THIS learner's own accuracyBySubtag evidence.
  "stage_guidance": {
    "version": 2,
    "capabilityWheel": {
      "sectionIntro": {"heading": "<2-5 word heading naming the identified capability_wheel evidence>", "description": "<one sentence, under 20 words, summarizing what THIS stage's identified evidence shows>"},
      "sections": {
        "parent": {"desc": "<short observation naming the specific capability_wheel evidence, plain language for a parent>", "highlights": ["<home scenario tied to the strongest identified item>", "<home scenario tied to a second identified item>", "<only if genuinely supported: a third distinct facet>"]},
        "teacher": {"desc": "<short observation naming the specific capability_wheel evidence, for a teacher>", "highlights": ["<classroom adjustment tied to the strongest identified item>", "<classroom adjustment tied to a second identified item>"]},
        "action": {"desc": "<one short framing sentence naming the identified capability_wheel evidence>", "highlights": ["<concrete task tied to the strongest identified item>", "<concrete task tied to a second identified item>"]}
      }
    },
    "whatIHaveNeed": {
      "sectionIntro": {"heading": "<...>", "description": "<...>"},
      "sections": {
        "parent": {"desc": "<observation naming the specific growth_map.what_i_have item(s)>", "highlights": ["<...>", "<...>"]},
        "action": {"desc": "<observation naming the specific growth_map.what_i_need_next item(s)>", "highlights": ["<concrete step tied to a specific what_i_need_next item>", "<...>"]}
      }
    },
    "missions": {
      "sectionIntro": {"heading": "<...>", "description": "<...>"},
      "sections": {
        "teacher": {"desc": "<observation for a teacher tied to the recommended missions>", "highlights": ["<...>", "<...>"]}
      }
    }
    // ... the remaining 5 stages (interestWorlds, characterConstellation, selfSocial,
    // explorerMap, thinkingStyle) each also require "parent", "teacher", AND "action" —
    // see the exact per-stage section list in REPORT 8 below.
  }
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
⚠️ CRITICAL: You MUST return EXACTLY 3 missions — not 2, not 4, not 5. Exactly 3 objects in the array.
Each mission must be genuinely personalized, grounded in THIS learner's real capability scores,
interests, and growth areas from the evidence provided — never copied from any example below.
Each mission has:
- priority: 1, 2, 3
- mission_name: Simple name (e.g., "Teamwork Challenge") — invent one that fits this learner's real evidence, do not reuse example names verbatim
- capability_target: One of 8 areas
- why_recommended: 1-2 sentences explaining why, grounded in this learner's actual evidence (use friendly language)
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
Source: Use aptitude_scores.accuracyBySubtag
Format: Array of EXACTLY 4 thinking styles, SELECTED BY YOU from the 6 legitimate categories below

THE 6 LEGITIMATE CATEGORIES (this is the ONLY set of titles you may use):
1. Pattern Recognition - Source: accuracyBySubtag["pattern_recognition"]
2. Spatial Reasoning - Source: accuracyBySubtag["spatial_reasoning"]
3. Verbal Reasoning - Source: accuracyBySubtag["verbal_reasoning"]
4. Logical Reasoning - Source: accuracyBySubtag["logical_reasoning"]
5. Numerical Reasoning - Source: accuracyBySubtag["numerical_reasoning"]
6. Data Interpretation - Source: accuracyBySubtag["data_interpretation"]

YOUR TASK: Look at this learner's actual accuracyBySubtag evidence across all 6 categories and SELECT
THE 4 MOST MEANINGFUL for this specific learner (e.g. their clearest strengths and/or their areas with
the most room to grow — whichever combination best reflects this learner's real pattern). Do not pick
the same 4 by default or alphabetically — base the selection on this learner's own evidence.

For each of your 4 SELECTED styles, generate:
- title: EXACT name from the 6 legitimate categories above (no variations, no new titles)
- description: How they performed on this thinking style during the Adaptive Aptitude Test (15-25 words, learner-friendly)
- icon: BrainCircuit, Lightbulb, Sparkles, or BarChart3 (choose appropriate one)

LOGIC FOR EACH STYLE (NO percentages, NO harsh words) — apply this same tiered pattern using that
category's own accuracyBySubtag score, only for the 4 categories you selected:
- If score > 85%: Warm, confident language celebrating this as a clear strength (e.g. "You're wonderful at spotting connections and patterns. Your mind naturally sees how things link together!")
- If score 70-85%: Encouraging language noting solid, developing skill (e.g. "You're developing great pattern-spotting skills. You can see connections in interesting ways!")
- If score < 70%: Growth-focused language framing it as a skill still growing (e.g. "You're learning to spot patterns. Each time you look for connections, you get better!")
Adapt the wording naturally to each category's own subject matter (e.g. for Verbal Reasoning describe
performance with words/reading, for Numerical Reasoning describe performance with numbers) while
keeping the same encouraging tone and structure.

EXAMPLE (friendly, no percentages — showing 2 of the 4 you'd return):
[
  {
    "title": "Pattern Recognition",
    "description": "You're wonderful at spotting connections and patterns! Your mind naturally sees how things link together and relate to each other.",
    "icon": "BrainCircuit"
  },
  {
    "title": "Logical Reasoning",
    "description": "You're learning to work through logical steps. Each puzzle you try helps you build this skill!",
    "icon": "Lightbulb"
  }
]

RULES:
✓ Return EXACTLY 4 entries — no more, no fewer
✓ Every title MUST be one of the 6 legitimate category names above, spelled exactly as shown
✓ All 4 titles MUST be unique — never repeat a category
✓ YOU choose which 4 based on this learner's actual accuracyBySubtag evidence — do not default to a fixed set
✓ Use scores to judge level (high/medium/low) - do NOT mention percentages or scores in the description text
✓ Use FRIENDLY, ENCOURAGING language suitable for ages 11-14
✓ Match strength level to actual performance
✓ Use second-person language ("You...")
✓ NO harsh words like "poor", "weak", "struggling", "failing"
✓ NO comparison language - focus only on learner's own thinking style
✓ Say "You're learning" not "You're not good at"
✓ Be positive and growth-focused throughout

---

REPORT 8: STAGE GUIDANCE (v2 — APP-OWNED SECTION STRUCTURE, PER GROWTH MAP STAGE)
For: The Growth Map stage modal and scroll view — a learner-specific section heading/description for
each stage's own card, plus 1-3 additional guidance sections per stage (exact count fixed by the app)
Source: Ground EACH stage's guidance in THAT STAGE's own real data below (do not mix stages' evidence)
GOAL: Every stage's guidance must read as if it was written from THIS learner's own evidence — never
as generic advice that could apply to any learner. A reader should be able to tell which real items
(labels/status) the guidance came from.

⚠️ CRITICAL: YOU DO NOT CONTROL WHICH SECTIONS EXIST, THEIR ORDER, OR THEIR TITLES.
The application decides which section KINDS each stage has (from exactly 3 possible kinds: "parent",
"teacher", "action") and what UI title/subtitle each one displays. You generate ONLY the real content
(desc + highlights) for the kinds a stage requires — never a title, never a 4th kind, never a kind a
stage does not require below. A response containing any section kind outside this table, or missing a
required one, will be REJECTED.

⚠️ CRITICAL REQUIREMENT (response will be REJECTED if not met):
stage_guidance MUST be an object with "version": 2 plus EXACTLY these 8 stage keys, each present:
${stageIds.map((id) => `"${id}"`).join(', ')}

STAGE → REQUIRED SECTION KINDS → EVIDENCE SOURCE (use ONLY this stage's own data for its guidance):
1. "capabilityWheel" [parent, teacher, action] → growth_map.capability_wheel (all 8 areas)
2. "interestWorlds" [parent, teacher, action] → growth_map.interest_worlds
3. "characterConstellation" [parent, teacher, action] → growth_map.character_strengths
4. "selfSocial" [parent, teacher, action] → growth_map.self_social (self_eq, social_sq)
5. "explorerMap" [parent, teacher, action] → growth_map.explorer_map (explored, to_explore)
6. "thinkingStyle" [parent, teacher, action] → aptitude_scores (if provided) — otherwise use growth_map.capability_wheel's "Thinking & Problem Solving" area as the closest real evidence
7. "whatIHaveNeed" [parent, action ONLY — NO teacher kind for this stage]:
   - "parent" section (rendered as "Parent Snapshot") → growth_map.what_i_have ONLY (the learner's
     real existing strengths — these are DETERMINISTIC, already-calculated values; you are
     explaining/framing them, never recalculating or inventing a different capability_area or score)
   - "action" section (rendered as "Skill Bridge Plan") → growth_map.what_i_need_next ONLY (the
     learner's real growth-target areas — also deterministic). This section's content must respond
     SPECIFICALLY to whichever capability_area(s) actually appear in growth_map.what_i_need_next for
     THIS learner — never generic "keep improving" advice that could apply regardless of which areas
     are listed.
8. "missions" [teacher ONLY — NO parent or action kind for this stage] (rendered as "Teacher
   Monitoring Note") → growth_map.capability_wheel + growth_map.what_i_need_next (what the learner
   could work toward next)

STEP A — IDENTIFY EVIDENCE BEFORE WRITING (do this silently for each stage, before generating its text):
From that stage's own evidence source above, identify:
- The 1-2 items with the strongest/highest status (the learner's clearest strength in this stage)
- The 1-2 items with the most room to grow (lowest status), IF any exist below "Growing" — some
  learners will have no low items in a stage; that's fine, do not invent one
- For "characterConstellation" only: if growth_map includes any reflection/qualitative text tied to
  a character strength, treat it as an identified item too
Every "desc" and every "highlights" entry in this stage's sections MUST be built from ONE OF THESE
IDENTIFIED ITEMS. Do not write about the stage in general — write about these specific items.

STEP B — VOCABULARY LOCK (same technique used for the College assessment report):
- Reuse the EXACT label/capability_area text from growth_map for that stage (e.g. if the data says
  "Emotional regulation", write "Emotional regulation" — do not paraphrase it into a different skill
  name like "managing feelings" as a label substitute)
- You may explain what the label means in plain words, but the real label text itself must appear
  verbatim at least once somewhere across that stage's sections
- Do NOT introduce any skill, activity, world, or label that is not one of the items identified in Step A

SECTION INTRO (replaces the app's hardcoded stage heading/description — e.g. "My Capability Wheel" /
"Your growth across 8 core capabilities..."): for EACH of the 8 stage keys, also generate a
"sectionIntro" object using the SAME Step-A identified items as that stage's sections:
- "heading" (string, 2-5 words): a short UI heading — NOT a full sentence, NOT a paragraph. It may
  reuse the stage's general theme (e.g. still be about "capabilities" for capabilityWheel) but should
  reflect the identified evidence rather than being interchangeable with every learner's heading.
- "description" (string, one sentence, under 20 words): what this stage's identified evidence shows
  for THIS learner specifically. Same throat-clearing ban as "desc" above (no "This shows that...").
- Follow Step A/B exactly as for the sections: name a real identified item, never invent one.
- If this stage's evidence is too sparse to say anything specific (e.g. an empty array), it is
  CORRECT to omit "sectionIntro" entirely for that stage — the app already has a safe static
  heading/description fallback for this exact case, so do not force a vague one.

FOR EACH STAGE KEY, generate ONLY the section kinds listed for it above, inside a "sections" object.
Each section is an object with EXACTLY these 2 fields (NO "title", NO "subtitle" — those are app-owned):
- "desc" (string, 12-18 words): ONE plain sentence stating the specific identified observation. Lead
  with the observation itself — do NOT open with "This shows that...", "This means...", or similar
  explanatory throat-clearing.
- "highlights" (array of 2-3 strings, 8-12 words each — see COUNT RULE below): concrete points, each
  traceable to a specific identified item from Step A

COUNT RULE FOR "highlights" (apply the same way in every section, every stage):
- Use 3 highlights when the stage's Step-A evidence genuinely supports 3 distinct, meaningful points —
  e.g. one per identified item (strongest / second strongest / growth area), or if only one or two
  distinct items exist, up to 3 different facets of that same evidence (what it shows / why it matters
  for this audience / how the learner could build on it)
- Use exactly 2 when the evidence only supports 2 genuinely distinct points for that stage (this is
  CORRECT, not incomplete)
- NEVER add a 3rd highlight that isn't traceable to Step A's identified items just to reach 3 — a
  generic filler point is worse than stopping at 2

MAKE EACH STAGE'S VIEWS ANSWER DIFFERENT QUESTIONS ABOUT THE SAME EVIDENCE
(sectionIntro plus this stage's section kinds must never just restate each other in different words):
- "sectionIntro": Answers "What does this stage's evidence show, in one line?" A short heading + one
  summarizing sentence — the FIRST thing a reader sees for this stage, not a repeat of the section content.
- "parent" kind (where required): Answers "What might a parent actually NOTICE at home because of this
  specific evidence?" Describe a concrete everyday/home situation tied to the identified item(s) — not
  a restatement of the pattern, not generic parenting advice that would fit any child. Plain, warm,
  non-technical language. NO academic terms, NO scores.
- "teacher" kind (where required): Answers "What should a teacher DO DIFFERENTLY in the classroom
  because of this specific evidence?" Name one realistic classroom adjustment tied to the identified
  item(s) — not a generic encouragement that would apply to any student. Professional but simple tone.
  NO scores, NO comparisons to other students.
- "action" kind (where required): Answers "What can the learner try, tied directly to this exact
  evidence?" Written directly to the learner ("You..."). Each of the 2-3 highlights should be a
  concrete, doable task tied to a different identified item where possible — not generic advice.

STRICT EVIDENCE-ONLY GUARDRAILS (apply to ALL sections — this is non-negotiable):
✓ Every "desc" and "highlights" entry MUST be traceable to a Step-A identified item in growth_map/aptitude_scores for THAT stage — do not invent evidence, achievements, or specifics not present in the data
✓ NO scores, percentages, rankings, or comparisons to other learners anywhere in stage_guidance
✓ NO diagnostic language, personality labels (e.g. "introvert", "gifted"), or clinical/medical framing
✓ NO harsh words: "weak", "poor", "struggling", "behind", "below average"
✓ If a stage's underlying data is sparse (e.g. very few interest_worlds or empty self_social), keep the guidance SHORT, honest, and use fewer highlights rather than fabricating specifics that aren't in the data — but all 8 stage keys and all of that stage's required section kinds are still REQUIRED
✓ Follow the exact same "celebrate wins first" and simple-language rules as the rest of this report
✓ Do NOT calculate, restate as a number, or invent a score/percentage for whatIHaveNeed — growth_map.what_i_have and growth_map.what_i_need_next are already final, deterministic values; your job is only to write guidance ABOUT them

---

JSON RULES:
✓ ALL 8 fields present (character_strengths_descriptions, capability_insights, assessmentReport, mission_recommendations, my_interest_worlds, explorer_insights, thinking_styles, stage_guidance)
✓ mission_recommendations is an array of EXACTLY 3 objects — never 2, never 4 or more
✓ stage_guidance has "version": 2 plus EXACTLY 8 stage keys: capabilityWheel, interestWorlds, characterConstellation, selfSocial, explorerMap, thinkingStyle, whatIHaveNeed, missions
✓ Each stage_guidance[stageId] has a "sections" object containing ONLY the section kinds required for that stage (capabilityWheel/interestWorlds/characterConstellation/selfSocial/explorerMap/thinkingStyle: parent+teacher+action; whatIHaveNeed: parent+action; missions: teacher) — plus an OPTIONAL "sectionIntro" (include it whenever that stage's evidence supports one; omit it entirely for that stage if not, do not include it with vague/empty content)
✓ Each section inside "sections" has EXACTLY: desc (string), highlights (array of 2-3 strings — 3 only when genuinely evidence-supported, never padded) — NO title, NO subtitle field
✓ When present, "sectionIntro" has EXACTLY: heading (string, 2-5 words), description (string, one sentence, under 20 words)
✓ character_strengths_descriptions is an array of 6-8 objects with "label", "description", "tag" fields
✓ thinking_styles is an array of EXACTLY 4 objects with "title", "description", "icon" fields — each "title" is one of the 6 legitimate categories (Pattern Recognition, Spatial Reasoning, Verbal Reasoning, Logical Reasoning, Numerical Reasoning, Data Interpretation), YOU select which 4 based on this learner's evidence, and all 4 titles must be unique
✓ explorer_insights has "exploredWorlds" and "toExploreWorlds" arrays
✓ exploredWorlds array must match ALL worlds from growth_map.explorer_map.explored (do not limit)
✓ toExploreWorlds array must match ALL worlds from growth_map.explorer_map.to_explore (do not limit)
✓ Each world in explorer_insights has: icon, worldName, whyThisWorld, evidenceFromGrowth, whatItMeans, nextStep
✓ Thinking style icons must be one of: BrainCircuit, Lightbulb, Sparkles, BarChart3
✓ Explorer map icons must be one of: briefcase, hammer, palette, users, leaf, laptop, heart, lightbulb
✓ Each text field is a single string (NO line breaks, NO markdown)
✓ Tags must be 2-3 words, kid-friendly, uplifting, no academic jargon
✓ worldName MUST EXACTLY match the world labels from growth_map.explorer_map arrays
✓ Return ONLY the JSON, nothing else`;

  return { system, user };
}
