export interface Activity {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  category: 'project' | 'certificate' | 'extracurricular' | 'achievement';
  status: 'pending' | 'verified' | 'rejected';
  submittedDate: string;
  verifiedDate?: string;
  verifiedBy?: string;
  media: MediaItem[];
  skills: string[];
  rejectionReason?: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  name: string;
}

export const mockActivities: Activity[] = [
  {
    id: 'act-001',
    studentId: 'std-001',
    studentName: 'Sarah Johnson',
    title: 'Science Fair Project - Renewable Energy',
    description: 'Developed a working model of a solar-powered water purification system.',
    category: 'project',
    status: 'pending',
    submittedDate: '2025-01-15T10:30:00Z',
    media: [
      {
        id: 'med-001',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200',
        name: 'solar-project.jpg'
      }
    ],
    skills: ['Critical Thinking', 'Problem Solving', 'Science']
  },
  {
    id: 'act-002',
    studentId: 'std-002',
    studentName: 'Michael Chen',
    title: 'JavaScript Certification - FreeCodeCamp',
    description: 'Completed 300-hour JavaScript Algorithms and Data Structures certification.',
    category: 'certificate',
    status: 'verified',
    submittedDate: '2025-01-10T14:20:00Z',
    verifiedDate: '2025-01-12T09:15:00Z',
    verifiedBy: 'Teacher Williams',
    media: [
      {
        id: 'med-002',
        type: 'document',
        url: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Certificate',
        thumbnail: 'https://via.placeholder.com/200x150/10b981/ffffff?text=Cert',
        name: 'freecodecamp-cert.pdf'
      }
    ],
    skills: ['Technology', 'Programming', 'Problem Solving']
  },
  {
    id: 'act-003',
    studentId: 'std-003',
    studentName: 'Emma Rodriguez',
    title: 'Community Art Mural Project',
    description: 'Led a team of 10 students to design and paint a mural at the local community center.',
    category: 'extracurricular',
    status: 'verified',
    submittedDate: '2025-01-08T11:45:00Z',
    verifiedDate: '2025-01-09T16:30:00Z',
    verifiedBy: 'Teacher Davis',
    media: [
      {
        id: 'med-003',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200',
        name: 'mural-final.jpg'
      },
      {
        id: 'med-004',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200',
        name: 'team-photo.jpg'
      }
    ],
    skills: ['Leadership', 'Creativity', 'Collaboration']
  },
  {
    id: 'act-004',
    studentId: 'std-004',
    studentName: 'James Wilson',
    title: 'Regional Basketball Tournament - 2nd Place',
    description: 'Team captain for school basketball team at regional tournament.',
    category: 'achievement',
    status: 'pending',
    submittedDate: '2025-01-14T09:00:00Z',
    media: [
      {
        id: 'med-005',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200',
        name: 'tournament-trophy.jpg'
      }
    ],
    skills: ['Teamwork', 'Leadership', 'Physical Fitness']
  },
  {
    id: 'act-005',
    studentId: 'std-005',
    studentName: 'Olivia Martinez',
    title: 'Research Paper - Climate Change Impact',
    description: 'Published research paper in youth science journal on local climate change effects.',
    category: 'project',
    status: 'verified',
    submittedDate: '2025-01-05T13:30:00Z',
    verifiedDate: '2025-01-07T10:00:00Z',
    verifiedBy: 'Teacher Anderson',
    media: [
      {
        id: 'med-006',
        type: 'document',
        url: 'https://via.placeholder.com/800x600/6366f1/ffffff?text=Research+Paper',
        thumbnail: 'https://via.placeholder.com/200x150/6366f1/ffffff?text=Paper',
        name: 'climate-research.pdf'
      }
    ],
    skills: ['Research', 'Writing', 'Analysis']
  },
  {
    id: 'act-006',
    studentId: 'std-001',
    studentName: 'Sarah Johnson',
    title: 'Student Council Vice President',
    description: 'Elected as Vice President of Student Council for 2024-2025.',
    category: 'achievement',
    status: 'rejected',
    submittedDate: '2025-01-03T15:20:00Z',
    rejectionReason: 'Please provide official documentation or certificate from school administration.',
    media: [],
    skills: ['Leadership', 'Communication']
  }
];
