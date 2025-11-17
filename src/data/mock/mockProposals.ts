import { Proposal, StudentProfile } from '../../types/project';

export const mockStudents: StudentProfile[] = [
  {
    id: 'std-001',
    name: 'Rahul Kumar',
    email: 'rahul.k@example.com',
    photo: 'https://i.pravatar.cc/150?img=12',
    university: 'IIT Delhi',
    department: 'Computer Science',
    cgpa: 8.5,
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
    bio: 'Full-stack developer with 2+ years of experience in web development and cloud technologies.'
  },
  {
    id: 'std-002',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    photo: 'https://i.pravatar.cc/150?img=45',
    university: 'BITS Pilani',
    department: 'Information Technology',
    cgpa: 9.0,
    skills: ['React Native', 'Firebase', 'Redux', 'JavaScript', 'UI/UX'],
    bio: 'Mobile app developer passionate about creating intuitive user experiences.'
  },
  {
    id: 'std-003',
    name: 'Amit Patel',
    email: 'amit.p@example.com',
    photo: 'https://i.pravatar.cc/150?img=33',
    university: 'NIT Trichy',
    department: 'Design',
    cgpa: 8.8,
    skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Prototyping'],
    bio: 'UI/UX designer with a keen eye for detail and modern design trends.'
  },
  {
    id: 'std-004',
    name: 'Sneha Reddy',
    email: 'sneha.r@example.com',
    photo: 'https://i.pravatar.cc/150?img=25',
    university: 'IIIT Hyderabad',
    department: 'Data Science',
    cgpa: 9.2,
    skills: ['Python', 'Pandas', 'Machine Learning', 'SQL', 'Tableau'],
    bio: 'Data scientist specializing in predictive analytics and visualization.'
  },
  {
    id: 'std-005',
    name: 'Arjun Singh',
    email: 'arjun.s@example.com',
    photo: 'https://i.pravatar.cc/150?img=68',
    university: 'VIT Vellore',
    department: 'Computer Science',
    cgpa: 8.7,
    skills: ['React Native', 'Flutter', 'Firebase', 'REST APIs', 'Mobile Development'],
    bio: 'Mobile developer with expertise in cross-platform app development.'
  }
];

