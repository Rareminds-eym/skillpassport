import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  X,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  Edit,
  UserCheck,
  Target,
  Award,
} from "lucide-react";

interface CompanyFormData {
  name: string;
  code: string;
  industry: string;
  companySize: string;
  hqAddress: string;
  hqCity: string;
  hqState: string;
  hqCountry: string;
  hqPincode: string;
  phone: string;
  email: string;
  website: string;
  establishedYear: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  // Enhanced D7.1 fields
  eligibilityTemplate: string;
  mouDocument: File | null;
  jdDocument: File | null;
  companyDescription: string;
  specialRequirements: string;
}

interface Company {
  id: string;
  name: string;
  code: string;
  industry: string;
  companySize: string;
  hqCity: string;
  hqState: string;
  phone: string;
  email: string;
  website: string;
  establishedYear: number;
  contactPersonName: string;
  contactPersonDesignation: string;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'blacklisted';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  // Enhanced D7.1 fields
  eligibilityTemplate: string;
  mouDocument?: string;
  jdDocument?: string;
  companyDescription: string;
  specialRequirements: string;
  lastUpdated: string;
  updatedBy: string;
  history: CompanyHistoryEntry[];
}

interface CompanyHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
}

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
  // Enhanced fields
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
  title: string;
  company_name: string;
  job_title: string;
  employment_type: string;
  location: string;
  mode: string;
  salary_range_min: string;
  salary_range_max: string;
  experience_required: string;
  skills_required: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  deadline: string;
  department: string;
  // Enhanced fields
  min_cgpa: string;
  eligible_departments: string[];
  required_skills_eligibility: string[];
  max_backlogs: string;
  graduation_years: string[];
  intake_count: string;
  placement_window_start: string;
  placement_window_end: string;
  rounds: {
    round_name: string;
    round_type: string;
    date: string;
    time: string;
    duration_minutes: string;
    location: string;
    instructions: string;
  }[];
}

interface PlacementRecord {
  id: string;
  student_name: string;
  student_id: string;
  company_name: string;
  job_title: string;
  department: string;
  employment_type: 'Full-time' | 'Internship';
  salary_offered: number;
  placement_date: string;
  status: 'placed' | 'offer_received' | 'joined';
  location: string;
}

interface DepartmentAnalytics {
  department: string;
  total_students: number;
  placed_students: number;
  placement_rate: number;
  avg_ctc: number;
  median_ctc: number; // D7.3 Enhancement
  highest_ctc: number;
  total_offers: number;
  internships: number;
  full_time: number;
}

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
}

