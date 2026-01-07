import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  Download,
  UserCheck,
  Clock,
  CheckCircle,
  X,
  Edit,
  User,
  GraduationCap,
  Award,
} from "lucide-react";
import toast from 'react-hot-toast';

interface EligibleStudent {
  id: string;
  name: string;
  email: string;
  department: string;
  cgpa: number;
  graduation_year: string;
  backlogs: number;
  skills: string[];
  status: 'eligible' | 'applied' | 'shortlisted' | 'selected' | 'rejected';
  application_stage: string;
  job_title?: string;
  company_name?: string;
}

const ApplicationTracking: React.FC = () => {
  const [applicationSearchTerm, setApplicationSearchTerm] = useState("");
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState("");
  const [showApplicationFilterModal, setShowApplicationFilterModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [showUpdateStageModal, setShowUpdateStageModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EligibleStudent | null>(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [newApplicationStage, setNewApplicationStage] = useState("");
  const [newApplicationStatus, setNewApplicationStatus] = useState("");

  // Static data for eligible students with enhanced application tracking
  const eligibleStudentsData: EligibleStudent[] = [
    {
      id: "CS2021001",
      name: "Rahul Sharma",
      email: "rahul.sharma@college.edu",
      department: "Computer Science",
      cgpa: 8.5,
      graduation_year: "2024",
      backlogs: 0,
      skills: ["JavaScript", "React", "Node.js", "Python"],
      status: "shortlisted",
      application_stage: "Aptitude Test - Passed",
      job_title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions"
    },
    {
      id: "CS2021002",
      name: "Priya Patel",
      email: "priya.patel@college.edu",
      department: "Computer Science",
      cgpa: 7.8,
      graduation_year: "2024",
      backlogs: 1,
      skills: ["Java", "Spring", "MySQL", "React"],
      status: "applied",
      application_stage: "Technical Interview - Scheduled",
      job_title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions"
    },
    {
      id: "IT2021001",
      name: "Amit Kumar",
      email: "amit.kumar@college.edu",
      department: "Information Technology",
      cgpa: 8.2,
      graduation_year: "2024",
      backlogs: 0,
      skills: ["JavaScript", "Angular", "Node.js", "MongoDB"],
      status: "shortlisted",
      application_stage: "HR Interview - Pending",
      job_title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions"
    },
    {
      id: "CS2021003",
      name: "Sneha Reddy",
      email: "sneha.reddy@college.edu",
      department: "Computer Science",
      cgpa: 9.1,
      graduation_year: "2024",
      backlogs: 0,
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      status: "selected",
      application_stage: "Final Selection - Offer Extended",
      job_title: "Data Analyst",
      company_name: "HealthPlus Medical"
    },
    {
      id: "IT2021002",
      name: "Vikram Singh",
      email: "vikram.singh@college.edu",
      department: "Information Technology",
      cgpa: 6.8,
      graduation_year: "2024",
      backlogs: 3,
      skills: ["HTML", "CSS", "JavaScript"],
      status: "rejected",
      application_stage: "Not Eligible - CGPA Below Minimum",
      job_title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions"
    },
    {
      id: "CS2021004",
      name: "Ananya Gupta",
      email: "ananya.gupta@college.edu",
      department: "Computer Science",
      cgpa: 8.7,
      graduation_year: "2024",
      backlogs: 0,
      skills: ["Python", "Django", "PostgreSQL", "Docker"],
      status: "applied",
      application_stage: "Application Under Review",
      job_title: "Data Analyst",
      company_name: "HealthPlus Medical"
    },
    {
      id: "IT2021003",
      name: "Karthik Nair",
      email: "karthik.nair@college.edu",
      department: "Information Technology",
      cgpa: 7.9,
      graduation_year: "2024",
      backlogs: 1,
      skills: ["Java", "Spring Boot", "MySQL", "Microservices"],
      status: "shortlisted",
      application_stage: "Aptitude Test - Completed",
      job_title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions"
    },
    {
      id: "CS2021005",
      name: "Meera Joshi",
      email: "meera.joshi@college.edu",
      department: "Computer Science",
      cgpa: 8.3,
      graduation_year: "2024",
      backlogs: 0,
      skills: ["React", "Node.js", "GraphQL", "MongoDB"],
      status: "eligible",
      application_stage: "Eligible - Not Applied",
      job_title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions"
    },
    {
      id: "MATH2021001",
      name: "Arjun Mehta",
      email: "arjun.mehta@college.edu",
      department: "Mathematics",
      cgpa: 8.1,
      graduation_year: "2024",
      backlogs: 0,
      skills: ["Python", "R", "Statistics", "Machine Learning"],
      status: "applied",
      application_stage: "Online Assessment - Scheduled",
      job_title: "Data Analyst",
      company_name: "HealthPlus Medical"
    },
    {
      id: "MKT2021001",
      name: "Riya Sharma",
      email: "riya.sharma@college.edu",
      department: "Management",
      cgpa: 7.6,
      graduation_year: "2024",
      backlogs: 2,
      skills: ["Digital Marketing", "Content Writing", "SEO", "Analytics"],
      status: "shortlisted",
      application_stage: "Portfolio Review - Passed",
      job_title: "Marketing Intern",
      company_name: "EduTech Learning"
    }
  ];

  // Available jobs data
  const jobPostingsData = [
    {
      id: "1",
      title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions",
      department: "Engineering",
      employment_type: "Full-time",
      location: "Bangalore, Karnataka",
      mode: "Hybrid",
      salary_range: "₹8.0L - ₹12.0L",
      experience_required: "2-4 years",
      description: "We are looking for a talented Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.",
      skills_required: ["React", "Node.js", "MongoDB", "TypeScript"],
      requirements: ["Bachelor's degree in Computer Science", "2+ years of experience", "Strong problem-solving skills"],
      responsibilities: ["Develop web applications", "Collaborate with team", "Write clean code"],
      benefits: ["Health Insurance", "Flexible Hours", "Learning Budget"],
      deadline: "2024-04-15",
      intake_count: 15,
      eligibility_criteria: {
        min_cgpa: 7.0,
        eligible_departments: ["Computer Science", "Information Technology"],
        required_skills: ["JavaScript", "React", "Node.js"],
        max_backlogs: 2,
        graduation_year: ["2024", "2025"]
      },
      rounds_schedule: [
        {
          round_name: "Aptitude Test",
          date: "2024-04-20",
          time: "10:00",
          duration: "90 minutes",
          location: "Online",
          instructions: "Logical reasoning and quantitative aptitude test"
        },
        {
          round_name: "Technical Interview",
          date: "2024-04-22",
          time: "14:00",
          duration: "60 minutes",
          location: "Campus - Room 101",
          instructions: "Coding and system design discussion"
        },
        {
          round_name: "HR Interview",
          date: "2024-04-24",
          time: "11:00",
          duration: "30 minutes",
          location: "Campus - Room 102",
          instructions: "Final interview with HR team"
        }
      ]
    },
    {
      id: "2",
      title: "Data Analyst",
      company_name: "HealthPlus Medical",
      department: "Analytics",
      employment_type: "Full-time",
      location: "Mumbai, Maharashtra",
      mode: "On-site",
      salary_range: "₹6.0L - ₹9.0L",
      experience_required: "1-3 years",
      description: "Join our data team to analyze healthcare trends and improve patient outcomes through data-driven insights.",
      skills_required: ["Python", "SQL", "Tableau", "Excel"],
      requirements: ["Bachelor's in Statistics/Math", "SQL proficiency", "Analytical mindset"],
      responsibilities: ["Analyze data trends", "Create reports", "Present insights"],
      benefits: ["Medical Coverage", "Performance Bonus", "Training Programs"],
      deadline: "2024-04-20",
      intake_count: 8,
      eligibility_criteria: {
        min_cgpa: 6.5,
        eligible_departments: ["Computer Science", "Mathematics", "Statistics"],
        required_skills: ["Python", "SQL"],
        max_backlogs: 1,
        graduation_year: ["2024", "2025"]
      },
      rounds_schedule: [
        {
          round_name: "Online Assessment",
          date: "2024-04-25",
          time: "09:00",
          duration: "120 minutes",
          location: "Online",
          instructions: "Data analysis and SQL test"
        },
        {
          round_name: "Technical Interview",
          date: "2024-04-27",
          time: "15:00",
          duration: "45 minutes",
          location: "Campus - Room 201",
          instructions: "Python and data visualization discussion"
        }
      ]
    },
    {
      id: "3",
      title: "Marketing Intern",
      company_name: "EduTech Learning",
      department: "Marketing",
      employment_type: "Internship",
      location: "Pune, Maharashtra",
      mode: "Remote",
      salary_range: "₹15K - ₹25K",
      experience_required: "0-1 years",
      description: "Great opportunity for students to gain hands-on marketing experience in the EdTech industry.",
      skills_required: ["Digital Marketing", "Content Writing", "Social Media"],
      requirements: ["Currently pursuing degree", "Good communication skills", "Creative thinking"],
      responsibilities: ["Content creation", "Social media management", "Campaign support"],
      benefits: ["Mentorship", "Certificate", "Flexible Schedule"],
      deadline: "2024-04-10",
      intake_count: 5,
      eligibility_criteria: {
        min_cgpa: 6.0,
        eligible_departments: ["Management", "Marketing", "Communications"],
        required_skills: ["Communication", "Creativity"],
        max_backlogs: 3,
        graduation_year: ["2024", "2025", "2026"]
      },
      rounds_schedule: [
        {
          round_name: "Portfolio Review",
          date: "2024-04-12",
          time: "11:00",
          duration: "30 minutes",
          location: "Online",
          instructions: "Present your marketing portfolio and creative work"
        },
        {
          round_name: "Interview",
          date: "2024-04-14",
          time: "14:00",
          duration: "30 minutes",
          location: "Online",
          instructions: "Discussion about marketing interests and goals"
        }
      ]
    }
  ];

  // Initialize selectedJobDetails with first job for details viewing
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(jobPostingsData[0]);

  // Filter applications - show all students
  const filteredApplications = eligibleStudentsData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                         student.department.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                         (student.job_title && student.job_title.toLowerCase().includes(applicationSearchTerm.toLowerCase()));
    
    const matchesStatus = !selectedApplicationStatus || student.status === selectedApplicationStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'eligible':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Eligible</span>;
      case 'applied':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Applied</span>;
      case 'shortlisted':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Shortlisted</span>;
      case 'selected':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Selected</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const updateStudentStage = (student: EligibleStudent) => {
    setSelectedStudent(student);
    setNewApplicationStage(student.application_stage);
    setNewApplicationStatus(student.status);
    setShowUpdateStageModal(true);
  };

  const viewStudentDetails = (student: EligibleStudent) => {
    setSelectedStudent(student);
    setShowStudentDetailsModal(true);
  };

  const viewJobDetails = () => {
    setShowJobDetailsModal(true);
  };

  const handleStageUpdate = () => {
    if (selectedStudent && newApplicationStage && newApplicationStatus) {
      toast.success(`${selectedStudent.name}'s application updated successfully!`);
      setShowUpdateStageModal(false);
      setSelectedStudent(null);
      setNewApplicationStage("");
      setNewApplicationStatus("");
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const exportApplications = () => {
    // Create CSV content
    const headers = ['Student ID', 'Name', 'Email', 'Department', 'CGPA', 'Graduation Year', 'Backlogs', 'Skills', 'Status', 'Application Stage'];
    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(student => [
        student.id,
        `"${student.name}"`,
        student.email,
        `"${student.department}"`,
        student.cgpa,
        student.graduation_year,
        student.backlogs,
        `"${student.skills.join('; ')}"`,
        student.status,
        `"${student.application_stage}"`
      ].join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `all_student_applications.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Applications exported successfully");
  };

  const exportJobDetails = () => {
    // Create JSON content with job details and application summary
    const exportData = {
      job_details: selectedJobDetails,
      application_summary: {
        total_applications: filteredApplications.length,
        eligible: filteredApplications.filter(s => s.status === 'eligible').length,
        applied: filteredApplications.filter(s => s.status === 'applied').length,
        shortlisted: filteredApplications.filter(s => s.status === 'shortlisted').length,
        selected: filteredApplications.filter(s => s.status === 'selected').length,
        rejected: filteredApplications.filter(s => s.status === 'rejected').length
      },
      export_timestamp: new Date().toISOString()
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedJobDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_job_details.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Job details exported successfully");
  };

  const clearApplicationFilters = () => {
    setSelectedApplicationStatus("");
    setShowApplicationFilterModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Application Tracking</h2>
        <div className="flex gap-2">
          <button 
            onClick={viewJobDetails}
            className="flex items-center gap-2 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
          >
            <Eye className="h-4 w-4" />
            View Job Details
          </button>
          <button 
            onClick={exportApplications}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            Export Applications
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">Track application stages, update student status, and manage recruitment rounds for all students.</p>

      {/* Current Job Selection Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">All Student Applications</h3>
              <p className="text-sm text-blue-700">Viewing applications across all job postings</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-900">{filteredApplications.length} Total Applications</p>
            <p className="text-sm text-blue-700">Multiple Job Postings</p>
          </div>
        </div>
      </div>

      {/* Enhanced Pipeline Status Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {filteredApplications.filter(s => s.status === 'eligible').length}
          </div>
          <div className="text-sm font-medium text-blue-800">Eligible</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredApplications.filter(s => s.status === 'applied').length}
          </div>
          <div className="text-sm font-medium text-yellow-800">Applied</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
            <UserCheck className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {filteredApplications.filter(s => s.status === 'shortlisted').length}
          </div>
          <div className="text-sm font-medium text-purple-800">Shortlisted</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {filteredApplications.filter(s => s.status === 'selected').length}
          </div>
          <div className="text-sm font-medium text-green-800">Selected</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {filteredApplications.filter(s => s.status === 'rejected').length}
          </div>
          <div className="text-sm font-medium text-red-800">Rejected</div>
        </div>
      </div>
      
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={applicationSearchTerm}
            onChange={(e) => setApplicationSearchTerm(e.target.value)}
            placeholder="Search applications by student name, email, or job title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setShowApplicationFilterModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Filter className="h-4 w-4" />
          Filter
          {selectedApplicationStatus && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              1
            </span>
          )}
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application Stage
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
              {filteredApplications.length > 0 ? (
                filteredApplications.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          <div className="text-sm text-gray-500">{student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.department}</div>
                      <div className="text-sm text-gray-500">CGPA: {student.cgpa}</div>
                      <div className="text-sm text-gray-500">
                        Backlogs: {student.backlogs} • Grad: {student.graduation_year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.job_title || "N/A"}</div>
                      <div className="text-sm text-gray-500">{student.company_name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.application_stage}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => viewStudentDetails(student)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Student Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => updateStudentStage(student)}
                          className="text-green-600 hover:text-green-900"
                          title="Update Application Stage"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No applications found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {applicationSearchTerm || selectedApplicationStatus
                          ? "Try adjusting your search or filters"
                          : "No student applications found in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applications Results Summary */}
      {filteredApplications.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredApplications.length} of {eligibleStudentsData.length} applications
          </div>
          <div className="flex items-center gap-4">
            <span>Eligible: {filteredApplications.filter(s => s.status === 'eligible').length}</span>
            <span>Applied: {filteredApplications.filter(s => s.status === 'applied').length}</span>
            <span>Shortlisted: {filteredApplications.filter(s => s.status === 'shortlisted').length}</span>
            <span>Selected: {filteredApplications.filter(s => s.status === 'selected').length}</span>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showApplicationFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Applications</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
                <select
                  value={selectedApplicationStatus}
                  onChange={(e) => setSelectedApplicationStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="eligible">Eligible</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={clearApplicationFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowApplicationFilterModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Status</h2>
                  <p className="text-sm text-gray-600">Current stage in recruitment process</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {getStatusBadge(selectedStudent.status)}
                </div>
                <button
                  onClick={() => setShowStudentDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedStudent.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student ID:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Address:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Graduation Year:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.graduation_year}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Personal Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Student ID</p>
                      <p className="font-medium text-gray-900">{selectedStudent.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900">{selectedStudent.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Academic Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium text-gray-900">{selectedStudent.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CGPA</p>
                      <p className="font-medium text-gray-900">{selectedStudent.cgpa}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Graduation Year</p>
                      <p className="font-medium text-gray-900">{selectedStudent.graduation_year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Backlogs</p>
                      <p className="font-medium text-gray-900">{selectedStudent.backlogs}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Competencies */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Skills & Competencies</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Application Progress */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">Application Progress</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Current Stage:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.application_stage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Job Applied:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.job_title || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company:</p>
                    <p className="font-medium text-gray-900">{selectedStudent.company_name || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowStudentDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStudentDetailsModal(false);
                  updateStudentStage(selectedStudent);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="h-4 w-4" />
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Application Stage Modal */}
      {showUpdateStageModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Update Application Stage</h2>
                  <p className="text-sm text-gray-600">{selectedStudent.name} • {selectedStudent.department}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateStageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Stage: <span className="font-medium">{selectedStudent.application_stage}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Application Stage</label>
                <select
                  value={newApplicationStage}
                  onChange={(e) => setNewApplicationStage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Stage</option>
                  <option value="Application Submitted">Application Submitted</option>
                  <option value="Eligibility Screening - Passed">Eligibility Screening - Passed</option>
                  <option value="Aptitude Test - Scheduled">Aptitude Test - Scheduled</option>
                  <option value="Aptitude Test - Passed">Aptitude Test - Passed</option>
                  <option value="Technical Interview - Scheduled">Technical Interview - Scheduled</option>
                  <option value="Technical Interview - Passed">Technical Interview - Passed</option>
                  <option value="HR Interview - Scheduled">HR Interview - Scheduled</option>
                  <option value="HR Interview - Passed">HR Interview - Passed</option>
                  <option value="Final Selection - Offer Extended">Final Selection - Offer Extended</option>
                  <option value="Not Eligible - CGPA Below Minimum">Not Eligible - CGPA Below Minimum</option>
                  <option value="Rejected - Failed Assessment">Rejected - Failed Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <select
                  value={newApplicationStatus}
                  onChange={(e) => setNewApplicationStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  <option value="eligible">Eligible</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowUpdateStageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStageUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <UserCheck className="h-4 w-4" />
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJobDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Details & Rounds</h2>
                  <p className="text-sm text-gray-600">View job posting details and recruitment rounds</p>
                </div>
              </div>
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Job Selection Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Job Posting</label>
                <select
                  value={selectedJobDetails.id}
                  onChange={(e) => {
                    const job = jobPostingsData.find(j => j.id === e.target.value);
                    if (job) setSelectedJobDetails(job);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {jobPostingsData.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedJobDetails.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Company:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mode:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.mode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salary:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.salary_range}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Intake:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.intake_count} positions</p>
                  </div>
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Min CGPA:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.eligibility_criteria.min_cgpa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Backlogs:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.eligibility_criteria.max_backlogs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Eligible Departments:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.eligibility_criteria.eligible_departments.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Graduation Years:</p>
                    <p className="font-medium text-gray-900">{selectedJobDetails.eligibility_criteria.graduation_year.join(', ')}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobDetails.eligibility_criteria.required_skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recruitment Rounds Schedule */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Rounds Schedule</h4>
                <div className="space-y-4">
                  {selectedJobDetails.rounds_schedule.map((round: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">{round.round_name}</h5>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          round.round_name.toLowerCase().includes('aptitude') ? 'bg-purple-100 text-purple-800' :
                          round.round_name.toLowerCase().includes('technical') ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {round.round_name.toLowerCase().includes('aptitude') ? 'aptitude' :
                           round.round_name.toLowerCase().includes('technical') ? 'technical' : 'interview'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Date:</p>
                          <p className="font-medium text-gray-900">{round.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time:</p>
                          <p className="font-medium text-gray-900">{round.time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration:</p>
                          <p className="font-medium text-gray-900">{round.duration}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location:</p>
                          <p className="font-medium text-gray-900">{round.location}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">Instructions:</p>
                        <p className="font-medium text-gray-900">{round.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  exportJobDetails();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="h-4 w-4" />
                Export Job Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracking;