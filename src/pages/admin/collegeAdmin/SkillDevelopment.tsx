import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  UserPlus,
  GraduationCap,
  Target,
  AlertTriangle,
  RefreshCw,
  Trash2,
  BarChart3,
  Clock,
  Upload,
  FileSpreadsheet,
  CheckSquare,
  XCircle,
  AlertCircle,
  MessageSquare,
  Star,
  FileText,
  Send,
  ThumbsUp,
  ThumbsDown,
  Archive,
} from "lucide-react";

interface SkillCourse {
  id: string;
  courseName: string;
  provider: string;
  providerType: 'Internal' | 'External';
  duration: string;
  durationType: 'hours' | 'weeks' | 'months';
  certificationType: 'Completion' | 'Assessment-based';
  credits?: number;
  isActive: boolean;
  description?: string;
  prerequisites?: string;
  skillsGained?: string[];
  createdAt: string;
  updatedAt: string;
}

interface SkillCourseFormData {
  courseName: string;
  provider: string;
  providerType: 'Internal' | 'External';
  duration: string;
  durationType: 'hours' | 'weeks' | 'months';
  certificationType: 'Completion' | 'Assessment-based';
  credits: string;
  description: string;
  prerequisites: string;
  skillsGained: string[];
}

interface SkillAllocation {
  id: string;
  courseId: string;
  courseName: string;
  allocationType: 'Department' | 'Program' | 'Semester' | 'Batch' | 'Individual';
  targetGroup: {
    department?: string;
    program?: string;
    semester?: string;
    batch?: string;
    year?: string;
  };
  studentIds: string[];
  studentCount: number;
  allocationFlag: 'Mandatory' | 'Elective';
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
  createdBy: string;
  allowRetake: boolean;
}

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  program: string;
  semester: string;
  batch: string;
  year: string;
  cgpa: number;
  isActive: boolean;
  allocatedCourses: string[];
}

interface AllocationFormData {
  courseId: string;
  allocationType: 'Department' | 'Program' | 'Semester' | 'Batch' | 'Individual';
  department: string;
  program: string;
  semester: string;
  batch: string;
  year: string;
  selectedStudents: string[];
  allocationFlag: 'Mandatory' | 'Elective';
  startDate: string;
  endDate: string;
  allowRetake: boolean;
}

interface StudentProgress {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  batch: string;
  courseId: string;
  courseName: string;
  allocationId: string;
  completionPercentage: number;
  assessmentScore?: number;
  maxAssessmentScore?: number;
  attendancePercentage?: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
  startDate: string;
  completionDate?: string;
  lastUpdated: string;
  modules: ModuleProgress[];
}

interface ModuleProgress {
  id: string;
  moduleName: string;
  isCompleted: boolean;
  completionDate?: string;
  score?: number;
  maxScore?: number;
}

interface ProgressUpdateFormData {
  studentId: string;
  courseId: string;
  completionPercentage: string;
  assessmentScore: string;
  maxAssessmentScore: string;
  attendancePercentage: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
  notes: string;
}

interface BatchProgressSummary {
  courseId: string;
  courseName: string;
  totalStudents: number;
  completedStudents: number;
  inProgressStudents: number;
  notStartedStudents: number;
  averageCompletion: number;
  averageScore: number;
  averageAttendance: number;
}

interface StudentFeedback {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseId: string;
  courseName: string;
  overallRating: number;
  contentQuality: number;
  instructorRating: number;
  difficultyLevel: number;
  recommendationScore: number;
  comments: string;
  suggestions: string;
  submittedAt: string;
  status: 'Pending' | 'Submitted' | 'Reviewed';
}

interface TrainerFeedback {
  id: string;
  trainerId: string;
  trainerName: string;
  courseId: string;
  courseName: string;
  batchId: string;
  studentEngagement: number;
  contentDelivery: number;
  learningOutcomes: number;
  overallSatisfaction: number;
  challenges: string;
  improvements: string;
  studentPerformance: string;
  submittedAt: string;
  status: 'Pending' | 'Submitted' | 'Reviewed';
}

interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseId: string;
  courseName: string;
  completionDate: string;
  issueDate: string;
  certificateNumber: string;
  grade?: string;
  score?: number;
  status: 'Generated' | 'Issued' | 'Downloaded';
  templateId: string;
  filePath?: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'Completion' | 'Achievement' | 'Participation';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackFormData {
  overallRating: string;
  contentQuality: string;
  instructorRating: string;
  difficultyLevel: string;
  recommendationScore: string;
  comments: string;
  suggestions: string;
}

interface TrainerFeedbackFormData {
  studentEngagement: string;
  contentDelivery: string;
  learningOutcomes: string;
  overallSatisfaction: string;
  challenges: string;
  improvements: string;
  studentPerformance: string;
}

