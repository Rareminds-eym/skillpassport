// Employability / 21st-Century Skills Diagnostic + SJT
// Purpose: Baseline for placement readiness; convert to skill-upgrade plan
// 21st-century skills are commonly measured via self-ratings plus situational judgement tests

// Part A: Self-rating skills (25 items)
// Response format: 1 = Not like me, 2 = Slightly, 3 = Somewhat, 4 = Mostly, 5 = Very much like me
export const selfRatingQuestions = {
  // Communication (3 items)
  communication: [
    { id: 'com1', text: 'I explain my ideas clearly.' },
    { id: 'com2', text: 'I adjust my communication to the audience.' },
    { id: 'com3', text: 'I listen actively without interrupting.' }
  ],

  // Teamwork (3 items)
  teamwork: [
    { id: 'tm1', text: 'I contribute reliably in group tasks.' },
    { id: 'tm2', text: 'I handle disagreements respectfully.' },
    { id: 'tm3', text: 'I help the team stay on track.' }
  ],

  // Problem Solving (3 items)
  problemSolving: [
    { id: 'ps1', text: 'I break problems into smaller parts.' },
    { id: 'ps2', text: 'I generate multiple solutions.' },
    { id: 'ps3', text: 'I choose solutions based on evidence.' }
  ],

  // Adaptability (3 items)
  adaptability: [
    { id: 'ad1', text: 'I stay calm when plans change.' },
    { id: 'ad2', text: 'I learn new tools quickly.' },
    { id: 'ad3', text: 'I handle uncertainty without freezing.' }
  ],

  // Leadership (3 items)
  leadership: [
    { id: 'ld1', text: 'I take initiative when needed.' },
    { id: 'ld2', text: 'I motivate peers toward deadlines.' },
    { id: 'ld3', text: 'I delegate fairly.' }
  ],

  // Digital Fluency (3 items)
  digitalFluency: [
    { id: 'df1', text: "I'm comfortable with new software." },
    { id: 'df2', text: 'I use digital tools to organize work.' },
    { id: 'df3', text: 'I can learn a tech skill from online resources.' }
  ],

  // Professionalism (3 items)
  professionalism: [
    { id: 'pr1', text: 'I manage time and deadlines well.' },
    { id: 'pr2', text: 'I take feedback constructively.' },
    { id: 'pr3', text: 'I communicate progress proactively.' }
  ],

  // Career Readiness (4 items)
  careerReadiness: [
    { id: 'cr1', text: 'I know how to write a strong CV.' },
    { id: 'cr2', text: 'I can describe my strengths confidently.' },
    { id: 'cr3', text: 'I seek internships/projects actively.' },
    { id: 'cr4', text: 'I track my skill gaps and work on them.' }
  ]
};

// Part B: Situational Judgement Test (6 scenarios)
// Response format: Choose BEST and WORST option for each scenario
// Scoring: Best=2, Worst=0, others=1
export const sjtQuestions = [
  {
    id: 'sjt1',
    scenario: 'Team member not contributing',
    text: 'Your teammate misses tasks repeatedly. You:',
    options: [
      { label: 'a', text: 'Do their part silently to finish.' },
      { label: 'b', text: "Talk privately, ask what's blocking them, agree on a plan." },
      { label: 'c', text: 'Complain to the faculty immediately.' },
      { label: 'd', text: 'Exclude them from the group chat.' }
    ],
    best: 'b',
    worst: 'd'
  },
  {
    id: 'sjt2',
    scenario: 'Client changes requirements late',
    text: 'Client changes requirements late. You:',
    options: [
      { label: 'a', text: "Refuse; say it's too late." },
      { label: 'b', text: 'Ask for priority changes and renegotiate timeline.' },
      { label: 'c', text: 'Agree to everything without checking feasibility.' },
      { label: 'd', text: 'Ignore and continue old plan.' }
    ],
    best: 'b',
    worst: 'd'
  },
  {
    id: 'sjt3',
    scenario: 'You made an error in a submission',
    text: 'You made an error in a submission. You:',
    options: [
      { label: 'a', text: 'Hide it and hope nobody notices.' },
      { label: 'b', text: 'Inform mentor, correct quickly, explain learning.' },
      { label: 'c', text: 'Blame the rubric.' },
      { label: 'd', text: 'Quit the task.' }
    ],
    best: 'b',
    worst: 'a'
  },
  {
    id: 'sjt4',
    scenario: 'Two teammates are in conflict',
    text: 'Two teammates are in conflict. You:',
    options: [
      { label: 'a', text: 'Take sides with your friend.' },
      { label: 'b', text: 'Facilitate a calm discussion on facts and goals.' },
      { label: 'c', text: 'Tell them to "grow up."' },
      { label: 'd', text: 'Leave the team.' }
    ],
    best: 'b',
    worst: 'c'
  },
  {
    id: 'sjt5',
    scenario: "You're assigned a task you don't know",
    text: "You're assigned a task you don't know. You:",
    options: [
      { label: 'a', text: 'Delay till last day.' },
      { label: 'b', text: 'Learn basics fast, ask guidance early, deliver in parts.' },
      { label: 'c', text: 'Say no immediately.' },
      { label: 'd', text: 'Copy from internet without understanding.' }
    ],
    best: 'b',
    worst: 'd'
  },
  {
    id: 'sjt6',
    scenario: 'Presentation anxiety before placement talk',
    text: 'Presentation anxiety before placement talk. You:',
    options: [
      { label: 'a', text: 'Skip presenting.' },
      { label: 'b', text: 'Practice small parts, seek feedback, then present.' },
      { label: 'c', text: 'Read slides without eye contact.' },
      { label: 'd', text: 'Ask someone else to present for you.' }
    ],
    best: 'b',
    worst: 'a'
  }
];