interface ApplicationStage {
  stage_name: string;
  stage_type: 'application' | 'aptitude' | 'technical' | 'hr' | 'final';
  students_count: number;
  completed_count: number;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const PlacementManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("companies");
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showJobFilterModal, setShowJobFilterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedCompanySize, setSelectedCompanySize] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedJobStatus, setSelectedJobStatus] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedJobMode, setSelectedJobMode] = useState("");
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    code: "",
    industry: "",
    companySize: "",
    hqAddress: "",
    hqCity: "",
    hqState: "",
    hqCountry: "India",
    hqPincode: "",
    phone: "",
    email: "",
    website: "",
    establishedYear: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    // Enhanced D7.1 fields
    eligibilityTemplate: "",
    mouDocument: null,
    jdDocument: null,
    companyDescription: "",
    specialRequirements: "",
  });

  const [jobFormData, setJobFormData] = useState<JobFormData>({
    title: "",
    company_name: "",
    job_title: "",
    employment_type: "",
    location: "",
    mode: "",
    salary_range_min: "",
    salary_range_max: "",
    experience_required: "",
    skills_required: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    deadline: "",
    department: "",
    // Enhanced fields
    min_cgpa: "",
    eligible_departments: [],
    required_skills_eligibility: [],
    max_backlogs: "",
    graduation_years: [],
    intake_count: "",
    placement_window_start: "",
    placement_window_end: "",
    rounds: [],
  });

  // Analytics state
  const [selectedAnalyticsDepartment, setSelectedAnalyticsDepartment] = useState("");
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState("2024");
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState("all");
  const [showAnalyticsFilter, setShowAnalyticsFilter] = useState(false);

  // Enhanced job posting state
  const [showEligibleStudents, setShowEligibleStudents] = useState(false);
  const [showApplicationTracker, setShowApplicationTracker] = useState(false);
  const [selectedJobForTracking, setSelectedJobForTracking] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobPosting | null>(null);
  const [showStageUpdateModal, setShowStageUpdateModal] = useState(false);
  const [selectedStudentForUpdate, setSelectedStudentForUpdate] = useState<EligibleStudent | null>(null);
  const [newStage, setNewStage] = useState("");
  const [applicationSearchTerm, setApplicationSearchTerm] = useState("");
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState("");
  const [selectedApplicationJob, setSelectedApplicationJob] = useState("");

  // Enhanced D7.1 Company Registration state
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<Company | null>(null);
  const [showCompanyHistoryModal, setShowCompanyHistoryModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCompanyForAction, setSelectedCompanyForAction] = useState<Company | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'activate' | 'deactivate' | 'blacklist'>('approve');
  const [actionReason, setActionReason] = useState("");

  const tabs = [
    { id: "companies", label: "Company Registration" },
    { id: "jobs", label: "Job Postings" },
    { id: "applications", label: "Application Tracking" },
    { id: "analytics", label: "Placement Analytics" },
  ];

  // Sample data
  const placementStats = [
    { label: "Total Companies", value: "87", icon: Building2, color: "bg-blue-500" },
    { label: "Active Job Postings", value: "34", icon: Briefcase, color: "bg-purple-500" },
    { label: "Students Placed", value: "1,245", icon: Users, color: "bg-green-500" },
    { label: "Placement Rate", value: "87.3%", icon: TrendingUp, color: "bg-orange-500" },
  ];

  const industryOptions = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Consulting", "Automotive", "Telecommunications", "Energy",
    "Real Estate", "Media & Entertainment", "Transportation", "Agriculture", "Other"
  ];

  const companySizeOptions = [
    "1-10 employees", "11-50 employees", "51-200 employees", 
    "201-500 employees", "501-1000 employees", "1000+ employees"
  ];

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
    "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
  ];

  // D7.1 Eligibility Criteria Templates
  const eligibilityTemplates = [
    {
      id: "tech_standard",
      name: "Technology - Standard",
      criteria: "Min CGPA: 7.0, Max Backlogs: 2, Departments: CS/IT/ECE, Skills: Programming Languages"
    },
    {
      id: "tech_premium",
      name: "Technology - Premium",
      criteria: "Min CGPA: 8.0, Max Backlogs: 0, Departments: CS/IT, Skills: Advanced Programming, Data Structures"
    },
    {
      id: "finance_standard",
      name: "Finance - Standard",
      criteria: "Min CGPA: 7.5, Max Backlogs: 1, Departments: Finance/Economics/Management, Skills: Financial Analysis"
    },
    {
      id: "consulting_premium",
      name: "Consulting - Premium",
      criteria: "Min CGPA: 8.5, Max Backlogs: 0, All Departments, Skills: Analytics, Communication, Problem Solving"
    },
    {
      id: "manufacturing_standard",
      name: "Manufacturing - Standard",
      criteria: "Min CGPA: 6.5, Max Backlogs: 3, Departments: Mechanical/Chemical/Industrial, Skills: Technical Knowledge"
    },
    {
      id: "custom",
      name: "Custom Template",
      criteria: "Define your own eligibility criteria"
    }
  ];

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would typically make an API call to save the company
      console.log("Company data to submit:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setFormData({
        name: "",
        code: "",
        industry: "",
        companySize: "",
        hqAddress: "",
        hqCity: "",
        hqState: "",
        hqCountry: "India",
        hqPincode: "",
        phone: "",
        email: "",
        website: "",
        establishedYear: "",
        contactPersonName: "",
        contactPersonDesignation: "",
        contactPersonEmail: "",
        contactPersonPhone: "",
      });
      setShowAddCompanyModal(false);
      
      // Show success message (you can implement toast notification here)
      alert("Company added successfully!");
      
    } catch (error) {
      console.error("Error adding company:", error);
      alert("Error adding company. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddCompanyModal(false);
    setFormData({
      name: "",
      code: "",
      industry: "",
      companySize: "",
      hqAddress: "",
      hqCity: "",
      hqState: "",
      hqCountry: "India",
      hqPincode: "",
      phone: "",
      email: "",
      website: "",
      establishedYear: "",
      contactPersonName: "",
      contactPersonDesignation: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
    });
  };

  // Sample companies data with enhanced D7.1 fields
  const companiesData: Company[] = [
    {
      id: "1",
      name: "TechCorp Solutions",
      code: "TECH001",
      industry: "Technology",
      companySize: "501-1000 employees",
      hqCity: "Bangalore",
      hqState: "Karnataka",
      phone: "+91 80 1234 5678",
      email: "hr@techcorp.com",
      website: "https://www.techcorp.com",
      establishedYear: 2010,
      contactPersonName: "Priya Sharma",
      contactPersonDesignation: "HR Manager",
      accountStatus: "active",
      approvalStatus: "approved",
      createdAt: "2024-01-15",
      eligibilityTemplate: "tech_premium",
      mouDocument: "techcorp_mou_2024.pdf",
      jdDocument: "techcorp_jd_software_engineer.pdf",
      companyDescription: "Leading technology solutions provider specializing in enterprise software development and digital transformation services.",
      specialRequirements: "Strong programming skills, experience with modern frameworks, good communication skills",
      lastUpdated: "2024-03-10",
      updatedBy: "Admin User",
      history: [
        {
          id: "h1",
          action: "Company Approved",
          performedBy: "Admin User",
          timestamp: "2024-01-20T10:30:00Z",
          details: "Company registration approved after document verification",
          previousStatus: "pending",
          newStatus: "approved"
        },
        {
          id: "h2",
          action: "Status Activated",
          performedBy: "Admin User",
          timestamp: "2024-01-22T14:15:00Z",
          details: "Company status activated for placement activities",
          previousStatus: "approved",
          newStatus: "active"
        }
      ]
    },
    {
      id: "2",
      name: "HealthPlus Medical",
      code: "HLTH002",
      industry: "Healthcare",
      companySize: "201-500 employees",
      hqCity: "Mumbai",
      hqState: "Maharashtra",
      phone: "+91 22 9876 5432",
      email: "careers@healthplus.com",
      website: "https://www.healthplus.com",
      establishedYear: 2015,
      contactPersonName: "Dr. Rajesh Kumar",
      contactPersonDesignation: "Recruitment Head",
      accountStatus: "active",
      approvalStatus: "approved",
      createdAt: "2024-02-10",
      eligibilityTemplate: "tech_standard",
      mouDocument: "healthplus_mou_2024.pdf",
      jdDocument: "healthplus_jd_data_analyst.pdf",
      companyDescription: "Healthcare technology company focused on improving patient care through data analytics and digital health solutions.",
      specialRequirements: "Healthcare domain knowledge preferred, analytical skills, attention to detail",
      lastUpdated: "2024-02-15",
      updatedBy: "HR Admin",
      history: [
        {
          id: "h3",
          action: "Company Registered",
          performedBy: "System",
          timestamp: "2024-02-10T09:00:00Z",
          details: "Company registration submitted",
          newStatus: "pending"
        },
        {
          id: "h4",
          action: "Documents Verified",
          performedBy: "Verification Team",
          timestamp: "2024-02-12T11:30:00Z",
          details: "MoU and JD documents verified successfully"
        }
      ]
    },
    {
      id: "3",
      name: "FinanceFirst Bank",
      code: "FIN003",
      industry: "Finance",
      companySize: "1000+ employees",
      hqCity: "Delhi",
      hqState: "Delhi",
      phone: "+91 11 5555 7777",
      email: "recruitment@financefirst.com",
      website: "https://www.financefirst.com",
      establishedYear: 2005,
      contactPersonName: "Anita Verma",
      contactPersonDesignation: "Senior HR Executive",
      accountStatus: "pending",
      approvalStatus: "pending",
      createdAt: "2024-03-05",
      eligibilityTemplate: "finance_standard",
      mouDocument: "financefirst_mou_draft.pdf",
      jdDocument: "financefirst_jd_analyst.pdf",
      companyDescription: "Leading financial services provider offering comprehensive banking and investment solutions across India.",
      specialRequirements: "Strong analytical skills, financial modeling experience, CFA certification preferred",
      lastUpdated: "2024-03-05",
      updatedBy: "System",
      history: [
        {
          id: "h5",
          action: "Company Registered",
          performedBy: "System",
          timestamp: "2024-03-05T16:45:00Z",
          details: "New company registration submitted for review",
          newStatus: "pending"
        }
      ]
    },
    {
      id: "4",
      name: "EduTech Learning",
      code: "EDU004",
      industry: "Education",
      companySize: "51-200 employees",
      hqCity: "Pune",
      hqState: "Maharashtra",
      phone: "+91 20 3333 4444",
      email: "jobs@edutech.com",
      website: "https://www.edutech.com",
      establishedYear: 2018,
      contactPersonName: "Vikram Singh",
      contactPersonDesignation: "Talent Acquisition Lead",
      accountStatus: "approved",
      approvalStatus: "approved",
      createdAt: "2024-01-20"
    },
    {
      id: "5",
      name: "ManufacturePro Industries",
      code: "MFG005",
      industry: "Manufacturing",
      companySize: "501-1000 employees",
      hqCity: "Chennai",
      hqState: "Tamil Nadu",
      phone: "+91 44 2222 3333",
      email: "hr@manufacturepro.com",
      website: "https://www.manufacturepro.com",
      establishedYear: 2008,
      contactPersonName: "Lakshmi Narayanan",
      contactPersonDesignation: "HR Director",
      accountStatus: "approved",
      approvalStatus: "approved",
      createdAt: "2024-02-28"
    },
    {
      id: "6",
      name: "RetailMax Chain",
      code: "RTL006",
      industry: "Retail",
      companySize: "1000+ employees",
      hqCity: "Hyderabad",
      hqState: "Telangana",
      phone: "+91 40 8888 9999",
      email: "careers@retailmax.com",
      website: "https://www.retailmax.com",
      establishedYear: 2012,
      contactPersonName: "Suresh Reddy",
      contactPersonDesignation: "Regional HR Manager",
      accountStatus: "rejected",
      approvalStatus: "rejected",
      createdAt: "2024-03-12"
    }
  ];

  // Filter companies based on search and filters
  const filteredCompanies = companiesData.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
    const matchesSize = !selectedCompanySize || company.companySize === selectedCompanySize;
    const matchesStatus = !selectedStatus || company.accountStatus === selectedStatus;
    
    return matchesSearch && matchesIndustry && matchesSize && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedIndustry("");
    setSelectedCompanySize("");
    setSelectedStatus("");
    setShowFilterModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
      case 'blacklisted':
        return <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-full">Blacklisted</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  // D7.1 Enhanced Company Actions
  const handleCompanyAction = (company: Company, action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'blacklist') => {
    setSelectedCompanyForAction(company);
    setActionType(action);
    setShowApprovalModal(true);
  };

  const executeCompanyAction = async () => {
    if (!selectedCompanyForAction || !actionType) return;

    try {
      console.log(`Executing ${actionType} for company:`, selectedCompanyForAction.name);
      console.log("Reason:", actionReason);

      // Here you would make API call to update company status
      // const response = await updateCompanyStatus(selectedCompanyForAction.id, actionType, actionReason);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add to history
      const historyEntry: CompanyHistoryEntry = {
        id: `h${Date.now()}`,
        action: `Company ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}d`,
        performedBy: "Current User", // Replace with actual user
        timestamp: new Date().toISOString(),
        details: actionReason || `Company ${actionType}d`,
        previousStatus: selectedCompanyForAction.accountStatus,
        newStatus: actionType === 'approve' ? 'approved' : 
                  actionType === 'activate' ? 'active' :
                  actionType === 'deactivate' ? 'inactive' :
                  actionType === 'blacklist' ? 'blacklisted' : 'rejected'
      };

      alert(`Company ${actionType}d successfully!`);
      setShowApprovalModal(false);
      setSelectedCompanyForAction(null);
      setActionReason("");
    } catch (error) {
      console.error(`Error ${actionType}ing company:`, error);
      alert(`Error ${actionType}ing company. Please try again.`);
    }
  };

  const viewCompanyDetails = (company: Company) => {
    setSelectedCompanyDetails(company);
    setShowCompanyDetailsModal(true);
  };

  const viewCompanyHistory = (company: Company) => {
    setSelectedCompanyDetails(company);
    setShowCompanyHistoryModal(true);
  };

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

  // Sample job postings data
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

  // Sample eligible students data with enhanced application tracking
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
      application_stage: "Aptitude Test - Passed"
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
      application_stage: "Technical Interview - Scheduled"
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
      application_stage: "HR Interview - Pending"
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
      application_stage: "Final Selection - Offer Extended"
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
      application_stage: "Not Eligible - CGPA Below Minimum"
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
      application_stage: "Application Under Review"
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
      application_stage: "Aptitude Test - Completed"
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
      application_stage: "Eligible - Not Applied"
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
      application_stage: "Online Assessment - Scheduled"
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
      application_stage: "Portfolio Review - Passed"
    }
  ];

  // Helper functions for eligibility checking
  const checkStudentEligibility = (student: EligibleStudent, job: JobPosting): boolean => {
    const { eligibility_criteria } = job;
    
    // Check CGPA
    if (student.cgpa < eligibility_criteria.min_cgpa) return false;
    
    // Check department
    if (!eligibility_criteria.eligible_departments.includes(student.department)) return false;
    
    // Check backlogs
    if (student.backlogs > eligibility_criteria.max_backlogs) return false;
    
    // Check graduation year
    if (!eligibility_criteria.graduation_year.includes(student.graduation_year)) return false;
    
    // Check required skills (at least one match)
    const hasRequiredSkills = eligibility_criteria.required_skills.some(skill => 
      student.skills.some(studentSkill => 
        studentSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return hasRequiredSkills;
  };

  const getEligibleStudentsForJob = (jobId: string): EligibleStudent[] => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (!job) return [];
    
    return eligibleStudentsData.filter(student => checkStudentEligibility(student, job));
  };

  const publishJobPost = (jobId: string) => {
    // Auto-list eligible students
    const eligibleStudents = getEligibleStudentsForJob(jobId);
    console.log(`Job ${jobId} published. ${eligibleStudents.length} eligible students found.`);
    alert(`Job published successfully! ${eligibleStudents.length} eligible students have been automatically identified.`);
  };

  const exportShortlist = (jobId: string) => {
    const job = jobPostingsData.find(j => j.id === jobId);
    if (!job) return;
    
    const shortlistedStudents = eligibleStudentsData.filter(s => 
      job.shortlisted_students.includes(s.id)
    );
    
    const csvData = [
      ["Student ID", "Name", "Email", "Department", "CGPA", "Skills", "Status"],
      ...shortlistedStudents.map(student => [
        student.id,
        student.name,
        student.email,
        student.department,
        student.cgpa,
        student.skills.join("; "),
        student.application_stage
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shortlist_${job.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Validation functions
  const validateJobForm = (): string[] => {
    const errors: string[] = [];
    
    // Eligibility mandatory validation
    if (!jobFormData.min_cgpa || parseFloat(jobFormData.min_cgpa) < 0) {
      errors.push("Minimum CGPA is mandatory and must be valid");
    }
    
    if (jobFormData.eligible_departments.length === 0) {
      errors.push("At least one eligible department must be selected");
    }
    
    if (jobFormData.required_skills_eligibility.length === 0) {
      errors.push("At least one required skill must be specified");
    }
    
    // Round dates within placement window validation
    if (jobFormData.placement_window_start && jobFormData.placement_window_end) {
      const windowStart = new Date(jobFormData.placement_window_start);
      const windowEnd = new Date(jobFormData.placement_window_end);
      
      jobFormData.rounds.forEach((round, index) => {
        if (round.date) {
          const roundDate = new Date(round.date);
          if (roundDate < windowStart || roundDate > windowEnd) {
            errors.push(`Round ${index + 1} date must be within placement window (${jobFormData.placement_window_start} to ${jobFormData.placement_window_end})`);
          }
        }
      });
    }
    
    return errors;
  };

  // Sample placement records data
  const placementRecords: PlacementRecord[] = [
    {
      id: "1",
      student_name: "Rahul Sharma",
      student_id: "CS2021001",
      company_name: "TechCorp Solutions",
      job_title: "Software Engineer",
      department: "Computer Science",
      employment_type: "Full-time",
      salary_offered: 1200000,
      placement_date: "2024-03-15",
      status: "joined",
      location: "Bangalore"
    },
    {
      id: "2",
      student_name: "Priya Patel",
      student_id: "CS2021002",
      company_name: "HealthPlus Medical",
      job_title: "Data Analyst",
      department: "Computer Science",
      employment_type: "Full-time",
      salary_offered: 900000,
      placement_date: "2024-03-10",
      status: "placed",
      location: "Mumbai"
    },
    {
      id: "3",
      student_name: "Amit Kumar",
      student_id: "ME2021001",
      company_name: "ManufacturePro Industries",
      job_title: "Mechanical Engineer",
      department: "Mechanical Engineering",
      employment_type: "Full-time",
      salary_offered: 800000,
      placement_date: "2024-02-28",
      status: "joined",
      location: "Chennai"
    },
    {
      id: "4",
      student_name: "Sneha Reddy",
      student_id: "EC2021001",
      company_name: "TechCorp Solutions",
      job_title: "Electronics Engineer",
      department: "Electronics",
      employment_type: "Full-time",
      salary_offered: 1000000,
      placement_date: "2024-03-05",
      status: "placed",
      location: "Hyderabad"
    },
    {
      id: "5",
      student_name: "Vikram Singh",
      student_id: "CS2022001",
      company_name: "EduTech Learning",
      job_title: "Software Intern",
      department: "Computer Science",
      employment_type: "Internship",
      salary_offered: 300000,
      placement_date: "2024-01-15",
      status: "joined",
      location: "Pune"
    },
    {
      id: "6",
      student_name: "Anita Verma",
      student_id: "MBA2021001",
      company_name: "FinanceFirst Bank",
      job_title: "Financial Analyst",
      department: "Management",
      employment_type: "Full-time",
      salary_offered: 1100000,
      placement_date: "2024-02-20",
      status: "placed",
      location: "Delhi"
    },
    {
      id: "7",
      student_name: "Ravi Gupta",
      student_id: "ME2022001",
      company_name: "ManufacturePro Industries",
      job_title: "Production Intern",
      department: "Mechanical Engineering",
      employment_type: "Internship",
      salary_offered: 250000,
      placement_date: "2024-01-20",
      status: "joined",
      location: "Chennai"
    },
    {
      id: "8",
      student_name: "Kavya Nair",
      student_id: "EC2022001",
      company_name: "TechCorp Solutions",
      job_title: "Hardware Intern",
      department: "Electronics",
      employment_type: "Internship",
      salary_offered: 280000,
      placement_date: "2024-01-25",
      status: "joined",
      location: "Bangalore"
    }
  ];

  // Calculate department analytics with D7.3 enhancements
  const calculateDepartmentAnalytics = (): DepartmentAnalytics[] => {
    const departments = ["Computer Science", "Mechanical Engineering", "Electronics", "Management"];
    
    return departments.map(dept => {
      const deptPlacements = placementRecords.filter(p => p.department === dept);
      const fullTimePlacements = deptPlacements.filter(p => p.employment_type === "Full-time");
      const internships = deptPlacements.filter(p => p.employment_type === "Internship");
      
      const totalStudents = dept === "Computer Science" ? 120 : 
                           dept === "Mechanical Engineering" ? 100 :
                           dept === "Electronics" ? 80 : 60;
      
      // Average CTC calculation
      const avgCtc = fullTimePlacements.length > 0 
        ? fullTimePlacements.reduce((sum, p) => sum + p.salary_offered, 0) / fullTimePlacements.length 
        : 0;
      
      // D7.3 Median CTC calculation
      const deptSalaries = fullTimePlacements.map(p => p.salary_offered).sort((a, b) => a - b);
      const medianCtc = deptSalaries.length > 0 
        ? deptSalaries.length % 2 === 0
          ? (deptSalaries[deptSalaries.length / 2 - 1] + deptSalaries[deptSalaries.length / 2]) / 2
          : deptSalaries[Math.floor(deptSalaries.length / 2)]
        : 0;
      
      const highestCtc = fullTimePlacements.length > 0 
        ? Math.max(...fullTimePlacements.map(p => p.salary_offered)) 
        : 0;
      
      return {
        department: dept,
        total_students: totalStudents,
        placed_students: deptPlacements.length,
        placement_rate: (deptPlacements.length / totalStudents) * 100,
        avg_ctc: avgCtc,
        median_ctc: medianCtc,
        highest_ctc: highestCtc,
        total_offers: deptPlacements.length,
        internships: internships.length,
        full_time: fullTimePlacements.length,
      };
    });
  };

  const departmentAnalytics = calculateDepartmentAnalytics();

  // Filter analytics data
  const filteredAnalytics = departmentAnalytics.filter(dept => {
    return !selectedAnalyticsDepartment || dept.department === selectedAnalyticsDepartment;
  });

  // Calculate overall metrics with D7.3 enhancements
  const totalPlacements = placementRecords.length;
  const totalInternships = placementRecords.filter(p => p.employment_type === "Internship").length;
  const totalFullTime = placementRecords.filter(p => p.employment_type === "Full-time").length;
  const internshipToJobRatio = totalFullTime > 0 ? (totalInternships / totalFullTime).toFixed(2) : "0";
  
  // Enhanced CTC calculations for D7.3
  const fullTimeSalaries = placementRecords
    .filter(p => p.employment_type === "Full-time")
    .map(p => p.salary_offered)
    .sort((a, b) => a - b);
  
  const overallAvgCtc = fullTimeSalaries.length > 0 
    ? fullTimeSalaries.reduce((sum, salary) => sum + salary, 0) / fullTimeSalaries.length 
    : 0;
  
  // D7.3 Median CTC calculation
  const overallMedianCtc = fullTimeSalaries.length > 0 
    ? fullTimeSalaries.length % 2 === 0
      ? (fullTimeSalaries[fullTimeSalaries.length / 2 - 1] + fullTimeSalaries[fullTimeSalaries.length / 2]) / 2
      : fullTimeSalaries[Math.floor(fullTimeSalaries.length / 2)]
    : 0;



  // Enhanced Export functionality with D7.3 fields
  const handleExportReport = () => {
    const csvData = [
      ["Department", "Total Students", "Placed Students", "Placement Rate (%)", "Avg CTC (₹)", "Median CTC (₹)", "Highest CTC (₹)", "Full-time", "Internships"],
      ...filteredAnalytics.map(dept => [
        dept.department,
        dept.total_students,
        dept.placed_students,
        dept.placement_rate.toFixed(1),
        dept.avg_ctc,
        dept.median_ctc,
        dept.highest_ctc,
        dept.full_time,
        dept.internships
      ])
    ];
    
    // Add summary row
    csvData.push([]);
    csvData.push(["OVERALL SUMMARY"]);
    csvData.push(["Total Placements", totalPlacements]);
    csvData.push(["Overall Avg CTC (₹)", overallAvgCtc.toFixed(0)]);
    csvData.push(["Overall Median CTC (₹)", overallMedianCtc.toFixed(0)]);
    csvData.push(["Internship:Job Ratio", `${internshipToJobRatio}:1`]);
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placement_analytics_${selectedAnalyticsYear}_enhanced.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

  const handleJobInputChange = (field: keyof JobFormData, value: string) => {
    setJobFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateJobForm();
    if (validationErrors.length > 0) {
      alert("Please fix the following errors:\n" + validationErrors.join("\n"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Job posting data to submit:", jobFormData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setJobFormData({
        title: "",
        company_name: "",
        job_title: "",
        employment_type: "",
        location: "",
        mode: "",
        salary_range_min: "",
        salary_range_max: "",
        experience_required: "",
        skills_required: "",
        description: "",
        requirements: "",
        responsibilities: "",
        benefits: "",
        deadline: "",
        department: "",
        min_cgpa: "",
        eligible_departments: [],
        required_skills_eligibility: [],
        max_backlogs: "",
        graduation_years: [],
        intake_count: "",
        placement_window_start: "",
        placement_window_end: "",
        rounds: [],
      });
      setShowAddJobModal(false);
      alert("Job posting created successfully!");
      
    } catch (error) {
      console.error("Error creating job posting:", error);
      alert("Error creating job posting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearJobFilters = () => {
    setSelectedJobStatus("");
    setSelectedEmploymentType("");
    setSelectedJobMode("");
    setShowJobFilterModal(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Placement Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage company registrations, job postings, and placement analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placementStats.map((stat, index) => {
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
        {activeTab === "companies" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Company Registration</h2>
              <button 
                onClick={() => setShowAddCompanyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Company
              </button>
            </div>
            <p className="text-gray-600 mb-4">Manage company profiles, MoU/JD uploads, and status management.</p>
            
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies by name, code, or industry..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4" />
                Filter
                {(selectedIndustry || selectedCompanySize || selectedStatus) && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {[selectedIndustry, selectedCompanySize, selectedStatus].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Companies Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Person
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
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                <div className="text-sm text-gray-500">{company.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{company.industry}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{company.companySize}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{company.hqCity}</div>
                            <div className="text-sm text-gray-500">{company.hqState}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{company.contactPersonName}</div>
                            <div className="text-sm text-gray-500">{company.contactPersonDesignation}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(company.accountStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => viewCompanyDetails(company)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Edit Company"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => viewCompanyHistory(company)}
                                className="text-purple-600 hover:text-purple-900 p-1"
                                title="View History"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              
                              {/* Status-based Actions */}
                              {company.accountStatus === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleCompanyAction(company, 'approve')}
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Approve Company"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleCompanyAction(company, 'reject')}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Reject Company"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              
                              {(company.accountStatus === 'approved' || company.accountStatus === 'inactive') && (
                                <button 
                                  onClick={() => handleCompanyAction(company, 'activate')}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Activate Company"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              
                              {company.accountStatus === 'active' && (
                                <button 
                                  onClick={() => handleCompanyAction(company, 'deactivate')}
                                  className="text-orange-600 hover:text-orange-900 p-1"
                                  title="Deactivate Company"
                                >
                                  <Clock className="h-4 w-4" />
                                </button>
                              )}
                              
                              {(company.accountStatus === 'active' || company.accountStatus === 'inactive') && (
                                <button 
                                  onClick={() => handleCompanyAction(company, 'blacklist')}
                                  className="text-black hover:text-gray-700 p-1"
                                  title="Blacklist Company"
                                >
                                  <X className="h-4 w-4" />
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
                            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                            <p className="text-gray-500 mb-4">
                              {searchTerm || selectedIndustry || selectedCompanySize || selectedStatus
                                ? "Try adjusting your search or filters"
                                : "Get started by adding your first company"}
                            </p>
                            {!(searchTerm || selectedIndustry || selectedCompanySize || selectedStatus) && (
                              <button 
                                onClick={() => setShowAddCompanyModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                <Plus className="h-4 w-4" />
                                Add First Company
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

            {/* Results Summary */}
            {filteredCompanies.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  Showing {filteredCompanies.length} of {companiesData.length} companies
                </div>
                <div className="flex items-center gap-4">
                  <span>Approved: {filteredCompanies.filter(c => c.accountStatus === 'approved').length}</span>
                  <span>Pending: {filteredCompanies.filter(c => c.accountStatus === 'pending').length}</span>
                  <span>Rejected: {filteredCompanies.filter(c => c.accountStatus === 'rejected').length}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
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
                                onClick={() => {
                                  setSelectedJobDetails(job);
                                  setShowJobDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
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
          </div>
        )}

        {activeTab === "applications" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Application Tracking</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowJobDetailsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Eye className="h-4 w-4" />
                  View Job Details
                </button>
                <button 
                  onClick={() => exportShortlist("1")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Applications
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Track application stages, update student status, and manage recruitment rounds.</p>
            
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={applicationSearchTerm}
                  onChange={(e) => setApplicationSearchTerm(e.target.value)}
                  placeholder="Search students by name, ID, or department..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedApplicationJob}
                onChange={(e) => setSelectedApplicationJob(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Jobs</option>
                {jobPostingsData.filter(j => j.status === 'active').map(job => (
                  <option key={job.id} value={job.id}>{job.title} - {job.company_name}</option>
                ))}
              </select>
              <select
                value={selectedApplicationStatus}
                onChange={(e) => setSelectedApplicationStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="eligible">Eligible</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Application Stages Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Eligible</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {eligibleStudentsData.filter(s => s.status === 'eligible').length}
                    </p>
                  </div>
                  <div className="bg-blue-500 p-2 rounded-lg text-white">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Applied</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {eligibleStudentsData.filter(s => s.status === 'applied').length}
                    </p>
                  </div>
                  <div className="bg-yellow-500 p-2 rounded-lg text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Shortlisted</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {eligibleStudentsData.filter(s => s.status === 'shortlisted').length}
                    </p>
                  </div>
                  <div className="bg-purple-500 p-2 rounded-lg text-white">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Selected</p>
                    <p className="text-2xl font-bold text-green-900">
                      {eligibleStudentsData.filter(s => s.status === 'selected').length}
                    </p>
                  </div>
                  <div className="bg-green-500 p-2 rounded-lg text-white">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Rejected</p>
                    <p className="text-2xl font-bold text-red-900">
                      {eligibleStudentsData.filter(s => s.status === 'rejected').length}
                    </p>
                  </div>
                  <div className="bg-red-500 p-2 rounded-lg text-white">
                    <X className="h-5 w-5" />
                  </div>
                </div>
              </div>
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
                        Skills
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
                    {eligibleStudentsData
                      .filter(student => {
                        const matchesSearch = student.name.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                                            student.id.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                                            student.department.toLowerCase().includes(applicationSearchTerm.toLowerCase());
                        const matchesStatus = !selectedApplicationStatus || student.status === selectedApplicationStatus;
                        return matchesSearch && matchesStatus;
                      })
                      .map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.id}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.department}</div>
                            <div className="text-sm text-gray-500">CGPA: {student.cgpa}</div>
                            <div className="text-sm text-gray-500">
                              Backlogs: {student.backlogs} | Grad: {student.graduation_year}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {student.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {student.skills.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  +{student.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.application_stage}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.status === 'eligible' && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Eligible</span>
                            )}
                            {student.status === 'applied' && (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Applied</span>
                            )}
                            {student.status === 'shortlisted' && (
                              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Shortlisted</span>
                            )}
                            {student.status === 'selected' && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Selected</span>
                            )}
                            {student.status === 'rejected' && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedStudentForUpdate(student);
                                  setShowStageUpdateModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Application Results Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing {eligibleStudentsData.filter(student => {
                  const matchesSearch = student.name.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                                      student.id.toLowerCase().includes(applicationSearchTerm.toLowerCase()) ||
                                      student.department.toLowerCase().includes(applicationSearchTerm.toLowerCase());
                  const matchesStatus = !selectedApplicationStatus || student.status === selectedApplicationStatus;
                  return matchesSearch && matchesStatus;
                }).length} of {eligibleStudentsData.length} applications
              </div>
              <div className="flex items-center gap-4">
                <span>Selection Rate: {((eligibleStudentsData.filter(s => s.status === 'selected').length / eligibleStudentsData.length) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Placement Analytics</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAnalyticsFilter(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {(selectedAnalyticsDepartment || selectedAnalyticsYear !== "2024") && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {[selectedAnalyticsDepartment, selectedAnalyticsYear !== "2024" ? selectedAnalyticsYear : ""].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-6">View offers per department, CTC analysis, internship to job ratio, and apply filters.</p>

            {/* Enhanced Analytics Overview Cards - D7.3 Compliant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Placements</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPlacements}</p>
                    <p className="text-xs text-gray-500">Placement Rate: {((totalPlacements / 360) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg text-white">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Avg CTC</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(overallAvgCtc / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-gray-500">Full-time offers</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg text-white">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Median CTC</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(overallMedianCtc / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-gray-500">Middle value</p>
                  </div>
                  <div className="bg-indigo-500 p-3 rounded-lg text-white">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Offers per Dept</p>
                    <p className="text-2xl font-bold text-gray-900">{(totalPlacements / departmentAnalytics.length).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Average per dept</p>
                  </div>
                  <div className="bg-orange-500 p-3 rounded-lg text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Department Analytics Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Department-wise Placement Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placement Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg CTC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Median CTC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Highest CTC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full-time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Internships
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAnalytics.map((dept) => (
                      <tr key={dept.department} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dept.placed_students}/{dept.total_students}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{dept.placement_rate.toFixed(1)}%</div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(dept.placement_rate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dept.avg_ctc > 0 ? `₹${(dept.avg_ctc / 100000).toFixed(1)}L` : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dept.median_ctc > 0 ? `₹${(dept.median_ctc / 100000).toFixed(1)}L` : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dept.highest_ctc > 0 ? `₹${(dept.highest_ctc / 100000).toFixed(1)}L` : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dept.full_time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dept.internships}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTC Distribution Chart */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CTC Distribution Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {placementRecords.filter(p => p.employment_type === "Full-time" && p.salary_offered >= 1000000).length}
                  </div>
                  <div className="text-sm text-gray-600">Above ₹10L</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {placementRecords.filter(p => p.employment_type === "Full-time" && p.salary_offered >= 600000 && p.salary_offered < 1000000).length}
                  </div>
                  <div className="text-sm text-gray-600">₹6L - ₹10L</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {placementRecords.filter(p => p.employment_type === "Full-time" && p.salary_offered < 600000).length}
                  </div>
                  <div className="text-sm text-gray-600">Below ₹6L</div>
                </div>
              </div>
            </div>

            {/* Recent Placements */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Placements</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {placementRecords.slice(0, 5).map((placement) => (
                  <div key={placement.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{placement.student_name}</div>
                        <div className="text-sm text-gray-500">{placement.student_id} • {placement.department}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{placement.company_name}</div>
                      <div className="text-sm text-gray-500">
                        ₹{(placement.salary_offered / 100000).toFixed(1)}L • {placement.employment_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Filter Modal */}
      {showAnalyticsFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Filter Analytics</h2>
              </div>
              <button
                onClick={() => setShowAnalyticsFilter(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={selectedAnalyticsDepartment}
                  onChange={(e) => setSelectedAnalyticsDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={selectedAnalyticsYear}
                  onChange={(e) => setSelectedAnalyticsYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placement Type
                </label>
                <select
                  value={selectedAnalyticsType}
                  onChange={(e) => setSelectedAnalyticsType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Placements</option>
                  <option value="full-time">Full-time Only</option>
                  <option value="internship">Internships Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedAnalyticsDepartment("");
                  setSelectedAnalyticsYear("2024");
                  setSelectedAnalyticsType("all");
                  setShowAnalyticsFilter(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear All
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAnalyticsFilter(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAnalyticsFilter(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Filter Modal */}
      {showJobFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Filter Job Postings</h2>
              </div>
              <button
                onClick={() => setShowJobFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedJobStatus}
                  onChange={(e) => setSelectedJobStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  value={selectedEmploymentType}
                  onChange={(e) => setSelectedEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Mode
                </label>
                <select
                  value={selectedJobMode}
                  onChange={(e) => setSelectedJobMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Modes</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={clearJobFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear All
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJobFilterModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowJobFilterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Posting Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create Job Posting</h2>
                  <p className="text-sm text-gray-600">Post a new job opportunity for students</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddJobModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleJobSubmit} className="p-6 space-y-6">
              {/* Basic Job Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Job Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={jobFormData.title}
                      onChange={(e) => handleJobInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <select
                      required
                      value={jobFormData.company_name}
                      onChange={(e) => handleJobInputChange('company_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Company</option>
                      {companiesData.filter(c => c.accountStatus === 'approved').map(company => (
                        <option key={company.id} value={company.name}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={jobFormData.department}
                      onChange={(e) => handleJobInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Engineering, Marketing"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      required
                      value={jobFormData.employment_type}
                      onChange={(e) => handleJobInputChange('employment_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Mode *
                    </label>
                    <select
                      required
                      value={jobFormData.mode}
                      onChange={(e) => handleJobInputChange('mode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Mode</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={jobFormData.location}
                      onChange={(e) => handleJobInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bangalore, Karnataka"
                    />
                  </div>
                </div>
              </div>

              {/* Salary & Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Compensation & Experience
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Salary (₹/year)
                    </label>
                    <input
                      type="number"
                      value={jobFormData.salary_range_min}
                      onChange={(e) => handleJobInputChange('salary_range_min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 600000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Salary (₹/year)
                    </label>
                    <input
                      type="number"
                      value={jobFormData.salary_range_max}
                      onChange={(e) => handleJobInputChange('salary_range_max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 1000000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Required
                    </label>
                    <input
                      type="text"
                      value={jobFormData.experience_required}
                      onChange={(e) => handleJobInputChange('experience_required', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2-4 years"
                    />
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Job Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={jobFormData.description}
                      onChange={(e) => handleJobInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the role and what the candidate will be doing..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Skills (comma-separated)
                      </label>
                      <textarea
                        rows={3}
                        value={jobFormData.skills_required}
                        onChange={(e) => handleJobInputChange('skills_required', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., React, Node.js, MongoDB"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requirements (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={jobFormData.requirements}
                        onChange={(e) => handleJobInputChange('requirements', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bachelor's degree in Computer Science&#10;2+ years of experience"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Responsibilities (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={jobFormData.responsibilities}
                        onChange={(e) => handleJobInputChange('responsibilities', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Develop web applications&#10;Collaborate with team"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Benefits (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={jobFormData.benefits}
                        onChange={(e) => handleJobInputChange('benefits', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Health Insurance&#10;Flexible Hours"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Deadline *
                      </label>
                      <input
                        type="date"
                        required
                        value={jobFormData.deadline}
                        onChange={(e) => handleJobInputChange('deadline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intake Count *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={jobFormData.intake_count}
                        onChange={(e) => handleJobInputChange('intake_count', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of positions available"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligibility Criteria - MANDATORY */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Eligibility Criteria (Mandatory)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum CGPA *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      required
                      value={jobFormData.min_cgpa}
                      onChange={(e) => handleJobInputChange('min_cgpa', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 7.0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Backlogs Allowed *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={jobFormData.max_backlogs}
                      onChange={(e) => handleJobInputChange('max_backlogs', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eligible Departments * (Select multiple)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["Computer Science", "Information Technology", "Electronics", "Mechanical Engineering", "Civil Engineering", "Management", "Mathematics", "Statistics"].map(dept => (
                      <label key={dept} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={jobFormData.eligible_departments.includes(dept)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setJobFormData(prev => ({
                                ...prev,
                                eligible_departments: [...prev.eligible_departments, dept]
                              }));
                            } else {
                              setJobFormData(prev => ({
                                ...prev,
                                eligible_departments: prev.eligible_departments.filter(d => d !== dept)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills for Eligibility * (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={jobFormData.required_skills_eligibility.join(', ')}
                    onChange={(e) => {
                      const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setJobFormData(prev => ({
                        ...prev,
                        required_skills_eligibility: skills
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., JavaScript, Python, Communication"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Years * (Select multiple)
                  </label>
                  <div className="flex gap-2">
                    {["2024", "2025", "2026"].map(year => (
                      <label key={year} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={jobFormData.graduation_years.includes(year)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setJobFormData(prev => ({
                                ...prev,
                                graduation_years: [...prev.graduation_years, year]
                              }));
                            } else {
                              setJobFormData(prev => ({
                                ...prev,
                                graduation_years: prev.graduation_years.filter(y => y !== year)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Placement Window */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Placement Window
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Window Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={jobFormData.placement_window_start}
                      onChange={(e) => handleJobInputChange('placement_window_start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Window End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={jobFormData.placement_window_end}
                      onChange={(e) => handleJobInputChange('placement_window_end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Rounds Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Recruitment Rounds Schedule
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setJobFormData(prev => ({
                        ...prev,
                        rounds: [...prev.rounds, {
                          round_name: "",
                          round_type: "aptitude",
                          date: "",
                          time: "",
                          duration_minutes: "",
                          location: "",
                          instructions: ""
                        }]
                      }));
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add Round
                  </button>
                </div>
                
                {jobFormData.rounds.map((round, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Round {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setJobFormData(prev => ({
                            ...prev,
                            rounds: prev.rounds.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Round Name
                        </label>
                        <input
                          type="text"
                          value={round.round_name}
                          onChange={(e) => {
                            const newRounds = [...jobFormData.rounds];
                            newRounds[index].round_name = e.target.value;
                            setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Aptitude Test"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Round Type
                        </label>
                        <select
                          value={round.round_type}
                          onChange={(e) => {
                            const newRounds = [...jobFormData.rounds];
                            newRounds[index].round_type = e.target.value;
                            setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="aptitude">Aptitude Test</option>
                          <option value="technical">Technical Interview</option>
                          <option value="hr">HR Interview</option>
                          <option value="group_discussion">Group Discussion</option>
                          <option value="presentation">Presentation</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={round.date}
                          onChange={(e) => {
                            const newRounds = [...jobFormData.rounds];
                            newRounds[index].date = e.target.value;
                            setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          value={round.time}
                          onChange={(e) => {
                            const newRounds = [...jobFormData.rounds];
                            newRounds[index].time = e.target.value;
                            setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          value={round.duration_minutes}
                          onChange={(e) => {
                            const newRounds = [...jobFormData.rounds];
                            newRounds[index].duration_minutes = e.target.value;
                            setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 90"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={round.location}
                          onChange={(e) => {
                            const newRounds = [...jobFormData.rounds];
                            newRounds[index].location = e.target.value;
                            setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Online, Campus - Room 101"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={round.instructions}
                        onChange={(e) => {
                          const newRounds = [...jobFormData.rounds];
                          newRounds[index].instructions = e.target.value;
                          setJobFormData(prev => ({ ...prev, rounds: newRounds }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Special instructions for this round..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Job Posting
                    </>
                  )}
                </button>
              </div>
            </form>
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
                <h2 className="text-lg font-bold text-gray-900">Filter Companies</h2>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Industries</option>
                  {industryOptions.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={selectedCompanySize}
                  onChange={(e) => setSelectedCompanySize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sizes</option>
                  {companySizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear All
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
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

      {/* Stage Update Modal */}
      {showStageUpdateModal && selectedStudentForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Update Application Stage</h2>
              </div>
              <button
                onClick={() => {
                  setShowStageUpdateModal(false);
                  setSelectedStudentForUpdate(null);
                  setNewStage("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{selectedStudentForUpdate.name}</h3>
                <p className="text-sm text-gray-600">{selectedStudentForUpdate.id} • {selectedStudentForUpdate.department}</p>
                <p className="text-sm text-gray-600">Current Stage: {selectedStudentForUpdate.application_stage}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Application Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Stage</option>
                  <option value="Application Under Review">Application Under Review</option>
                  <option value="Aptitude Test - Scheduled">Aptitude Test - Scheduled</option>
                  <option value="Aptitude Test - Completed">Aptitude Test - Completed</option>
                  <option value="Aptitude Test - Passed">Aptitude Test - Passed</option>
                  <option value="Technical Interview - Scheduled">Technical Interview - Scheduled</option>
                  <option value="Technical Interview - Completed">Technical Interview - Completed</option>
                  <option value="Technical Interview - Passed">Technical Interview - Passed</option>
                  <option value="HR Interview - Scheduled">HR Interview - Scheduled</option>
                  <option value="HR Interview - Completed">HR Interview - Completed</option>
                  <option value="HR Interview - Passed">HR Interview - Passed</option>
                  <option value="Final Selection - Offer Extended">Final Selection - Offer Extended</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                  <option value="Rejected - Aptitude">Rejected - Aptitude</option>
                  <option value="Rejected - Technical">Rejected - Technical</option>
                  <option value="Rejected - HR">Rejected - HR</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="eligible">Eligible</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowStageUpdateModal(false);
                  setSelectedStudentForUpdate(null);
                  setNewStage("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Update the student's stage
                  console.log(`Updating ${selectedStudentForUpdate.name} to stage: ${newStage}`);
                  alert(`Application stage updated successfully for ${selectedStudentForUpdate.name}`);
                  setShowStageUpdateModal(false);
                  setSelectedStudentForUpdate(null);
                  setNewStage("");
                }}
                disabled={!newStage}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-purple-600" />
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

            <div className="p-6 space-y-6">
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Job Posting
                </label>
                <select
                  value={selectedJobDetails?.id || ""}
                  onChange={(e) => {
                    const job = jobPostingsData.find(j => j.id === e.target.value);
                    setSelectedJobDetails(job || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a job posting</option>
                  {jobPostingsData.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJobDetails && (
                <>
                  {/* Job Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedJobDetails.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Company:</span> {selectedJobDetails.company_name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Department:</span> {selectedJobDetails.department}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span> {selectedJobDetails.location}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Mode:</span> {selectedJobDetails.mode}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Salary:</span> ₹{(selectedJobDetails.salary_range_min / 100000).toFixed(1)}L - ₹{(selectedJobDetails.salary_range_max / 100000).toFixed(1)}L
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Intake:</span> {selectedJobDetails.intake_count} positions
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Criteria */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h4>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <div><span className="font-medium">Min CGPA:</span> {selectedJobDetails.eligibility_criteria?.min_cgpa}</div>
                      <div><span className="font-medium">Max Backlogs:</span> {selectedJobDetails.eligibility_criteria?.max_backlogs}</div>
                      <div><span className="font-medium">Eligible Departments:</span> {selectedJobDetails.eligibility_criteria?.eligible_departments.join(', ')}</div>
                      <div><span className="font-medium">Required Skills:</span> {selectedJobDetails.eligibility_criteria?.required_skills.join(', ')}</div>
                      <div><span className="font-medium">Graduation Years:</span> {selectedJobDetails.eligibility_criteria?.graduation_year.join(', ')}</div>
                    </div>
                  </div>

                  {/* Recruitment Rounds */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recruitment Rounds Schedule</h4>
                    <div className="space-y-3">
                      {selectedJobDetails.rounds_schedule?.map((round, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{round.round_name}</h5>
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                              {round.round_type}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><span className="font-medium">Date:</span> {new Date(round.date).toLocaleDateString()}</div>
                            <div><span className="font-medium">Time:</span> {round.time}</div>
                            <div><span className="font-medium">Duration:</span> {round.duration_minutes} minutes</div>
                            <div><span className="font-medium">Location:</span> {round.location}</div>
                          </div>
                          {round.instructions && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Instructions:</span> {round.instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => publishJobPost(selectedJobDetails.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Publish Job & Auto-list Students
                    </button>
                    <button
                      onClick={() => exportShortlist(selectedJobDetails.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Download className="h-4 w-4" />
                      Export Shortlist
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Company</h2>
                  <p className="text-sm text-gray-600">Register a new company for placement opportunities</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Company Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter company code (e.g., TECH001)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Industry</option>
                      {industryOptions.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Size
                    </label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Company Size</option>
                      {companySizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Established Year
                    </label>
                    <input
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2010"
                    />
                  </div>
                </div>
              </div>

              {/* Headquarters Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Headquarters Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={formData.hqAddress}
                      onChange={(e) => handleInputChange('hqAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter complete address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.hqCity}
                        onChange={(e) => handleInputChange('hqCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        value={formData.hqState}
                        onChange={(e) => handleInputChange('hqState', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select State</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode
                      </label>
                      <input
                        type="text"
                        pattern="[0-9]{6}"
                        value={formData.hqPincode}
                        onChange={(e) => handleInputChange('hqPincode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.hqCountry}
                      onChange={(e) => handleInputChange('hqCountry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Contact Person Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      value={formData.contactPersonName}
                      onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter contact person name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.contactPersonDesignation}
                      onChange={(e) => handleInputChange('contactPersonDesignation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., HR Manager, Recruiter"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter contact person email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPersonPhone}
                      onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter contact person phone"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                      Add Company
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementManagement;