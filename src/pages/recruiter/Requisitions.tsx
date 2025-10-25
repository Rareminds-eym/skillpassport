import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { BriefcaseIcon as BriefcaseSolidIcon } from '@heroicons/react/24/solid';

interface Requisition {
  id: string;
  job_title: string;
  department: string;
  location: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  salary_range_min?: number;
  salary_range_max?: number;
  status: 'draft' | 'open' | 'closed' | 'on_hold';
  posted_date: string;
  closing_date?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  applications_count: number;
  messages_count: number;
  views_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const Requisitions = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load requisitions (mock data for now)
  useEffect(() => {
    loadRequisitions();
  }, []);

  const loadRequisitions = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setRequisitions([
        {
          id: 'req_001',
          job_title: 'Senior Full Stack Developer',
          department: 'Engineering',
          location: 'Bangalore',
          employment_type: 'Full-time',
          experience_level: 'Senior',
          salary_range_min: 1500000,
          salary_range_max: 2500000,
          status: 'open',
          posted_date: '2025-01-15',
          closing_date: '2025-02-28',
          description: 'We are looking for an experienced Full Stack Developer...',
          requirements: ['5+ years experience', 'React, Node.js', 'SQL/NoSQL databases'],
          responsibilities: ['Design and implement features', 'Code reviews', 'Mentor junior developers'],
          benefits: ['Health insurance', 'Remote work', 'Learning budget'],
          applications_count: 45,
          messages_count: 12,
          views_count: 320,
          created_by: 'recruiter@company.com',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z'
        },
        {
          id: 'req_002',
          job_title: 'Product Manager',
          department: 'Product',
          location: 'Remote',
          employment_type: 'Full-time',
          experience_level: 'Mid',
          salary_range_min: 1200000,
          salary_range_max: 1800000,
          status: 'open',
          posted_date: '2025-01-18',
          closing_date: '2025-02-20',
          description: 'Join our product team to shape the future...',
          requirements: ['3+ years PM experience', 'Agile methodology', 'Stakeholder management'],
          responsibilities: ['Define product roadmap', 'Coordinate with teams', 'Analyze metrics'],
          applications_count: 28,
          messages_count: 7,
          views_count: 180,
          created_by: 'recruiter@company.com',
          created_at: '2025-01-18T10:00:00Z',
          updated_at: '2025-01-18T10:00:00Z'
        },
        {
          id: 'req_003',
          job_title: 'Data Science Intern',
          department: 'Data',
          location: 'Hyderabad',
          employment_type: 'Internship',
          experience_level: 'Entry',
          status: 'draft',
          posted_date: '2025-01-20',
          description: 'Summer internship program for data science enthusiasts...',
          requirements: ['Python, R', 'Machine Learning basics', 'Currently pursuing degree'],
          responsibilities: ['Data analysis', 'Model building', 'Report generation'],
          applications_count: 0,
          messages_count: 0,
          views_count: 0,
          created_by: 'recruiter@company.com',
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z'
        }
      ]);
      setLoading(false);
    }, 800);
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = searchQuery === '' || 
      req.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this requisition?')) {
      setRequisitions(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setRequisitions(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus as any } : r
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Requisitions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredRequisitions.length} requisition{filteredRequisitions.length !== 1 ? 's' : ''}
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
        ) : filteredRequisitions.length === 0 ? (
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
            {filteredRequisitions.map((req) => (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequisitions.map((req) => (
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
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRequisitionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newReq) => {
            setRequisitions(prev => [newReq, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {showEditModal && selectedRequisition && (
        <EditRequisitionModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequisition(null);
          }}
          onSuccess={(updated) => {
            setRequisitions(prev => prev.map(r => r.id === updated.id ? updated : r));
            setShowEditModal(false);
            setSelectedRequisition(null);
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

// Requisition Card Component
const RequisitionCard = ({ requisition, onView, onEdit, onDelete, onStatusChange, onViewApplications, onViewMessages, getStatusBadge, getStatusIcon }: any) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {requisition.job_title}
            </h3>
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

// Modal Components (simplified - you'll expand these)
const CreateRequisitionModal = ({ onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: 'Full-time',
    experience_level: 'Mid',
    salary_range_min: '',
    salary_range_max: '',
    description: '',
    requirements: '',
    responsibilities: '',
    status: 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: Requisition = {
      id: `req_${Date.now()}`,
      ...formData,
      salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : undefined,
      salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : undefined,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
      applications_count: 0,
      messages_count: 0,
      views_count: 0,
      posted_date: new Date().toISOString(),
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;
    onSuccess(newReq);
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
                Create Requisition
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditRequisitionModal = ({ requisition, onClose, onSuccess }: any) => {
  return <CreateRequisitionModal onClose={onClose} onSuccess={onSuccess} />;
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
                {requisition.requirements.map((req: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1">
                {requisition.responsibilities.map((resp: string, idx: number) => (
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
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-6xl w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-4">Applications for {requisition.job_title}</h2>
          <p className="text-gray-600 mb-4">{requisition.applications_count} applications received</p>
          <div className="text-center py-12 text-gray-500">
            Applications list will be displayed here
          </div>
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