const SkillDevelopment: React.FC = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showViewCourseModal, setShowViewCourseModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<SkillCourse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedCertificationType, setSelectedCertificationType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Skill Allocation states
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showAllocationFilterModal, setShowAllocationFilterModal] = useState(false);
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<SkillAllocation | null>(null);
  const [allocationSearchTerm, setAllocationSearchTerm] = useState("");
  const [selectedAllocationStatus, setSelectedAllocationStatus] = useState("");
  const [selectedAllocationType, setSelectedAllocationType] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");

  // Progress Tracker states
  const [progressView, setProgressView] = useState<'student' | 'batch' | 'course'>('student');
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showProgressFilterModal, setShowProgressFilterModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<StudentProgress | null>(null);
  const [progressSearchTerm, setProgressSearchTerm] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedDepartmentProgressFilter, setSelectedDepartmentProgressFilter] = useState("");
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);

  // Feedback & Certification states
  const [feedbackView, setFeedbackView] = useState<'student' | 'trainer' | 'certificates'>('student');
  const [showStudentFeedbackModal, setShowStudentFeedbackModal] = useState(false);
  const [showTrainerFeedbackModal, setShowTrainerFeedbackModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showFeedbackFilterModal, setShowFeedbackFilterModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<StudentFeedback | TrainerFeedback | null>(null);
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState("");
  const [selectedFeedbackCourse, setSelectedFeedbackCourse] = useState("");
  const [selectedFeedbackStatus, setSelectedFeedbackStatus] = useState("");
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<SkillCourseFormData>({
    courseName: "",
    provider: "",
    providerType: "Internal",
    duration: "",
    durationType: "hours",
    certificationType: "Completion",
    credits: "",
    description: "",
    prerequisites: "",
    skillsGained: [],
  });

  const [allocationFormData, setAllocationFormData] = useState<AllocationFormData>({
    courseId: "",
    allocationType: "Department",
    department: "",
    program: "",
    semester: "",
    batch: "",
    year: "",
    selectedStudents: [],
    allocationFlag: "Mandatory",
    startDate: "",
    endDate: "",
    allowRetake: false,
  });

  const [progressUpdateFormData, setProgressUpdateFormData] = useState<ProgressUpdateFormData>({
    studentId: "",
    courseId: "",
    completionPercentage: "",
    assessmentScore: "",
    maxAssessmentScore: "",
    attendancePercentage: "",
    status: "Not Started",
    notes: "",
  });

  const [feedbackFormData, setFeedbackFormData] = useState<FeedbackFormData>({
    overallRating: "",
    contentQuality: "",
    instructorRating: "",
    difficultyLevel: "",
    recommendationScore: "",
    comments: "",
    suggestions: "",
  });

  const [trainerFeedbackFormData, setTrainerFeedbackFormData] = useState<TrainerFeedbackFormData>({
    studentEngagement: "",
    contentDelivery: "",
    learningOutcomes: "",
    overallSatisfaction: "",
    challenges: "",
    improvements: "",
    studentPerformance: "",
  });

  const tabs = [
    { id: "courses", label: "Skill Course Master" },
    { id: "allocation", label: "Skill Allocation" },
    { id: "progress", label: "Progress Tracker" },
    { id: "feedback", label: "Feedback & Certification" },
  ];

  // Sample data
  const skillStats = [
    { label: "Active Courses", value: "156", icon: BookOpen, color: "bg-blue-500" },
    { label: "Enrolled Students", value: "12,450", icon: Users, color: "bg-purple-500" },
    { label: "Completion Rate", value: "78.5%", icon: TrendingUp, color: "bg-green-500" },
    { label: "Certificates Issued", value: "9,780", icon: Award, color: "bg-orange-500" },
  ];

  // Sample skill courses data
  const skillCoursesData: SkillCourse[] = [
    {
      id: "1",
      courseName: "Python for Data Science",
      provider: "Coursera",
      providerType: "External",
      duration: "40",
      durationType: "hours",
      certificationType: "Assessment-based",
      credits: 3,
      isActive: true,
      description: "Comprehensive Python programming course focused on data science applications including pandas, numpy, and matplotlib.",
      prerequisites: "Basic programming knowledge",
      skillsGained: ["Python Programming", "Data Analysis", "Pandas", "NumPy", "Matplotlib"],
      createdAt: "2024-01-15",
      updatedAt: "2024-03-10"
    },
    {
      id: "2",
      courseName: "Full Stack Web Development",
      provider: "Internal Faculty",
      providerType: "Internal",
      duration: "12",
      durationType: "weeks",
      certificationType: "Assessment-based",
      credits: 4,
      isActive: true,
      description: "Complete web development course covering frontend and backend technologies.",
      prerequisites: "HTML, CSS basics",
      skillsGained: ["React", "Node.js", "MongoDB", "Express.js", "JavaScript"],
      createdAt: "2024-02-01",
      updatedAt: "2024-02-15"
    },
    {
      id: "3",
      courseName: "Cloud Computing (AWS)",
      provider: "AWS Training",
      providerType: "External",
      duration: "8",
      durationType: "weeks",
      certificationType: "Assessment-based",
      credits: 3,
      isActive: true,
      description: "AWS cloud computing fundamentals and advanced services training.",
      prerequisites: "Basic networking knowledge",
      skillsGained: ["AWS Services", "Cloud Architecture", "EC2", "S3", "Lambda"],
      createdAt: "2024-01-20",
      updatedAt: "2024-03-05"
    },
    {
      id: "4",
      courseName: "Soft Skills & Interview Prep",
      provider: "Dr. Priya Sharma",
      providerType: "Internal",
      duration: "30",
      durationType: "hours",
      certificationType: "Completion",
      isActive: true,
      description: "Essential soft skills development and interview preparation program.",
      prerequisites: "None",
      skillsGained: ["Communication", "Leadership", "Interview Skills", "Presentation", "Teamwork"],
      createdAt: "2024-02-10",
      updatedAt: "2024-02-20"
    },
    {
      id: "5",
      courseName: "Machine Learning Basics",
      provider: "Udemy",
      providerType: "External",
      duration: "6",
      durationType: "weeks",
      certificationType: "Assessment-based",
      credits: 3,
      isActive: false,
      description: "Introduction to machine learning concepts and algorithms.",
      prerequisites: "Python programming, Statistics basics",
      skillsGained: ["Machine Learning", "Scikit-learn", "Data Preprocessing", "Model Evaluation"],
      createdAt: "2024-01-05",
      updatedAt: "2024-03-01"
    },
    {
      id: "6",
      courseName: "Digital Marketing Fundamentals",
      provider: "Google Digital Garage",
      providerType: "External",
      duration: "25",
      durationType: "hours",
      certificationType: "Completion",
      credits: 2,
      isActive: true,
      description: "Comprehensive digital marketing course covering SEO, SEM, and social media marketing.",
      prerequisites: "None",
      skillsGained: ["SEO", "Google Ads", "Social Media Marketing", "Analytics", "Content Marketing"],
      createdAt: "2024-02-05",
      updatedAt: "2024-02-25"
    }
  ];

  // Provider options
  const providerOptions = [
    "Internal Faculty",
    "Coursera",
    "Udemy", 
    "AWS Training",
    "Google Digital Garage",
    "Microsoft Learn",
    "IBM SkillsBuild",
    "LinkedIn Learning",
    "edX",
    "Pluralsight"
  ];

  // Department and Program options
  const departmentOptions = [
    "Computer Science Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Management Studies",
    "Commerce",
    "Arts & Sciences"
  ];

  const programOptions = [
    "B.Tech",
    "M.Tech", 
    "BCA",
    "MCA",
    "MBA",
    "B.Com",
    "M.Com",
    "BSc",
    "MSc"
  ];

  const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const yearOptions = ["2021", "2022", "2023", "2024", "2025"];

  // Sample students data
  const studentsData: Student[] = [
    {
      id: "CS2021001",
      name: "Rahul Sharma",
      email: "rahul.sharma@college.edu",
      rollNumber: "CS2021001",
      department: "Computer Science Engineering",
      program: "B.Tech",
      semester: "6",
      batch: "CSE-A",
      year: "2021",
      cgpa: 8.5,
      isActive: true,
      allocatedCourses: ["1", "4"]
    },
    {
      id: "CS2021002",
      name: "Priya Patel",
      email: "priya.patel@college.edu",
      rollNumber: "CS2021002",
      department: "Computer Science Engineering",
      program: "B.Tech",
      semester: "6",
      batch: "CSE-A",
      year: "2021",
      cgpa: 7.8,
      isActive: true,
      allocatedCourses: ["2"]
    },
    {
      id: "IT2021001",
      name: "Amit Kumar",
      email: "amit.kumar@college.edu",
      rollNumber: "IT2021001",
      department: "Information Technology",
      program: "B.Tech",
      semester: "6",
      batch: "IT-A",
      year: "2021",
      cgpa: 8.2,
      isActive: true,
      allocatedCourses: ["1", "3"]
    },
    {
      id: "CS2022001",
      name: "Sneha Reddy",
      email: "sneha.reddy@college.edu",
      rollNumber: "CS2022001",
      department: "Computer Science Engineering",
      program: "B.Tech",
      semester: "4",
      batch: "CSE-B",
      year: "2022",
      cgpa: 9.1,
      isActive: true,
      allocatedCourses: ["4"]
    },
    {
      id: "MBA2021001",
      name: "Vikram Singh",
      email: "vikram.singh@college.edu",
      rollNumber: "MBA2021001",
      department: "Management Studies",
      program: "MBA",
      semester: "4",
      batch: "MBA-A",
      year: "2021",
      cgpa: 8.0,
      isActive: true,
      allocatedCourses: ["6"]
    }
  ];

  // Sample skill allocations data
  const skillAllocationsData: SkillAllocation[] = [
    {
      id: "1",
      courseId: "1",
      courseName: "Python for Data Science",
      allocationType: "Department",
      targetGroup: {
        department: "Computer Science Engineering",
        year: "2021"
      },
      studentIds: ["CS2021001", "CS2021002"],
      studentCount: 2,
      allocationFlag: "Mandatory",
      startDate: "2024-04-01",
      endDate: "2024-06-30",
      status: "Active",
      createdAt: "2024-03-15",
      createdBy: "Admin User",
      allowRetake: false
    },
    {
      id: "2",
      courseId: "2",
      courseName: "Full Stack Web Development",
      allocationType: "Semester",
      targetGroup: {
        department: "Computer Science Engineering",
        semester: "6",
        year: "2021"
      },
      studentIds: ["CS2021002"],
      studentCount: 1,
      allocationFlag: "Elective",
      startDate: "2024-03-01",
      endDate: "2024-05-31",
      status: "Active",
      createdAt: "2024-02-20",
      createdBy: "Admin User",
      allowRetake: true
    },
    {
      id: "3",
      courseId: "3",
      courseName: "Cloud Computing (AWS)",
      allocationType: "Batch",
      targetGroup: {
        department: "Information Technology",
        batch: "IT-A",
        year: "2021"
      },
      studentIds: ["IT2021001"],
      studentCount: 1,
      allocationFlag: "Mandatory",
      startDate: "2024-04-15",
      endDate: "2024-07-15",
      status: "Active",
      createdAt: "2024-04-01",
      createdBy: "Admin User",
      allowRetake: false
    },
    {
      id: "4",
      courseId: "4",
      courseName: "Soft Skills & Interview Prep",
      allocationType: "Program",
      targetGroup: {
        program: "B.Tech",
        semester: "6"
      },
      studentIds: ["CS2021001", "CS2022001"],
      studentCount: 2,
      allocationFlag: "Mandatory",
      startDate: "2024-03-01",
      endDate: "2024-04-30",
      status: "Completed",
      createdAt: "2024-02-15",
      createdBy: "Admin User",
      allowRetake: false
    },
    {
      id: "5",
      courseId: "6",
      courseName: "Digital Marketing Fundamentals",
      allocationType: "Individual",
      targetGroup: {
        department: "Management Studies"
      },
      studentIds: ["MBA2021001"],
      studentCount: 1,
      allocationFlag: "Elective",
      startDate: "2024-04-01",
      endDate: "2024-05-15",
      status: "Active",
      createdAt: "2024-03-25",
      createdBy: "Admin User",
      allowRetake: true
    }
  ];

  // Sample student progress data
  const studentProgressData: StudentProgress[] = [
    {
      id: "1",
      studentId: "CS2021001",
      studentName: "Rahul Sharma",
      rollNumber: "CS2021001",
      department: "Computer Science Engineering",
      batch: "CSE-A",
      courseId: "1",
      courseName: "Python for Data Science",
      allocationId: "1",
      completionPercentage: 100,
      assessmentScore: 85,
      maxAssessmentScore: 100,
      attendancePercentage: 95,
      status: "Completed",
      startDate: "2024-04-01",
      completionDate: "2024-05-15",
      lastUpdated: "2024-05-15",
      modules: [
        { id: "1", moduleName: "Python Basics", isCompleted: true, completionDate: "2024-04-10", score: 90, maxScore: 100 },
        { id: "2", moduleName: "Data Analysis with Pandas", isCompleted: true, completionDate: "2024-04-25", score: 85, maxScore: 100 },
        { id: "3", moduleName: "Data Visualization", isCompleted: true, completionDate: "2024-05-10", score: 80, maxScore: 100 },
        { id: "4", moduleName: "Final Project", isCompleted: true, completionDate: "2024-05-15", score: 85, maxScore: 100 }
      ]
    },
    {
      id: "2",
      studentId: "CS2021002",
      studentName: "Priya Patel",
      rollNumber: "CS2021002",
      department: "Computer Science Engineering",
      batch: "CSE-A",
      courseId: "1",
      courseName: "Python for Data Science",
      allocationId: "1",
      completionPercentage: 60,
      assessmentScore: 0,
      maxAssessmentScore: 100,
      attendancePercentage: 80,
      status: "In Progress",
      startDate: "2024-04-01",
      lastUpdated: "2024-05-10",
      modules: [
        { id: "1", moduleName: "Python Basics", isCompleted: true, completionDate: "2024-04-12", score: 88, maxScore: 100 },
        { id: "2", moduleName: "Data Analysis with Pandas", isCompleted: true, completionDate: "2024-04-28", score: 75, maxScore: 100 },
        { id: "3", moduleName: "Data Visualization", isCompleted: false },
        { id: "4", moduleName: "Final Project", isCompleted: false }
      ]
    },
    {
      id: "3",
      studentId: "IT2021001",
      studentName: "Amit Kumar",
      rollNumber: "IT2021001",
      department: "Information Technology",
      batch: "IT-A",
      courseId: "3",
      courseName: "Cloud Computing (AWS)",
      allocationId: "3",
      completionPercentage: 25,
      assessmentScore: 0,
      maxAssessmentScore: 100,
      attendancePercentage: 70,
      status: "In Progress",
      startDate: "2024-04-15",
      lastUpdated: "2024-05-01",
      modules: [
        { id: "1", moduleName: "AWS Fundamentals", isCompleted: true, completionDate: "2024-04-25", score: 82, maxScore: 100 },
        { id: "2", moduleName: "EC2 & Storage", isCompleted: false },
        { id: "3", moduleName: "Networking & Security", isCompleted: false },
        { id: "4", moduleName: "Serverless Computing", isCompleted: false }
      ]
    },
    {
      id: "4",
      studentId: "CS2022001",
      studentName: "Sneha Reddy",
      rollNumber: "CS2022001",
      department: "Computer Science Engineering",
      batch: "CSE-B",
      courseId: "4",
      courseName: "Soft Skills & Interview Prep",
      allocationId: "4",
      completionPercentage: 100,
      assessmentScore: 92,
      maxAssessmentScore: 100,
      attendancePercentage: 100,
      status: "Completed",
      startDate: "2024-03-01",
      completionDate: "2024-04-30",
      lastUpdated: "2024-04-30",
      modules: [
        { id: "1", moduleName: "Communication Skills", isCompleted: true, completionDate: "2024-03-15", score: 95, maxScore: 100 },
        { id: "2", moduleName: "Leadership & Teamwork", isCompleted: true, completionDate: "2024-04-01", score: 90, maxScore: 100 },
        { id: "3", moduleName: "Interview Techniques", isCompleted: true, completionDate: "2024-04-20", score: 88, maxScore: 100 },
        { id: "4", moduleName: "Mock Interviews", isCompleted: true, completionDate: "2024-04-30", score: 95, maxScore: 100 }
      ]
    },
    {
      id: "5",
      studentId: "MBA2021001",
      studentName: "Vikram Singh",
      rollNumber: "MBA2021001",
      department: "Management Studies",
      batch: "MBA-A",
      courseId: "6",
      courseName: "Digital Marketing Fundamentals",
      allocationId: "5",
      completionPercentage: 0,
      assessmentScore: 0,
      maxAssessmentScore: 100,
      attendancePercentage: 0,
      status: "Not Started",
      startDate: "2024-04-01",
      lastUpdated: "2024-04-01",
      modules: [
        { id: "1", moduleName: "SEO Basics", isCompleted: false },
        { id: "2", moduleName: "Social Media Marketing", isCompleted: false },
        { id: "3", moduleName: "Google Ads", isCompleted: false },
        { id: "4", moduleName: "Analytics & Reporting", isCompleted: false }
      ]
    },
    {
      id: "6",
      studentId: "CS2021002",
      studentName: "Priya Patel",
      rollNumber: "CS2021002",
      department: "Computer Science Engineering",
      batch: "CSE-A",
      courseId: "2",
      courseName: "Full Stack Web Development",
      allocationId: "2",
      completionPercentage: 80,
      assessmentScore: 78,
      maxAssessmentScore: 100,
      attendancePercentage: 85,
      status: "In Progress",
      startDate: "2024-03-01",
      lastUpdated: "2024-05-10",
      modules: [
        { id: "1", moduleName: "HTML/CSS Fundamentals", isCompleted: true, completionDate: "2024-03-15", score: 85, maxScore: 100 },
        { id: "2", moduleName: "JavaScript & React", isCompleted: true, completionDate: "2024-04-10", score: 80, maxScore: 100 },
        { id: "3", moduleName: "Backend with Node.js", isCompleted: true, completionDate: "2024-05-01", score: 75, maxScore: 100 },
        { id: "4", moduleName: "Database & Deployment", isCompleted: false }
      ]
    }
  ];

  // Sample student feedback data
  const studentFeedbackData: StudentFeedback[] = [
    {
      id: "1",
      studentId: "CS2021001",
      studentName: "Rahul Sharma",
      rollNumber: "CS2021001",
      courseId: "1",
      courseName: "Python for Data Science",
      overallRating: 5,
      contentQuality: 5,
      instructorRating: 4,
      difficultyLevel: 4,
      recommendationScore: 5,
      comments: "Excellent course! The content was well-structured and the instructor was very knowledgeable. The hands-on projects really helped me understand the concepts.",
      suggestions: "Maybe add more real-world case studies and industry examples.",
      submittedAt: "2024-05-16",
      status: "Submitted"
    },
    {
      id: "2",
      studentId: "CS2021002",
      studentName: "Priya Patel",
      rollNumber: "CS2021002",
      courseId: "1",
      courseName: "Python for Data Science",
      overallRating: 4,
      contentQuality: 4,
      instructorRating: 4,
      difficultyLevel: 3,
      recommendationScore: 4,
      comments: "Good course overall. The pace was appropriate and the assignments were challenging but doable.",
      suggestions: "More interactive sessions would be helpful.",
      submittedAt: "2024-05-10",
      status: "Submitted"
    },
    {
      id: "3",
      studentId: "CS2022001",
      studentName: "Sneha Reddy",
      rollNumber: "CS2022001",
      courseId: "4",
      courseName: "Soft Skills & Interview Prep",
      overallRating: 5,
      contentQuality: 5,
      instructorRating: 5,
      difficultyLevel: 2,
      recommendationScore: 5,
      comments: "Amazing course! Really helped me improve my communication skills and confidence. The mock interviews were particularly valuable.",
      suggestions: "Could include more group activities and peer feedback sessions.",
      submittedAt: "2024-05-01",
      status: "Reviewed"
    },
    {
      id: "4",
      studentId: "IT2021001",
      studentName: "Amit Kumar",
      rollNumber: "IT2021001",
      courseId: "3",
      courseName: "Cloud Computing (AWS)",
      overallRating: 0,
      contentQuality: 0,
      instructorRating: 0,
      difficultyLevel: 0,
      recommendationScore: 0,
      comments: "",
      suggestions: "",
      submittedAt: "",
      status: "Pending"
    }
  ];

  // Sample trainer feedback data
  const trainerFeedbackData: TrainerFeedback[] = [
    {
      id: "1",
      trainerId: "T001",
      trainerName: "Dr. Priya Sharma",
      courseId: "4",
      courseName: "Soft Skills & Interview Prep",
      batchId: "CSE-2022",
      studentEngagement: 5,
      contentDelivery: 4,
      learningOutcomes: 5,
      overallSatisfaction: 5,
      challenges: "Some students were initially hesitant to participate in role-playing exercises.",
      improvements: "More ice-breaking activities at the beginning would help students feel comfortable.",
      studentPerformance: "Excellent improvement in communication skills. Students showed great enthusiasm and progress.",
      submittedAt: "2024-05-01",
      status: "Submitted"
    },
    {
      id: "2",
      trainerId: "T002",
      trainerName: "Prof. Rajesh Kumar",
      courseId: "1",
      courseName: "Python for Data Science",
      batchId: "CSE-2021",
      studentEngagement: 4,
      contentDelivery: 4,
      learningOutcomes: 4,
      overallSatisfaction: 4,
      challenges: "Varying levels of programming background among students made it challenging to maintain uniform pace.",
      improvements: "Pre-course assessment and separate tracks for beginners and intermediate students.",
      studentPerformance: "Good overall performance. Most students grasped the concepts well with practice.",
      submittedAt: "2024-05-16",
      status: "Submitted"
    }
  ];

  // Sample certificates data
  const certificatesData: Certificate[] = [
    {
      id: "1",
      studentId: "CS2021001",
      studentName: "Rahul Sharma",
      rollNumber: "CS2021001",
      courseId: "1",
      courseName: "Python for Data Science",
      completionDate: "2024-05-15",
      issueDate: "2024-05-16",
      certificateNumber: "CERT-PDS-2024-001",
      grade: "A",
      score: 85,
      status: "Issued",
      templateId: "1",
      filePath: "/certificates/rahul_sharma_python_ds.pdf"
    },
    {
      id: "2",
      studentId: "CS2022001",
      studentName: "Sneha Reddy",
      rollNumber: "CS2022001",
      courseId: "4",
      courseName: "Soft Skills & Interview Prep",
      completionDate: "2024-04-30",
      issueDate: "2024-05-01",
      certificateNumber: "CERT-SS-2024-001",
      grade: "A+",
      score: 92,
      status: "Downloaded",
      templateId: "2",
      filePath: "/certificates/sneha_reddy_soft_skills.pdf"
    },
    {
      id: "3",
      studentId: "CS2021002",
      studentName: "Priya Patel",
      rollNumber: "CS2021002",
      courseId: "2",
      courseName: "Full Stack Web Development",
      completionDate: "2024-05-10",
      issueDate: "2024-05-11",
      certificateNumber: "CERT-FSWD-2024-001",
      grade: "B+",
      score: 78,
      status: "Generated",
      templateId: "1"
    }
  ];

  // Sample certificate templates
  const certificateTemplates: CertificateTemplate[] = [
    {
      id: "1",
      name: "Standard Completion Certificate",
      description: "Standard template for course completion certificates",
      templateType: "Completion",
      isActive: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-03-01"
    },
    {
      id: "2",
      name: "Achievement Certificate",
      description: "Template for high-performing students with grades A and above",
      templateType: "Achievement",
      isActive: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-03-01"
    },
    {
      id: "3",
      name: "Participation Certificate",
      description: "Template for participation in workshops and seminars",
      templateType: "Participation",
      isActive: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-02-01"
    }
  ];

  // Handle form functions
  const handleInputChange = (field: keyof SkillCourseFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !formData.skillsGained.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsGained: [...prev.skillsGained, skill.trim()]
      }));
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillsGained: prev.skillsGained.filter(skill => skill !== skillToRemove)
    }));
  };

  const resetForm = () => {
    setFormData({
      courseName: "",
      provider: "",
      providerType: "Internal",
      duration: "",
      durationType: "hours",
      certificationType: "Completion",
      credits: "",
      description: "",
      prerequisites: "",
      skillsGained: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!formData.courseName.trim()) {
        alert("Course name is required");
        return;
      }
      if (!formData.provider.trim()) {
        alert("Provider is required");
        return;
      }
      if (!formData.duration.trim() || parseFloat(formData.duration) <= 0) {
        alert("Valid duration is required");
        return;
      }

      console.log("Skill course data to submit:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      resetForm();
      setShowAddCourseModal(false);
      alert("Skill course added successfully!");
      
    } catch (error) {
      console.error("Error adding skill course:", error);
      alert("Error adding skill course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (course: SkillCourse) => {
    setSelectedCourse(course);
    setFormData({
      courseName: course.courseName,
      provider: course.provider,
      providerType: course.providerType,
      duration: course.duration,
      durationType: course.durationType,
      certificationType: course.certificationType,
      credits: course.credits?.toString() || "",
      description: course.description || "",
      prerequisites: course.prerequisites || "",
      skillsGained: course.skillsGained || [],
    });
    setShowEditCourseModal(true);
  };

  const handleView = (course: SkillCourse) => {
    setSelectedCourse(course);
    setShowViewCourseModal(true);
  };

  const handleToggleStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      console.log(`Toggling course ${courseId} from ${currentStatus} to ${!currentStatus}`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      alert(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error("Error toggling course status:", error);
      alert("Error updating course status. Please try again.");
    }
  };

  // Filter courses
  const filteredCourses = skillCoursesData.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.skillsGained || []).some(skill => 
                           skill.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesProvider = !selectedProvider || course.provider === selectedProvider;
    const matchesCertification = !selectedCertificationType || course.certificationType === selectedCertificationType;
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === "active" && course.isActive) ||
                         (selectedStatus === "inactive" && !course.isActive);
    
    return matchesSearch && matchesProvider && matchesCertification && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedProvider("");
    setSelectedCertificationType("");
    setSelectedStatus("");
    setShowFilterModal(false);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>
    );
  };

  const getCertificationBadge = (type: string) => {
    return type === "Assessment-based" ? (
      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Assessment-based</span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completion</span>
    );
  };

  const getProviderBadge = (providerType: string) => {
    return providerType === "Internal" ? (
      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Internal</span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">External</span>
    );
  };

  // Allocation helper functions
  const getAllocationTypeBadge = (type: string) => {
    const colors = {
      Department: "bg-blue-100 text-blue-800",
      Program: "bg-green-100 text-green-800",
      Semester: "bg-purple-100 text-purple-800",
      Batch: "bg-orange-100 text-orange-800",
      Individual: "bg-gray-100 text-gray-800"
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[type as keyof typeof colors]}`}>
        {type}
      </span>
    );
  };

  const getAllocationFlagBadge = (flag: string) => {
    return flag === "Mandatory" ? (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Mandatory</span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Elective</span>
    );
  };

  const getAllocationStatusBadge = (status: string) => {
    const colors = {
      Active: "bg-green-100 text-green-800",
      Completed: "bg-blue-100 text-blue-800",
      Cancelled: "bg-red-100 text-red-800"
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  // Allocation form handlers
  const handleAllocationInputChange = (field: keyof AllocationFormData, value: string | string[] | boolean) => {
    setAllocationFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetAllocationForm = () => {
    setAllocationFormData({
      courseId: "",
      allocationType: "Department",
      department: "",
      program: "",
      semester: "",
      batch: "",
      year: "",
      selectedStudents: [],
      allocationFlag: "Mandatory",
      startDate: "",
      endDate: "",
      allowRetake: false,
    });
  };

  // Get eligible students based on allocation criteria
  const getEligibleStudents = (): Student[] => {
    return studentsData.filter(student => {
      if (allocationFormData.allocationType === "Department") {
        return student.department === allocationFormData.department &&
               (!allocationFormData.year || student.year === allocationFormData.year);
      } else if (allocationFormData.allocationType === "Program") {
        return student.program === allocationFormData.program &&
               (!allocationFormData.semester || student.semester === allocationFormData.semester);
      } else if (allocationFormData.allocationType === "Semester") {
        return student.department === allocationFormData.department &&
               student.semester === allocationFormData.semester &&
               (!allocationFormData.year || student.year === allocationFormData.year);
      } else if (allocationFormData.allocationType === "Batch") {
        return student.batch === allocationFormData.batch &&
               student.department === allocationFormData.department &&
               (!allocationFormData.year || student.year === allocationFormData.year);
      }
      return true; // For Individual allocation, show all students
    });
  };

  // Check for duplicate allocations
  const checkDuplicateAllocation = (studentId: string, courseId: string): boolean => {
    const student = studentsData.find(s => s.id === studentId);
    if (!student) return false;
    
    const hasExistingAllocation = student.allocatedCourses.includes(courseId);
    return hasExistingAllocation && !allocationFormData.allowRetake;
  };

  // Handle allocation submission
  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!allocationFormData.courseId) {
        alert("Please select a course");
        return;
      }
      if (!allocationFormData.startDate || !allocationFormData.endDate) {
        alert("Please select start and end dates");
        return;
      }
      if (new Date(allocationFormData.startDate) >= new Date(allocationFormData.endDate)) {
        alert("End date must be after start date");
        return;
      }

      // Get students to allocate
      let studentsToAllocate: string[] = [];
      if (allocationFormData.allocationType === "Individual") {
        studentsToAllocate = allocationFormData.selectedStudents;
      } else {
        const eligibleStudents = getEligibleStudents();
        studentsToAllocate = eligibleStudents.map(s => s.id);
      }

      if (studentsToAllocate.length === 0) {
        alert("No students found for allocation");
        return;
      }

      // Check for duplicate allocations
      const duplicates = studentsToAllocate.filter(studentId => 
        checkDuplicateAllocation(studentId, allocationFormData.courseId)
      );

      if (duplicates.length > 0 && !allocationFormData.allowRetake) {
        const duplicateNames = duplicates.map(id => 
          studentsData.find(s => s.id === id)?.name
        ).join(", ");
        alert(`The following students are already allocated to this course: ${duplicateNames}. Enable "Allow Retake" to proceed.`);
        return;
      }

      console.log("Allocation data to submit:", {
        ...allocationFormData,
        studentsToAllocate,
        studentCount: studentsToAllocate.length
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      resetAllocationForm();
      setShowAllocateModal(false);
      alert(`Course allocated successfully to ${studentsToAllocate.length} students!`);
      
    } catch (error) {
      console.error("Error allocating course:", error);
      alert("Error allocating course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reassignment
  const handleReassign = (allocation: SkillAllocation) => {
    setSelectedAllocation(allocation);
    setAllocationFormData({
      courseId: allocation.courseId,
      allocationType: allocation.allocationType,
      department: allocation.targetGroup.department || "",
      program: allocation.targetGroup.program || "",
      semester: allocation.targetGroup.semester || "",
      batch: allocation.targetGroup.batch || "",
      year: allocation.targetGroup.year || "",
      selectedStudents: allocation.studentIds,
      allocationFlag: allocation.allocationFlag,
      startDate: allocation.startDate,
      endDate: allocation.endDate,
      allowRetake: allocation.allowRetake,
    });
    setShowAllocateModal(true);
  };

  // Handle export allocations
  const handleExportAllocations = () => {
    const csvData = [
      ["Course Name", "Allocation Type", "Target Group", "Students Count", "Flag", "Status", "Start Date", "End Date"],
      ...filteredAllocations.map(allocation => [
        allocation.courseName,
        allocation.allocationType,
        getTargetGroupDisplay(allocation.targetGroup),
        allocation.studentCount,
        allocation.allocationFlag,
        allocation.status,
        allocation.startDate,
        allocation.endDate
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skill_allocations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to display target group
  const getTargetGroupDisplay = (targetGroup: SkillAllocation['targetGroup']): string => {
    const parts = [];
    if (targetGroup.department) parts.push(targetGroup.department);
    if (targetGroup.program) parts.push(targetGroup.program);
    if (targetGroup.semester) parts.push(`Sem ${targetGroup.semester}`);
    if (targetGroup.batch) parts.push(targetGroup.batch);
    if (targetGroup.year) parts.push(targetGroup.year);
    return parts.join(" - ");
  };

  // Filter allocations
  const filteredAllocations = skillAllocationsData.filter(allocation => {
    const matchesSearch = allocation.courseName.toLowerCase().includes(allocationSearchTerm.toLowerCase()) ||
                         getTargetGroupDisplay(allocation.targetGroup).toLowerCase().includes(allocationSearchTerm.toLowerCase());
    
    const matchesStatus = !selectedAllocationStatus || allocation.status === selectedAllocationStatus;
    const matchesType = !selectedAllocationType || allocation.allocationType === selectedAllocationType;
    const matchesDepartment = !selectedDepartmentFilter || allocation.targetGroup.department === selectedDepartmentFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesDepartment;
  });

  const clearAllocationFilters = () => {
    setSelectedAllocationStatus("");
    setSelectedAllocationType("");
    setSelectedDepartmentFilter("");
    setShowAllocationFilterModal(false);
  };

  // Progress Tracker helper functions
  const getProgressStatusBadge = (status: string) => {
    const colors = {
      "Completed": "bg-green-100 text-green-800",
      "In Progress": "bg-blue-100 text-blue-800",
      "Not Started": "bg-gray-100 text-gray-800",
      "Failed": "bg-red-100 text-red-800"
    };
    const icons = {
      "Completed": CheckSquare,
      "In Progress": Clock,
      "Not Started": AlertCircle,
      "Failed": XCircle
    };
    const Icon = icons[status as keyof typeof icons];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-100";
    if (percentage >= 60) return "text-blue-600 bg-blue-100";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Progress form handlers
  const handleProgressInputChange = (field: keyof ProgressUpdateFormData, value: string) => {
    setProgressUpdateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetProgressForm = () => {
    setProgressUpdateFormData({
      studentId: "",
      courseId: "",
      completionPercentage: "",
      assessmentScore: "",
      maxAssessmentScore: "",
      attendancePercentage: "",
      status: "Not Started",
      notes: "",
    });
  };

  // Handle progress update
  const handleProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      const completion = parseFloat(progressUpdateFormData.completionPercentage);
      if (isNaN(completion) || completion < 0 || completion > 100) {
        alert("Completion percentage must be between 0 and 100");
        return;
      }

      if (progressUpdateFormData.assessmentScore) {
        const score = parseFloat(progressUpdateFormData.assessmentScore);
        const maxScore = parseFloat(progressUpdateFormData.maxAssessmentScore) || 100;
        if (isNaN(score) || score < 0 || score > maxScore) {
          alert(`Assessment score must be between 0 and ${maxScore}`);
          return;
        }
      }

      console.log("Progress update data:", progressUpdateFormData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      resetProgressForm();
      setShowUpdateProgressModal(false);
      setSelectedProgress(null);
      alert("Progress updated successfully!");
      
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Error updating progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUploadFile) {
      alert("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Uploading file:", bulkUploadFile.name);
      
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setBulkUploadFile(null);
      setShowBulkUploadModal(false);
      alert("Progress data uploaded successfully!");
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle export progress report
  const handleExportProgressReport = () => {
    const csvData = [
      ["Student Name", "Roll Number", "Course", "Completion %", "Assessment Score", "Attendance %", "Status", "Last Updated"],
      ...filteredProgress.map(progress => [
        progress.studentName,
        progress.rollNumber,
        progress.courseName,
        progress.completionPercentage,
        progress.assessmentScore || "N/A",
        progress.attendancePercentage || "N/A",
        progress.status,
        new Date(progress.lastUpdated).toLocaleDateString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skill_progress_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate batch progress summary
  const calculateBatchProgress = (): BatchProgressSummary[] => {
    const courseGroups = studentProgressData.reduce((acc, progress) => {
      if (!acc[progress.courseId]) {
        acc[progress.courseId] = {
          courseId: progress.courseId,
          courseName: progress.courseName,
          students: []
        };
      }
      acc[progress.courseId].students.push(progress);
      return acc;
    }, {} as Record<string, { courseId: string; courseName: string; students: StudentProgress[] }>);

    return Object.values(courseGroups).map(group => {
      const students = group.students;
      const totalStudents = students.length;
      const completedStudents = students.filter(s => s.status === "Completed").length;
      const inProgressStudents = students.filter(s => s.status === "In Progress").length;
      const notStartedStudents = students.filter(s => s.status === "Not Started").length;
      
      const averageCompletion = totalStudents > 0 
        ? students.reduce((sum, s) => sum + s.completionPercentage, 0) / totalStudents 
        : 0;
      
      const studentsWithScores = students.filter(s => s.assessmentScore !== undefined && s.assessmentScore > 0);
      const averageScore = studentsWithScores.length > 0
        ? studentsWithScores.reduce((sum, s) => sum + (s.assessmentScore || 0), 0) / studentsWithScores.length
        : 0;
      
      const studentsWithAttendance = students.filter(s => s.attendancePercentage !== undefined);
      const averageAttendance = studentsWithAttendance.length > 0
        ? studentsWithAttendance.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / studentsWithAttendance.length
        : 0;

      return {
        courseId: group.courseId,
        courseName: group.courseName,
        totalStudents,
        completedStudents,
        inProgressStudents,
        notStartedStudents,
        averageCompletion: Math.round(averageCompletion),
        averageScore: Math.round(averageScore),
        averageAttendance: Math.round(averageAttendance)
      };
    });
  };

  // Filter progress data
  const filteredProgress = studentProgressData.filter(progress => {
    const matchesSearch = progress.studentName.toLowerCase().includes(progressSearchTerm.toLowerCase()) ||
                         progress.rollNumber.toLowerCase().includes(progressSearchTerm.toLowerCase()) ||
                         progress.courseName.toLowerCase().includes(progressSearchTerm.toLowerCase());
    
    const matchesCourse = !selectedCourseFilter || progress.courseId === selectedCourseFilter;
    const matchesStatus = !selectedStatusFilter || progress.status === selectedStatusFilter;
    const matchesDepartment = !selectedDepartmentProgressFilter || progress.department === selectedDepartmentProgressFilter;
    
    return matchesSearch && matchesCourse && matchesStatus && matchesDepartment;
  });

  const clearProgressFilters = () => {
    setSelectedCourseFilter("");
    setSelectedStatusFilter("");
    setSelectedDepartmentProgressFilter("");
    setShowProgressFilterModal(false);
  };

  // Get incomplete students list
  const getIncompleteStudents = () => {
    return studentProgressData.filter(progress => 
      progress.status === "In Progress" || progress.status === "Not Started"
    );
  };

  // Feedback & Certification helper functions
  const getFeedbackStatusBadge = (status: string) => {
    const colors = {
      "Submitted": "bg-green-100 text-green-800",
      "Pending": "bg-yellow-100 text-yellow-800",
      "Reviewed": "bg-blue-100 text-blue-800"
    };
    const icons = {
      "Submitted": CheckCircle,
      "Pending": Clock,
      "Reviewed": Eye
    };
    const Icon = icons[status as keyof typeof icons];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const getCertificateStatusBadge = (status: string) => {
    const colors = {
      "Generated": "bg-blue-100 text-blue-800",
      "Issued": "bg-green-100 text-green-800",
      "Downloaded": "bg-purple-100 text-purple-800"
    };
    const icons = {
      "Generated": FileText,
      "Issued": Award,
      "Downloaded": Download
    };
    const Icon = icons[status as keyof typeof icons];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const renderStarRating = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  // Feedback form handlers
  const handleFeedbackInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFeedbackFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTrainerFeedbackInputChange = (field: keyof TrainerFeedbackFormData, value: string) => {
    setTrainerFeedbackFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFeedbackForm = () => {
    setFeedbackFormData({
      overallRating: "",
      contentQuality: "",
      instructorRating: "",
      difficultyLevel: "",
      recommendationScore: "",
      comments: "",
      suggestions: "",
    });
  };

  const resetTrainerFeedbackForm = () => {
    setTrainerFeedbackFormData({
      studentEngagement: "",
      contentDelivery: "",
      learningOutcomes: "",
      overallSatisfaction: "",
      challenges: "",
      improvements: "",
      studentPerformance: "",
    });
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      const requiredFields = ['overallRating', 'contentQuality', 'instructorRating'];
      for (const field of requiredFields) {
        const value = feedbackFormData[field as keyof FeedbackFormData];
        if (!value || parseFloat(value) < 1 || parseFloat(value) > 5) {
          alert(`Please provide a valid rating (1-5) for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return;
        }
      }

      console.log("Student feedback data:", feedbackFormData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      resetFeedbackForm();
      setShowStudentFeedbackModal(false);
      alert("Feedback submitted successfully!");
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle trainer feedback submission
  const handleTrainerFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      const requiredFields = ['studentEngagement', 'contentDelivery', 'learningOutcomes', 'overallSatisfaction'];
      for (const field of requiredFields) {
        const value = trainerFeedbackFormData[field as keyof TrainerFeedbackFormData];
        if (!value || parseFloat(value) < 1 || parseFloat(value) > 5) {
          alert(`Please provide a valid rating (1-5) for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return;
        }
      }

      console.log("Trainer feedback data:", trainerFeedbackFormData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      resetTrainerFeedbackForm();
      setShowTrainerFeedbackModal(false);
      alert("Trainer feedback submitted successfully!");
      
    } catch (error) {
      console.error("Error submitting trainer feedback:", error);
      alert("Error submitting trainer feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle certificate generation
  const handleGenerateCertificates = async () => {
    if (selectedCertificates.length === 0) {
      alert("Please select certificates to generate");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Generating certificates for:", selectedCertificates);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSelectedCertificates([]);
      alert(`${selectedCertificates.length} certificates generated successfully!`);
      
    } catch (error) {
      console.error("Error generating certificates:", error);
      alert("Error generating certificates. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle batch certificate download
  const handleBatchDownload = () => {
    const issuedCertificates = certificatesData.filter(cert => 
      cert.status === "Issued" && selectedCertificates.includes(cert.id)
    );

    if (issuedCertificates.length === 0) {
      alert("No issued certificates selected for download");
      return;
    }

    console.log("Downloading certificates:", issuedCertificates);
    alert(`Downloading ${issuedCertificates.length} certificates as ZIP file...`);
  };

  // Filter feedback data
  const filteredStudentFeedback = studentFeedbackData.filter(feedback => {
    const matchesSearch = feedback.studentName.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
                         feedback.courseName.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
                         feedback.rollNumber.toLowerCase().includes(feedbackSearchTerm.toLowerCase());
    
    const matchesCourse = !selectedFeedbackCourse || feedback.courseId === selectedFeedbackCourse;
    const matchesStatus = !selectedFeedbackStatus || feedback.status === selectedFeedbackStatus;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const filteredTrainerFeedback = trainerFeedbackData.filter(feedback => {
    const matchesSearch = feedback.trainerName.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
                         feedback.courseName.toLowerCase().includes(feedbackSearchTerm.toLowerCase());
    
    const matchesCourse = !selectedFeedbackCourse || feedback.courseId === selectedFeedbackCourse;
    const matchesStatus = !selectedFeedbackStatus || feedback.status === selectedFeedbackStatus;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const clearFeedbackFilters = () => {
    setSelectedFeedbackCourse("");
    setSelectedFeedbackStatus("");
    setShowFeedbackFilterModal(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Training & Skill Development
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage skill courses, allocations, progress tracking, and certifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {skillStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "courses" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Skill Course Master</h2>
              <button 
                onClick={() => setShowAddCourseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Skill Course
              </button>
            </div>
            <p className="text-gray-600 mb-4">Manage skill course names, providers, and certification types.</p>
            
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search skill courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4" />
                Filter
                {(selectedProvider || selectedCertificationType || selectedStatus) && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {[selectedProvider, selectedCertificationType, selectedStatus].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Courses Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Certification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                                <div className="text-sm text-gray-500">
                                  {course.skillsGained?.slice(0, 2).join(", ")}
                                  {course.skillsGained && course.skillsGained.length > 2 && "..."}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{course.provider}</div>
                            <div className="text-sm">{getProviderBadge(course.providerType)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {course.duration} {course.durationType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCertificationBadge(course.certificationType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {course.credits ? `${course.credits} credits` : "No credits"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(course.isActive)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(course)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(course)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                title="Edit Course"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(course.id, course.isActive)}
                                className={`p-1 rounded ${
                                  course.isActive 
                                    ? "text-red-600 hover:text-red-900 hover:bg-red-50" 
                                    : "text-green-600 hover:text-green-900 hover:bg-green-50"
                                }`}
                                title={course.isActive ? "Deactivate" : "Activate"}
                              >
                                {course.isActive ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No skill courses found</h3>
                            <p className="text-gray-500 mb-4">
                              {searchTerm || selectedProvider || selectedCertificationType || selectedStatus
                                ? "Try adjusting your search or filters"
                                : "Get started by adding your first skill course"}
                            </p>
                            {!searchTerm && !selectedProvider && !selectedCertificationType && !selectedStatus && (
                              <button
                                onClick={() => setShowAddCourseModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                <Plus className="h-4 w-4" />
                                Add First Course
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "allocation" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Skill Allocation</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportAllocations}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button 
                  onClick={() => setShowAllocateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Allocate Course
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Allocate courses to departments/programs, set as mandatory/elective, and manage student-wise allocation.</p>
            
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={allocationSearchTerm}
                  onChange={(e) => setAllocationSearchTerm(e.target.value)}
                  placeholder="Search allocations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={() => setShowAllocationFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4" />
                Filter
                {(selectedAllocationStatus || selectedAllocationType || selectedDepartmentFilter) && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {[selectedAllocationStatus, selectedAllocationType, selectedDepartmentFilter].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Allocations Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course & Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocation Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Flag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAllocations.length > 0 ? (
                      filteredAllocations.map((allocation) => (
                        <tr key={allocation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                  <Target className="h-5 w-5 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{allocation.courseName}</div>
                                <div className="text-sm text-gray-500">{getTargetGroupDisplay(allocation.targetGroup)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getAllocationTypeBadge(allocation.allocationType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{allocation.studentCount}</span>
                              <button
                                onClick={() => {
                                  setSelectedAllocation(allocation);
                                  setShowStudentListModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 text-xs underline"
                              >
                                View List
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getAllocationFlagBadge(allocation.allocationFlag)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(allocation.startDate).toLocaleDateString()} - {new Date(allocation.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getAllocationStatusBadge(allocation.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReassign(allocation)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                title="Reassign"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to cancel this allocation?")) {
                                    console.log("Cancelling allocation:", allocation.id);
                                    alert("Allocation cancelled successfully!");
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Cancel Allocation"
                                disabled={allocation.status === "Completed" || allocation.status === "Cancelled"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Target className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No allocations found</h3>
                            <p className="text-gray-500 mb-4">
                              {allocationSearchTerm || selectedAllocationStatus || selectedAllocationType || selectedDepartmentFilter
                                ? "Try adjusting your search or filters"
                                : "Get started by allocating your first course"}
                            </p>
                            {!allocationSearchTerm && !selectedAllocationStatus && !selectedAllocationType && !selectedDepartmentFilter && (
                              <button
                                onClick={() => setShowAllocateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                <Plus className="h-4 w-4" />
                                Allocate First Course
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Progress Tracker</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowBulkUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </button>
                <button 
                  onClick={handleExportProgressReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Track completion percentage, assessment scores, and attendance integration.</p>
            
            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setProgressView('student')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  progressView === 'student'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Student-wise Progress
              </button>
              <button
                onClick={() => setProgressView('batch')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  progressView === 'batch'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Batch-wise Progress
              </button>
              <button
                onClick={() => setProgressView('course')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  progressView === 'course'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Course-wise Stats
              </button>
            </div>

            {/* Search and Filter */}
            {progressView === 'student' && (
              <div className="flex gap-2 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={progressSearchTerm}
                    onChange={(e) => setProgressSearchTerm(e.target.value)}
                    placeholder="Search students or courses..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button 
                  onClick={() => setShowProgressFilterModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {(selectedCourseFilter || selectedStatusFilter || selectedDepartmentProgressFilter) && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {[selectedCourseFilter, selectedStatusFilter, selectedDepartmentProgressFilter].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Student-wise Progress View */}
            {progressView === 'student' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completion %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assessment Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProgress.length > 0 ? (
                        filteredProgress.map((progress) => (
                          <tr key={progress.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{progress.studentName}</div>
                                  <div className="text-sm text-gray-500">{progress.rollNumber} • {progress.department}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{progress.courseName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${getCompletionColor(progress.completionPercentage).split(' ')[1]}`}
                                        style={{ width: `${progress.completionPercentage}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-sm font-medium ${getCompletionColor(progress.completionPercentage).split(' ')[0]}`}>
                                      {progress.completionPercentage}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {progress.assessmentScore !== undefined && progress.assessmentScore > 0 
                                  ? `${progress.assessmentScore}/${progress.maxAssessmentScore || 100}`
                                  : "Pending"
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {progress.attendancePercentage !== undefined 
                                  ? `${progress.attendancePercentage}%`
                                  : "N/A"
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getProgressStatusBadge(progress.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedProgress(progress);
                                    setProgressUpdateFormData({
                                      studentId: progress.studentId,
                                      courseId: progress.courseId,
                                      completionPercentage: progress.completionPercentage.toString(),
                                      assessmentScore: progress.assessmentScore?.toString() || "",
                                      maxAssessmentScore: progress.maxAssessmentScore?.toString() || "100",
                                      attendancePercentage: progress.attendancePercentage?.toString() || "",
                                      status: progress.status,
                                      notes: "",
                                    });
                                    setShowUpdateProgressModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="Update Progress"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProgress(progress);
                                    // Could open a detailed view modal here
                                    alert(`Detailed view for ${progress.studentName} - ${progress.courseName}`);
                                  }}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data found</h3>
                              <p className="text-gray-500">
                                {progressSearchTerm || selectedCourseFilter || selectedStatusFilter || selectedDepartmentProgressFilter
                                  ? "Try adjusting your search or filters"
                                  : "Progress data will appear here once students start courses"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Batch-wise Progress View */}
            {progressView === 'batch' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {calculateBatchProgress().map((batch) => (
                  <div key={batch.courseId} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{batch.courseName}</h3>
                      <span className="text-sm text-gray-500">{batch.totalStudents} students</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{batch.completedStudents}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{batch.inProgressStudents}</div>
                          <div className="text-xs text-gray-500">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{batch.notStartedStudents}</div>
                          <div className="text-xs text-gray-500">Not Started</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Completion</span>
                          <span className="font-medium">{batch.averageCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${batch.averageCompletion}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {batch.averageScore > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Average Score</span>
                          <span className="font-medium">{batch.averageScore}/100</span>
                        </div>
                      )}
                      
                      {batch.averageAttendance > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Average Attendance</span>
                          <span className="font-medium">{batch.averageAttendance}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Course-wise Stats View */}
            {progressView === 'course' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Enrollments</p>
                        <p className="text-2xl font-bold text-gray-900">{studentProgressData.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {studentProgressData.filter(p => p.status === "Completed").length}
                        </p>
                      </div>
                      <CheckSquare className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {studentProgressData.filter(p => p.status === "In Progress").length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Not Started</p>
                        <p className="text-2xl font-bold text-gray-600">
                          {studentProgressData.filter(p => p.status === "Not Started").length}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Incomplete Students List */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Incomplete Students</h3>
                    <p className="text-sm text-gray-600">Students who haven't completed their assigned courses</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Days Since Start
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getIncompleteStudents().map((progress) => {
                          const daysSinceStart = Math.floor(
                            (new Date().getTime() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)
                          );
                          return (
                            <tr key={progress.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{progress.studentName}</div>
                                <div className="text-sm text-gray-500">{progress.rollNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{progress.courseName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${getCompletionColor(progress.completionPercentage).split(' ')[1]}`}
                                      style={{ width: `${progress.completionPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">{progress.completionPercentage}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getProgressStatusBadge(progress.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm ${daysSinceStart > 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                  {daysSinceStart} days
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "feedback" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Feedback & Certification</h2>
              <div className="flex gap-2">
                {feedbackView === 'certificates' && selectedCertificates.length > 0 && (
                  <>
                    <button 
                      onClick={handleBatchDownload}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Download className="h-4 w-4" />
                      Batch Download ({selectedCertificates.length})
                    </button>
                    <button 
                      onClick={handleGenerateCertificates}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Award className="h-4 w-4" />
                      )}
                      Generate Certificates
                    </button>
                  </>
                )}
                {feedbackView === 'student' && (
                  <button 
                    onClick={() => setShowStudentFeedbackModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Collect Feedback
                  </button>
                )}
                {feedbackView === 'trainer' && (
                  <button 
                    onClick={() => setShowTrainerFeedbackModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Trainer Feedback
                  </button>
                )}
                {feedbackView === 'certificates' && (
                  <button 
                    onClick={() => setShowCertificateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Award className="h-4 w-4" />
                    Certificate Manager
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-4">Collect student and trainer feedback, generate certificates, and batch downloads.</p>
            
            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFeedbackView('student')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  feedbackView === 'student'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Student Feedback
              </button>
              <button
                onClick={() => setFeedbackView('trainer')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  feedbackView === 'trainer'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Trainer Feedback
              </button>
              <button
                onClick={() => setFeedbackView('certificates')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  feedbackView === 'certificates'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Certificates
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={feedbackSearchTerm}
                  onChange={(e) => setFeedbackSearchTerm(e.target.value)}
                  placeholder={`Search ${feedbackView === 'student' ? 'students' : feedbackView === 'trainer' ? 'trainers' : 'certificates'}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={() => setShowFeedbackFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4" />
                Filter
                {(selectedFeedbackCourse || selectedFeedbackStatus) && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {[selectedFeedbackCourse, selectedFeedbackStatus].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Student Feedback View */}
            {feedbackView === 'student' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Overall Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content Quality
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instructor Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudentFeedback.length > 0 ? (
                        filteredStudentFeedback.map((feedback) => (
                          <tr key={feedback.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{feedback.studentName}</div>
                                  <div className="text-sm text-gray-500">{feedback.rollNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{feedback.courseName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {feedback.overallRating > 0 ? renderStarRating(feedback.overallRating) : (
                                <span className="text-sm text-gray-500">Not rated</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {feedback.contentQuality > 0 ? renderStarRating(feedback.contentQuality) : (
                                <span className="text-sm text-gray-500">Not rated</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {feedback.instructorRating > 0 ? renderStarRating(feedback.instructorRating) : (
                                <span className="text-sm text-gray-500">Not rated</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getFeedbackStatusBadge(feedback.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedFeedback(feedback);
                                    // Could open detailed feedback view modal
                                    alert(`Viewing feedback from ${feedback.studentName}`);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="View Feedback"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {feedback.status === 'Submitted' && (
                                  <button
                                    onClick={() => {
                                      console.log("Marking feedback as reviewed:", feedback.id);
                                      alert("Feedback marked as reviewed!");
                                    }}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Mark as Reviewed"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
                              <p className="text-gray-500">
                                {feedbackSearchTerm || selectedFeedbackCourse || selectedFeedbackStatus
                                  ? "Try adjusting your search or filters"
                                  : "Student feedback will appear here once submitted"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trainer Feedback View */}
            {feedbackView === 'trainer' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trainer Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course & Batch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Engagement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content Delivery
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Overall Satisfaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTrainerFeedback.length > 0 ? (
                        filteredTrainerFeedback.map((feedback) => (
                          <tr key={feedback.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-purple-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{feedback.trainerName}</div>
                                  <div className="text-sm text-gray-500">Trainer ID: {feedback.trainerId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{feedback.courseName}</div>
                              <div className="text-sm text-gray-500">Batch: {feedback.batchId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderStarRating(feedback.studentEngagement)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderStarRating(feedback.contentDelivery)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderStarRating(feedback.overallSatisfaction)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getFeedbackStatusBadge(feedback.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedFeedback(feedback);
                                    alert(`Viewing trainer feedback from ${feedback.trainerName}`);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="View Feedback"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {feedback.status === 'Submitted' && (
                                  <button
                                    onClick={() => {
                                      console.log("Marking trainer feedback as reviewed:", feedback.id);
                                      alert("Trainer feedback marked as reviewed!");
                                    }}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Mark as Reviewed"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No trainer feedback found</h3>
                              <p className="text-gray-500">
                                {feedbackSearchTerm || selectedFeedbackCourse || selectedFeedbackStatus
                                  ? "Try adjusting your search or filters"
                                  : "Trainer feedback will appear here once submitted"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Certificates View */}
            {feedbackView === 'certificates' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedCertificates.length === certificatesData.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCertificates(certificatesData.map(cert => cert.id));
                              } else {
                                setSelectedCertificates([]);
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade/Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {certificatesData.length > 0 ? (
                        certificatesData.map((certificate) => (
                          <tr key={certificate.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedCertificates.includes(certificate.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCertificates([...selectedCertificates, certificate.id]);
                                  } else {
                                    setSelectedCertificates(selectedCertificates.filter(id => id !== certificate.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Award className="h-5 w-5 text-green-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{certificate.studentName}</div>
                                  <div className="text-sm text-gray-500">{certificate.rollNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{certificate.courseName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-900">{certificate.certificateNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {certificate.grade && <span className="font-medium">{certificate.grade}</span>}
                                {certificate.score && <span className="text-gray-500"> ({certificate.score}/100)</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(certificate.issueDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getCertificateStatusBadge(certificate.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    console.log("Viewing certificate:", certificate.certificateNumber);
                                    alert(`Viewing certificate ${certificate.certificateNumber}`);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="View Certificate"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {certificate.status === 'Issued' && (
                                  <button
                                    onClick={() => {
                                      console.log("Downloading certificate:", certificate.filePath);
                                      alert(`Downloading certificate for ${certificate.studentName}`);
                                    }}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Download Certificate"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <Award className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                              <p className="text-gray-500">Certificates will appear here once generated</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Skill Course</h2>
                  <p className="text-sm text-gray-500">Create a new skill course for students</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddCourseModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => handleInputChange("courseName", e.target.value)}
                  placeholder="e.g., Python for Data Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Provider and Provider Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleInputChange("provider", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Provider</option>
                    {providerOptions.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.providerType}
                    onChange={(e) => handleInputChange("providerType", e.target.value as 'Internal' | 'External')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    placeholder="e.g., 40"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration Type
                  </label>
                  <select
                    value={formData.durationType}
                    onChange={(e) => handleInputChange("durationType", e.target.value as 'hours' | 'weeks' | 'months')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hours">Hours</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              {/* Certification Type and Credits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certification Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.certificationType}
                    onChange={(e) => handleInputChange("certificationType", e.target.value as 'Completion' | 'Assessment-based')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Completion">Completion</option>
                    <option value="Assessment-based">Assessment-based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => handleInputChange("credits", e.target.value)}
                    placeholder="e.g., 3"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the course content and objectives..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisites
                </label>
                <input
                  type="text"
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                  placeholder="e.g., Basic programming knowledge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Skills Gained */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Gained
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter a skill and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleSkillAdd(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                        handleSkillAdd(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Add
                    </button>
                  </div>
                  {formData.skillsGained.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skillsGained.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillRemove(skill)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourseModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Add Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Edit className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Edit Skill Course</h2>
                  <p className="text-sm text-gray-500">Update course information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditCourseModal(false);
                  setSelectedCourse(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              
              try {
                console.log("Updating course:", selectedCourse.id, formData);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setShowEditCourseModal(false);
                setSelectedCourse(null);
                resetForm();
                alert("Course updated successfully!");
                
              } catch (error) {
                console.error("Error updating course:", error);
                alert("Error updating course. Please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }} className="p-6 space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => handleInputChange("courseName", e.target.value)}
                  placeholder="e.g., Python for Data Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Provider and Provider Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleInputChange("provider", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Provider</option>
                    {providerOptions.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.providerType}
                    onChange={(e) => handleInputChange("providerType", e.target.value as 'Internal' | 'External')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    placeholder="e.g., 40"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration Type
                  </label>
                  <select
                    value={formData.durationType}
                    onChange={(e) => handleInputChange("durationType", e.target.value as 'hours' | 'weeks' | 'months')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hours">Hours</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              {/* Certification Type and Credits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certification Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.certificationType}
                    onChange={(e) => handleInputChange("certificationType", e.target.value as 'Completion' | 'Assessment-based')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Completion">Completion</option>
                    <option value="Assessment-based">Assessment-based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => handleInputChange("credits", e.target.value)}
                    placeholder="e.g., 3"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the course content and objectives..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisites
                </label>
                <input
                  type="text"
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                  placeholder="e.g., Basic programming knowledge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Skills Gained */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Gained
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter a skill and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleSkillAdd(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                        handleSkillAdd(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Add
                    </button>
                  </div>
                  {formData.skillsGained.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skillsGained.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillRemove(skill)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCourseModal(false);
                    setSelectedCourse(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Update Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Course Modal */}
      {showViewCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Course Details</h2>
                  <p className="text-sm text-gray-500">{selectedCourse.courseName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewCourseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Course Name</label>
                    <p className="text-gray-900 font-medium">{selectedCourse.courseName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Provider</label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{selectedCourse.provider}</p>
                      {getProviderBadge(selectedCourse.providerType)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
                    <p className="text-gray-900">{selectedCourse.duration} {selectedCourse.durationType}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Certification Type</label>
                    <div>{getCertificationBadge(selectedCourse.certificationType)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Credits</label>
                    <p className="text-gray-900">{selectedCourse.credits ? `${selectedCourse.credits} credits` : "No credits"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <div>{getStatusBadge(selectedCourse.isActive)}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedCourse.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedCourse.description}</p>
                </div>
              )}

              {/* Prerequisites */}
              {selectedCourse.prerequisites && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Prerequisites</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedCourse.prerequisites}</p>
                </div>
              )}

              {/* Skills Gained */}
              {selectedCourse.skillsGained && selectedCourse.skillsGained.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Skills Gained</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.skillsGained.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-gray-900 text-sm">{new Date(selectedCourse.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-gray-900 text-sm">{new Date(selectedCourse.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewCourseModal(false);
                    handleEdit(selectedCourse);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit className="h-4 w-4" />
                  Edit Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Course Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Allocate Course</h2>
                  <p className="text-sm text-gray-500">Assign skill course to students</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAllocateModal(false);
                  resetAllocationForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAllocationSubmit} className="p-6 space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={allocationFormData.courseId}
                  onChange={(e) => handleAllocationInputChange("courseId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a course</option>
                  {skillCoursesData.filter(course => course.isActive).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.courseName} ({course.provider})
                    </option>
                  ))}
                </select>
              </div>

              {/* Allocation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocation Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={allocationFormData.allocationType}
                  onChange={(e) => handleAllocationInputChange("allocationType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Department">Department</option>
                  <option value="Program">Program</option>
                  <option value="Semester">Semester</option>
                  <option value="Batch">Batch</option>
                  <option value="Individual">Individual Students</option>
                </select>
              </div>

              {/* Target Group Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(allocationFormData.allocationType === "Department" || 
                  allocationFormData.allocationType === "Semester" || 
                  allocationFormData.allocationType === "Batch") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={allocationFormData.department}
                      onChange={(e) => handleAllocationInputChange("department", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(allocationFormData.allocationType === "Program" || 
                  allocationFormData.allocationType === "Semester") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program {allocationFormData.allocationType === "Program" && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={allocationFormData.program}
                      onChange={(e) => handleAllocationInputChange("program", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={allocationFormData.allocationType === "Program"}
                    >
                      <option value="">Select Program</option>
                      {programOptions.map((program) => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(allocationFormData.allocationType === "Semester" || 
                  allocationFormData.allocationType === "Program") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester {allocationFormData.allocationType === "Semester" && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={allocationFormData.semester}
                      onChange={(e) => handleAllocationInputChange("semester", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={allocationFormData.allocationType === "Semester"}
                    >
                      <option value="">Select Semester</option>
                      {semesterOptions.map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                )}

                {allocationFormData.allocationType === "Batch" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={allocationFormData.batch}
                      onChange={(e) => handleAllocationInputChange("batch", e.target.value)}
                      placeholder="e.g., CSE-A, IT-B"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={allocationFormData.year}
                    onChange={(e) => handleAllocationInputChange("year", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Years</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Individual Student Selection */}
              {allocationFormData.allocationType === "Individual" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Students <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {studentsData.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={allocationFormData.selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            const currentSelected = allocationFormData.selectedStudents;
                            if (e.target.checked) {
                              handleAllocationInputChange("selectedStudents", [...currentSelected, student.id]);
                            } else {
                              handleAllocationInputChange("selectedStudents", currentSelected.filter(id => id !== student.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.rollNumber} - {student.department}</div>
                        </div>
                        {student.allocatedCourses.includes(allocationFormData.courseId) && (
                          <div title="Already allocated">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Allocation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocation Flag <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={allocationFormData.allocationFlag}
                    onChange={(e) => handleAllocationInputChange("allocationFlag", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Mandatory">Mandatory</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="allowRetake"
                    checked={allocationFormData.allowRetake}
                    onChange={(e) => handleAllocationInputChange("allowRetake", e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="allowRetake" className="text-sm text-gray-700">
                    Allow Retake (Override duplicate allocation)
                  </label>
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={allocationFormData.startDate}
                    onChange={(e) => handleAllocationInputChange("startDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={allocationFormData.endDate}
                    onChange={(e) => handleAllocationInputChange("endDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Preview */}
              {allocationFormData.allocationType !== "Individual" && allocationFormData.courseId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
                  <p className="text-sm text-blue-800">
                    {getEligibleStudents().length} students will be allocated to this course
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllocateModal(false);
                    resetAllocationForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Allocating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Allocate Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {showStudentListModal && selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Allocated Students</h2>
                  <p className="text-sm text-gray-500">{selectedAllocation.courseName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowStudentListModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {selectedAllocation.studentIds.map((studentId) => {
                  const student = studentsData.find(s => s.id === studentId);
                  if (!student) return null;
                  
                  return (
                    <div key={studentId} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">
                          {student.rollNumber} • {student.department} • {student.program} Sem {student.semester}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">CGPA: {student.cgpa}</div>
                        <div className="text-xs text-gray-500">{student.batch}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Filter Modal */}
      {showAllocationFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Filter Allocations</h2>
              </div>
              <button
                onClick={() => setShowAllocationFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedAllocationStatus}
                  onChange={(e) => setSelectedAllocationStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Allocation Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allocation Type</label>
                <select
                  value={selectedAllocationType}
                  onChange={(e) => setSelectedAllocationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Department">Department</option>
                  <option value="Program">Program</option>
                  <option value="Semester">Semester</option>
                  <option value="Batch">Batch</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={clearAllocationFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowAllocationFilterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Feedback Modal */}
      {showStudentFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Student Feedback</h2>
                  <p className="text-sm text-gray-500">Collect course feedback from students</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStudentFeedbackModal(false);
                  resetFeedbackForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a course</option>
                  {skillCoursesData.filter(course => course.isActive).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a student</option>
                  {studentsData.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={feedbackFormData.overallRating}
                    onChange={(e) => handleFeedbackInputChange("overallRating", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Quality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={feedbackFormData.contentQuality}
                    onChange={(e) => handleFeedbackInputChange("contentQuality", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={feedbackFormData.instructorRating}
                    onChange={(e) => handleFeedbackInputChange("instructorRating", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={feedbackFormData.difficultyLevel}
                    onChange={(e) => handleFeedbackInputChange("difficultyLevel", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select level</option>
                    <option value="5">5 - Very Difficult</option>
                    <option value="4">4 - Difficult</option>
                    <option value="3">3 - Moderate</option>
                    <option value="2">2 - Easy</option>
                    <option value="1">1 - Very Easy</option>
                  </select>
                </div>
              </div>

              {/* Recommendation Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Would you recommend this course?
                </label>
                <select
                  value={feedbackFormData.recommendationScore}
                  onChange={(e) => handleFeedbackInputChange("recommendationScore", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select recommendation</option>
                  <option value="5">5 - Definitely recommend</option>
                  <option value="4">4 - Likely to recommend</option>
                  <option value="3">3 - Neutral</option>
                  <option value="2">2 - Unlikely to recommend</option>
                  <option value="1">1 - Would not recommend</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={feedbackFormData.comments}
                  onChange={(e) => handleFeedbackInputChange("comments", e.target.value)}
                  placeholder="Share your experience with this course..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestions for Improvement
                </label>
                <textarea
                  value={feedbackFormData.suggestions}
                  onChange={(e) => handleFeedbackInputChange("suggestions", e.target.value)}
                  placeholder="How can this course be improved?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentFeedbackModal(false);
                    resetFeedbackForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trainer Feedback Modal */}
      {showTrainerFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Trainer Feedback</h2>
                  <p className="text-sm text-gray-500">Collect feedback from course trainers</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTrainerFeedbackModal(false);
                  resetTrainerFeedbackForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleTrainerFeedbackSubmit} className="p-6 space-y-6">
              {/* Course and Batch Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a course</option>
                    {skillCoursesData.filter(course => course.isActive).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.courseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CSE-2021, IT-2022"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Trainer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trainer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter trainer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trainer ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., T001, T002"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Rating Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Engagement <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trainerFeedbackFormData.studentEngagement}
                    onChange={(e) => handleTrainerFeedbackInputChange("studentEngagement", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Delivery <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trainerFeedbackFormData.contentDelivery}
                    onChange={(e) => handleTrainerFeedbackInputChange("contentDelivery", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Outcomes <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trainerFeedbackFormData.learningOutcomes}
                    onChange={(e) => handleTrainerFeedbackInputChange("learningOutcomes", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Satisfaction <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trainerFeedbackFormData.overallSatisfaction}
                    onChange={(e) => handleTrainerFeedbackInputChange("overallSatisfaction", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Below Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
              </div>

              {/* Text Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenges Faced
                </label>
                <textarea
                  value={trainerFeedbackFormData.challenges}
                  onChange={(e) => handleTrainerFeedbackInputChange("challenges", e.target.value)}
                  placeholder="Describe any challenges faced during the training..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestions for Improvement
                </label>
                <textarea
                  value={trainerFeedbackFormData.improvements}
                  onChange={(e) => handleTrainerFeedbackInputChange("improvements", e.target.value)}
                  placeholder="How can the training program be improved?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Performance Assessment
                </label>
                <textarea
                  value={trainerFeedbackFormData.studentPerformance}
                  onChange={(e) => handleTrainerFeedbackInputChange("studentPerformance", e.target.value)}
                  placeholder="Overall assessment of student performance and engagement..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowTrainerFeedbackModal(false);
                    resetTrainerFeedbackForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Filter Modal */}
      {showFeedbackFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Filter Feedback</h2>
              </div>
              <button
                onClick={() => setShowFeedbackFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select
                  value={selectedFeedbackCourse}
                  onChange={(e) => setSelectedFeedbackCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {skillCoursesData.map((course) => (
                    <option key={course.id} value={course.id}>{course.courseName}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedFeedbackStatus}
                  onChange={(e) => setSelectedFeedbackStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={clearFeedbackFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFeedbackFilterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {showUpdateProgressModal && selectedProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Update Progress</h2>
                  <p className="text-sm text-gray-500">{selectedProgress.studentName} - {selectedProgress.courseName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUpdateProgressModal(false);
                  setSelectedProgress(null);
                  resetProgressForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleProgressUpdate} className="p-6 space-y-6">
              {/* Completion Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={progressUpdateFormData.completionPercentage}
                  onChange={(e) => handleProgressInputChange("completionPercentage", e.target.value)}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Assessment Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Score
                  </label>
                  <input
                    type="number"
                    value={progressUpdateFormData.assessmentScore}
                    onChange={(e) => handleProgressInputChange("assessmentScore", e.target.value)}
                    placeholder="Score obtained"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Assessment Score
                  </label>
                  <input
                    type="number"
                    value={progressUpdateFormData.maxAssessmentScore}
                    onChange={(e) => handleProgressInputChange("maxAssessmentScore", e.target.value)}
                    placeholder="100"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Attendance Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Percentage
                </label>
                <input
                  type="number"
                  value={progressUpdateFormData.attendancePercentage}
                  onChange={(e) => handleProgressInputChange("attendancePercentage", e.target.value)}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={progressUpdateFormData.status}
                  onChange={(e) => handleProgressInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={progressUpdateFormData.notes}
                  onChange={(e) => handleProgressInputChange("notes", e.target.value)}
                  placeholder="Additional notes about progress..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateProgressModal(false);
                    setSelectedProgress(null);
                    resetProgressForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Update Progress
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Upload className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Bulk Upload Progress</h2>
                  <p className="text-sm text-gray-500">Upload progress data via Excel file</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setBulkUploadFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Choose file
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setBulkUploadFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500">
                      or drag and drop your Excel file here
                    </p>
                  </div>
                  {bulkUploadFile && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Selected: {bulkUploadFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Template Format</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please use the correct template format. Required columns: Student ID, Course ID, Completion %, Assessment Score, Attendance %
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // Generate and download template
                        const templateData = [
                          ["Student ID", "Course ID", "Completion %", "Assessment Score", "Max Score", "Attendance %", "Status"],
                          ["CS2021001", "1", "100", "85", "100", "95", "Completed"],
                          ["CS2021002", "1", "60", "", "100", "80", "In Progress"]
                        ];
                        const csvContent = templateData.map(row => row.join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: "text/csv" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "progress_upload_template.csv";
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="text-sm text-yellow-800 underline hover:text-yellow-900 mt-2"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !bulkUploadFile}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Progress Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Filter Modal */}
      {showProgressFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Filter Progress</h2>
              </div>
              <button
                onClick={() => setShowProgressFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {skillCoursesData.map((course) => (
                    <option key={course.id} value={course.id}>{course.courseName}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDepartmentProgressFilter}
                  onChange={(e) => setSelectedDepartmentProgressFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={clearProgressFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowProgressFilterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Certificate Management</h2>
                  <p className="text-sm text-gray-500">Generate and manage course completion certificates</p>
                </div>
              </div>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Certificate Templates Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {certificateTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                        template.isActive 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{template.templateType}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log("Previewing template:", template.id);
                              alert(`Previewing ${template.name} template`);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => {
                              console.log("Editing template:", template.id);
                              alert(`Editing ${template.name} template`);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificate Generation Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Certificates</h3>
                
                {/* Course Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Course
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select a course</option>
                      {skillCoursesData.filter(course => course.isActive).map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Template
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select template</option>
                      {certificateTemplates.filter(template => template.isActive).map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Eligible Students */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Eligible Students</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {studentProgressData
                      .filter(progress => progress.status === "Completed")
                      .map((progress) => (
                        <label
                          key={progress.id}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {progress.studentName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {progress.rollNumber} • {progress.courseName} • Score: {progress.assessmentScore || 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {progress.completionPercentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              Completed: {progress.completionDate ? new Date(progress.completionDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </label>
                      ))}
                    {studentProgressData.filter(progress => progress.status === "Completed").length === 0 && (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No completed students found</p>
                        <p className="text-sm text-gray-400">Students will appear here once they complete courses</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Series
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CERT-2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Number
                    </label>
                    <input
                      type="number"
                      placeholder="001"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Generation Options */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Generation Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-800">Include grade/score on certificate</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-800">Send email notification to students</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-800">Generate QR code for verification</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-800">Create downloadable PDF</span>
                    </label>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Certificate Preview</h4>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                    <Award className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Certificate of Completion</h3>
                    <p className="text-gray-600 mb-4">This is to certify that</p>
                    <p className="text-2xl font-bold text-blue-600 mb-4">[Student Name]</p>
                    <p className="text-gray-600 mb-2">has successfully completed the course</p>
                    <p className="text-lg font-semibold text-gray-900 mb-4">[Course Name]</p>
                    <div className="flex justify-center gap-8 text-sm text-gray-600">
                      <div>
                        <p>Issue Date</p>
                        <p className="font-medium">[Date]</p>
                      </div>
                      <div>
                        <p>Certificate No.</p>
                        <p className="font-medium">[Number]</p>
                      </div>
                      <div>
                        <p>Grade</p>
                        <p className="font-medium">[Grade]</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      console.log("Previewing certificates");
                      alert("Certificate preview will be generated");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Preview Certificates
                  </button>
                  <button
                    onClick={() => {
                      console.log("Generating certificates");
                      setIsSubmitting(true);
                      setTimeout(() => {
                        setIsSubmitting(false);
                        alert("Certificates generated successfully!");
                        setShowCertificateModal(false);
                      }, 2000);
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4" />
                        Generate Certificates
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Certificates */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Certificates</h3>
                <div className="space-y-3">
                  {certificatesData.slice(0, 5).map((certificate) => (
                    <div
                      key={certificate.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.studentName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {certificate.courseName} • {certificate.certificateNumber}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCertificateStatusBadge(certificate.status)}
                        <button
                          onClick={() => {
                            console.log("Viewing certificate:", certificate.id);
                            alert(`Viewing certificate for ${certificate.studentName}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="View Certificate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {certificate.status === 'Issued' && (
                          <button
                            onClick={() => {
                              console.log("Downloading certificate:", certificate.id);
                              alert(`Downloading certificate for ${certificate.studentName}`);
                            }}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Download Certificate"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {('studentName' in selectedFeedback) ? 'Student Feedback Details' : 'Trainer Feedback Details'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {('studentName' in selectedFeedback) 
                      ? `${selectedFeedback.studentName} - ${selectedFeedback.courseName}`
                      : `${selectedFeedback.trainerName} - ${selectedFeedback.courseName}`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Feedback Details */}
              {('studentName' in selectedFeedback) && (
                <>
                  {/* Student Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Student Name</label>
                        <p className="text-blue-800 font-medium">{selectedFeedback.studentName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Roll Number</label>
                        <p className="text-blue-800">{selectedFeedback.rollNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Course</label>
                        <p className="text-blue-800">{selectedFeedback.courseName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ratings Grid */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                          {selectedFeedback.overallRating > 0 ? (
                            renderStarRating(selectedFeedback.overallRating, 'md')
                          ) : (
                            <span className="text-gray-500">Not rated</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Content Quality</label>
                          {selectedFeedback.contentQuality > 0 ? (
                            renderStarRating(selectedFeedback.contentQuality, 'md')
                          ) : (
                            <span className="text-gray-500">Not rated</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Instructor Rating</label>
                          {selectedFeedback.instructorRating > 0 ? (
                            renderStarRating(selectedFeedback.instructorRating, 'md')
                          ) : (
                            <span className="text-gray-500">Not rated</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                          {selectedFeedback.difficultyLevel > 0 ? (
                            <div className="flex items-center gap-2">
                              {renderStarRating(selectedFeedback.difficultyLevel, 'md')}
                              <span className="text-sm text-gray-600">
                                ({selectedFeedback.difficultyLevel === 1 ? 'Very Easy' : 
                                  selectedFeedback.difficultyLevel === 2 ? 'Easy' :
                                  selectedFeedback.difficultyLevel === 3 ? 'Moderate' :
                                  selectedFeedback.difficultyLevel === 4 ? 'Difficult' : 'Very Difficult'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not rated</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
                          {selectedFeedback.recommendationScore > 0 ? (
                            <div className="flex items-center gap-2">
                              {renderStarRating(selectedFeedback.recommendationScore, 'md')}
                              <span className="text-sm text-gray-600">
                                ({selectedFeedback.recommendationScore >= 4 ? 'Recommended' : 
                                  selectedFeedback.recommendationScore === 3 ? 'Neutral' : 'Not Recommended'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not rated</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          {getFeedbackStatusBadge(selectedFeedback.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments and Suggestions */}
                  <div className="space-y-4">
                    {selectedFeedback.comments && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-900">{selectedFeedback.comments}</p>
                        </div>
                      </div>
                    )}
                    {selectedFeedback.suggestions && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Suggestions for Improvement</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-900">{selectedFeedback.suggestions}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Submitted At</label>
                        <p className="text-gray-900">
                          {selectedFeedback.submittedAt ? new Date(selectedFeedback.submittedAt).toLocaleString() : 'Not submitted yet'}
                        </p>
                      </div>
                      {selectedFeedback.status === 'Submitted' && (
                        <button
                          onClick={() => {
                            console.log("Marking feedback as reviewed:", selectedFeedback.id);
                            alert("Feedback marked as reviewed!");
                            setSelectedFeedback(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Reviewed
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Trainer Feedback Details */}
              {('trainerName' in selectedFeedback) && (
                <>
                  {/* Trainer Info */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-1">Trainer Name</label>
                        <p className="text-purple-800 font-medium">{selectedFeedback.trainerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-1">Trainer ID</label>
                        <p className="text-purple-800">{selectedFeedback.trainerId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-1">Batch ID</label>
                        <p className="text-purple-800">{selectedFeedback.batchId}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-purple-900 mb-1">Course</label>
                      <p className="text-purple-800">{selectedFeedback.courseName}</p>
                    </div>
                  </div>

                  {/* Trainer Ratings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Student Engagement</label>
                          {renderStarRating(selectedFeedback.studentEngagement, 'md')}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Content Delivery</label>
                          {renderStarRating(selectedFeedback.contentDelivery, 'md')}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Learning Outcomes</label>
                          {renderStarRating(selectedFeedback.learningOutcomes, 'md')}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Satisfaction</label>
                          {renderStarRating(selectedFeedback.overallSatisfaction, 'md')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trainer Comments */}
                  <div className="space-y-4">
                    {selectedFeedback.challenges && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Challenges Faced</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-900">{selectedFeedback.challenges}</p>
                        </div>
                      </div>
                    )}
                    {selectedFeedback.improvements && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Suggestions for Improvement</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-900">{selectedFeedback.improvements}</p>
                        </div>
                      </div>
                    )}
                    {selectedFeedback.studentPerformance && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Student Performance Assessment</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-900">{selectedFeedback.studentPerformance}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Submitted At</label>
                        <p className="text-gray-900">
                          {selectedFeedback.submittedAt ? new Date(selectedFeedback.submittedAt).toLocaleString() : 'Not submitted yet'}
                        </p>
                      </div>
                      {selectedFeedback.status === 'Submitted' && (
                        <button
                          onClick={() => {
                            console.log("Marking trainer feedback as reviewed:", selectedFeedback.id);
                            alert("Trainer feedback marked as reviewed!");
                            setSelectedFeedback(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Reviewed
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Filter Courses</h2>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Provider Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Providers</option>
                  {providerOptions.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certification Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certification Type</label>
                <select
                  value={selectedCertificationType}
                  onChange={(e) => setSelectedCertificationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Completion">Completion</option>
                  <option value="Assessment-based">Assessment-based</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillDevelopment;
