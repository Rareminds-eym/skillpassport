import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { BriefcaseIcon as BriefcaseSolidIcon } from '@heroicons/react/24/solid';
import { supabase } from '../../lib/supabaseClient';
import AdvancedRequisitionFilters from '../../components/Recruiter/components/AdvancedRequisitionFilters';
import { RequisitionFilters } from '../../types/recruiter';
import { useAuth } from '../../context/AuthContext';

interface Opportunity {
  id: string;
  job_title: string;
  title: string;
  company_name: string; 
  company_logo?: string;
  department: string;
  location: string;
  mode?: 'Remote' | 'On-site' | 'Hybrid';
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  salary_range_min?: number;
  experience_required?: string;  
  skills_required?: string[];  
  deadline?: string;  
  benefits?: string[];
  salary_range_max?: number;
  status: 'draft' | 'open' | 'closed' | 'on_hold';
  posted_date: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applications_count: number;
  messages_count: number;
  views_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  recruiter_id?: string;
}

const Requisitions = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Opportunity | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [currentRecruiterId, setCurrentRecruiterId] = useState<string | null>(null);
  
  // Sorting State
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState<RequisitionFilters>({
    dateRange: {},
    status: [],
    departments: [],
    workModes: [],
    locations: [],
    experienceRequired: [],
    titles: [],
    employmentTypes: [],
    experienceLevels: [],
    salaryRange: {},
    applicationCountRange: 'all'
  });
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalCount, setTotalCount] = useState(0);

  // Load recruiters and current recruiter
  useEffect(() => {
    loadRecruiters();
    loadCurrentRecruiter();
  }, [user]);

  // Load requisitions from Supabase
  // useEffect(() => {
  //   loadRequisitions();
  // }, [searchQuery, statusFilter, advancedFilters, sortField, sortDirection]);
  // Load requisitions when pagination changes
