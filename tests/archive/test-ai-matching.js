// Test AI Job Matching Service
// Run this in browser console to test the AI matching

import { matchJobsWithAI } from './src/services/aiJobMatchingService.js';

// Sample student profile for testing
const sampleStudentProfile = {
  id: 'test-student-123',
  name: 'John Doe',
  department: 'Computer Science',
  university: 'Test University',
  year_of_passing: '2025',
  cgpa: '8.5',
  profile: {
    technicalSkills: [
      { name: 'React', level: 4, category: 'Frontend' },
      { name: 'JavaScript', level: 4, category: 'Programming' },
      { name: 'Node.js', level: 3, category: 'Backend' },
      { name: 'Python', level: 4, category: 'Programming' },
      { name: 'MongoDB', level: 3, category: 'Database' }
    ],
    softSkills: [
      { name: 'Communication', level: 4, type: 'communication' },
      { name: 'Team Collaboration', level: 4, type: 'teamwork' },
      { name: 'Problem Solving', level: 5, type: 'analytical' }
    ],
    education: [
      {
        degree: 'B.Tech',
        department: 'Computer Science',
        university: 'Test University',
        year_of_passing: '2025',
        cgpa: '8.5',
        level: "Bachelor's",
        status: 'ongoing'
      }
    ],
    training: [
      {
        course: 'Full Stack Web Development',
        status: 'completed',
        progress: 100,
        start_date: '2024-01-01',
        end_date: '2024-06-30'
      },
      {
        course: 'Machine Learning Basics',
        status: 'ongoing',
        progress: 60,
        start_date: '2024-07-01'
      }
    ],
    experience: [
      {
        role: 'Web Development Intern',
        organization: 'Tech Startup Inc',
        duration: '3 months',
        description: 'Built responsive web applications using React',
        is_current: false,
        start_date: '2024-06-01',
        end_date: '2024-08-31'
      }
    ],
    projects: [
      {
        name: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce application with React, Node.js, and MongoDB',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        link: 'https://github.com/test/ecommerce'
      }
    ],
    certificates: [
      {
        name: 'React Developer Certification',
        issuer: 'Coursera',
        issue_date: '2024-05-01',
        description: 'Advanced React development certification'
      }
    ]
  }
};

// Sample opportunities for testing
const sampleOpportunities = [
  {
    id: 1,
    job_title: 'Frontend Developer Intern',
    company_name: 'Tech Corp',
    department: 'Computer Science',
    employment_type: 'Internship',
    location: 'Bangalore',
    mode: 'Hybrid',
    experience_level: 'Entry Level',
    experience_required: '0-1 years',
    skills_required: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
    requirements: [
      'Currently pursuing B.Tech in Computer Science',
      'Strong knowledge of React.js',
      'Understanding of web development fundamentals',
      'Good communication skills'
    ],
    responsibilities: [
      'Build and maintain UI components',
      'Collaborate with design team',
      'Write clean, maintainable code',
      'Participate in code reviews'
    ],
    description: 'Looking for a passionate frontend developer intern to join our team and work on cutting-edge web applications.',
    stipend_or_salary: '₹15,000 - ₹25,000/month',
    deadline: '2025-12-31',
    is_active: true,
    status: 'published'
  },
  {
    id: 2,
    job_title: 'Full Stack Developer',
    company_name: 'Startup XYZ',
    department: 'Computer Science',
    employment_type: 'Full-time',
    location: 'Remote',
    mode: 'Remote',
    experience_level: 'Mid Level',
    experience_required: '2-4 years',
    skills_required: ['React', 'Node.js', 'MongoDB', 'Express', 'REST APIs'],
    requirements: [
      'B.Tech in Computer Science or related field',
      'Experience with MERN stack',
      'Strong problem-solving skills',
      'Experience with version control (Git)'
    ],
    responsibilities: [
      'Design and develop full-stack applications',
      'Build RESTful APIs',
      'Database design and optimization',
      'Mentor junior developers'
    ],
    description: 'Join our growing startup as a full stack developer and work on innovative products.',
    stipend_or_salary: '₹6,00,000 - ₹10,00,000/year',
    deadline: '2025-11-30',
    is_active: true,
    status: 'published'
  },
  {
    id: 3,
    job_title: 'Python Developer Intern',
    company_name: 'Data Analytics Co',
    department: 'Computer Science',
    employment_type: 'Internship',
    location: 'Mumbai',
    mode: 'Onsite',
    experience_level: 'Entry Level',
    experience_required: 'Fresher',
    skills_required: ['Python', 'Pandas', 'NumPy', 'Data Analysis', 'SQL'],
    requirements: [
      'Pursuing or completed B.Tech in CS/IT',
      'Strong Python programming skills',
      'Interest in data analysis',
      'Basic understanding of machine learning'
    ],
    responsibilities: [
      'Write Python scripts for data processing',
      'Assist in data analysis projects',
      'Create data visualizations',
      'Learn machine learning techniques'
    ],
    description: 'Internship opportunity for Python enthusiasts interested in data analytics and machine learning.',
    stipend_or_salary: '₹10,000 - ₹20,000/month',
    deadline: '2026-01-15',
    is_active: true,
    status: 'published'
  },
  {
    id: 4,
    job_title: 'Marketing Executive',
    company_name: 'Marketing Agency',
    department: 'Marketing',
    employment_type: 'Full-time',
    location: 'Delhi',
    mode: 'Onsite',
    experience_level: 'Entry Level',
    experience_required: '1-2 years',
    skills_required: ['Digital Marketing', 'SEO', 'Content Writing', 'Social Media'],
    requirements: [
      'Degree in Marketing or related field',
      'Experience with digital marketing tools',
      'Excellent communication skills',
      'Creative thinking'
    ],
    responsibilities: [
      'Plan and execute marketing campaigns',
      'Manage social media accounts',
      'Create marketing content',
      'Analyze campaign performance'
    ],
    description: 'Join our marketing team to create impactful campaigns.',
    stipend_or_salary: '₹3,00,000 - ₹5,00,000/year',
    deadline: '2025-12-15',
    is_active: true,
    status: 'published'
  }
];

// Test function
async function testAIMatching() {
  console.log('🧪 Starting AI Job Matching Test...');
  console.log('📊 Student Profile:', sampleStudentProfile.name);
  console.log('💼 Number of Opportunities:', sampleOpportunities.length);
  
  try {
    const matches = await matchJobsWithAI(sampleStudentProfile, sampleOpportunities, 3);
    
    console.log('\n✅ AI MATCHING SUCCESSFUL!');
    console.log('🎯 Number of Matches:', matches.length);
    console.log('\n📋 MATCHED JOBS:\n');
    
    matches.forEach((match, idx) => {
      console.log(`\n${idx + 1}. ${match.job_title} at ${match.company_name}`);
      console.log(`   Match Score: ${match.match_score}%`);
      console.log(`   Why it matches: ${match.match_reason}`);
      console.log(`   Key Skills: ${match.key_matching_skills.join(', ')}`);
      console.log(`   Recommendation: ${match.recommendation}`);
    });
    
    return matches;
  } catch (error) {
    console.error('\n❌ AI MATCHING FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Run test
console.log('🚀 To test AI matching, run: testAIMatching()');

// Export for use
export { testAIMatching, sampleStudentProfile, sampleOpportunities };
