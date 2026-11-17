export type FacilitatorAction = 'lesson-plan' | 'worksheet' | 'chat';
export interface FacilitatorRole {
  id: string;
  name: string;
  purpose: string;
  available: string;
  planned?: string;
  action: FacilitatorAction;
  actionLabel: string;
  prompt?: string;
  example: { title: string; items: string[]; note?: string };
}

/** Product roles from the six-facilitator plan, mapped to currently supported actions. */
export const FACILITATORS: FacilitatorRole[] = [
  {
    id: 'organizer', name: 'Organizer', purpose: 'Give every lesson a clear direction.',
    available: 'Plan objectives, teaching sequences, timings and checkpoints. Use Resource Provider for worksheets.',
    action: 'lesson-plan', actionLabel: 'Plan this lesson',
    example: { title: 'A 40-minute photosynthesis lesson', items: ['Engage · 5 min — Where do plants get their food?', 'Explore · 8 min — Observe a plant and identify water and light.', 'Explain · 7 min — Connect the inputs, energy source and outputs.', 'Express · 10 min — Practise through differentiated activities.', 'Empower · 6 min — Choose a garden location and justify it.', 'Evolve · 4 min — Reflect with a shared exit ticket.'] },
  },
  {
    id: 'facilitator-of-learning', name: 'Facilitator of Learning', purpose: 'Turn a topic into a moment of discovery.',
    available: 'Explore concepts, inquiry questions and teaching approaches through guided chat.',
    planned: 'A coordinated, interactive 6E learning experience is planned.',
    action: 'chat', actionLabel: 'Explore this concept',
    prompt: 'Help me design an inquiry experience for this lesson: an opening phenomenon, guided discovery prompts and a reflection checkpoint. Use the course context; ask for the concept only if it is missing.',
    example: { title: 'Guide discovery, one question at a time', items: ['What do roots absorb from the soil?', 'Does soil supply all the sugar a plant needs?', 'Where does the carbon used to make sugar come from?', 'What supplies the energy for this process?', 'Explain photosynthesis in your own words.'] },
  },
  {
    id: 'individualized-support', name: 'Individualized Support', purpose: 'One learning goal. Different ways to get there.',
    available: 'Recommend adjustments to scaffolding, pacing, language and challenge. Carry the recommendations to Resource Provider when a worksheet is needed.',
    planned: 'Connected evidence-based adaptation beyond the information supplied in chat is planned.',
    action: 'chat', actionLabel: 'Recommend learning adjustments',
    prompt: 'Recommend instructional support adjustments for this lesson using the learning need and evidence I provide. Keep the objective, distinguish evidence from assumptions, and suggest scaffolding, pacing or challenge changes with a success check. Specify any required practice materials for Resource Provider; do not generate a full worksheet.',
    example: { title: 'One objective, three usable tasks', items: ['Foundation — Label sunlight, water, carbon dioxide, glucose and oxygen using a word bank.', 'Developing — Complete the word equation and explain how darkness affects photosynthesis.', 'Challenge — Predict what happens when carbon dioxide becomes limiting; design a fair investigation.'], note: 'These are example support routes, not fixed learner ability labels.' },
  },
  {
    id: 'resource-provider', name: 'Resource Provider', purpose: 'Go from an idea to something ready to teach.',
    available: 'Create questions, worksheets, private answer keys and rubrics. Export PDF or Word and assign learner copies.',
    action: 'worksheet', actionLabel: 'Create a worksheet',
    example: { title: 'A ready-to-use exit ticket', items: ['1. What provides the energy for photosynthesis?', '2. Name the two substances used to make glucose.', '3. Why might photosynthesis slow when light is limited?'], note: 'Teacher answer key: light energy; water and carbon dioxide; less available light energy limits the process.' },
  },
  {
    id: 'problem-solver', name: 'Problem Solver', purpose: 'Make confusion the start of understanding.',
    available: 'Diagnose a specific misconception, suggest staged intervention and verify understanding without grading work.',
    planned: 'Hint tracking and learner retries are planned.',
    action: 'chat', actionLabel: 'Work through a misconception',
    prompt: 'Help me diagnose a specific misconception in this lesson. Use the question or attempted answer already provided, or ask for it if missing. Suggest a diagnostic question, a staged corrective explanation and a short verification task. Do not grade the work or assume the intervention succeeded.',
    example: { title: 'When a learner says plants get energy from soil', items: ['First hint — Soil supplies water and minerals. What is available in daylight?', 'Next hint — Water and carbon dioxide are ingredients. What powers the leaf’s food factory?', 'Recheck — A plant has water and carbon dioxide but no light. Would photosynthesis continue at its usual rate?'], note: 'Illustrative dialogue; no real learner attempt has been assessed.' },
  },
  {
    id: 'mentor-and-guide', name: 'Mentor and Guide', purpose: 'Turn evidence into a meaningful next step.',
    available: 'Review a selected saved submission against its grading criteria, explain the saved evaluation and recommend improvement priorities.',
    planned: 'Longitudinal evidence summaries and cross-assessment progress dashboards are planned.',
    action: 'chat', actionLabel: 'Review a learner response',
    prompt: 'Help me guide a learner using their saved submission, assignment questions and grading criteria. Base feedback only on verified evidence and suggest one next step. Do not invent learner scores or class-wide progress.',
    example: { title: 'Feedback grounded in one sample response', items: ['Sample response — “I would put the plant near a window for sunlight and water both plants equally.”', 'Demonstrated — Connects sunlight with food production and controls watering.', 'Next step — Ask what else should stay the same, such as plant type and size.'], note: 'One illustrative response; this is not a class progress report.' },
  },
];

