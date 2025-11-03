export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  class: string;
  section: string;
  skills: string[];
  progress: number;
  status: 'active' | 'inactive';
  joinedDate: string;
  activitiesCount: number;
  verifiedActivitiesCount: number;
  portfolioComplete: boolean;
}

export const mockStudents: Student[] = [
  {
    id: 'std-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=6366f1&color=fff',
    class: 'Grade 10',
    section: 'A',
    skills: ['Leadership', 'Communication', 'Critical Thinking'],
    progress: 85,
    status: 'active',
    joinedDate: '2024-09-01',
    activitiesCount: 24,
    verifiedActivitiesCount: 20,
    portfolioComplete: true
  },
  {
    id: 'std-002',
    name: 'Michael Chen',
    email: 'michael.chen@school.edu',
    avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=10b981&color=fff',
    class: 'Grade 10',
    section: 'A',
    skills: ['Technology', 'Problem Solving', 'Collaboration'],
    progress: 72,
    status: 'active',
    joinedDate: '2024-09-01',
    activitiesCount: 18,
    verifiedActivitiesCount: 15,
    portfolioComplete: false
  },
  {
    id: 'std-003',
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@school.edu',
    avatar: 'https://ui-avatars.com/api/?name=Emma+Rodriguez&background=f59e0b&color=fff',
    class: 'Grade 10',
    section: 'B',
    skills: ['Creativity', 'Art & Design', 'Presentation'],
    progress: 91,
    status: 'active',
    joinedDate: '2024-09-01',
    activitiesCount: 28,
    verifiedActivitiesCount: 26,
    portfolioComplete: true
  },
  {
    id: 'std-004',
    name: 'James Wilson',
    email: 'james.wilson@school.edu',
    avatar: 'https://ui-avatars.com/api/?name=James+Wilson&background=8b5cf6&color=fff',
    class: 'Grade 9',
    section: 'A',
    skills: ['Sports', 'Teamwork', 'Physical Fitness'],
    progress: 65,
    status: 'active',
    joinedDate: '2024-09-15',
    activitiesCount: 12,
    verifiedActivitiesCount: 10,
    portfolioComplete: false
  },
  {
    id: 'std-005',
    name: 'Olivia Martinez',
    email: 'olivia.martinez@school.edu',
    avatar: 'https://ui-avatars.com/api/?name=Olivia+Martinez&background=ec4899&color=fff',
    class: 'Grade 11',
    section: 'A',
    skills: ['Research', 'Writing', 'Analysis'],
    progress: 88,
    status: 'active',
    joinedDate: '2024-08-25',
    activitiesCount: 31,
    verifiedActivitiesCount: 28,
    portfolioComplete: true
  },
  {
    id: 'std-006',
    name: 'Daniel Kim',
    email: 'daniel.kim@school.edu',
    avatar: 'https://ui-avatars.com/api/?name=Daniel+Kim&background=06b6d4&color=fff',
    class: 'Grade 11',
    section: 'B',
    skills: ['Mathematics', 'Logic', 'Programming'],
    progress: 78,
    status: 'active',
    joinedDate: '2024-08-25',
    activitiesCount: 22,
    verifiedActivitiesCount: 19,
    portfolioComplete: true
  }
];
