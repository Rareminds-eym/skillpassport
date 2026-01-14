/**
 * Middle School Assessment (Grades 6-8) - Age-appropriate career exploration
 * Also includes High School (Grades 9-10) and Higher Secondary (Grades 11-12) questions
 * 
 * @module features/assessment/data/questions/middleSchoolQuestions
 */

// ============================================================================
// Types
// ============================================================================

export interface MiddleSchoolQuestion {
  id: string;
  text: string;
  type: 'multiselect' | 'singleselect' | 'rating' | 'text';
  options?: string[];
  maxSelections?: number;
  categoryMapping?: Record<string, string>;
  strengthType?: string;
  placeholder?: string;
  taskType?: string;
  description?: string;
}

export interface RatingScaleOption {
  value: number;
  label: string;
}

// ============================================================================
// Set A: Grades 6–8 (Middle School)
// ============================================================================

// Section 1: Interest Explorer (RIASEC-style)
export const interestExplorerQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'ms1',
    text: 'If you had a "choose-any" period in school, what would you enjoy most? (pick 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'Building/making something with your hands',
      'Drawing/painting/designing',
      'Solving puzzles or brain games',
      'Helping someone learn or feel better',
      'Organizing a class event or selling something',
      'Being outdoors / with animals / nature'
    ],
    categoryMapping: {
      'Building/making something with your hands': 'R',
      'Drawing/painting/designing': 'A',
      'Solving puzzles or brain games': 'I',
      'Helping someone learn or feel better': 'S',
      'Organizing a class event or selling something': 'E',
      'Being outdoors / with animals / nature': 'R'
    }
  },
  {
    id: 'ms2',
    text: 'Which school activities feel most fun? (pick 3)',
    type: 'multiselect',
    maxSelections: 3,
    options: [
      'Science experiments',
      'Math games / logic puzzles',
      'Writing stories / poems',
      'Art / craft / design',
      'Sports / dance / drama',
      'Group discussions / debates',
      'Coding / robotics / tinkering',
      'Community / volunteering',
      'Business fairs / buying-selling projects',
      'Gardening / environment clubs'
    ],
    categoryMapping: {
      'Science experiments': 'I',
      'Math games / logic puzzles': 'I',
      'Writing stories / poems': 'A',
      'Art / craft / design': 'A',
      'Sports / dance / drama': 'R',
      'Group discussions / debates': 'S',
      'Coding / robotics / tinkering': 'I',
      'Community / volunteering': 'S',
      'Business fairs / buying-selling projects': 'E',
      'Gardening / environment clubs': 'R'
    }
  },
  {
    id: 'ms3',
    text: 'Which YouTube / books / shows do you naturally click on? (pick 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'How things work / inventions',
      'Art / music / creativity',
      'Mysteries / problem-solving',
      'People stories / emotions / friendships',
      'Money/business / "how to grow" ideas',
      'Nature / space / animals / earth'
    ],
    categoryMapping: {
      'How things work / inventions': 'I',
      'Art / music / creativity': 'A',
      'Mysteries / problem-solving': 'I',
      'People stories / emotions / friendships': 'S',
      'Money/business / "how to grow" ideas': 'E',
      'Nature / space / animals / earth': 'R'
    }
  },
  {
    id: 'ms4',
    text: 'When you do a project, you usually like to…',
    type: 'singleselect',
    options: [
      'Make a model / build something',
      'Make it look beautiful / creative',
      'Find facts and explain clearly',
      'Work with friends and share roles',
      'Plan it, lead it, present it',
      'Connect it to real life / society / environment'
    ],
    categoryMapping: {
      'Make a model / build something': 'R',
      'Make it look beautiful / creative': 'A',
      'Find facts and explain clearly': 'I',
      'Work with friends and share roles': 'S',
      'Plan it, lead it, present it': 'E',
      'Connect it to real life / society / environment': 'S'
    }
  },
  {
    id: 'ms5',
    text: 'What do you avoid because it feels boring or hard? (pick 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'Writing long answers',
      'Doing calculations',
      'Speaking in front of people',
      'Working in groups',
      'Doing neat/design work',
      'Doing hands-on/building tasks'
    ],
    categoryMapping: {
      'Writing long answers': 'A',
      'Doing calculations': 'I',
      'Speaking in front of people': 'E',
      'Working in groups': 'S',
      'Doing neat/design work': 'A',
      'Doing hands-on/building tasks': 'R'
    }
  }
];