/** Learner actions are chat-only; official materials remain educator-owned. */
export const LEARNER_FACILITATORS: FacilitatorRole[] = [
  { id: 'organizer', name: 'Organizer', purpose: 'Make a realistic study plan.', available: 'Break a learning goal into study sessions, priorities and self-checks. Official deadlines stay unchanged.', action: 'chat', actionLabel: 'Plan my study', prompt: 'Help me plan my study for this course. Use the goal, deadline and available time I provide; ask only for missing essentials.', example: { title: 'Plan three short study sessions', items: ['Review the core idea.', 'Practise and check understanding.', 'Revisit mistakes and reflect.'] } },
  { id: 'facilitator-of-learning', name: 'Facilitator of Learning', purpose: 'Discover how a concept works.', available: 'Explore ideas through examples, connections and guided questions.', action: 'chat', actionLabel: 'Explore a concept', prompt: 'Help me understand a concept from this course through a clear example and a guided question. Ask which concept if I have not specified it.', example: { title: 'Explore time management', items: ['Compare two ways to plan a busy day.', 'Identify which tasks matter most.', 'Explain your choice in your own words.'] } },
  { id: 'individualized-support', name: 'Individualized Support', purpose: 'Learn with an explanation that fits your needs.', available: 'Adjust language, pace, examples or challenge while keeping the learning goal.', action: 'chat', actionLabel: 'Adjust my explanation', prompt: 'Help me learn this course with an adjusted explanation. Ask what I would like changed if it is not clear: simpler language, smaller steps, a new example or more challenge.', example: { title: 'Try a smaller first step', items: ['Explain one idea in plain language.', 'Try an everyday example.', 'Check understanding before moving on.'] } },
  { id: 'resource-provider', name: 'Resource Provider', purpose: 'Create practice for your own learning.', available: 'Request informal practice questions, revision notes or flashcards. Protected assessment answers remain private.', action: 'chat', actionLabel: 'Create practice', prompt: 'Create a small informal practice activity for a topic in this course. Ask for the topic if needed, and keep it separate from official assignments.', example: { title: 'A quick revision activity', items: ['Recall one key concept.', 'Apply it to a new situation.', 'Check your reasoning.'] } },
  { id: 'problem-solver', name: 'Problem Solver', purpose: 'Work through a specific point where you are stuck.', available: 'Use your question or attempt to get a useful hint, explanation and retry.', action: 'chat', actionLabel: 'Work through a problem', prompt: 'Help me work through a specific problem in this course. Use my question and attempt if provided; otherwise ask where I am stuck. Respect assessment restrictions.', example: { title: 'Find the step that needs attention', items: ['Share the question and your attempt.', 'Try one useful hint.', 'Explain the corrected reasoning.'] } },
  { id: 'mentor-and-guide', name: 'Mentor and Guide', purpose: 'Turn feedback into a clear next step.', available: 'Understand your own released feedback or a response you share. Saved results are not fetched automatically in this chat.', action: 'chat', actionLabel: 'Understand my feedback', prompt: 'Help me understand my own released feedback and choose an improvement goal. Use only feedback available in this chat; ask me to share it if missing and do not invent scores.', example: { title: 'Use feedback to improve', items: ['Identify what your feedback says.', 'Recognize a strength and an improvement area.', 'Choose one practical next step.'] } },
];
