export type FacilitatorAction = 'lesson-plan' | 'worksheet' | 'differentiated' | 'chat';
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
    available: 'Create a timed lesson plan with activities, resources and assessment checkpoints.',
    action: 'lesson-plan', actionLabel: 'Plan this lesson',
    example: { title: 'A 40-minute photosynthesis lesson', items: ['Engage · 5 min — Where do plants get their food?', 'Explore · 8 min — Observe a plant and identify water and light.', 'Explain · 7 min — Connect the inputs, energy source and outputs.', 'Express · 10 min — Practise through differentiated activities.', 'Empower · 6 min — Choose a garden location and justify it.', 'Evolve · 4 min — Reflect with a shared exit ticket.'] },
  },
  {
    id: 'facilitator-of-learning', name: 'Facilitator of Learning', purpose: 'Turn a topic into a moment of discovery.',
    available: 'Explore concepts, inquiry questions and teaching approaches through guided chat.',
    planned: 'A coordinated, interactive 6E learning experience is planned.',
    action: 'chat', actionLabel: 'Explore this concept',
    prompt: 'Help me facilitate learning in this lesson. Suggest an inquiry hook and a short sequence of guided questions. Ask what concept I want to explore before giving a full explanation.',
    example: { title: 'Guide discovery, one question at a time', items: ['What do roots absorb from the soil?', 'Does soil supply all the sugar a plant needs?', 'Where does the carbon used to make sugar come from?', 'What supplies the energy for this process?', 'Explain photosynthesis in your own words.'] },
  },
  {
    id: 'individualized-support', name: 'Individualized Support', purpose: 'One learning goal. Different ways to get there.',
    available: 'Generate Beginner, Intermediate and Advanced worksheets, then assign all included levels as one resource.',
    planned: 'Automatic adaptation from learner attempts is planned.',
    action: 'differentiated', actionLabel: 'Create three difficulty levels',
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
    available: 'Discuss a misconception, ask for staged hints and explore an alternative explanation in chat.',
    planned: 'Automatic hint tracking and learner retries are planned.',
    action: 'chat', actionLabel: 'Work through a misconception',
    prompt: 'Help me work through a misconception in this lesson. First ask for the learner\'s question or attempted answer. Then suggest a diagnostic question, a gentle first hint and a related recheck. Do not assume a learner has mastered the topic.',
    example: { title: 'When a learner says plants get energy from soil', items: ['First hint — Soil supplies water and minerals. What is available in daylight?', 'Next hint — Water and carbon dioxide are ingredients. What powers the leaf’s food factory?', 'Recheck — A plant has water and carbon dioxide but no light. Would photosynthesis continue at its usual rate?'], note: 'Illustrative dialogue; no real learner attempt has been assessed.' },
  },
  {
    id: 'mentor-and-guide', name: 'Mentor and Guide', purpose: 'Turn evidence into a meaningful next step.',
    available: 'Discuss learner work you provide and draft feedback or follow-up questions in chat.',
    planned: 'Connected submissions, evidence summaries and progress dashboards are planned.',
    action: 'chat', actionLabel: 'Review a learner response',
    prompt: 'Help me review a learner response for this lesson. Ask me to share the response, learning objective and rubric first. Base feedback only on that evidence and suggest one next step. Do not invent learner scores, submission records or class-wide progress.',
    example: { title: 'Feedback grounded in one sample response', items: ['Sample response — “I would put the plant near a window for sunlight and water both plants equally.”', 'Demonstrated — Connects sunlight with food production and controls watering.', 'Next step — Ask what else should stay the same, such as plant type and size.'], note: 'One illustrative response; this is not a class progress report.' },
  },
];