// Section 2: Strengths & Character (VIA-style, kid language)
export const strengthsCharacterQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'ms6',
    text: 'I get curious and ask lots of "why/how" questions.',
    type: 'rating',
    strengthType: 'Curiosity'
  },
  {
    id: 'ms7',
    text: 'I keep trying even when something is difficult.',
    type: 'rating',
    strengthType: 'Perseverance'
  },
  {
    id: 'ms8',
    text: 'I notice when someone is left out and try to include them.',
    type: 'rating',
    strengthType: 'Kindness'
  },
  {
    id: 'ms9',
    text: "I'm good at finding new or different ideas.",
    type: 'rating',
    strengthType: 'Creativity'
  },
  {
    id: 'ms10',
    text: 'I stay calm or help others when things go wrong.',
    type: 'rating',
    strengthType: 'Leadership'
  },
  {
    id: 'ms11',
    text: 'I like learning new things even without exams.',
    type: 'rating',
    strengthType: 'Love of Learning'
  },
  {
    id: 'ms12',
    text: "People say I'm honest / fair.",
    type: 'rating',
    strengthType: 'Honesty'
  },
  {
    id: 'ms13',
    text: 'I like helping at home/school without being asked.',
    type: 'rating',
    strengthType: 'Helpfulness'
  },
  {
    id: 'ms14',
    text: "I'm good at making people laugh or feel relaxed.",
    type: 'rating',
    strengthType: 'Humor'
  },
  {
    id: 'ms15',
    text: 'I plan my work and finish on time.',
    type: 'rating',
    strengthType: 'Self-Discipline'
  },
  {
    id: 'ms16',
    text: 'Write one moment you felt proud of yourself this year. What strength did you use?',
    type: 'text',
    placeholder: 'Share your proud moment here...',
    strengthType: 'Reflection'
  }
];

// Section 3: Learning & Work Preferences
export const learningPreferencesQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'ms17',
    text: 'I learn best when… (pick 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'I see pictures/diagrams/videos',
      'Someone explains step-by-step',
      'I read and make notes',
      'I try it hands-on',
      'I discuss with a friend',
      'I teach someone else'
    ]
  },
  {
    id: 'ms18',
    text: 'I prefer doing work…',
    type: 'singleselect',
    options: [
      'Alone',
      'With one friend',
      'In a group',
      'Depends on the task'
    ]
  },
  {
    id: 'ms19',
    text: 'In group work, I usually…',
    type: 'singleselect',
    options: [
      'Take the lead',
      'Help with ideas',
      'Do the research',
      'Make it neat/creative',
      'Keep everyone together',
      'Prefer a clear role'
    ]
  },
  {
    id: 'ms20',
    text: "When I'm stuck, I first…",
    type: 'singleselect',
    options: [
      'Try again on my own',
      'Ask a friend',
      'Ask teacher/parent',
      'Look up a video',
      'Leave it and return later'
    ]
  }
];

