// Sample candidate data
export const candidates = [
  {
    id: "stu_001",
    name: "Priya S",
    college: "Bharathiar University",
    dept: "Botany (FSQM)",
    location: "Coimbatore",
    skills: ["HACCP", "FMEA", "MS Excel", "Tamil", "English"],
    badges: ["institution_verified", "external_audited"],
    ai_score_overall: 82,
    ai_scores: {
      lsrw: 85,
      coding: 78,
      case_study: 84
    },
    hackathon: { event_id: "agrihack25", rank: 6 },
    internship: { org: "FreshFoods Pvt", rating: 4.5 },
    last_updated: "2025-09-28T10:10:00Z",
    consent_recruiter_view: true,
    year: "Final Year",
    projects: [
      {
        title: "Smart Food Safety Monitoring System",
        description: "IoT-based system for real-time monitoring of food safety parameters",
        tech: ["Arduino", "Python", "MySQL"]
      }
    ],
    phone: "+91 9876543210",
    email: "priya.s@example.com"
  },
  {
    id: "stu_002",
    name: "Arjun Kumar",
    college: "Anna University",
    dept: "Computer Science (GMP)",
    location: "Chennai",
    skills: ["Python", "React", "Node.js", "MongoDB", "AWS"],
    badges: ["self_verified", "institution_verified"],
    ai_score_overall: 91,
    ai_scores: {
      lsrw: 88,
      coding: 95,
      case_study: 89
    },
    hackathon: { event_id: "techfest24", rank: 2 },
    internship: { org: "Tech Innovators", rating: 4.8 },
    last_updated: "2025-09-25T14:30:00Z",
    consent_recruiter_view: true,
    year: "Pre-Final Year",
    projects: [
      {
        title: "E-commerce Analytics Dashboard",
        description: "Full-stack web application for analyzing e-commerce data",
        tech: ["React", "Node.js", "PostgreSQL"]
      }
    ],
    phone: "+91 9876543211",
    email: "arjun.kumar@example.com"
  },
  {
    id: "stu_003",
    name: "Deepika M",
    college: "PSG College of Technology",
    dept: "Mechanical Engineering (MC)",
    location: "Coimbatore",
    skills: ["AutoCAD", "SolidWorks", "MATLAB", "Six Sigma", "Lean Manufacturing"],
    badges: ["institution_verified"],
    ai_score_overall: 76,
    ai_scores: {
      lsrw: 82,
      coding: 65,
      case_study: 81
    },
    hackathon: { event_id: "mechathon24", rank: 12 },
    internship: { org: "Manufacturing Corp", rating: 4.2 },
    last_updated: "2025-09-20T09:15:00Z",
    consent_recruiter_view: true,
    year: "Final Year",
    projects: [
      {
        title: "Automated Quality Control System",
        description: "Robotic system for automated quality inspection in manufacturing",
        tech: ["PLC", "HMI", "Industrial Automation"]
      }
    ],
    phone: "+91 9876543212",
    email: "deepika.m@example.com"
  }
];

// Sample requisitions/jobs
export const requisitions = [
  {
    id: "req_001",
    title: "Software Development Intern",
    location: "Chennai",
    openings: 5,
    created_date: "2025-09-15",
    owner: "Tech HR Team",
    description: "Looking for full-stack developers with React and Node.js experience"
  },
  {
    id: "req_002", 
    title: "Food Safety Quality Analyst",
    location: "Coimbatore",
    openings: 3,
    created_date: "2025-09-18",
    owner: "Food Safety Team",
    description: "FSQM graduates for quality assurance roles in food industry"
  }
];

// Sample shortlists
export const shortlists = [
  {
    id: "sl_001",
    name: "FSQM Q4 Plant Quality Interns",
    candidates: ["stu_001"],
    created_date: "2025-09-25",
    shared: true
  },
  {
    id: "sl_002",
    name: "Tech Talent Pool - React Developers",
    candidates: ["stu_002"],
    created_date: "2025-09-22",
    shared: false
  }
];

// KPI data
export const kpiData = {
  newProfiles: 24,
  shortlisted: 18,
  interviewsScheduled: 12,
  offersExtended: 8,
  timeToHire: 16 // days
};

