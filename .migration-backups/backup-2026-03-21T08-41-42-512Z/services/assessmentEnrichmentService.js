/**
 * Assessment Enrichment Service
 * Generates enriched data for PDF fields based on assessment results
 */

/**
 * Degree Programs Database
 * Maps career interests to relevant degree programs
 */
const DEGREE_PROGRAMS_DATABASE = {
  'Software Engineer': [
    {
      programName: 'Bachelor of Technology in Computer Science',
      matchScore: 95,
      description: 'Comprehensive program covering software development, algorithms, data structures, and system design',
      topColleges: ['IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'IIIT Hyderabad'],
      careerPaths: ['Software Engineer', 'Full Stack Developer', 'Backend Developer', 'DevOps Engineer'],
      averageSalary: { min: 8, max: 25, currency: 'LPA' },
      skills: ['Programming', 'Data Structures', 'Algorithms', 'System Design', 'Database Management'],
      duration: '4 years'
    },
    {
      programName: 'Bachelor of Computer Applications (BCA)',
      matchScore: 85,
      description: 'Focused program on computer applications, programming, and software development',
      topColleges: ['Christ University', 'Symbiosis', 'Amity University', 'Manipal University'],
      careerPaths: ['Software Developer', 'Web Developer', 'Application Developer'],
      averageSalary: { min: 5, max: 15, currency: 'LPA' },
      skills: ['Programming', 'Web Development', 'Database', 'Software Engineering'],
      duration: '3 years'
    }
  ],
  'Data Scientist': [
    {
      programName: 'Bachelor of Science in Data Science',
      matchScore: 95,
      description: 'Specialized program in data analysis, machine learning, and statistical modeling',
      topColleges: ['IIT Madras', 'ISI Kolkata', 'CMI Chennai', 'IIIT Bangalore'],
      careerPaths: ['Data Scientist', 'ML Engineer', 'Data Analyst', 'Research Scientist'],
      averageSalary: { min: 10, max: 30, currency: 'LPA' },
      skills: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization', 'SQL'],
      duration: '4 years'
    }
  ],
  'UX Designer': [
    {
      programName: 'Bachelor of Design (B.Des) in Interaction Design',
      matchScore: 92,
      description: 'Creative program focusing on user experience, interface design, and design thinking',
      topColleges: ['NID Ahmedabad', 'IIT Bombay IDC', 'Srishti Institute', 'MIT Institute of Design'],
      careerPaths: ['UX Designer', 'UI Designer', 'Product Designer', 'Interaction Designer'],
      averageSalary: { min: 6, max: 20, currency: 'LPA' },
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Thinking'],
      duration: '4 years'
    }
  ],
  'Marketing Manager': [
    {
      programName: 'Bachelor of Business Administration (BBA) in Marketing',
      matchScore: 90,
      description: 'Business program with specialization in marketing, branding, and digital marketing',
      topColleges: ['NMIMS Mumbai', 'Symbiosis Pune', 'Christ University', 'Amity University'],
      careerPaths: ['Marketing Manager', 'Brand Manager', 'Digital Marketing Manager', 'Content Strategist'],
      averageSalary: { min: 7, max: 22, currency: 'LPA' },
      skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Communication'],
      duration: '3 years'
    }
  ],
  'Financial Analyst': [
    {
      programName: 'Bachelor of Commerce (B.Com) in Finance',
      matchScore: 88,
      description: 'Commerce program specializing in finance, accounting, and financial analysis',
      topColleges: ['SRCC Delhi', 'St. Xavier\'s Mumbai', 'Loyola Chennai', 'Christ University'],
      careerPaths: ['Financial Analyst', 'Investment Analyst', 'Risk Analyst', 'Portfolio Manager'],
      averageSalary: { min: 8, max: 25, currency: 'LPA' },
      skills: ['Financial Modeling', 'Excel', 'Accounting', 'Data Analysis', 'Economics'],
      duration: '3 years'
    }
  ],
  'Teacher': [
    {
      programName: 'Bachelor of Education (B.Ed)',
      matchScore: 90,
      description: 'Education program preparing teachers for school and college teaching',
      topColleges: ['Delhi University', 'Jamia Millia Islamia', 'BHU', 'Tata Institute of Social Sciences'],
      careerPaths: ['School Teacher', 'College Professor', 'Curriculum Developer', 'Education Consultant'],
      averageSalary: { min: 4, max: 15, currency: 'LPA' },
      skills: ['Communication', 'Curriculum Design', 'Classroom Management', 'Subject Expertise'],
      duration: '2 years (after graduation)'
    }
  ],
  'Mechanical Engineer': [
    {
      programName: 'Bachelor of Technology in Mechanical Engineering',
      matchScore: 93,
      description: 'Engineering program covering mechanics, thermodynamics, and manufacturing',
      topColleges: ['IIT Delhi', 'IIT Kharagpur', 'NIT Trichy', 'BITS Pilani'],
      careerPaths: ['Mechanical Engineer', 'Design Engineer', 'Manufacturing Engineer', 'Project Engineer'],
      averageSalary: { min: 6, max: 18, currency: 'LPA' },
      skills: ['CAD', 'SolidWorks', 'Manufacturing', 'Thermodynamics', 'Materials Science'],
      duration: '4 years'
    }
  ],
  'Nurse': [
    {
      programName: 'Bachelor of Science in Nursing (B.Sc Nursing)',
      matchScore: 92,
      description: 'Healthcare program preparing nurses for patient care and medical support',
      topColleges: ['AIIMS Delhi', 'CMC Vellore', 'JIPMER Puducherry', 'Manipal University'],
      careerPaths: ['Registered Nurse', 'Clinical Nurse', 'Nurse Practitioner', 'Nursing Supervisor'],
      averageSalary: { min: 3, max: 12, currency: 'LPA' },
      skills: ['Patient Care', 'Medical Knowledge', 'Communication', 'Empathy', 'Critical Thinking'],
      duration: '4 years'
    }
  ]
};

/**
 * Skill Development Resources Database
 */
const SKILL_RESOURCES_DATABASE = {
  'Communication Skills': [
    {
      title: 'Effective Communication Skills',
      type: 'course',
      url: 'https://www.coursera.org/learn/communication-skills',
      provider: 'Coursera'
    },
    {
      title: 'Toastmasters International',
      type: 'practice',
      url: 'https://www.toastmasters.org',
      provider: 'Toastmasters'
    }
  ],
  'Project Management': [
    {
      title: 'Project Management Fundamentals',
      type: 'course',
      url: 'https://www.udemy.com/course/project-management',
      provider: 'Udemy'
    },
    {
      title: 'Agile Project Management',
      type: 'course',
      url: 'https://www.coursera.org/learn/agile-project-management',
      provider: 'Coursera'
    }
  ],
  'Leadership': [
    {
      title: 'Leadership and Management',
      type: 'course',
      url: 'https://www.edx.org/learn/leadership',
      provider: 'edX'
    }
  ],
  'Technical Writing': [
    {
      title: 'Technical Writing Essentials',
      type: 'course',
      url: 'https://www.udemy.com/course/technical-writing',
      provider: 'Udemy'
    }
  ],
  'Time Management': [
    {
      title: 'Time Management Mastery',
      type: 'course',
      url: 'https://www.udemy.com/course/time-management',
      provider: 'Udemy'
    }
  ]
};

/**
 * Generate degree programs based on career recommendations
 */
export const generateDegreePrograms = (careerRecommendations, riasecScores = {}) => {
  if (!Array.isArray(careerRecommendations) || careerRecommendations.length === 0) {
    return [];
  }

  const programs = [];
  
  careerRecommendations.slice(0, 3).forEach(career => {
    const careerTitle = typeof career === 'string' ? career : career.title;
    const careerPrograms = DEGREE_PROGRAMS_DATABASE[careerTitle];
    
    if (careerPrograms && careerPrograms.length > 0) {
      programs.push(...careerPrograms);
    }
  });

  return programs;
};

/**
 * Generate enriched skill gap analysis
 */
export const generateSkillGapEnriched = (skillGaps) => {
  if (!Array.isArray(skillGaps) || skillGaps.length === 0) {
    return { gaps: [] };
  }

  const gaps = skillGaps.map((skill, index) => {
    const skillName = typeof skill === 'string' ? skill : skill.skill || skill.name;
    const resources = SKILL_RESOURCES_DATABASE[skillName] || [];
    
    return {
      skill: skillName,
      importance: index === 0 ? 'High' : index === 1 ? 'High' : 'Medium',
      developmentPath: `Focus on developing ${skillName} through structured learning, practice, and real-world application. Start with foundational courses and gradually build expertise through projects and mentorship.`,
      resources
    };
  });

  return { gaps };
};

/**
 * Generate enriched roadmap
 */
export const generateRoadmapEnriched = (nextSteps, gradeLevel) => {
  if (!Array.isArray(nextSteps) || nextSteps.length === 0) {
    // Generate default roadmap based on grade level
    return generateDefaultRoadmap(gradeLevel);
  }

  const steps = nextSteps.map((step, index) => {
    const stepTitle = typeof step === 'string' ? step : step.title || step.name;
    const stepDescription = typeof step === 'string' ? step : step.description || step.details || stepTitle;
    
    return {
      title: stepTitle,
      description: stepDescription,
      timeline: index === 0 ? 'Immediate (Next 1 month)' : 
                index === 1 ? 'Short-term (1-3 months)' : 
                index === 2 ? 'Medium-term (3-6 months)' : 
                'Long-term (6-12 months)',
      priority: index < 2 ? 'High' : 'Medium',
      resources: []
    };
  });

  return { steps };
};

/**
 * Generate default roadmap based on grade level
 */
const generateDefaultRoadmap = (gradeLevel) => {
  const roadmaps = {
    'middle': {
      steps: [
        {
          title: 'Explore Your Interests',
          description: 'Try different activities, clubs, and subjects to discover what you enjoy most',
          timeline: 'Immediate (Next 1 month)',
          priority: 'High',
          resources: []
        },
        {
          title: 'Build Foundational Skills',
          description: 'Focus on core subjects and develop good study habits',
          timeline: 'Short-term (1-3 months)',
          priority: 'High',
          resources: []
        }
      ]
    },
    'highschool': {
      steps: [
        {
          title: 'Choose Stream Wisely',
          description: 'Select subjects that align with your interests and career goals',
          timeline: 'Immediate (Next 1 month)',
          priority: 'High',
          resources: []
        },
        {
          title: 'Participate in Competitions',
          description: 'Join olympiads, hackathons, or competitions in your field of interest',
          timeline: 'Short-term (1-3 months)',
          priority: 'Medium',
          resources: []
        }
      ]
    },
    'after12': {
      steps: [
        {
          title: 'Research Degree Programs',
          description: 'Explore colleges and programs that match your career interests',
          timeline: 'Immediate (Next 1 month)',
          priority: 'High',
          resources: []
        },
        {
          title: 'Prepare for Entrance Exams',
          description: 'Start preparing for relevant entrance exams (JEE, NEET, CAT, etc.)',
          timeline: 'Short-term (1-3 months)',
          priority: 'High',
          resources: []
        }
      ]
    },
    'college': {
      steps: [
        {
          title: 'Apply for Internships',
          description: 'Gain practical experience through internships in your field',
          timeline: 'Immediate (Next 1 month)',
          priority: 'High',
          resources: [
            { title: 'LinkedIn Jobs', type: 'platform', url: 'https://www.linkedin.com/jobs' },
            { title: 'Internshala', type: 'platform', url: 'https://internshala.com' }
          ]
        },
        {
          title: 'Build Your Portfolio',
          description: 'Create projects and showcase your skills online',
          timeline: 'Short-term (1-3 months)',
          priority: 'High',
          resources: [
            { title: 'GitHub', type: 'platform', url: 'https://github.com' }
          ]
        }
      ]
    }
  };

  return roadmaps[gradeLevel] || roadmaps['college'];
};

/**
 * Generate enriched course recommendations
 */
export const generateCourseRecommendationsEnriched = (existingCourses, skills, gradeLevel) => {
  // If enriched courses already exist, return them
  if (Array.isArray(existingCourses) && existingCourses.length > 0 && existingCourses[0].provider) {
    return existingCourses;
  }

  // Otherwise, enrich existing courses or generate new ones
  const courses = [];

  if (Array.isArray(existingCourses) && existingCourses.length > 0) {
    existingCourses.forEach(course => {
      courses.push({
        courseName: course.title || course.name || course.courseName || 'Course',
        provider: course.provider || 'Online Platform',
        duration: course.duration || 'Self-paced',
        level: course.level || 'Intermediate',
        url: course.url || course.link || '#',
        rating: course.rating || 4.5,
        skills: course.skills || [],
        description: course.description || '',
        price: course.price || 'Free'
      });
    });
  }

  return courses;
};

/**
 * Main enrichment function
 * Generates all enriched fields for a result
 */
export const enrichAssessmentResult = (dbResult) => {
  const careerRecommendations = dbResult.career_recommendations || [];
  const skillGaps = dbResult.skill_gaps || [];
  const nextSteps = dbResult.gemini_results?.next_steps || dbResult.gemini_analysis?.next_steps || [];
  const gradeLevel = dbResult.grade_level || 'college';

  return {
    degree_programs: generateDegreePrograms(careerRecommendations, dbResult.riasec_scores),
    skill_gap_enriched: generateSkillGapEnriched(skillGaps),
    roadmap_enriched: generateRoadmapEnriched(nextSteps, gradeLevel),
    course_recommendations_enriched: generateCourseRecommendationsEnriched(
      dbResult.skill_gap_courses || dbResult.platform_courses,
      skillGaps,
      gradeLevel
    )
  };
};

export default {
  generateDegreePrograms,
  generateSkillGapEnriched,
  generateRoadmapEnriched,
  generateCourseRecommendationsEnriched,
  enrichAssessmentResult
};