// Rating scale for Strengths & Character questions
export const strengthsRatingScale: RatingScaleOption[] = [
  { value: 1, label: 'Not like me' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Mostly me' },
  { value: 4, label: 'Very me' }
];

// ============================================================================
// Set B: Grades 9–10 (High School) and Grades 11-12 (Higher Secondary)
// ============================================================================

// Section 1: Interest Explorer (RIASEC-style, more detailed)
export const highSchoolInterestQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'hs1',
    text: 'Which activities would you willingly spend extra time on? (pick 3)',
    type: 'multiselect',
    maxSelections: 3,
    options: [
      'Repairing/building/engineering things',
      'Creating art/design/media/music',
      'Investigating science, tech, research',
      'Teaching, mentoring, supporting others',
      'Running events, persuading, entrepreneurship',
      'Working with nature, environment, animals'
    ],
    categoryMapping: {
      'Repairing/building/engineering things': 'R',
      'Creating art/design/media/music': 'A',
      'Investigating science, tech, research': 'I',
      'Teaching, mentoring, supporting others': 'S',
      'Running events, persuading, entrepreneurship': 'E',
      'Working with nature, environment, animals': 'R'
    }
  },
  {
    id: 'hs2',
    text: "Choose 2 subjects you'd study even without marks:",
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'Math / statistics',
      'Physics / tech',
      'Biology / psychology',
      'Economics / business',
      'Literature / languages',
      'History / politics / society',
      'Computer science / AI',
      'Art / design / media',
      'Sports / physical training',
      'Environmental studies'
    ],
    categoryMapping: {
      'Math / statistics': 'I',
      'Physics / tech': 'I',
      'Biology / psychology': 'I',
      'Economics / business': 'E',
      'Literature / languages': 'A',
      'History / politics / society': 'S',
      'Computer science / AI': 'I',
      'Art / design / media': 'A',
      'Sports / physical training': 'R',
      'Environmental studies': 'R'
    }
  },
  {
    id: 'hs3',
    text: 'What kind of problems excite you? (pick 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      '"How does this work and how can we improve it?"',
      '"How can we create something original?"',
      '"What\'s the truth behind this data?"',
      '"How do people feel and why do they act this way?"',
      '"How can we grow or market this idea?"',
      '"How do we protect/improve the planet/life?"'
    ],
    categoryMapping: {
      '"How does this work and how can we improve it?"': 'R',
      '"How can we create something original?"': 'A',
      '"What\'s the truth behind this data?"': 'I',
      '"How do people feel and why do they act this way?"': 'S',
      '"How can we grow or market this idea?"': 'E',
      '"How do we protect/improve the planet/life?"': 'R'
    }
  },
  {
    id: 'hs4',
    text: 'Which role do you naturally take in projects?',
    type: 'singleselect',
    options: [
      'Builder / implementer',
      'Designer / storyteller',
      'Analyst / researcher',
      'Coordinator / mediator',
      'Leader / presenter',
      'Field-worker / explorer'
    ],
    categoryMapping: {
      'Builder / implementer': 'R',
      'Designer / storyteller': 'A',
      'Analyst / researcher': 'I',
      'Coordinator / mediator': 'S',
      'Leader / presenter': 'E',
      'Field-worker / explorer': 'R'
    }
  },
  {
    id: 'hs5',
    text: 'If you had to pick a project right now, which would you choose?',
    type: 'singleselect',
    options: [
      'Build a simple app / robot / model',
      'Create a short film / campaign / design portfolio',
      'Do a research study with data + conclusions',
      'Plan a peer-mentoring or community program',
      'Launch a small business / event / fundraiser',
      'Work on an environment/nature initiative'
    ],
    categoryMapping: {
      'Build a simple app / robot / model': 'R',
      'Create a short film / campaign / design portfolio': 'A',
      'Do a research study with data + conclusions': 'I',
      'Plan a peer-mentoring or community program': 'S',
      'Launch a small business / event / fundraiser': 'E',
      'Work on an environment/nature initiative': 'R'
    }
  }
];

// Section 2: Strengths & Character (VIA-style, teen language)
export const highSchoolStrengthsQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'hs6',
    text: "I'm driven by curiosity — I like getting to the bottom of things.",
    type: 'rating',
    strengthType: 'Curiosity'
  },
  {
    id: 'hs7',
    text: 'I stay persistent through long or boring tasks.',
    type: 'rating',
    strengthType: 'Perseverance'
  },
  {
    id: 'hs8',
    text: 'People trust me to be fair and honest.',
    type: 'rating',
    strengthType: 'Honesty'
  },
  {
    id: 'hs9',
    text: 'I generate original ideas or creative angles.',
    type: 'rating',
    strengthType: 'Creativity'
  },
  {
    id: 'hs10',
    text: 'I handle pressure without falling apart.',
    type: 'rating',
    strengthType: 'Resilience'
  },
  {
    id: 'hs11',
    text: 'I care about people and notice their needs.',
    type: 'rating',
    strengthType: 'Kindness'
  },
  {
    id: 'hs12',
    text: "I'm organized and plan ahead.",
    type: 'rating',
    strengthType: 'Self-Discipline'
  },
  {
    id: 'hs13',
    text: 'I take responsibility even when no one forces me.',
    type: 'rating',
    strengthType: 'Responsibility'
  },
  {
    id: 'hs14',
    text: "I'm comfortable speaking up or leading when needed.",
    type: 'rating',
    strengthType: 'Leadership'
  },
  {
    id: 'hs15',
    text: 'I reflect on myself and try to improve.',
    type: 'rating',
    strengthType: 'Self-Awareness'
  },
  {
    id: 'hs16',
    text: 'Describe a challenge you overcame. What personal strengths helped you?',
    type: 'text',
    placeholder: 'Describe your challenge and the strengths you used...',
    strengthType: 'Reflection'
  },
  {
    id: 'hs17',
    text: 'What do people consistently appreciate about you?',
    type: 'text',
    placeholder: 'Share what others appreciate about you...',
    strengthType: 'Reflection'
  }
];

