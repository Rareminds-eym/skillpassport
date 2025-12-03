// Multi-Aptitude Battery (DAT / GATB style)
// Purpose: Measure relative cognitive strengths across domains commonly used in vocational guidance
// Domains: Verbal, Numerical, Abstract/Logic, Spatial/Mechanical, Clerical Speed & Accuracy

export const aptitudeQuestions = {
  // A) Verbal Reasoning (8 items) - ~2 minutes
  verbal: [
    {
      id: 'v1',
      type: 'analogy',
      text: 'Book : Reading :: Fork : ___',
      options: ['Drawing', 'Eating', 'Writing', 'Playing'],
      correct: 'Eating'
    },
    {
      id: 'v2',
      type: 'synonym',
      text: '"Brief" means:',
      options: ['Long', 'Short', 'Angry', 'Quiet'],
      correct: 'Short'
    },
    {
      id: 'v3',
      type: 'odd-one-out',
      text: 'Which one does NOT belong with the others?',
      options: ['Apple', 'Banana', 'Carrot', 'Mango'],
      correct: 'Carrot'
    },
    {
      id: 'v4',
      type: 'sentence-completion',
      text: '"He was tired, ___ he finished the work."',
      options: ['but', 'because', 'although', 'unless'],
      correct: 'but'
    },
    {
      id: 'v5',
      type: 'antonym',
      text: 'What is the opposite of "Expand"?',
      options: ['Grow', 'Stretch', 'Shrink', 'Improve'],
      correct: 'Shrink'
    },
    {
      id: 'v6',
      type: 'logical-statement',
      text: 'All engineers are problem-solvers. Priya is an engineer. Therefore, Priya is a ___',
      options: ['teacher', 'problem-solver', 'artist', 'singer'],
      correct: 'problem-solver'
    },
    {
      id: 'v7',
      type: 'word-meaning',
      text: '"The plan was feasible." What does "feasible" mean?',
      options: ['impossible', 'practical', 'risky', 'funny'],
      correct: 'practical'
    },
    {
      id: 'v8',
      type: 'analogy',
      text: 'Teacher : School :: Doctor : ___',
      options: ['Court', 'Hospital', 'Farm', 'Factory'],
      correct: 'Hospital'
    }
  ],

  // B) Numerical Ability (8 items) - ~2 minutes
  numerical: [
    {
      id: 'n1',
      type: 'percentage',
      text: '18% of 200 = ?',
      options: ['18', '36', '56', '72'],
      correct: '36'
    },
    {
      id: 'n2',
      type: 'algebra',
      text: 'If x + 7 = 15, then x = ?',
      options: ['6', '7', '8', '9'],
      correct: '8'
    },
    {
      id: 'n3',
      type: 'average',
      text: 'What is the average of 6, 8, and 10?',
      options: ['6', '7', '8', '9'],
      correct: '8'
    },
    {
      id: 'n4',
      type: 'ratio',
      text: 'The ratio 2:3 equals which decimal?',
      options: ['0.5', '0.67', '1.5', '2.0'],
      correct: '0.67'
    },
    {
      id: 'n5',
      type: 'squares',
      text: '3² + 4² = ?',
      options: ['7', '25', '49', '16'],
      correct: '25'
    },
    {
      id: 'n6',
      type: 'series',
      text: 'What comes next: 5, 10, 20, 40, ___',
      options: ['45', '60', '80', '100'],
      correct: '80'
    },
    {
      id: 'n7',
      type: 'discount',
      text: 'If a shirt costs ₹800 after a 20% discount, what was the original price?',
      options: ['₹960', '₹1000', '₹1200', '₹1600'],
      correct: '₹1000'
    },
    {
      id: 'n8',
      type: 'fraction',
      text: '0.25 as a fraction is:',
      options: ['1/2', '1/3', '1/4', '2/5'],
      correct: '1/4'
    }
  ],

  // C) Abstract / Logical Reasoning (8 items) - ~2 minutes
  abstract: [
    {
      id: 'a1',
      type: 'pattern',
      text: 'What comes next in the pattern: ▲ ■ ▲ ■ ▲ ___',
      options: ['▲', '■', '●', '◆'],
      correct: '■'
    },
    {
      id: 'a2',
      type: 'number-series',
      text: 'Find the next number: 2, 6, 12, 20, ___',
      options: ['24', '28', '30', '32'],
      correct: '30'
    },
    {
      id: 'a3',
      type: 'syllogism',
      text: 'If all Zibs are Lops, and all Lops are Mibs, then all Zibs are ___',
      options: ['Zibs only', 'Mibs', 'Lops only', 'None of these'],
      correct: 'Mibs'
    },
    {
      id: 'a4',
      type: 'odd-one-out',
      text: 'Which number does NOT belong: 3, 9, 27, 40',
      options: ['3', '9', '27', '40'],
      correct: '40'
    },
    {
      id: 'a5',
      type: 'code',
      text: 'If CAT is coded as DBU, then DOG is coded as:',
      options: ['EPH', 'EOH', 'EPG', 'FPH'],
      correct: 'EPH'
    },
    {
      id: 'a6',
      type: 'syllogism',
      text: 'Some A are B. All B are C. Therefore, some A are ___',
      options: ['C', 'B only', 'not C', 'None'],
      correct: 'C'
    },
    {
      id: 'a7',
      type: 'number-series',
      text: 'Find the next number: 1, 4, 9, 16, ___',
      options: ['20', '24', '25', '36'],
      correct: '25'
    },
    {
      id: 'a8',
      type: 'calendar',
      text: 'If today is Tuesday, what day is 3 days after the day before yesterday?',
      options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      correct: 'Wednesday'
    }
  ],

  // D) Spatial / Mechanical Reasoning (6 items) - ~2 minutes
  spatial: [
    {
      id: 's1',
      type: 'rotation',
      text: 'If the letter "L" is rotated 90° clockwise, which way does it point?',
      options: ['Up', 'Down', 'Left', 'Right'],
      correct: 'Down'
    },
    {
      id: 's2',
      type: 'gears',
      text: 'If gear A turns clockwise, the meshed gear B turns:',
      options: ['Clockwise', 'Anti-clockwise', 'Stops', 'Faster'],
      correct: 'Anti-clockwise'
    },
    {
      id: 's3',
      type: 'folding',
      text: 'A square paper is folded in half, then in half again. One corner is cut off. How many holes when unfolded?',
      options: ['1', '2', '4', '8'],
      correct: '4'
    },
    {
      id: 's4',
      type: 'lever',
      text: 'In a lever, if the load is closer to the fulcrum than the effort, the mechanical advantage is:',
      options: ['Greater than 1', 'Less than 1', 'Equal to 1', 'Zero'],
      correct: 'Greater than 1'
    },
    {
      id: 's5',
      type: 'cube',
      text: 'A cube painted on all sides is cut into 27 small cubes. How many small cubes have exactly 3 faces painted?',
      options: ['4', '6', '8', '12'],
      correct: '8'
    },
    {
      id: 's6',
      type: 'force',
      text: 'When a force is applied at right angles to a rotating object, it produces:',
      options: ['Heat', 'Torque/Motion', 'Sound', 'Friction only'],
      correct: 'Torque/Motion'
    }
  ],

  // E) Clerical Speed & Accuracy (20 items) - 5 minutes
  // Instruction: Mark whether the two strings are exactly the same
  clerical: [
    { id: 'c1', text: 'AB7K9 — AB7K9', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c2', text: '19QW2 — 19QWK', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c3', text: 'RAREM — RAREN', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c4', text: 'XY45Z — XY45Z', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c5', text: 'P0Q1R — POQ1R', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c6', text: 'MN89K — MN89K', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c7', text: 'HELLO — HELL0', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c8', text: '12AB34 — 12AB34', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c9', text: 'QWERTY — QWETRY', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c10', text: 'ZX78CV — ZX78CV', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c11', text: 'BN45MK — BN54MK', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c12', text: 'ASDFGH — ASDFGH', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c13', text: '7U8I9O — 7U8l9O', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c14', text: 'LKJHGF — LKJHGF', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c15', text: 'RT56YU — RT65YU', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c16', text: 'POIUYT — POIUYT', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c17', text: 'WE34RT — WE34RY', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c18', text: 'MNBVCX — MNBVCX', options: ['Same', 'Different'], correct: 'Same' },
    { id: 'c19', text: 'QA12WS — QA21WS', options: ['Same', 'Different'], correct: 'Different' },
    { id: 'c20', text: 'ZXCVBN — ZXCVBN', options: ['Same', 'Different'], correct: 'Same' }
  ]
};

// Flatten all aptitude questions for the assessment
export const getAllAptitudeQuestions = () => {
  return [
    ...aptitudeQuestions.verbal.map(q => ({ ...q, subtype: 'verbal', category: 'Verbal Reasoning' })),
    ...aptitudeQuestions.numerical.map(q => ({ ...q, subtype: 'numerical', category: 'Numerical Ability' })),
    ...aptitudeQuestions.abstract.map(q => ({ ...q, subtype: 'abstract', category: 'Abstract/Logical Reasoning' })),
    ...aptitudeQuestions.spatial.map(q => ({ ...q, subtype: 'spatial', category: 'Spatial/Mechanical Reasoning' })),
    ...aptitudeQuestions.clerical.map(q => ({ ...q, subtype: 'clerical', category: 'Clerical Speed & Accuracy' }))
  ];
};

// Get question counts by category
export const getAptitudeQuestionCounts = () => ({
  verbal: aptitudeQuestions.verbal.length,
  numerical: aptitudeQuestions.numerical.length,
  abstract: aptitudeQuestions.abstract.length,
  spatial: aptitudeQuestions.spatial.length,
  clerical: aptitudeQuestions.clerical.length,
  total: getAllAptitudeQuestions().length
});

export default aptitudeQuestions;