export const mockProposals: Proposal[] = [
  // Proposals for proj-001 (E-commerce Website)
  {
    id: 'prop-001',
    project_id: 'proj-001',
    student_id: 'std-001',
    student: mockStudents[0],
    cover_letter: 'I am excited to work on your e-commerce platform. With over 2 years of experience in full-stack development, I have built similar projects using React and Node.js. I recently completed an e-commerce site for a retail client that handles 1000+ daily transactions. I can deliver a scalable, secure platform with modern UI/UX.',
    proposed_budget: 75000,
    proposed_timeline: '8 weeks',
    proposed_milestones: [
      { name: 'Design & Architecture', amount: 15000, deadline: '2025-12-01' },
      { name: 'Frontend Development', amount: 25000, deadline: '2025-12-15' },
      { name: 'Backend & Integration', amount: 25000, deadline: '2025-12-29' },
      { name: 'Testing & Launch', amount: 10000, deadline: '2026-01-05' }
    ],
    relevant_experience: 'Built 3 e-commerce platforms, 5+ years React experience',
    portfolio_links: ['https://portfolio.example.com/ecommerce-project'],
    sample_work_links: ['https://github.com/rahulk/ecommerce-demo'],
    status: 'shortlisted',
    recruiter_rating: 4,
    recruiter_notes: 'Strong technical background, good portfolio',
    questions_answers: [
      {
        question: 'Can you integrate with Razorpay payment gateway?',
        answer: 'Yes, I have integrated Razorpay in 2 previous projects.',
        asked_by: 'recruiter',
        timestamp: '2025-11-12T10:00:00Z'
      }
    ],
    submitted_at: '2025-11-11T09:30:00Z',
    reviewed_at: '2025-11-13T14:20:00Z',
    updated_at: '2025-11-13T14:20:00Z'
  },
  {
    id: 'prop-002',
    project_id: 'proj-001',
    student_id: 'std-002',
    student: mockStudents[1],
    cover_letter: 'Hi! I would love to help build your e-commerce platform. I have experience with React and modern web technologies. I focus on creating responsive, user-friendly interfaces that convert visitors to customers.',
    proposed_budget: 68000,
    proposed_timeline: '7 weeks',
    proposed_milestones: [
      { name: 'Complete Frontend', amount: 35000, deadline: '2025-12-10' },
      { name: 'Backend Development', amount: 23000, deadline: '2025-12-20' },
      { name: 'Final Integration', amount: 10000, deadline: '2025-12-27' }
    ],
    relevant_experience: '2 years of web development',
    portfolio_links: ['https://portfolio.example.com/projects'],
    sample_work_links: [],
    status: 'submitted',
    questions_answers: [],
    submitted_at: '2025-11-12T11:45:00Z',
    updated_at: '2025-11-12T11:45:00Z'
  },
  // Proposals for proj-003 (Data Analysis Dashboard)
  {
    id: 'prop-003',
    project_id: 'proj-003',
    student_id: 'std-004',
    student: mockStudents[3],
    cover_letter: 'I am a data science graduate from IIIT Hyderabad with extensive experience in Python, Pandas, and data visualization. I have created 5+ interactive dashboards using Plotly and Dash. I understand the importance of clean, maintainable code and comprehensive documentation.',
    proposed_budget: 48000,
    proposed_timeline: '6 weeks',
    proposed_milestones: [
      { name: 'Data Pipeline & ETL', amount: 16000, deadline: '2025-11-28' },
      { name: 'Dashboard Development', amount: 22000, deadline: '2025-12-12' },
      { name: 'Testing & Documentation', amount: 10000, deadline: '2025-12-20' }
    ],
    relevant_experience: 'Created dashboards for 3 startups, Strong Python & SQL skills',
    portfolio_links: ['https://portfolio.example.com/data-projects'],
    sample_work_links: ['https://github.com/snehar/dashboard-samples'],
    status: 'under_review',
    recruiter_rating: 5,
    recruiter_notes: 'Excellent portfolio, very qualified',
    questions_answers: [
      {
        question: 'Can you work with MySQL database?',
        answer: 'Absolutely! I have 3 years of experience with MySQL and PostgreSQL.',
        asked_by: 'recruiter',
        timestamp: '2025-11-14T10:30:00Z'
      }
    ],
    submitted_at: '2025-11-13T16:00:00Z',
    reviewed_at: '2025-11-15T09:00:00Z',
    updated_at: '2025-11-15T09:00:00Z'
  },
  // Proposals for proj-005 (Content Writing)
  {
    id: 'prop-004',
    project_id: 'proj-005',
    student_id: 'std-003',
    student: mockStudents[2],
    cover_letter: 'As a technical content writer with a background in computer science, I can create engaging, SEO-optimized content that resonates with your tech-savvy audience. I have written 50+ technical articles covering AI, web development, and cloud technologies.',
    proposed_budget: 18000,
    proposed_timeline: '5 weeks',
    proposed_milestones: [
      { name: 'First 8 Articles', amount: 7000, deadline: '2025-12-05' },
      { name: 'Next 7 Articles', amount: 6000, deadline: '2025-12-15' },
      { name: 'Final 5 Articles', amount: 5000, deadline: '2025-12-22' }
    ],
    relevant_experience: 'Written for Tech blogs, Medium publications',
    portfolio_links: ['https://medium.com/@amitpatel'],
    sample_work_links: ['https://example.com/sample-articles'],
    status: 'submitted',
    questions_answers: [],
    submitted_at: '2025-11-15T08:20:00Z',
    updated_at: '2025-11-15T08:20:00Z'
  }
];

export const getProposalsByProject = (projectId: string): Proposal[] => {
  return mockProposals.filter(proposal => proposal.project_id === projectId);
};

export const getProposalById = (id: string): Proposal | undefined => {
  return mockProposals.find(proposal => proposal.id === id);
};

export const getProposalStats = (projectId: string) => {
  const proposals = getProposalsByProject(projectId);
  return {
    total: proposals.length,
    submitted: proposals.filter(p => p.status === 'submitted').length,
    under_review: proposals.filter(p => p.status === 'under_review').length,
    shortlisted: proposals.filter(p => p.status === 'shortlisted').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
    avgBudget: proposals.length > 0 
      ? Math.round(proposals.reduce((sum, p) => sum + p.proposed_budget, 0) / proposals.length)
      : 0
  };
};

