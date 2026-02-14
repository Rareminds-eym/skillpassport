/**
 * Employability / 21st-Century Skills Diagnostic + SJT
 * Purpose: Baseline for placement readiness; convert to skill-upgrade plan
 * 
 * @module features/assessment/data/questions/employabilityQuestions
 */

export interface SelfRatingQuestion {
  id: string;
  text: string;
  type?: string;
  partType?: string;
  moduleTitle?: string;
}

export interface SJTOption {
  label: string;
  text: string;
}

export interface SJTQuestion {
  id: string;
  scenario: string;
  text: string;
  options: SJTOption[];
  best: string;
  worst: string;
}

// Part A: Self-rating skills (25 items)
export const selfRatingQuestions = {
  communication: [
    { id: 'employability_com1', text: 'I explain my ideas clearly.' },
    { id: 'employability_com2', text: 'I adjust my communication to the audience.' },
    { id: 'employability_com3', text: 'I listen actively without interrupting.' }
  ],
  teamwork: [
    { id: 'employability_tm1', text: 'I contribute reliably in group tasks.' },
    { id: 'employability_tm2', text: 'I handle disagreements respectfully.' },
    { id: 'employability_tm3', text: 'I help the team stay on track.' }
  ],
  problemSolving: [
    { id: 'employability_ps1', text: 'I break problems into smaller parts.' },
    { id: 'employability_ps2', text: 'I generate multiple solutions.' },
    { id: 'employability_ps3', text: 'I choose solutions based on evidence.' }
  ],
  adaptability: [
    { id: 'employability_ad1', text: 'I stay calm when plans change.' },
    { id: 'employability_ad2', text: 'I learn new tools quickly.' },
    { id: 'employability_ad3', text: 'I handle uncertainty without freezing.' }
  ],
  leadership: [
    { id: 'employability_ld1', text: 'I take initiative when needed.' },
    { id: 'employability_ld2', text: 'I motivate peers toward deadlines.' },
    { id: 'employability_ld3', text: 'I delegate fairly.' }
  ],
  digitalFluency: [
    { id: 'employability_df1', text: "I'm comfortable with new software." },
    { id: 'employability_df2', text: 'I use digital tools to organize work.' },
    { id: 'employability_df3', text: 'I can learn a tech skill from online resources.' }
  ],
  professionalism: [
    { id: 'employability_pr1', text: 'I manage time and deadlines well.' },
    { id: 'employability_pr2', text: 'I take feedback constructively.' },
    { id: 'employability_pr3', text: 'I communicate progress proactively.' }
  ],
  careerReadiness: [
    { id: 'employability_cr1', text: 'I know how to write a strong CV.' },
    { id: 'employability_cr2', text: 'I can describe my strengths confidently.' },
    { id: 'employability_cr3', text: 'I seek internships/projects actively.' },
    { id: 'employability_cr4', text: 'I track my skill gaps and work on them.' }
  ]
};

// Part B: Situational Judgement Test (6 scenarios)
export const sjtQuestions: SJTQuestion[] = [
  {
    id: 'employability_sjt1',
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
    id: 'employability_sjt2',
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
    id: 'employability_sjt3',
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
    id: 'employability_sjt4',
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
    id: 'employability_sjt5',
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
    id: 'employability_sjt6',
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
export const getCurrentEmployabilityModule = (questionIndex: number) => {
  if (questionIndex < 25) {
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
  
  return {
    part: 'B',
    partTitle: 'Part B: Situational Judgement Test',
    domain: 'SJT Scenarios',
    questionInDomain: questionIndex - 24,
    domainTotal: 6
  };
};

export const getEmployabilityQuestionCounts = () => ({
  selfRating: 25,
  sjt: 6,
  total: 31
});

export default employabilityQuestions;