// Recent activity
export const recentActivity = [
  {
    id: "act_001",
    type: "shortlist",
    user: "Sarah Johnson",
    action: "shortlisted",
    candidate: "Priya S",
    timestamp: "2 hours ago"
  },
  {
    id: "act_002",
    type: "note",
    user: "Mike Chen",
    action: "added note for",
    candidate: "Arjun Kumar",
    timestamp: "4 hours ago"
  },
  {
    id: "act_003",
    type: "interview",
    user: "Lisa Wang",
    action: "scheduled interview with",
    candidate: "Deepika M",
    timestamp: "1 day ago"
  }
];

// Enhanced shortlists data
export const shortlistsData = [
  {
    id: "sl_001",
    name: "FSQM Q4 Plant Quality Interns",
    description: "Food safety quality management candidates for plant operations",
    candidates: ["stu_001"],
    created_date: "2025-09-25T10:00:00Z",
    created_by: "Sarah Johnson",
    shared: true,
    share_link: "https://recruiterhub.com/shared/sl_001?token=abc123",
    share_expiry: "2025-10-25T10:00:00Z",
    watermark: true,
    tags: ["FSQM", "Q4", "Plant Quality"],
    status: "active"
  },
  {
    id: "sl_002",
    name: "Tech Talent Pool - React Developers",
    description: "Full-stack developers with React expertise",
    candidates: ["stu_002"],
    created_date: "2025-09-22T14:30:00Z",
    created_by: "Mike Chen",
    shared: false,
    tags: ["Tech", "React", "Full-stack"],
    status: "active"
  },
  {
    id: "sl_003",
    name: "Manufacturing Excellence - Mechanical",
    description: "Mechanical engineering candidates for manufacturing roles",
    candidates: ["stu_003"],
    created_date: "2025-09-20T09:15:00Z",
    created_by: "Lisa Wang",
    shared: true,
    share_link: "https://recruiterhub.com/shared/sl_003?token=def456",
    share_expiry: "2025-11-20T09:15:00Z",
    watermark: false,
    tags: ["Manufacturing", "Mechanical", "Excellence"],
    status: "active"
  }
];

// Interview data
export const interviewsData = [
  {
    id: "int_001",
    candidate_id: "stu_001",
    candidate_name: "Priya S",
    job_id: "req_002",
    job_title: "Food Safety Quality Analyst",
    type: "Technical Interview",
    date: "2025-10-15T10:00:00Z",
    duration: 60,
    status: "scheduled",
    interviewer: "Dr. Rajesh Kumar",
    interviewer_email: "rajesh.kumar@company.com",
    meeting_link: "https://teams.microsoft.com/l/meetup-join/...",
    meeting_type: "teams",
    scorecard: {
      technical_skills: null,
      communication: null,
      problem_solving: null,
      cultural_fit: null,
      overall_rating: null,
      notes: "",
      recommendation: null
    },
    reminders_sent: 1
  },
  {
    id: "int_002",
    candidate_id: "stu_002",
    candidate_name: "Arjun Kumar",
    job_id: "req_001",
    job_title: "Software Development Intern",
    type: "Technical + HR Round",
    date: "2025-10-12T14:00:00Z",
    duration: 90,
    status: "completed",
    interviewer: "Sarah Johnson",
    interviewer_email: "sarah.j@company.com",
    meeting_link: "https://meet.google.com/abc-defg-hij",
    meeting_type: "meet",
    scorecard: {
      technical_skills: 4,
      communication: 4,
      problem_solving: 5,
      cultural_fit: 4,
      overall_rating: 4.25,
      notes: "Strong technical skills, good problem-solving approach. Excellent React knowledge.",
      recommendation: "proceed"
    },
    reminders_sent: 2,
    completed_date: "2025-10-12T15:30:00Z"
  },
  {
    id: "int_003",
    candidate_id: "stu_003",
    candidate_name: "Deepika M",
    job_id: "req_002",
    job_title: "Manufacturing Quality Engineer",
    type: "Panel Interview",
    date: "2025-10-18T11:00:00Z",
    duration: 120,
    status: "confirmed",
    interviewer: "Manufacturing Team",
    interviewer_email: "mfg.team@company.com",
    meeting_link: "https://zoom.us/j/123456789",
    meeting_type: "zoom",
    scorecard: {
      technical_skills: null,
      communication: null,
      problem_solving: null,
      cultural_fit: null,
      overall_rating: null,
      notes: "",
      recommendation: null
    },
    reminders_sent: 0
  }
];

// Offers data
export const offersData = [
  {
    id: "off_001",
    candidate_id: "stu_002",
    candidate_name: "Arjun Kumar",
    job_id: "req_001",
    job_title: "Software Development Intern",
    template: "Intern Offer - Tech",
    ctc_band: "3.6-4.2 LPA",
    offered_ctc: "4.0 LPA",
    offer_date: "2025-10-13T10:00:00Z",
    expiry_date: "2025-10-20T23:59:59Z",
    status: "pending",
    sent_via: "email",
    benefits: ["Health Insurance", "Flexible Hours", "Learning Budget"],
    notes: "Strong candidate, competitive offer made",
    response_deadline: "2025-10-20T23:59:59Z"
  },
  {
    id: "off_002",
    candidate_id: "stu_001",
    candidate_name: "Priya S",
    job_id: "req_002",
    job_title: "Food Safety Quality Analyst",
    template: "Full-time Offer - Quality",
    ctc_band: "4.5-6.0 LPA",
    offered_ctc: "5.2 LPA",
    offer_date: "2025-09-28T15:00:00Z",
    expiry_date: "2025-10-05T23:59:59Z",
    status: "accepted",
    sent_via: "email",
    benefits: ["Health Insurance", "Food Safety Certification", "Gym Membership"],
    notes: "Excellent fit for food safety role",
    response_date: "2025-10-02T14:30:00Z",
    acceptance_notes: "Very excited to join the team!"
  }
];

// Analytics data
export const analyticsData = {
  funnel: {
    sourced: 150,
    screened: 89,
    interviewed: 45,
    offered: 12,
    hired: 8
  },
  quality_metrics: {
    external_audited_percentage: 18,
    avg_ai_score_hired: 87.3,
    rubric_pass_rate: 73,
    top_skills_hired: ["Python", "React", "HACCP", "Six Sigma", "AutoCAD"]
  },
  speed_metrics: {
    median_time_to_first_response: 2.5, // days
    median_time_to_hire: 18, // days
    avg_interview_to_offer: 5, // days
    fastest_hire: 12 // days
  },
  diversity_geography: {
    locations: [
      { city: "Chennai", count: 3, percentage: 37.5 },
      { city: "Coimbatore", count: 2, percentage: 25 },
      { city: "Bangalore", count: 2, percentage: 25 },
      { city: "Pune", count: 1, percentage: 12.5 }
    ],
    colleges: [
      { name: "Anna University", count: 2 },
      { name: "PSG College of Technology", count: 2 },
      { name: "Bharathiar University", count: 1 },
      { name: "VIT University", count: 1 }
    ]
  },
  attribution: {
    hackathons: [
      { name: "TechFest 2024", hires: 2, applications: 15 },
      { name: "AgriHack 2025", hires: 1, applications: 8 },
      { name: "MechAthon 2024", hires: 1, applications: 12 }
    ],
    courses: [
      { name: "GMP", hires: 3, applications: 45 },
      { name: "FSQM", hires: 2, applications: 32 },
      { name: "MC", hires: 2, applications: 28 }
    ]
  }
};

// Saved searches
export const savedSearches = [
  "FSQM + Tamil + Coimbatore",
  "GMP project > 80",
  "React + Node.js",
  "External Audited Only"
];

// Export templates
export const exportTemplates = {
  miniProfile: {
    includeFields: ["name", "skills", "badges", "ai_score_overall", "college", "dept", "location"],
    excludePII: true,
    watermarkText: "RecruiterHub - Confidential"
  },
  fullProfile: {
    includeFields: "all",
    excludePII: false,
    watermarkText: "RecruiterHub - Full Profile Export"
  }
};