useEffect(() => {
  loadRequisitions();
}, [searchQuery, statusFilter, advancedFilters, sortField, sortDirection, currentPage, itemsPerPage]);

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter, advancedFilters, sortField, sortDirection]);

  const loadRecruiters = async () => {
    try {
      const { data, error } = await supabase
        .from('recruiters')
        .select('id, name, email')
        .eq('isactive', true)
        .order('name');

      if (error) {
        console.error('Error loading recruiters:', error);
        return;
      }

      setRecruiters(data || []);
    } catch (error) {
      console.error('Error loading recruiters:', error);
    }
  };

  const loadCurrentRecruiter = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('recruiters')
        .select('id')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Error loading current recruiter:', error);
        return;
      }

      if (data) {
        setCurrentRecruiterId(data.id);
      }
    } catch (error) {
      console.error('Error loading current recruiter:', error);
    }
  };

  const loadRequisitions = async () => {
    setLoading(true);
    try {
      // Build Supabase query with SQL-optimized filters
      // let query = supabase
      //   .from('opportunities')
      //   .select('*');
      let query = supabase
  .from('opportunities')
  .select('*', { count: 'exact' });

      // Apply search query filter (case-insensitive)
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      // Apply basic status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply advanced filters with SQL optimization
      if (advancedFilters.status.length > 0) {
        query = query.in('status', advancedFilters.status);
      }

      if (advancedFilters.departments.length > 0) {
        query = query.in('department', advancedFilters.departments);
      }

      if (advancedFilters.locations.length > 0) {
        query = query.in('location', advancedFilters.locations);
      }

      if (advancedFilters.employmentTypes.length > 0) {
        query = query.in('employment_type', advancedFilters.employmentTypes);
      }

      if (advancedFilters.experienceLevels.length > 0) {
        query = query.in('experience_level', advancedFilters.experienceLevels);
      }

      // Salary range filters
      if (advancedFilters.salaryRange.min) {
        query = query.gte('salary_range_min', advancedFilters.salaryRange.min);
      }
      if (advancedFilters.salaryRange.max) {
        query = query.lte('salary_range_max', advancedFilters.salaryRange.max);
      }

      // Application count filter with smart ranges
      if (advancedFilters.applicationCountRange && advancedFilters.applicationCountRange !== 'all') {
        const rangeMap: Record<string, { min: number; max: number | null }> = {
          '0': { min: 0, max: 0 },
          '1-5': { min: 1, max: 5 },
          '6-20': { min: 6, max: 20 },
          '21-50': { min: 21, max: 50 },
          '50+': { min: 51, max: null },
        };
        
        const range = rangeMap[advancedFilters.applicationCountRange];
        if (range) {
          query = query.gte('applications_count', range.min);
          if (range.max !== null) {
            query = query.lte('applications_count', range.max);
          }
        }
      }

      // Date range filters
      if (advancedFilters.dateRange.startDate) {
        query = query.gte('posted_date', advancedFilters.dateRange.startDate);
      }
      if (advancedFilters.dateRange.endDate) {
        query = query.lte('posted_date', advancedFilters.dateRange.endDate);
      }

      // Apply sorting (SQL-optimized)
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // const { data, error } = await query;
      // 🆕 ADD THESE 5 LINES HERE:
// Apply pagination
const from = (currentPage - 1) * itemsPerPage;
const to = from + itemsPerPage - 1;
query = query.range(from, to);

const { data, error, count } = await query;  // ✅ CHANGED: Added 'count'
// 🆕 ADD THIS LINE HERE
console.log("Fetched cards from DB:", data?.length, "out of total:", count);
// 🆕 ADD THIS LINE HERE:
// Set total count for pagination
setTotalCount(count || 0);

      if (error) {
        console.error('Error loading opportunities:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedData: Opportunity[] = (data || []).map(opp => ({
        ...opp,
        job_title: opp.title || opp.job_title || '',
        requirements: opp.requirements || [],
        responsibilities: opp.responsibilities || [],
        benefits: opp.benefits || [],
        applications_count: opp.applications_count || 0,
        messages_count: opp.messages_count || 0,
        views_count: opp.views_count || 0,
        employment_type: (opp.employment_type as any) || 'Full-time',
        experience_level: (opp.experience_level as any) || 'Mid',
        status: (opp.status as any) || 'draft'
      }));

      setRequisitions(transformedData);
    } catch (error) {
      console.error('Error loading requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequisition = async (requisitionData: any): Promise<Opportunity> => {
  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      title: requisitionData.job_title,
      job_title: requisitionData.job_title,
      company_name: requisitionData.company_name,  // MODIFY THIS - use actual value
      company_logo: requisitionData.company_logo,  // ADD THIS
      mode: requisitionData.mode,  // ADD THIS
      department: requisitionData.department,
      location: requisitionData.location,
      employment_type: requisitionData.employment_type,
      experience_level: requisitionData.experience_level,
      experience_required: requisitionData.experience_required,  // ADD THIS
      skills_required: requisitionData.skills_required,  // ADD THIS
      deadline: requisitionData.deadline,  // ADD THIS
      benefits: requisitionData.benefits,  // ADD THIS
      salary_range_min: requisitionData.salary_range_min,
      salary_range_max: requisitionData.salary_range_max,
      status: requisitionData.status,
      description: requisitionData.description,
      requirements: requisitionData.requirements,
      responsibilities: requisitionData.responsibilities,
      applications_count: 0,
      messages_count: 0,
      views_count: 0,
      created_by: user?.id,
      posted_date: new Date().toISOString(),
      is_active: requisitionData.status === 'open',
      recruiter_id: requisitionData.recruiter_id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

  const updateRequisition = async (id: string, updates: any): Promise<Opportunity> => {
    const { data, error } = await supabase
      .from('opportunities')
      .update({
        ...updates,
        title: updates.job_title,
        updated_at: new Date().toISOString(),
        is_active: updates.status === 'open'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteRequisition = async (id: string) => {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };


  const handleResetFilters = () => {
    setAdvancedFilters({
      dateRange: {},
      status: [],
      departments: [],
      workModes: [],
      locations: [],
      titles: [],
      experienceRequired: [],
      employmentTypes: [],
      experienceLevels: [],
      salaryRange: {},
      applicationCountRange: 'all'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      closed: 'bg-red-100 text-red-800 border-red-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircleIcon className="h-4 w-4" />;
      case 'closed': return <XCircleIcon className="h-4 w-4" />;
      case 'on_hold': return <ClockIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this requisition?')) {
      try {
        await deleteRequisition(id);
        setRequisitions(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting requisition:', error);
        alert('Error deleting requisition');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await updateRequisition(id, { status: newStatus });
      setRequisitions(prev => prev.map(r => 
        r.id === id ? { ...r, ...updated } : r
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-primary-600" />
      : <ChevronDownIcon className="h-4 w-4 text-primary-600" />;
  };
   
  // 🆕🆕🆕 ADD THESE LINES HERE 🆕🆕🆕
const totalPages = Math.ceil(totalCount / itemsPerPage);
const startItem = (currentPage - 1) * itemsPerPage + 1;
const endItem = Math.min(currentPage * itemsPerPage, totalCount);

const goToPage = (page: number) => {
  setCurrentPage(Math.max(1, Math.min(page, totalPages)));
};
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Requisitions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {requisitions.length} requisition{requisitions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Requisition
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {/* Results Count & Sort Info */}
          {/* {requisitions.length > 0 && ( */}
          {totalCount > 0 && (
            <div className="hidden md:flex items-center px-3 py-2 bg-gray-100 rounded-md text-xs text-gray-600">
              {/* <span className="font-medium">{requisitions.length}</span>
              <span className="mx-1">results</span> */}
              <span className="font-medium">{totalCount}</span>
  <span className="mx-1">total results</span>
              {sortField && (
                <>
                  <span className="mx-1">•</span>
                  <span>sorted by</span>
                  <span className="ml-1 font-medium">
                    {sortField === 'job_title' ? 'Job Title' :
                     sortField === 'created_at' ? 'Created Date' :
                     sortField === 'posted_date' ? 'Posted Date' :
                     sortField === 'applications_count' ? 'Applications' :
                     sortField === 'department' ? 'Department' :
                     sortField === 'location' ? 'Location' :
                     sortField === 'salary_range_min' ? 'Salary' :
                     sortField}
                  </span>
                  {sortDirection === 'asc' ? <ChevronUpIcon className="h-3 w-3 ml-1" /> : <ChevronDownIcon className="h-3 w-3 ml-1" />}
                </>
              )}
            </div>
          )}
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="draft">Draft</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
          </select>

          <AdvancedRequisitionFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onReset={handleResetFilters}
            onApply={loadRequisitions}
          />

          {/* Sorting Dropdown */}
          <div className="relative">
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field);
                setSortDirection(direction as 'asc' | 'desc');
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white text-sm"
            >
              <optgroup label="Date">
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="posted_date-desc">Recently Posted</option>
                <option value="posted_date-asc">Oldest Posted</option>
              </optgroup>
              <optgroup label="Applications">
                <option value="applications_count-desc">Most Applications</option>
                <option value="applications_count-asc">Least Applications</option>
              </optgroup>
              <optgroup label="Alphabetical">
                <option value="job_title-asc">Job Title (A-Z)</option>
                <option value="job_title-desc">Job Title (Z-A)</option>
                <option value="department-asc">Department (A-Z)</option>
                <option value="department-desc">Department (Z-A)</option>
                <option value="location-asc">Location (A-Z)</option>
                <option value="location-desc">Location (Z-A)</option>
              </optgroup>
              <optgroup label="Salary">
                <option value="salary_range_min-desc">Highest Salary</option>
                <option value="salary_range_min-asc">Lowest Salary</option>
              </optgroup>
            </select>
            <ArrowsUpDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 border rounded-md ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 border rounded-md ${
                viewMode === 'list'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseSolidIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requisitions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating a new requisition'}
            </p>
            {searchQuery === '' && statusFilter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Requisition
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requisitions.map((req) => (
              <RequisitionCard
                key={req.id}
                requisition={req}
                onView={(r) => {
                  setSelectedRequisition(r);
                  setShowViewModal(true);
                }}
                onEdit={(r) => {
                  setSelectedRequisition(r);
                  setShowEditModal(true);
                }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onViewApplications={(r) => {
                  setSelectedRequisition(r);
                  setShowApplicationsModal(true);
                }}
                onViewMessages={(r) => {
                  setSelectedRequisition(r);
                  setShowMessagesModal(true);
                }}
                getStatusBadge={getStatusBadge}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('job_title')}
                  >
                    <div className="flex items-center gap-2">
                      Job Title
                      {getSortIcon('job_title')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center gap-2">
                      Department
                      {getSortIcon('department')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-2">
                      Location
                      {getSortIcon('location')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('applications_count')}
                  >
                    <div className="flex items-center gap-2">
                      Applications
                      {getSortIcon('applications_count')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('posted_date')}
                  >
                    <div className="flex items-center gap-2">
                      Posted
                      {getSortIcon('posted_date')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{req.job_title}</div>
                          <div className="text-xs text-gray-500">{req.employment_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {req.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(req.status)}`}>
                        {getStatusIcon(req.status)}
                        <span className="ml-1 capitalize">{req.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowApplicationsModal(true);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-900"
                        >
                          {req.applications_count} apps
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowMessagesModal(true);
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {req.messages_count} msgs
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.posted_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowViewModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowEditModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* 🆕🆕🆕 PAGINATION UI STARTS HERE 🆕🆕🆕 */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
             <div>
    <p className="text-sm text-gray-700">
      Showing <span className="font-medium">{startItem}</span> to{' '}
      <span className="font-medium">{endItem}</span> of{' '}
      <span className="font-medium">{totalCount}</span> results
    </p>
  </div>
             <div>
    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">

      {/* Previous Button */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronUpIcon className="h-5 w-5 rotate-[-90deg] mr-1" aria-hidden="true" />
        <span>Previous</span>
      </button>
                
                {/* Page Numbers */}
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
            onClick={() => goToPage(pageNum)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
              currentPage === pageNum
                ? 'z-10 bg-primary-600 text-white'
                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </button>
                  );
                })}
                
                 {/* Next Button */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Next</span>
        <ChevronUpIcon className="h-5 w-5 rotate-90 ml-1" aria-hidden="true" />
      </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRequisitionModal
          recruiters={recruiters}
          currentRecruiterId={currentRecruiterId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (newReqData) => {
            try {
              const newReq = await createRequisition(newReqData);
              setRequisitions(prev => [newReq, ...prev]);
              setShowCreateModal(false);
            } catch (error) {
              console.error('Error creating requisition:', error);
              alert('Error creating requisition');
            }
          }}
        />
      )}

      {showEditModal && selectedRequisition && (
        <EditRequisitionModal
          requisition={selectedRequisition}
          recruiters={recruiters}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequisition(null);
          }}
          onSuccess={async (updatedData) => {
            try {
              const updated = await updateRequisition(selectedRequisition.id, updatedData);
              setRequisitions(prev => prev.map(r => r.id === updated.id ? updated : r));
              setShowEditModal(false);
              setSelectedRequisition(null);
            } catch (error) {
              console.error('Error updating requisition:', error);
              alert('Error updating requisition');
            }
          }}
        />
      )}

      {showViewModal && selectedRequisition && (
        <ViewRequisitionModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}

      {showApplicationsModal && selectedRequisition && (
        <ApplicationsModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowApplicationsModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}

      {showMessagesModal && selectedRequisition && (
        <MessagesModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowMessagesModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}
    </div>
  );
};

// Requisition Card Component (unchanged)
const RequisitionCard = ({ requisition, onView, onEdit, onDelete, onStatusChange, onViewApplications, onViewMessages, getStatusBadge, getStatusIcon }: any) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
  <div className="flex items-start space-x-3 flex-1">
    {/* ADD COMPANY LOGO */}
    {requisition.company_logo && (
      <img 
        src={requisition.company_logo} 
        alt={requisition.company_name}
        className="h-12 w-12 rounded-lg object-contain border border-gray-200"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    )}
    
    <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {requisition.job_title}
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-2 truncate">
              {requisition.company_name}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-1" />
                {requisition.department}
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {requisition.location}
              </span>
              {/* ADD MODE BADGE */}
              {requisition.mode && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {requisition.mode.charAt(0).toUpperCase() + requisition.mode.slice(1)}
                  </span>
                </>
              )}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => { onView(requisition); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <EyeIcon className="h-4 w-4 inline mr-2" />
                    View Details
                  </button>
                  <button
                    onClick={() => { onEdit(requisition); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PencilIcon className="h-4 w-4 inline mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(requisition.id); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 inline mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(requisition.status)}`}>
            {getStatusIcon(requisition.status)}
            <span className="ml-1 capitalize">{requisition.status.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>{requisition.employment_type} • {requisition.experience_level} Level</span>
          </div>
          {requisition.salary_range_min && (
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              <span>₹{(requisition.salary_range_min / 100000).toFixed(1)}L - ₹{(requisition.salary_range_max! / 100000).toFixed(1)}L</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>Posted {new Date(requisition.posted_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onViewApplications(requisition)}
            className="text-center hover:bg-gray-50 rounded p-2"
          >
            <div className="text-2xl font-semibold text-primary-600">{requisition.applications_count}</div>
            <div className="text-xs text-gray-600">Applications</div>
          </button>
          <button
            onClick={() => onViewMessages(requisition)}
            className="text-center hover:bg-gray-50 rounded p-2"
          >
            <div className="text-2xl font-semibold text-gray-900">{requisition.messages_count}</div>
            <div className="text-xs text-gray-600">Messages</div>
          </button>
          <div className="text-center p-2">
            <div className="text-2xl font-semibold text-gray-900">{requisition.views_count}</div>
            <div className="text-xs text-gray-600">Views</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Components (unchanged - they already work with the interface)
const CreateRequisitionModal = ({ recruiters, currentRecruiterId, onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    company_logo: '',
    department: '',
    location: '',
    mode: 'On-site',
    employment_type: 'Full-time',
    experience_level: 'Mid',
    experience_required: '',  
    skills_required: '',
    deadline: '',  
    benefits: '',
    salary_range_min: '',
    salary_range_max: '',
    description: '',
    requirements: '',
    responsibilities: '',
    status: 'draft',
    recruiter_id: currentRecruiterId || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSuccess({
        ...formData,
        salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : undefined,
        salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : undefined,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Create Job Requisition</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Tech Corp Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo URL
                </label>
                <input
                  type="url"
                  value={formData.company_logo}
                  onChange={(e) => setFormData({...formData, company_logo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Mode <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.mode}
                  onChange={(e) => setFormData({...formData, mode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Bangalore, Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employment_type}
                  onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.experience_level}
                  onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead/Principal</option>
                </select>
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Required
                </label>
                <input
                  type="text"
                  value={formData.experience_required}
                  onChange={(e) => setFormData({...formData, experience_required: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 3-5 years"
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recruiter <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.recruiter_id}
                onChange={(e) => setFormData({...formData, recruiter_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a recruiter</option>
                {recruiters.map((recruiter: any) => (
                  <option key={recruiter.id} value={recruiter.id}>
                    {recruiter.name} ({recruiter.email})
                  </option>
                ))}
              </select>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Min (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_min}
                  onChange={(e) => setFormData({...formData, salary_range_min: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 1500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Max (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_max}
                  onChange={(e) => setFormData({...formData, salary_range_max: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 2500000"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required <span className="text-xs text-gray-500">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.skills_required}
                onChange={(e) => setFormData({...formData, skills_required: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., React, Node.js, TypeScript, SQL"
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.benefits}
                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Health insurance&#10;Remote work&#10;Learning budget"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5+ years experience&#10;React, Node.js expertise&#10;Team leadership"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Design and implement features&#10;Code reviews&#10;Mentor team members"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Create Requisition
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditRequisitionModal = ({ requisition, recruiters, onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    job_title: requisition.job_title,
    company_name: requisition.company_name,  // ADD THIS
    company_logo: requisition.company_logo,
    department: requisition.department,
    location: requisition.location,
    mode: requisition.mode || 'on-site',  // ADD THIS with default
    employment_type: requisition.employment_type,
    experience_level: requisition.experience_level,
    experience_required: requisition.experience_required || '',  
    skills_required: requisition.skills_required?.join(', ') || '',  
    deadline: requisition.deadline || '',  
    benefits: requisition.benefits?.join('\n') || '',  
    salary_range_min: requisition.salary_range_min?.toString() || '',
    salary_range_max: requisition.salary_range_max?.toString() || '',
    description: requisition.description,
    requirements: requisition.requirements?.join('\n') || '',
    responsibilities: requisition.responsibilities?.join('\n') || '',
    status: requisition.status,
    recruiter_id: requisition.recruiter_id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSuccess({
        ...formData,
        company_name: formData.company_name,  
        company_logo: formData.company_logo || null,  
        mode: formData.mode || 'on-site',  
        experience_required: formData.experience_required || null,  
        skills_required: formData.skills_required 
          ? formData.skills_required.split(',').map(s => s.trim()).filter(s => s)
          : [],  
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,  
        benefits: formData.benefits.split('\n').filter(b => b.trim()),  
        salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : undefined,
        salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : undefined,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Edit Job Requisition</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Bangalore, Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employment_type}
                  onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.experience_level}
                  onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead/Principal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recruiter <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.recruiter_id}
                onChange={(e) => setFormData({...formData, recruiter_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a recruiter</option>
                {recruiters.map((recruiter: any) => (
                  <option key={recruiter.id} value={recruiter.id}>
                    {recruiter.name} ({recruiter.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Min (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_min}
                  onChange={(e) => setFormData({...formData, salary_range_min: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 1500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Max (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_max}
                  onChange={(e) => setFormData({...formData, salary_range_max: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 2500000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5+ years experience&#10;React, Node.js expertise&#10;Team leadership"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Design and implement features&#10;Code reviews&#10;Mentor team members"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Update Requisition
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ViewRequisitionModal = ({ requisition, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-4">{requisition.job_title}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{requisition.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1">
                {requisition.requirements?.map((req: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1">
                {requisition.responsibilities?.map((resp: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{resp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationsModal = ({ requisition, onClose }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    loadApplications();
  }, [requisition.id]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
          id,
          application_status,
          applied_at,
          viewed_at,
          interview_scheduled_at,
          updated_at,
          students (
            id,
            email,
            profile
          )
        `)
        .eq('opportunity_id', requisition.id)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error loading applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      viewed: 'bg-gray-100 text-gray-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      offer_received: 'bg-green-100 text-green-800',
      accepted: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-200 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-2">Applications for {requisition.job_title}</h2>
          <p className="text-gray-600 mb-6">{applications.length} applications received</p>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No applications received yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => {
                    const profile = app.students?.profile || {};
                    const relativeTime = formatRelativeTime(app.applied_at);
                    
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        {/* Candidate */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-sm">
                                  {(profile.name || 'N/A').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {profile.name || 'Unknown Candidate'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {profile.email || app.students?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Position */}
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {profile.branch_field || profile.course || 'N/A'}
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {app.application_status.replace('_', ' ')}
                          </span>
                        </td>
                        
                        {/* Applied */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {relativeTime}
                        </td>
                        
                        {/* Experience */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {profile.course || 'N/A'}
                        </td>
                        
                        {/* Rating */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= 4 ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedStudent({ ...app, profile })}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-600 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md border border-red-600 transition-colors"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Student Detail Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 z-60 overflow-y-auto" onClick={() => setSelectedStudent(null)}>
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75"></div>
                <div className="relative bg-white rounded-lg max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                  <h3 className="text-2xl font-bold mb-6">{selectedStudent.profile.name || 'Candidate Details'}</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Passport ID</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.profile.nm_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Registration Number</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.profile.registration_number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.profile.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Age</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.profile.age || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Course</label>
                      <p className="mt-1 text-gray-900">{selectedStudent.profile.course || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Branch/Field</label>
                      <p className="mt-1 text-gray-900">{selectedStudent.profile.branch_field || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Skills</label>
                      <p className="mt-1 text-gray-900">{selectedStudent.profile.skill || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Alternate Contact</label>
                      <p className="mt-1 text-gray-900">{selectedStudent.profile.alternate_number || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Application Status</label>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedStudent.application_status)}`}>
                        {selectedStudent.application_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t flex space-x-3">
                      <button
                        onClick={() => window.open(`mailto:${selectedStudent.profile.email}`, '_blank')}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        Send Email
                      </button>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessagesModal = ({ requisition, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-4">Messages for {requisition.job_title}</h2>
          <p className="text-gray-600 mb-4">{requisition.messages_count} messages</p>
          <div className="text-center py-12 text-gray-500">
            Messages will be displayed here
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requisitions;