// Section 3: Learning & Work Preferences
export const highSchoolLearningQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'hs18',
    text: 'I learn best through… (rank top 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'Reading + summarizing',
      'Watching + visualizing',
      'Hands-on practice',
      'Discussions/debates',
      'Solving problems',
      'Teaching/explaining to others'
    ]
  },
  {
    id: 'hs19',
    text: 'I prefer tasks that are… (pick 2)',
    type: 'multiselect',
    maxSelections: 2,
    options: [
      'Structured with clear steps',
      'Open-ended with freedom',
      'Fast and varied',
      'Deep and focused',
      'Solo',
      'Collaborative'
    ]
  },
  {
    id: 'hs20',
    text: 'When starting a task, I usually…',
    type: 'singleselect',
    options: [
      'Plan first, then act',
      'Start acting, then adjust',
      'Need a push, then I flow',
      'Prefer clear deadlines'
    ]
  },
  {
    id: 'hs21',
    text: 'In a team, my strongest contribution is…',
    type: 'singleselect',
    options: [
      'Execution / building',
      'Creativity / design',
      'Analysis / research',
      'People management',
      'Presenting / influencing',
      'Strategy / planning'
    ]
  }
];

// Section 4: Aptitude Sampling (mini-tasks + reflection)
export const highSchoolAptitudeQuestions: MiddleSchoolQuestion[] = [
  {
    id: 'hs22',
    text: 'Task A: Analytical reasoning - Rate the EASE of this task',
    type: 'rating',
    taskType: 'Analytical',
    description: '(e.g., data interpretation, logic grid, basic stats problem)'
  },
  {
    id: 'hs23',
    text: 'Task A: Analytical reasoning - Rate your ENJOYMENT of this task',
    type: 'rating',
    taskType: 'Analytical'
  },
  {
    id: 'hs24',
    text: 'Task B: Creative production - Rate the EASE of this task',
    type: 'rating',
    taskType: 'Creative',
    description: '(e.g., design a poster, write a pitch/story, create a 1-min reel plan)'
  },
  {
    id: 'hs25',
    text: 'Task B: Creative production - Rate your ENJOYMENT of this task',
    type: 'rating',
    taskType: 'Creative'
  },
  {
    id: 'hs26',
    text: 'Task C: Technical/hands-on build - Rate the EASE of this task',
    type: 'rating',
    taskType: 'Technical',
    description: '(e.g., prototype, coding mini-challenge, mechanical build)'
  },
  {
    id: 'hs27',
    text: 'Task C: Technical/hands-on build - Rate your ENJOYMENT of this task',
    type: 'rating',
    taskType: 'Technical'
  },
  {
    id: 'hs28',
    text: 'Task D: Social/leadership scenario - Rate the EASE of this task',
    type: 'rating',
    taskType: 'Social',
    description: '(e.g., resolve a conflict, lead a small group plan, mentor a junior)'
  },
  {
    id: 'hs29',
    text: 'Task D: Social/leadership scenario - Rate your ENJOYMENT of this task',
    type: 'rating',
    taskType: 'Social'
  },
  {
    id: 'hs30',
    text: 'Which task gave you energy? What skill was it using?',
    type: 'text',
    placeholder: 'Describe which task energized you and why...',
    strengthType: 'Reflection'
  },
  {
    id: 'hs31',
    text: 'Which task drained you? Why?',
    type: 'text',
    placeholder: 'Describe which task was draining and why...',
    strengthType: 'Reflection'
  },
  {
    id: 'hs32',
    text: 'If you could improve one skill this year, what would it be and how will you practice it?',
    type: 'text',
    placeholder: 'Share the skill you want to improve and your practice plan...',
    strengthType: 'Reflection'
  }
];

// Rating scale for High School assessments
export const highSchoolRatingScale: RatingScaleOption[] = [
  { value: 1, label: 'Not me' },
  { value: 2, label: 'A bit' },
  { value: 3, label: 'Mostly' },
  { value: 4, label: 'Strongly me' }
];

// Aptitude task rating scale
export const aptitudeRatingScale: RatingScaleOption[] = [
  { value: 1, label: 'Very difficult / Not enjoyable' },
  { value: 2, label: 'Somewhat difficult / Slightly enjoyable' },
  { value: 3, label: 'Moderately easy / Moderately enjoyable' },
  { value: 4, label: 'Very easy / Very enjoyable' }
];
