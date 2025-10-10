// Mock data for Skill Passport Student Dashboard

export const studentData = {
  id: "SP2024001",
  name: "Priya Sharma",
  university: "Indian Institute of Technology, Chennai",
  department: "Computer Science Engineering",
  photo: "https://images.unsplash.com/photo-1494790108755-2616b612b429?w=150&h=150&fit=crop&crop=face",
  verified: true,
  employabilityScore: 85,
  cgpa: "8.9",
  yearOfPassing: "2025",
  passportId: "IIT-CSE-2024-001"
};

export const educationData = [
  {
    id: 1,
    degree: "B.Tech Computer Science Engineering",
    department: "Computer Science Engineering", 
    university: "Stanford University",
    yearOfPassing: "2025",
    cgpa: "8.9/10.0",
    level: "Bachelor's",
    status: "ongoing"
  },
  {
    id: 2,
    degree: "High School Diploma",
    department: "Science Stream", 
    university: "Springfield High School",
    yearOfPassing: "2021",
    cgpa: "9.2/10.0",
    level: "High School",
    status: "completed"
  },
  {
    id: 3,
    degree: "Advanced Python Certification",
    department: "Computer Science", 
    university: "MIT Online",
    yearOfPassing: "2024",
    cgpa: "A+",
    level: "Certificate",
    status: "completed"
  }
];

export const trainingData = [
  {
    course: "Full Stack Development (FSQM)",
    progress: 80,
    status: "ongoing"
  },
  {
    course: "Data Structures & Algorithms",
    progress: 100,
    status: "completed"
  },
  {
    course: "Machine Learning Fundamentals",
    progress: 65,
    status: "ongoing"
  }
];

export const experienceData = [
  {
    role: "Frontend Developer Intern",
    organization: "Tech Startup Inc.",
    duration: "Jun 2024 - Aug 2024",
    verified: true
  },
  {
    role: "Hackathon Winner",
    organization: "Smart India Hackathon",
    duration: "Mar 2024",
    verified: true
  }
];

export const technicalSkills = [
  {
    name: "React",
    level: 4,
    verified: true,
    icon: "⚛️"
  },
  {
    name: "Python",
    level: 5,
    verified: true,
    icon: "🐍"
  },
  {
    name: "JavaScript",
    level: 4,
    verified: true,
    icon: "💻"
  },
  {
    name: "Node.js",
    level: 3,
    verified: true,
    icon: "🟢"
  },
  {
    name: "MongoDB",
    level: 3,
    verified: true,
    icon: "🍃"
  }
];

export const softSkills = [
  {
    name: "English",
    level: 5,
    type: "language"
  },
  {
    name: "Tamil",
    level: 5,
    type: "language"
  },
  {
    name: "Hindi", 
    level: 4,
    type: "language"
  },
  {
    name: "Public Speaking",
    level: 4,
    type: "communication"
  },
  {
    name: "Team Leadership",
    level: 3,
    type: "communication"
  }
];

export const opportunities = [
  {
    title: "Web Developer Intern",
    company: "Tata Consultancy Services",
    type: "internship",
    deadline: "Dec 15, 2024"
  },
  {
    title: "Software Engineer",
    company: "Flipkart",
    type: "full-time",
    deadline: "Jan 20, 2025"
  },
  {
    title: "Frontend Developer",
    company: "Zomato",
    type: "internship",
    deadline: "Nov 30, 2024"
  }
];

export const recentUpdates = [
  {
    message: "You completed FSQM Module 4.",
    timestamp: "2 hours ago",
    type: "achievement"
  },
  {
    message: "3 recruiters viewed your profile.",
    timestamp: "1 day ago",
    type: "notification"
  },
  {
    message: "New opportunity match: Frontend Developer at Zomato",
    timestamp: "2 days ago", 
    type: "opportunity"
  }
];

export const suggestions = [
  "Add your latest project to boost your score by 10%",
  "Complete your Machine Learning course to unlock AI roles",
  "Upload certificates for Data Structures course"
];