// Module metadata for UI display
export const employabilityModules = [
  {
    id: 'partA',
    title: 'Part A: Self-Rating Skills',
    description: 'Rate yourself on 21st-century workplace skills',
    subModules: [
      { id: 'communication', title: 'Communication', questionCount: 3, color: 'blue' },
      { id: 'teamwork', title: 'Teamwork', questionCount: 3, color: 'green' },
      { id: 'problemSolving', title: 'Problem Solving', questionCount: 3, color: 'purple' },
      { id: 'adaptability', title: 'Adaptability', questionCount: 3, color: 'orange' },
      { id: 'leadership', title: 'Leadership', questionCount: 3, color: 'red' },
      { id: 'digitalFluency', title: 'Digital Fluency', questionCount: 3, color: 'cyan' },
      { id: 'professionalism', title: 'Professionalism', questionCount: 3, color: 'indigo' },
      { id: 'careerReadiness', title: 'Career Readiness', questionCount: 4, color: 'amber' }
    ],
    totalQuestions: 25
  },
  {
    id: 'partB',
    title: 'Part B: Situational Judgement Test',
    description: 'Choose the BEST and WORST response for each workplace scenario',
    totalQuestions: 6,
    color: 'rose'
  }
];

// Flatten all employability questions for the assessment
export const employabilityQuestions = [
  // Part A: Self-rating (25 items)
  ...selfRatingQuestions.communication.map(q => ({ ...q, type: 'Communication', partType: 'selfRating', moduleTitle: 'Communication' })),
  ...selfRatingQuestions.teamwork.map(q => ({ ...q, type: 'Teamwork', partType: 'selfRating', moduleTitle: 'Teamwork' })),
  ...selfRatingQuestions.problemSolving.map(q => ({ ...q, type: 'ProblemSolving', partType: 'selfRating', moduleTitle: 'Problem Solving' })),
  ...selfRatingQuestions.adaptability.map(q => ({ ...q, type: 'Adaptability', partType: 'selfRating', moduleTitle: 'Adaptability' })),
  ...selfRatingQuestions.leadership.map(q => ({ ...q, type: 'Leadership', partType: 'selfRating', moduleTitle: 'Leadership' })),
  ...selfRatingQuestions.digitalFluency.map(q => ({ ...q, type: 'DigitalFluency', partType: 'selfRating', moduleTitle: 'Digital Fluency' })),
  ...selfRatingQuestions.professionalism.map(q => ({ ...q, type: 'Professionalism', partType: 'selfRating', moduleTitle: 'Professionalism' })),
  ...selfRatingQuestions.careerReadiness.map(q => ({ ...q, type: 'CareerReadiness', partType: 'selfRating', moduleTitle: 'Career Readiness' })),
  
  // Part B: SJT (6 scenarios)
  ...sjtQuestions.map(q => ({
    id: q.id,
    type: 'SJT',
    partType: 'sjt',
    moduleTitle: 'Situational Judgement',
    text: q.text,
    scenario: q.scenario,
    options: q.options.map(o => o.text),
    optionLabels: q.options.map(o => o.label),
    bestAnswer: q.options.find(o => o.label === q.best)?.text,
    worstAnswer: q.options.find(o => o.label === q.worst)?.text,
    best: q.best,
    worst: q.worst
  }))
];

// Get current module based on question index
export const getCurrentEmployabilityModule = (questionIndex) => {
  if (questionIndex < 25) {
    // Part A - find which skill domain
    let cumulative = 0;
    const domains = [
      { id: 'communication', title: 'Communication', count: 3 },
      { id: 'teamwork', title: 'Teamwork', count: 3 },
      { id: 'problemSolving', title: 'Problem Solving', count: 3 },
      { id: 'adaptability', title: 'Adaptability', count: 3 },
      { id: 'leadership', title: 'Leadership', count: 3 },
      { id: 'digitalFluency', title: 'Digital Fluency', count: 3 },
      { id: 'professionalism', title: 'Professionalism', count: 3 },
      { id: 'careerReadiness', title: 'Career Readiness', count: 4 }
    ];
    
    for (const domain of domains) {
      if (questionIndex < cumulative + domain.count) {
        return {
          part: 'A',
          partTitle: 'Part A: Self-Rating Skills',
          domain: domain.title,
          questionInDomain: questionIndex - cumulative + 1,
          domainTotal: domain.count
        };
      }
      cumulative += domain.count;
    }
  }
  
  // Part B - SJT
  return {
    part: 'B',
    partTitle: 'Part B: Situational Judgement Test',
    domain: 'SJT Scenarios',
    questionInDomain: questionIndex - 24,
    domainTotal: 6
  };
};

// Get question counts
export const getEmployabilityQuestionCounts = () => ({
  selfRating: 25,
  sjt: 6,
  total: 31
});

export default employabilityQuestions;
