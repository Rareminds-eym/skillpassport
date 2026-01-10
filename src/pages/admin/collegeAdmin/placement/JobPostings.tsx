import React, { useState, useEffect } from "react";
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
  CheckCircle,
} from "lucide-react";
import toast from 'react-hot-toast';
import { opportunitiesService } from '@/services/opportunitiesService';
import type { Opportunity } from '@/services/opportunitiesService';


const JobPostings: React.FC = () => {
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [selectedJobStatus, setSelectedJobStatus] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedJobMode, setSelectedJobMode] = useState("");
  const [showJobFilterModal, setShowJobFilterModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Opportunity | null>(null);
  const [editingJob, setEditingJob] = useState<Opportunity | null>(null);
  
  // Opportunities data from database
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Company data from database (kept for future use)
  // const [companies, setCompanies] = useState<Company[]>([]);

  // Form data state (kept for future use when form is fully implemented)
  // const [formData, setFormData] = useState<JobFormData>({
  // Form data state (kept for future use when form is fully implemented)
  /*
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
  */

  // Available options (kept for future use)
  // const employmentTypes = ['Full-time', 'Part-time', 'Internship', 'Contract'];
  // const workModes = ['Remote', 'On-site', 'Hybrid'];
  // const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'Management', 'Mathematics', 'Statistics'];
  // const graduationYears = ['2024', '2025', '2026'];
  // const roundTypes = ['Aptitude Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Presentation'];

  // Load opportunities from database on component mount
  useEffect(() => {
    loadOpportunities();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [opportunities, jobSearchTerm, selectedJobStatus, selectedEmploymentType, selectedJobMode]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [jobSearchTerm, selectedJobStatus, selectedEmploymentType, selectedJobMode]);

  const loadOpportunities = async () => {
    try {
      setIsLoadingOpportunities(true);
      setHasError(false);
      
      // Load all opportunities without filters (we'll filter client-side)
      const opportunitiesData = await opportunitiesService.getAllOpportunities({
        is_active: true // Only show active opportunities
      });
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      setHasError(true);
      toast.error('Failed to load job opportunities');
      setOpportunities([]);
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...opportunities];

    // Search filter
    if (jobSearchTerm) {
      const search = jobSearchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(search) ||
        job.company_name?.toLowerCase().includes(search) ||
        job.department?.toLowerCase().includes(search) ||
        job.location?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (selectedJobStatus) {
      filtered = filtered.filter(job => job.status === selectedJobStatus);
    }

    // Employment type filter
    if (selectedEmploymentType) {
      filtered = filtered.filter(job => job.employment_type === selectedEmploymentType);
    }

    // Mode filter
    if (selectedJobMode) {
      filtered = filtered.filter(job => job.mode === selectedJobMode);
    }

    setTotalItems(filtered.length);
    setFilteredOpportunities(filtered);
  };

  // Get paginated data
  const getPaginatedOpportunities = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOpportunities.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedOpportunities = getPaginatedOpportunities();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Company loading function (kept for future use)
  /*
  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getAllCompanies();
      // Filter only active companies for job postings
      const activeCompanies = companiesData.filter(company => 
        company.accountStatus === 'active' || company.accountStatus === 'approved'
      );
      setCompanies(activeCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };
  */

  // Form handling functions (kept for future use when form is fully implemented)
  /*
  const handleCompanySelection = (companyName: string) => {
    // Update company name
    setFormData(prev => ({
      ...prev,
      company_name: companyName
    }));

    // Find the selected company and auto-fill fields
    if (companyName) {
      const selectedCompany = companies.find(company => company.name === companyName);
      if (selectedCompany) {
        setFormData(prev => ({
          ...prev,
          company_name: companyName,
          // Auto-fill location from company HQ
          location: selectedCompany.hqCity && selectedCompany.hqState 
            ? `${selectedCompany.hqCity}, ${selectedCompany.hqState}` 
            : prev.location,
          // Auto-fill department from company industry (if not already set)
          department: prev.department || selectedCompany.industry || '',
        }));
      }
    }
  };

  // Check if location is auto-filled from company
  const isLocationAutoFilled = () => {
    if (!formData.company_name) return false;
    const selectedCompany = companies.find(company => company.name === formData.company_name);
    return selectedCompany && selectedCompany.hqCity && selectedCompany.hqState;
  };

  // Check if department is auto-filled from company industry
  const isDepartmentAutoFilled = () => {
    if (!formData.company_name) return false;
    const selectedCompany = companies.find(company => company.name === formData.company_name);
    return selectedCompany && selectedCompany.industry && formData.department === selectedCompany.industry;
  };
  */

  const getJobStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || 'draft';
    const colorClass = opportunitiesService.getStatusBadgeColor(status);
    const displayStatus = statusLower === 'open' ? 'Active' : 
                         statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
    
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>{displayStatus}</span>;
  };

  const viewJobDetails = async (jobId: number) => {
    try {
      const job = await opportunitiesService.getOpportunityById(jobId);
      if (job) {
        setSelectedJob(job);
        setShowJobDetailsModal(true);
        // Increment view count
        await opportunitiesService.incrementViewCount(jobId);
        // Refresh the opportunities list to show updated view count
        loadOpportunities();
      }
    } catch (error) {
      console.error('Error viewing job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const editJob = async (jobId: number) => {
    try {
      const job = await opportunitiesService.getOpportunityById(jobId);
      if (job) {
        setEditingJob(job);
        // Note: Form population logic commented out since form is simplified
        /*
        setFormData({
          job_title: job.job_title || job.title,
          company_name: job.company_name,
          department: job.department,
          employment_type: job.employment_type,
          work_mode: job.mode || '',
          location: job.location,
          min_salary: job.salary_range_min?.toString() || '',
          max_salary: job.salary_range_max?.toString() || '',
          experience_required: job.experience_required || '',
          job_description: job.description || '',
          required_skills: opportunitiesService.formatSkills(job.skills_required).join(', '),
          requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || ''),
          responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : (job.responsibilities || ''),
          benefits: Array.isArray(job.benefits) ? job.benefits.join('\n') : (job.benefits || ''),
          application_deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
          intake_count: '1', // Default value as this field doesn't exist in opportunities table
          min_cgpa: '6.0', // Default value
          max_backlogs: '2', // Default value
          eligible_departments: [job.department].filter(Boolean),
          required_skills_eligibility: opportunitiesService.formatSkills(job.skills_required).join(', '),
          graduation_years: ['2024', '2025'], // Default values
          window_start_date: job.posted_date ? new Date(job.posted_date).toISOString().split('T')[0] : '',
          window_end_date: job.closing_date ? new Date(job.closing_date).toISOString().split('T')[0] : '',
          rounds: [] // Default empty as this data doesn't exist in opportunities table
        });
        */
        setShowAddJobModal(true);
      }
    } catch (error) {
      console.error('Error loading job for editing:', error);
      toast.error('Failed to load job for editing');
    }
  };

  const publishJobPost = (jobId: number) => {
    const job = opportunities.find(j => j.id === jobId);
    if (job) {
      toast.success(`Job "${job.title}" published and students auto-listed successfully!`);
    }
  };

  const exportShortlist = (jobId: number) => {
    const job = opportunities.find(j => j.id === jobId);
    if (job) {
      const shortlistData = {
        'Job ID': job.id,
        'Job Title': job.title,
        'Company': job.company_name,
        'Department': job.department,
        'Employment Type': job.employment_type,
        'Location': job.location,
        'Applications': job.applications_count,
        'Views': job.views_count,
        'Status': job.status,
        'Created Date': new Date(job.created_at).toLocaleDateString(),
        'Deadline': job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified'
      };

      const jsonContent = JSON.stringify(shortlistData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title.replace(/\s+/g, '_')}_shortlist.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Shortlist exported for ${job.title}`);
    }
  };

  const exportJobDetails = (jobId: number) => {
    const job = opportunities.find(j => j.id === jobId);
    if (job) {
      const jobDetails = {
        'Job Title': job.title,
        'Company': job.company_name,
        'Department': job.department,
        'Employment Type': job.employment_type,
        'Work Mode': job.mode,
        'Location': job.location,
        'Salary Range': opportunitiesService.formatSalary(job),
        'Experience Required': job.experience_required,
        'Description': job.description,
        'Skills Required': opportunitiesService.formatSkills(job.skills_required).join(', '),
        'Requirements': Array.isArray(job.requirements) ? job.requirements.join('; ') : job.requirements,
        'Responsibilities': Array.isArray(job.responsibilities) ? job.responsibilities.join('; ') : job.responsibilities,
        'Benefits': Array.isArray(job.benefits) ? job.benefits.join('; ') : job.benefits,
        'Application Deadline': job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified',
        'Status': job.status,
        'Applications Count': job.applications_count,
        'Views Count': job.views_count
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

  const resetForm = () => {
    // Form reset logic commented out since form is simplified
    /*
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
    */
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Job Posting & Application Tracking</h2>
        <button 
          onClick={() => setShowAddJobModal(true)} disabled
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
        {hasError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Opportunities</h3>
              <p className="text-gray-500 mb-4">There was an error loading job opportunities. Please try again.</p>
              <button
                onClick={() => loadOpportunities()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        ) : isLoadingOpportunities ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading opportunities...</span>
          </div>
        ) : (
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
                {paginatedOpportunities.length > 0 ? (
                  paginatedOpportunities.map((job) => (
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
                        <div className="text-sm text-gray-900">{job.company_name || 'Not specified'}</div>
                        <div className="text-sm text-gray-500">Posted {new Date(job.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.employment_type}</div>
                        <div className="text-sm text-gray-500">{job.mode || 'Not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {opportunitiesService.formatSalary(job)}
                        </div>
                        <div className="text-sm text-gray-500">{job.experience_required || 'Not specified'}</div>
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No job opportunities found</h3>
                        <p className="text-gray-500 mb-4">
                          {jobSearchTerm || selectedJobStatus || selectedEmploymentType || selectedJobMode
                            ? "Try adjusting your search or filters"
                            : "No job opportunities are currently available in the system"}
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
        )}

        {/* Pagination and Results Summary */}
        {totalItems > 0 && (
          <div className="mt-4 space-y-4">
            {/* Show entries selector and results info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
              <div>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} job postings
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Results Summary */}
      {opportunities.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {opportunities.length} job opportunities
          </div>
          <div className="flex items-center gap-4">
            <span>Active: {opportunities.filter(j => j.status === 'open').length}</span>
            <span>Draft: {opportunities.filter(j => j.status === 'draft').length}</span>
            <span>Closed: {opportunities.filter(j => j.status === 'closed').length}</span>
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
                  <option value="open">Active</option>
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
                  <h2 className="text-xl font-bold text-gray-900">Job Details</h2>
                  <p className="text-sm text-gray-600">View job posting details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedJob.id}
                  onChange={(e) => {
                    const job = opportunities.find(j => j.id === parseInt(e.target.value));
                    if (job) setSelectedJob(job);
                  }}
                >
                  {opportunities.map(job => (
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
                    <p className="font-medium text-gray-900">{selectedJob.company_name || 'Not specified'}</p>
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
                    <p className="font-medium text-gray-900">{selectedJob.mode || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salary:</p>
                    <p className="font-medium text-gray-900">
                      {opportunitiesService.formatSalary(selectedJob)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience:</p>
                    <p className="font-medium text-gray-900">{selectedJob.experience_required || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              {selectedJob.description && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}

              {/* Skills Required */}
              {selectedJob.skills_required && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {opportunitiesService.formatSkills(selectedJob.skills_required).map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h4>
                  <div className="text-gray-700">
                    {Array.isArray(selectedJob.requirements) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-wrap">{selectedJob.requirements}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJob.responsibilities && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h4>
                  <div className="text-gray-700">
                    {Array.isArray(selectedJob.responsibilities) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {selectedJob.responsibilities.map((resp, index) => (
                          <li key={index}>{resp}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-wrap">{selectedJob.responsibilities}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h4>
                  <div className="text-gray-700">
                    {Array.isArray(selectedJob.benefits) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {selectedJob.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-wrap">{selectedJob.benefits}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-sm text-gray-600">
                Applications: {selectedJob.applications_count} • Views: {selectedJob.views_count} • Messages: {selectedJob.messages_count}
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

      {/* Create/Edit Job Posting Modal - Simplified for now */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
              </h2>
              <button
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
            
            <div className="p-6">
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Job Creation Form</h3>
                <p className="text-gray-500 mb-4">
                  This feature is currently under development. Job postings are displayed from the opportunities table.
                </p>
                <button
                  onClick={() => {
                    setShowAddJobModal(false);
                    setEditingJob(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostings;