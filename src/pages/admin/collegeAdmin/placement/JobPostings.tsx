import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  UserCheck,
  Download,
  X,
  Calendar,
  Clock,
  DollarSign,
  Building,
  FileText,
  CheckCircle,
  Trash2,
} from "lucide-react";
import toast from 'react-hot-toast';

interface JobPosting {
  id: string;
  title: string;
  company_name: string;
  job_title: string;
  employment_type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  location: string;
  mode: 'Remote' | 'On-site' | 'Hybrid';
  salary_range_min: number;
  salary_range_max: number;
  experience_required: string;
  skills_required: string[];
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  deadline: string;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  applications_count: number;
  views_count: number;
  created_at: string;
  recruiter_id: string;
  department: string;
  eligibility_criteria: {
    min_cgpa: number;
    eligible_departments: string[];
    required_skills: string[];
    max_backlogs: number;
    graduation_year: string[];
  };
  rounds_schedule: {
    round_name: string;
    round_type: 'aptitude' | 'technical' | 'hr' | 'group_discussion' | 'presentation';
    date: string;
    time: string;
    duration_minutes: number;
    location: string;
    instructions: string;
  }[];
  intake_count: number;
  placement_window: {
    start_date: string;
    end_date: string;
  };
  eligible_students_count: number;
  shortlisted_students: string[];
}

interface JobFormData {
  job_title: string;
  company_name: string;
  department: string;
  employment_type: string;
  work_mode: string;
  location: string;
  min_salary: string;
  max_salary: string;
  experience_required: string;
  job_description: string;
  required_skills: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  application_deadline: string;
  intake_count: string;
  min_cgpa: string;
  max_backlogs: string;
  eligible_departments: string[];
  required_skills_eligibility: string;
  graduation_years: string[];
  window_start_date: string;
  window_end_date: string;
  rounds: {
    round_name: string;
    round_type: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    instructions: string;
  }[];
}

const JobPostings: React.FC = () => {
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [selectedJobStatus, setSelectedJobStatus] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedJobMode, setSelectedJobMode] = useState("");
  const [showJobFilterModal, setShowJobFilterModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  // Form data state
  const [formData, setFormData] = useState<JobFormData>({
    job_title: '',
    company_name: '',
    department: '',
    employment_type: '',
    work_mode: '',
    location: '',
    min_salary: '',
    max_salary: '',
    experience_required: '',
    job_description: '',
    required_skills: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    application_deadline: '',
    intake_count: '',
    min_cgpa: '',
    max_backlogs: '',
    eligible_departments: [],
    required_skills_eligibility: '',
    graduation_years: [],
    window_start_date: '',
    window_end_date: '',
    rounds: []
  });

  // Available options
  const companies = ['EduTech Learning', 'ManufacturePro Industries', 'TechCorp Solutions', 'HealthPlus Medical', 'FinanceFirst Bank'];
  const employmentTypes = ['Full-time', 'Part-time', 'Internship', 'Contract'];
  const workModes = ['Remote', 'On-site', 'Hybrid'];
  const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'Management', 'Mathematics', 'Statistics'];
  const graduationYears = ['2024', '2025', '2026'];
  const roundTypes = ['Aptitude Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Presentation'];

  // Static data for job postings
  const jobPostingsData: JobPosting[] = [
    {
      id: "1",
      title: "Software Engineer - Full Stack",
      company_name: "TechCorp Solutions",
      job_title: "Software Engineer",
      employment_type: "Full-time",
      location: "Bangalore, Karnataka",
      mode: "Hybrid",
      salary_range_min: 800000,
      salary_range_max: 1200000,
      experience_required: "2-4 years",
      skills_required: ["React", "Node.js", "MongoDB", "TypeScript"],
      description: "We are looking for a talented Full Stack Developer to join our growing team...",
      requirements: ["Bachelor's degree in Computer Science", "2+ years of experience", "Strong problem-solving skills"],
      responsibilities: ["Develop web applications", "Collaborate with team", "Write clean code"],
      benefits: ["Health Insurance", "Flexible Hours", "Learning Budget"],
      deadline: "2024-04-15",
      status: "active",
      applications_count: 45,
      views_count: 234,
      created_at: "2024-03-01",
      recruiter_id: "1",
      department: "Engineering",
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
          round_type: "aptitude",
          date: "2024-04-20",
          time: "10:00",
          duration_minutes: 90,
          location: "Online",
          instructions: "Logical reasoning and quantitative aptitude test"
        },
        {
          round_name: "Technical Interview",
          round_type: "technical",
          date: "2024-04-22",
          time: "14:00",
          duration_minutes: 60,
          location: "Campus - Room 101",
          instructions: "Coding and system design discussion"
        },
        {
          round_name: "HR Interview",
          round_type: "hr",
          date: "2024-04-24",
          time: "11:00",
          duration_minutes: 30,
          location: "Campus - Room 102",
          instructions: "Final interview with HR team"
        }
      ],
      intake_count: 15,
      placement_window: {
        start_date: "2024-04-01",
        end_date: "2024-05-31"
      },
      eligible_students_count: 89,
      shortlisted_students: ["CS2021001", "CS2021002", "IT2021001"]
    },
    {
      id: "2",
      title: "Data Analyst",
      company_name: "HealthPlus Medical",
      job_title: "Data Analyst",
      employment_type: "Full-time",
      location: "Mumbai, Maharashtra",
      mode: "On-site",
      salary_range_min: 600000,
      salary_range_max: 900000,
      experience_required: "1-3 years",
      skills_required: ["Python", "SQL", "Tableau", "Excel"],
      description: "Join our data team to analyze healthcare trends and improve patient outcomes...",
      requirements: ["Bachelor's in Statistics/Math", "SQL proficiency", "Analytical mindset"],
      responsibilities: ["Analyze data trends", "Create reports", "Present insights"],
      benefits: ["Medical Coverage", "Performance Bonus", "Training Programs"],
      deadline: "2024-04-20",
      status: "active",
      applications_count: 28,
      views_count: 156,
      created_at: "2024-03-05",
      recruiter_id: "2",
      department: "Analytics",
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
          round_type: "aptitude",
          date: "2024-04-25",
          time: "09:00",
          duration_minutes: 120,
          location: "Online",
          instructions: "Data analysis and SQL test"
        },
        {
          round_name: "Technical Interview",
          round_type: "technical",
          date: "2024-04-27",
          time: "15:00",
          duration_minutes: 45,
          location: "Campus - Room 201",
          instructions: "Python and data visualization discussion"
        }
      ],
      intake_count: 8,
      placement_window: {
        start_date: "2024-04-15",
        end_date: "2024-06-15"
      },
      eligible_students_count: 34,
      shortlisted_students: ["CS2021003", "MATH2021001"]
    },
    {
      id: "3",
      title: "Marketing Intern",
      company_name: "EduTech Learning",
      job_title: "Marketing Intern",
      employment_type: "Internship",
      location: "Pune, Maharashtra",
      mode: "Remote",
      salary_range_min: 15000,
      salary_range_max: 25000,
      experience_required: "0-1 years",
      skills_required: ["Digital Marketing", "Content Writing", "Social Media"],
      description: "Great opportunity for students to gain hands-on marketing experience...",
      requirements: ["Currently pursuing degree", "Good communication skills", "Creative thinking"],
      responsibilities: ["Content creation", "Social media management", "Campaign support"],
      benefits: ["Mentorship", "Certificate", "Flexible Schedule"],
      deadline: "2024-04-10",
      status: "active",
      applications_count: 67,
      views_count: 289,
      created_at: "2024-02-28",
      recruiter_id: "4",
      department: "Marketing",
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
          round_type: "presentation",
          date: "2024-04-12",
          time: "11:00",
          duration_minutes: 30,
          location: "Online",
          instructions: "Present your marketing portfolio and creative work"
        },
        {
          round_name: "Interview",
          round_type: "hr",
          date: "2024-04-14",
          time: "14:00",
          duration_minutes: 30,
          location: "Online",
          instructions: "Discussion about marketing interests and goals"
        }
      ],
      intake_count: 5,
      placement_window: {
        start_date: "2024-04-01",
        end_date: "2024-05-01"
      },
      eligible_students_count: 78,
      shortlisted_students: ["MKT2021001", "COMM2021001", "MBA2021002"]
    },
    {
      id: "4",
      title: "Financial Analyst",
      company_name: "FinanceFirst Bank",
      job_title: "Financial Analyst",
      employment_type: "Full-time",
      location: "Delhi, Delhi",
      mode: "On-site",
      salary_range_min: 700000,
      salary_range_max: 1000000,
      experience_required: "2-5 years",
      skills_required: ["Financial Modeling", "Excel", "Bloomberg", "Risk Analysis"],
      description: "Seeking a detail-oriented Financial Analyst to join our investment team...",
      requirements: ["Finance/Economics degree", "CFA preferred", "Strong analytical skills"],
      responsibilities: ["Financial modeling", "Risk assessment", "Investment research"],
      benefits: ["Competitive Salary", "Bonus Structure", "Career Growth"],
      deadline: "2024-04-25",
      status: "draft",
      applications_count: 0,
      views_count: 45,
      created_at: "2024-03-10",
      recruiter_id: "3",
      department: "Finance",
      eligibility_criteria: {
        min_cgpa: 7.5,
        eligible_departments: ["Finance", "Economics", "Management"],
        required_skills: ["Excel", "Financial Analysis"],
        max_backlogs: 0,
        graduation_year: ["2024"]
      },
      rounds_schedule: [
        {
          round_name: "Aptitude Test",
          round_type: "aptitude",
          date: "2024-04-30",
          time: "10:00",
          duration_minutes: 90,
          location: "Campus - Room 301",
          instructions: "Quantitative and logical reasoning test"
        },
        {
          round_name: "Case Study",
          round_type: "technical",
          date: "2024-05-02",
          time: "14:00",
          duration_minutes: 90,
          location: "Campus - Room 302",
          instructions: "Financial case study analysis and presentation"
        },
        {
          round_name: "Final Interview",
          round_type: "hr",
          date: "2024-05-04",
          time: "11:00",
          duration_minutes: 45,
          location: "Campus - Room 303",
          instructions: "Final interview with senior management"
        }
      ],
      intake_count: 3,
      placement_window: {
        start_date: "2024-04-20",
        end_date: "2024-06-20"
      },
      eligible_students_count: 12,
      shortlisted_students: []
    }
  ];

  // Filter job postings
  const filteredJobPostings = jobPostingsData.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
                         job.company_name.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(jobSearchTerm.toLowerCase());
    
    const matchesStatus = !selectedJobStatus || job.status === selectedJobStatus;
    const matchesEmploymentType = !selectedEmploymentType || job.employment_type === selectedEmploymentType;
    const matchesMode = !selectedJobMode || job.mode === selectedJobMode;
    
    return matchesSearch && matchesStatus && matchesEmploymentType && matchesMode;
  });

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Draft</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Closed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const publishJobPost = (jobId: string) => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (job) {
      toast.success(`Job published successfully! ${job.eligible_students_count} eligible students have been automatically identified.`);
    }
  };

  const exportShortlist = (jobId: string) => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (job) {
      // Create CSV content
      const csvContent = [
        ['Student ID', 'Name', 'Department', 'CGPA', 'Skills', 'Status'].join(','),
        ...job.shortlisted_students.map(studentId => 
          [studentId, 'Student Name', 'Computer Science', '8.5', 'React, Node.js', 'Shortlisted'].join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title.replace(/\s+/g, '_')}_shortlist.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Shortlist exported for ${job.title}`);
    }
  };

  const viewJobDetails = (jobId: string) => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowJobDetailsModal(true);
    }
  };

  const editJob = (jobId: string) => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (job) {
      setEditingJob(job);
      // Populate form with job data
      setFormData({
        job_title: job.job_title,
        company_name: job.company_name,
        department: job.department,
        employment_type: job.employment_type,
        work_mode: job.mode,
        location: job.location,
        min_salary: job.salary_range_min.toString(),
        max_salary: job.salary_range_max.toString(),
        experience_required: job.experience_required,
        job_description: job.description,
        required_skills: job.skills_required.join(', '),
        requirements: job.requirements.join('\n'),
        responsibilities: job.responsibilities.join('\n'),
        benefits: job.benefits.join('\n'),
        application_deadline: job.deadline,
        intake_count: job.intake_count.toString(),
        min_cgpa: job.eligibility_criteria.min_cgpa.toString(),
        max_backlogs: job.eligibility_criteria.max_backlogs.toString(),
        eligible_departments: job.eligibility_criteria.eligible_departments,
        required_skills_eligibility: job.eligibility_criteria.required_skills.join(', '),
        graduation_years: job.eligibility_criteria.graduation_year,
        window_start_date: job.placement_window.start_date,
        window_end_date: job.placement_window.end_date,
        rounds: job.rounds_schedule.map(round => ({
          round_name: round.round_name,
          round_type: round.round_type,
          date: round.date,
          time: round.time,
          duration: round.duration_minutes.toString(),
          location: round.location,
          instructions: round.instructions
        }))
      });
      setShowAddJobModal(true);
    }
  };

  const exportJobDetails = (jobId: string) => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (job) {
      const jobDetails = {
        'Job Title': job.title,
        'Company': job.company_name,
        'Department': job.department,
        'Employment Type': job.employment_type,
        'Work Mode': job.mode,
        'Location': job.location,
        'Salary Range': `₹${(job.salary_range_min / 100000).toFixed(1)}L - ₹${(job.salary_range_max / 100000).toFixed(1)}L`,
        'Experience Required': job.experience_required,
        'Description': job.description,
        'Skills Required': job.skills_required.join(', '),
        'Requirements': job.requirements.join('; '),
        'Responsibilities': job.responsibilities.join('; '),
        'Benefits': job.benefits.join('; '),
        'Application Deadline': job.deadline,
        'Intake Count': job.intake_count,
        'Min CGPA': job.eligibility_criteria.min_cgpa,
        'Max Backlogs': job.eligibility_criteria.max_backlogs,
        'Eligible Departments': job.eligibility_criteria.eligible_departments.join(', '),
        'Required Skills for Eligibility': job.eligibility_criteria.required_skills.join(', '),
        'Graduation Years': job.eligibility_criteria.graduation_year.join(', '),
        'Placement Window': `${job.placement_window.start_date} to ${job.placement_window.end_date}`,
        'Status': job.status,
        'Applications Count': job.applications_count,
        'Views Count': job.views_count,
        'Eligible Students Count': job.eligible_students_count
      };

      const jsonContent = JSON.stringify(jobDetails, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title.replace(/\s+/g, '_')}_details.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Job details exported for ${job.title}`);
    }
  };

  const clearJobFilters = () => {
    setSelectedJobStatus("");
    setSelectedEmploymentType("");
    setSelectedJobMode("");
    setShowJobFilterModal(false);
  };

  // Form handling functions
  const handleInputChange = (field: keyof JobFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDepartmentToggle = (department: string) => {
    setFormData(prev => ({
      ...prev,
      eligible_departments: prev.eligible_departments.includes(department)
        ? prev.eligible_departments.filter(d => d !== department)
        : [...prev.eligible_departments, department]
    }));
  };

  const handleGraduationYearToggle = (year: string) => {
    setFormData(prev => ({
      ...prev,
      graduation_years: prev.graduation_years.includes(year)
        ? prev.graduation_years.filter(y => y !== year)
        : [...prev.graduation_years, year]
    }));
  };

  const addRound = () => {
    setFormData(prev => ({
      ...prev,
      rounds: [...prev.rounds, {
        round_name: '',
        round_type: '',
        date: '',
        time: '',
        duration: '',
        location: '',
        instructions: ''
      }]
    }));
  };

  const removeRound = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.filter((_, i) => i !== index)
    }));
  };

  const updateRound = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.map((round, i) => 
        i === index ? { ...round, [field]: value } : round
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      job_title: '',
      company_name: '',
      department: '',
      employment_type: '',
      work_mode: '',
      location: '',
      min_salary: '',
      max_salary: '',
      experience_required: '',
      job_description: '',
      required_skills: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      application_deadline: '',
      intake_count: '',
      min_cgpa: '',
      max_backlogs: '',
      eligible_departments: [],
      required_skills_eligibility: '',
      graduation_years: [],
      window_start_date: '',
      window_end_date: '',
      rounds: []
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.job_title || !formData.company_name || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.eligible_departments.length === 0) {
      toast.error('Please select at least one eligible department');
      return;
    }

    if (formData.graduation_years.length === 0) {
      toast.error('Please select at least one graduation year');
      return;
    }

    // Success message
    if (editingJob) {
      toast.success('Job posting updated successfully!');
    } else {
      toast.success('Job posting created successfully!');
    }
    
    setShowAddJobModal(false);
    setEditingJob(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Job Posting & Application Tracking</h2>
        <button 
          onClick={() => setShowAddJobModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create Job Posting
        </button>
      </div>
      
      <p className="text-gray-600 mb-4">Manage job roles, eligibility rules, rounds scheduling, student allocation, and application stage updates.</p>
      
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={jobSearchTerm}
            onChange={(e) => setJobSearchTerm(e.target.value)}
            placeholder="Search job postings by title, company, or department..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setShowJobFilterModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Filter className="h-4 w-4" />
          Filter
          {(selectedJobStatus || selectedEmploymentType || selectedJobMode) && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {[selectedJobStatus, selectedEmploymentType, selectedJobMode].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Job Postings Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
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
              {filteredJobPostings.length > 0 ? (
                filteredJobPostings.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.department} • {job.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.company_name}</div>
                      <div className="text-sm text-gray-500">Posted {new Date(job.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.employment_type}</div>
                      <div className="text-sm text-gray-500">{job.mode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₹{(job.salary_range_min / 100000).toFixed(1)}L - ₹{(job.salary_range_max / 100000).toFixed(1)}L
                      </div>
                      <div className="text-sm text-gray-500">{job.experience_required}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{job.applications_count}</div>
                        <div className="text-sm text-gray-500">applications</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="h-3 w-3" />
                        {job.views_count} views
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getJobStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => viewJobDetails(job.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => editJob(job.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Job"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => publishJobPost(job.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Publish & Auto-list Students"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => exportShortlist(job.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Export Shortlist"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings found</h3>
                      <p className="text-gray-500 mb-4">
                        {jobSearchTerm || selectedJobStatus || selectedEmploymentType || selectedJobMode
                          ? "Try adjusting your search or filters"
                          : "Get started by creating your first job posting"}
                      </p>
                      {!(jobSearchTerm || selectedJobStatus || selectedEmploymentType || selectedJobMode) && (
                        <button 
                          onClick={() => setShowAddJobModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Job Posting
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

      {/* Job Results Summary */}
      {filteredJobPostings.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredJobPostings.length} of {jobPostingsData.length} job postings
          </div>
          <div className="flex items-center gap-4">
            <span>Active: {filteredJobPostings.filter(j => j.status === 'active').length}</span>
            <span>Draft: {filteredJobPostings.filter(j => j.status === 'draft').length}</span>
            <span>Closed: {filteredJobPostings.filter(j => j.status === 'closed').length}</span>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showJobFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Job Postings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedJobStatus}
                  onChange={(e) => setSelectedJobStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={selectedEmploymentType}
                  onChange={(e) => setSelectedEmploymentType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                <select
                  value={selectedJobMode}
                  onChange={(e) => setSelectedJobMode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Modes</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={clearJobFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowJobFilterModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Details & Rounds</h2>
                  <p className="text-sm text-gray-600">View job posting details and recruitment rounds</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedJob.id}
                  onChange={(e) => {
                    const job = jobPostingsData.find(j => j.id === e.target.value);
                    if (job) setSelectedJob(job);
                  }}
                >
                  {jobPostingsData.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowJobDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedJob.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Company:</p>
                    <p className="font-medium text-gray-900">{selectedJob.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department:</p>
                    <p className="font-medium text-gray-900">{selectedJob.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location:</p>
                    <p className="font-medium text-gray-900">{selectedJob.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mode:</p>
                    <p className="font-medium text-gray-900">{selectedJob.mode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salary:</p>
                    <p className="font-medium text-gray-900">
                      ₹{(selectedJob.salary_range_min / 100000).toFixed(1)}L - ₹{(selectedJob.salary_range_max / 100000).toFixed(1)}L
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Intake:</p>
                    <p className="font-medium text-gray-900">{selectedJob.intake_count} positions</p>
                  </div>
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Min CGPA:</p>
                    <p className="font-medium text-gray-900">{selectedJob.eligibility_criteria.min_cgpa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Backlogs:</p>
                    <p className="font-medium text-gray-900">{selectedJob.eligibility_criteria.max_backlogs}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Eligible Departments:</p>
                    <p className="font-medium text-gray-900">{selectedJob.eligibility_criteria.eligible_departments.join(', ')}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Required Skills:</p>
                    <p className="font-medium text-gray-900">{selectedJob.eligibility_criteria.required_skills.join(', ')}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Graduation Years:</p>
                    <p className="font-medium text-gray-900">{selectedJob.eligibility_criteria.graduation_year.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Recruitment Rounds Schedule */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Rounds Schedule</h4>
                <div className="space-y-4">
                  {selectedJob.rounds_schedule.map((round, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{round.round_name}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          round.round_type === 'aptitude' ? 'bg-blue-100 text-blue-800' :
                          round.round_type === 'technical' ? 'bg-green-100 text-green-800' :
                          round.round_type === 'hr' ? 'bg-purple-100 text-purple-800' :
                          round.round_type === 'group_discussion' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {round.round_type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Date:</p>
                          <p className="font-medium text-gray-900">{new Date(round.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Time:</p>
                          <p className="font-medium text-gray-900">{round.time}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration:</p>
                          <p className="font-medium text-gray-900">{round.duration_minutes} minutes</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Location:</p>
                          <p className="font-medium text-gray-900">{round.location}</p>
                        </div>
                      </div>
                      {round.instructions && (
                        <div className="mt-3">
                          <p className="text-gray-600 text-sm">Instructions:</p>
                          <p className="text-gray-900 text-sm">{round.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-sm text-gray-600">
                Applications: {selectedJob.applications_count} • Views: {selectedJob.views_count} • Eligible Students: {selectedJob.eligible_students_count}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => exportJobDetails(selectedJob.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Details
                </button>
                <button
                  onClick={() => exportShortlist(selectedJob.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Shortlist
                </button>
                <button
                  onClick={() => publishJobPost(selectedJob.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle className="h-4 w-4" />
                  Publish Job & Auto-list Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Job Posting Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {editingJob ? 'Update job opportunity details' : 'Post a new job opportunity for students'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddJobModal(false);
                    setEditingJob(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Job Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Job Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        placeholder="e.g., Software Engineer"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Company</option>
                        {companies.map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="e.g., Engineering, Marketing"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employment Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.employment_type}
                        onChange={(e) => handleInputChange('employment_type', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Type</option>
                        {employmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.work_mode}
                        onChange={(e) => handleInputChange('work_mode', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Mode</option>
                        {workModes.map(mode => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Bangalore, Karnataka"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Compensation & Experience Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Compensation & Experience</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (₹/year)</label>
                      <input
                        type="number"
                        value={formData.min_salary}
                        onChange={(e) => handleInputChange('min_salary', e.target.value)}
                        placeholder="e.g., 600000"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (₹/year)</label>
                      <input
                        type="number"
                        value={formData.max_salary}
                        onChange={(e) => handleInputChange('max_salary', e.target.value)}
                        placeholder="e.g., 1000000"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience Required</label>
                      <input
                        type="text"
                        value={formData.experience_required}
                        onChange={(e) => handleInputChange('experience_required', e.target.value)}
                        placeholder="e.g., 2-4 years"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.job_description}
                      onChange={(e) => handleInputChange('job_description', e.target.value)}
                      placeholder="Describe the role and what the candidate will be doing..."
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.required_skills}
                      onChange={(e) => handleInputChange('required_skills', e.target.value)}
                      placeholder="e.g., JavaScript, React, Node.js, MongoDB"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="Bachelor's degree in Computer Science&#10;2+ years of experience&#10;Strong problem-solving skills"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (one per line)</label>
                    <textarea
                      value={formData.responsibilities}
                      onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                      placeholder="Develop web applications&#10;Collaborate with team&#10;Write clean code"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
                    <textarea
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="Health Insurance&#10;Flexible Hours&#10;Learning Budget"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.application_deadline}
                        onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intake Count <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.intake_count}
                        onChange={(e) => handleInputChange('intake_count', e.target.value)}
                        placeholder="Number of positions available"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Eligibility Criteria Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Eligibility Criteria (Mandatory)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum CGPA <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.min_cgpa}
                        onChange={(e) => handleInputChange('min_cgpa', e.target.value)}
                        placeholder="e.g., 7.0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Backlogs Allowed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.max_backlogs}
                        onChange={(e) => handleInputChange('max_backlogs', e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eligible Departments <span className="text-red-500">*</span> (Select multiple)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {departments.map(dept => (
                        <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.eligible_departments.includes(dept)}
                            onChange={() => handleDepartmentToggle(dept)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Skills for Eligibility <span className="text-red-500">*</span> (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.required_skills_eligibility}
                      onChange={(e) => handleInputChange('required_skills_eligibility', e.target.value)}
                      placeholder="e.g., JavaScript, Python, Communication"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Years <span className="text-red-500">*</span> (Select multiple)
                    </label>
                    <div className="flex gap-4">
                      {graduationYears.map(year => (
                        <label key={year} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.graduation_years.includes(year)}
                            onChange={() => handleGraduationYearToggle(year)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{year}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Placement Window Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Placement Window</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Window Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.window_start_date}
                        onChange={(e) => handleInputChange('window_start_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Window End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.window_end_date}
                        onChange={(e) => handleInputChange('window_end_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Recruitment Rounds Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-pink-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Recruitment Rounds Schedule</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addRound}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                    >
                      <Plus className="h-4 w-4" />
                      Add Round
                    </button>
                  </div>

                  {formData.rounds.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No rounds added yet. Click "Add Round" to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.rounds.map((round, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">Round {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeRound(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Round Name</label>
                              <input
                                type="text"
                                value={round.round_name}
                                onChange={(e) => updateRound(index, 'round_name', e.target.value)}
                                placeholder="e.g., Aptitude Test"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Round Type</label>
                              <select
                                value={round.round_type}
                                onChange={(e) => updateRound(index, 'round_type', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select Type</option>
                                {roundTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                              <input
                                type="date"
                                value={round.date}
                                onChange={(e) => updateRound(index, 'date', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                              <input
                                type="time"
                                value={round.time}
                                onChange={(e) => updateRound(index, 'time', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                value={round.duration}
                                onChange={(e) => updateRound(index, 'duration', e.target.value)}
                                placeholder="e.g., 90"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                              <input
                                type="text"
                                value={round.location}
                                onChange={(e) => updateRound(index, 'location', e.target.value)}
                                placeholder="e.g., Online, Campus - Room 101"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                            <textarea
                              value={round.instructions}
                              onChange={(e) => updateRound(index, 'instructions', e.target.value)}
                              placeholder="Special instructions for this round..."
                              rows={2}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddJobModal(false);
                    setEditingJob(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <CheckCircle className="h-4 w-4" />
                  {editingJob ? 'Update Job Posting' : 'Create Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostings;