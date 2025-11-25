import { Course } from '../../types/educator/course';

export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Web Development Fundamentals',
    code: 'CS301',
    description: 'Learn the basics of HTML, CSS, JavaScript and modern web development practices.',
    thumbnail: 'web-dev',
    status: 'Active',
    skillsCovered: ['Problem Solving', 'Critical Thinking', 'Creativity', 'Technical Skills'],
    skillsMapped: 15,
    totalSkills: 20,
    enrollmentCount: 45,
    completionRate: 68,
    evidencePending: 8,
    linkedClasses: ['Class 11A', 'Class 11B'],
    duration: '12 weeks',
    targetOutcomes: [
      'Build responsive websites using HTML and CSS',
      'Implement interactive features with JavaScript',
      'Understand web accessibility principles'
    ],
    modules: [
      {
        id: 'm1',
        title: 'HTML Basics',
        description: 'Introduction to HTML structure and semantic markup',
        skillTags: ['Technical Skills', 'Problem Solving'],
        lessons: [],
        activities: ['Assignment: Create a personal webpage'],
        order: 1
      },
      {
        id: 'm2',
        title: 'CSS Styling',
        description: 'Learn to style web pages with CSS',
        skillTags: ['Creativity', 'Technical Skills'],
        lessons: [],
        activities: ['Project: Design a portfolio site'],
        order: 2
      }
    ],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-02-10T14:30:00Z',
    coEducators: []
  },
  {
    id: '2',
    title: 'Data Science with Python',
    code: 'DS201',
    description: 'Introduction to data analysis, visualization, and machine learning using Python.',
    thumbnail: 'data-science',
    status: 'Active',
    skillsCovered: ['Critical Thinking', 'Problem Solving', 'Data Analysis', 'Programming'],
    skillsMapped: 18,
    totalSkills: 18,
    enrollmentCount: 32,
    completionRate: 75,
    evidencePending: 5,
    linkedClasses: ['Class 12A'],
    duration: '16 weeks',
    targetOutcomes: [
      'Perform data analysis using pandas and numpy',
      'Create visualizations with matplotlib and seaborn',
      'Build basic machine learning models'
    ],
    modules: [],
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-02-15T11:20:00Z',
    coEducators: []
  },
  {
    id: '3',
    title: 'Creative Writing Workshop',
    code: 'ENG401',
    description: 'Develop your creative writing skills through various genres and techniques.',
    thumbnail: 'creative-writing',
    status: 'Active',
    skillsCovered: ['Creativity', 'Communication', 'Critical Thinking'],
    skillsMapped: 10,
    totalSkills: 12,
    enrollmentCount: 28,
    completionRate: 82,
    evidencePending: 3,
    linkedClasses: ['Class 10A', 'Class 10B'],
    duration: '10 weeks',
    targetOutcomes: [
      'Write compelling short stories',
      'Develop unique narrative voices',
      'Provide constructive peer feedback'
    ],
    modules: [],
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-02-18T16:45:00Z',
    coEducators: ['Dr. Sarah Johnson']
  },
  {
    id: '4',
    title: 'Digital Marketing Essentials',
    code: 'MKT101',
    description: 'Learn the fundamentals of digital marketing, SEO, and social media strategies.',
    thumbnail: 'digital-marketing',
    status: 'Upcoming',
    skillsCovered: ['Communication', 'Creativity', 'Strategic Thinking', 'Collaboration'],
    skillsMapped: 8,
    totalSkills: 15,
    enrollmentCount: 0,
    completionRate: 0,
    evidencePending: 0,
    linkedClasses: ['Class 11A'],
    duration: '8 weeks',
    targetOutcomes: [
      'Create effective social media campaigns',
      'Understand SEO best practices',
      'Analyze marketing metrics'
    ],
    modules: [],
    createdAt: '2025-02-20T10:00:00Z',
    updatedAt: '2025-02-20T10:00:00Z',
    coEducators: []
  },
  {
    id: '5',
    title: 'Introduction to Robotics',
    code: 'TECH202',
    description: 'Hands-on course covering robotics fundamentals, programming, and automation.',
    thumbnail: 'robotics',
    status: 'Draft',
    skillsCovered: ['Problem Solving', 'Technical Skills', 'Collaboration', 'Innovation'],
    skillsMapped: 5,
    totalSkills: 20,
    enrollmentCount: 0,
    completionRate: 0,
    evidencePending: 0,
    linkedClasses: [],
    duration: '14 weeks',
    targetOutcomes: [
      'Build and program basic robots',
      'Understand sensors and actuators',
      'Implement automation solutions'
    ],
    modules: [],
    createdAt: '2025-02-22T14:00:00Z',
    updatedAt: '2025-02-22T14:00:00Z',
    coEducators: []
  },
  {
    id: '6',
    title: 'Environmental Science',
    code: 'SCI301',
    description: 'Explore environmental issues, sustainability, and conservation practices.',
    thumbnail: 'environment',
    status: 'Archived',
    skillsCovered: ['Critical Thinking', 'Research', 'Collaboration'],
    skillsMapped: 12,
    totalSkills: 12,
    enrollmentCount: 38,
    completionRate: 95,
    evidencePending: 0,
    linkedClasses: ['Class 9A', 'Class 9B'],
    duration: '12 weeks',
    targetOutcomes: [
      'Understand climate change impacts',
      'Analyze environmental data',
      'Propose sustainability solutions'
    ],
    modules: [],
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-12-15T17:00:00Z',
    coEducators: ['Prof. Michael Green']
  }
];

export const SKILL_CATEGORIES = [
  'Creativity',
  'Collaboration',
  'Critical Thinking',
  'Leadership',
  'Communication',
  'Problem Solving',
  'Technical Skills',
  'Data Analysis',
  'Programming',
  'Research',
  'Strategic Thinking',
  'Innovation'
];

export const CLASSES = [
  'Class 9A',
  'Class 9B',
  'Class 10A',
  'Class 10B',
  'Class 11A',
  'Class 11B',
  'Class 12A'
];
