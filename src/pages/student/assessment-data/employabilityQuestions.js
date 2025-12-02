// Employability and 21st Century Skills Assessment
// Includes self-rating skills + Situational Judgement Test (SJT)

export const employabilityQuestions = [
    // Communication - 3 questions
    { id: 'com1', type: 'Communication', text: 'I explain my ideas clearly.' },
    { id: 'com2', type: 'Communication', text: 'I adjust my communication to the audience.' },
    { id: 'com3', type: 'Communication', text: 'I listen actively without interrupting.' },

    // Teamwork - 3 questions
    { id: 'tm1', type: 'Teamwork', text: 'I contribute reliably in group tasks.' },
    { id: 'tm2', type: 'Teamwork', text: 'I handle disagreements respectfully.' },
    { id: 'tm3', type: 'Teamwork', text: 'I help the team stay on track.' },

    // Problem Solving - 3 questions
    { id: 'ps1', type: 'ProblemSolving', text: 'I break problems into smaller parts.' },
    { id: 'ps2', type: 'ProblemSolving', text: 'I generate multiple solutions.' },
    { id: 'ps3', type: 'ProblemSolving', text: 'I choose solutions based on evidence.' },

    // Adaptability - 3 questions
    { id: 'ad1', type: 'Adaptability', text: 'I stay calm when plans change.' },
    { id: 'ad2', type: 'Adaptability', text: 'I learn new tools quickly.' },
    { id: 'ad3', type: 'Adaptability', text: 'I handle uncertainty without freezing.' },

    // Leadership - 3 questions
    { id: 'ld1', type: 'Leadership', text: 'I take initiative when needed.' },
    { id: 'ld2', type: 'Leadership', text: 'I motivate peers toward deadlines.' },
    { id: 'ld3', type: 'Leadership', text: 'I delegate fairly.' },

    // Digital Fluency - 3 questions
    { id: 'df1', type: 'DigitalFluency', text: 'I\'m comfortable with new software.' },
    { id: 'df2', type: 'DigitalFluency', text: 'I use digital tools to organize work.' },
    { id: 'df3', type: 'DigitalFluency', text: 'I can learn a tech skill from online resources.' },

    // Professionalism - 3 questions
    { id: 'pr1', type: 'Professionalism', text: 'I manage time and deadlines well.' },
    { id: 'pr2', type: 'Professionalism', text: 'I take feedback constructively.' },
    { id: 'pr3', type: 'Professionalism', text: 'I communicate progress proactively.' },

    // Career Readiness - 4 questions
    { id: 'cr1', type: 'CareerReadiness', text: 'I know how to write a strong CV.' },
    { id: 'cr2', type: 'CareerReadiness', text: 'I can describe my strengths confidently.' },
    { id: 'cr3', type: 'CareerReadiness', text: 'I seek internships/projects actively.' },
    { id: 'cr4', type: 'CareerReadiness', text: 'I track my skill gaps and work on them.' },

    // SJT Scenarios - 6 questions
    {
        id: 'sjt1',
        type: 'SJT',
        text: 'Your teammate misses tasks repeatedly. You:',
        options: [
            'Do their part silently to finish',
            'Talk privately, ask what\'s blocking them, agree on a plan',
            'Complain to the faculty immediately',
            'Exclude them from the group chat'
        ],
        bestAnswer: 'Talk privately, ask what\'s blocking them, agree on a plan',
        worstAnswer: 'Exclude them from the group chat'
    },
    {
        id: 'sjt2',
        type: 'SJT',
        text: 'Client changes requirements late. You:',
        options: [
            'Refuse; say it\'s too late',
            'Ask for priority changes and renegotiate timeline',
            'Agree to everything without checking feasibility',
            'Ignore and continue old plan'
        ],
        bestAnswer: 'Ask for priority changes and renegotiate timeline',
        worstAnswer: 'Ignore and continue old plan'
    },
    {
        id: 'sjt3',
        type: 'SJT',
        text: 'You made an error in a submission. You:',
        options: [
            'Hide it and hope nobody notices',
            'Inform mentor, correct quickly, explain learning',
            'Blame the rubric',
            'Quit the task'
        ],
        bestAnswer: 'Inform mentor, correct quickly, explain learning',
        worstAnswer: 'Hide it and hope nobody notices'
    },
    {
        id: 'sjt4',
        type: 'SJT',
        text: 'Two teammates are in conflict. You:',
        options: [
            'Take sides with your friend',
            'Facilitate a calm discussion on facts and goals',
            'Tell them to "grow up"',
            'Leave the team'
        ],
        bestAnswer: 'Facilitate a calm discussion on facts and goals',
        worstAnswer: 'Tell them to "grow up"'
    },
    {
        id: 'sjt5',
        type: 'SJT',
        text: 'You\'re assigned a task you don\'t know. You:',
        options: [
            'Delay till last day',
            'Learn basics fast, ask guidance early, deliver in parts',
            'Say no immediately',
            'Copy from internet without understanding'
        ],
        bestAnswer: 'Learn basics fast, ask guidance early, deliver in parts',
        worstAnswer: 'Copy from internet without understanding'
    },
    {
        id: 'sjt6',
        type: 'SJT',
        text: 'Presentation anxiety before placement talk. You:',
        options: [
            'Skip presenting',
            'Practice small parts, seek feedback, then present',
            'Read slides without eye contact',
            'Ask someone else to present for you'
        ],
        bestAnswer: 'Practice small parts, seek feedback, then present',
        worstAnswer: 'Skip presenting'
    }
];
