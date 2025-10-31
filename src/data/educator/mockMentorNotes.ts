export interface MentorNote {
  id: string;
  studentId: string;
  studentName: string;
  category: 'Skill' | 'Academic' | 'Behavior' | 'Personal' | 'Career';
  description: string;
  date: string;
  createdBy: string;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
  tags?: string[];
}

export const mockMentorNotes: MentorNote[] = [
  {
    id: 'note-1',
    studentId: 'std-001',
    studentName: 'Rahul Sharma',
    category: 'Skill',
    description: 'Demonstrated excellent problem-solving abilities during the coding competition. Needs to work on time management.',
    date: '2025-10-28',
    createdBy: 'Prof. Kumar',
    tags: ['coding', 'problem-solving']
  },
  {
    id: 'note-2',
    studentId: 'std-002',
    studentName: 'Priya Patel',
    category: 'Academic',
    description: 'Outstanding performance in mathematics. Consistently scores above 95%. Recommend for advanced placement.',
    date: '2025-10-27',
    createdBy: 'Dr. Singh',
    attachment: {
      name: 'test_results.pdf',
      url: '/attachments/test_results.pdf',
      type: 'application/pdf'
    },
    tags: ['mathematics', 'excellence']
  },
  {
    id: 'note-3',
    studentId: 'std-003',
    studentName: 'Amit Kumar',
    category: 'Behavior',
    description: 'Shows great leadership qualities. Led the team project effectively and ensured everyone participated.',
    date: '2025-10-26',
    createdBy: 'Prof. Kumar',
    tags: ['leadership', 'teamwork']
  },
  {
    id: 'note-4',
    studentId: 'std-004',
    studentName: 'Sneha Reddy',
    category: 'Personal',
    description: 'Expressed interest in pursuing AI/ML career. Recommended online courses and research opportunities.',
    date: '2025-10-25',
    createdBy: 'Dr. Mehta',
    tags: ['career-guidance', 'AI/ML']
  },
  {
    id: 'note-5',
    studentId: 'std-001',
    studentName: 'Rahul Sharma',
    category: 'Career',
    description: 'Discussed internship opportunities at tech companies. Shared resume building tips and interview preparation resources.',
    date: '2025-10-24',
    createdBy: 'Prof. Kumar',
    tags: ['internship', 'career']
  },
  {
    id: 'note-6',
    studentId: 'std-005',
    studentName: 'Ananya Singh',
    category: 'Skill',
    description: 'Exceptional presentation skills displayed during the science fair. Could improve technical depth in explanations.',
    date: '2025-10-23',
    createdBy: 'Dr. Singh',
    tags: ['presentation', 'communication']
  },
  {
    id: 'note-7',
    studentId: 'std-006',
    studentName: 'Vikram Rao',
    category: 'Academic',
    description: 'Struggling with physics concepts. Arranged extra tutoring sessions. Showing improvement gradually.',
    date: '2025-10-22',
    createdBy: 'Prof. Verma',
    tags: ['physics', 'tutoring']
  },
  {
    id: 'note-8',
    studentId: 'std-002',
    studentName: 'Priya Patel',
    category: 'Behavior',
    description: 'Very helpful to peers. Often assists classmates with difficult concepts. Great collaborative spirit.',
    date: '2025-10-21',
    createdBy: 'Dr. Singh',
    tags: ['helpful', 'collaboration']
  }
];
