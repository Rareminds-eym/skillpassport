import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Building2, 
  MapPin, 
  DollarSign,
  Eye,
  Filter,
  Search,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      const mockApplications = [
        {
          id: 1,
          jobTitle: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          salary: '$80k - $120k',
          appliedDate: '2025-10-15',
          status: 'under_review',
          logo: 'https://via.placeholder.com/48',
          type: 'Full-time',
          level: 'Mid-level',
          lastUpdate: '2 days ago'
        },
        {
          id: 2,
          jobTitle: 'UX Designer',
          company: 'Design Studio',
          location: 'Remote',
          salary: '$70k - $100k',
          appliedDate: '2025-10-12',
          status: 'interview_scheduled',
          logo: 'https://via.placeholder.com/48',
          type: 'Contract',
          level: 'Senior',
          lastUpdate: '1 week ago'
        },
        {
          id: 3,
          jobTitle: 'Backend Engineer',
          company: 'StartupXYZ',
          location: 'New York, NY',
          salary: '$90k - $130k',
          appliedDate: '2025-10-08',
          status: 'rejected',
          logo: 'https://via.placeholder.com/48',
          type: 'Full-time',
          level: 'Junior',
          lastUpdate: '3 weeks ago'
        },
        {
          id: 4,
          jobTitle: 'Full Stack Developer',
          company: 'Innovation Labs',
          location: 'Austin, TX',
          salary: '$85k - $115k',
          appliedDate: '2025-10-20',
          status: 'accepted',
          logo: 'https://via.placeholder.com/48',
          type: 'Full-time',
          level: 'Mid-level',
          lastUpdate: '1 day ago'
        },
        {
          id: 5,
          jobTitle: 'Product Designer',
          company: 'Creative Agency',
          location: 'Los Angeles, CA',
          salary: '$75k - $105k',
          appliedDate: '2025-10-18',
          status: 'pending',
          logo: 'https://via.placeholder.com/48',
          type: 'Part-time',
          level: 'Entry',
          lastUpdate: '5 days ago'
        }
      ];
      setApplications(mockApplications);
      setFilteredApplications(mockApplications);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, applications]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pending',
        icon: Clock,
        color: 'text-gray-700',
        bg: 'bg-gray-50',
        border: 'border-gray-300'
      },
      under_review: {
        label: 'Under Review',
        icon: Eye,
        color: 'text-slate-700',
        bg: 'bg-slate-50',
        border: 'border-slate-300'
      },
      interview_scheduled: {
        label: 'Interview Scheduled',
        icon: Calendar,
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200'
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle2,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200'
      },
      rejected: {
        label: 'Rejected',
        icon: XCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-300'
      }
    };
    return configs[status] || configs.pending;
  };

  const stats = [
    { label: 'Total Applied', value: applications.length, icon: Briefcase, color: 'bg-slate-700' },
    { label: 'Under Review', value: applications.filter(a => a.status === 'under_review').length, icon: Eye, color: 'bg-slate-600' },
    { label: 'Interviews', value: applications.filter(a => a.status === 'interview_scheduled').length, icon: Calendar, color: 'bg-slate-600' },
    { label: 'Accepted', value: applications.filter(a => a.status === 'accepted').length, icon: CheckCircle2, color: 'bg-slate-700' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-700"></div>
          <p className="text-gray-600 font-medium">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-slate-700" />
              My Applications
            </h1>
            <p className="text-gray-600 mt-1">Track and manage your job applications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          <Building2 className="w-8 h-8 text-slate-600" />
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                              {app.jobTitle}
                            </h3>
                            <p className="text-gray-600 font-medium mt-1">{app.company}</p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                            <span className={`text-sm font-semibold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{app.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span>{app.salary}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            <span>Updated {app.lastUpdate}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                            {app.type}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {app.level}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex lg:flex-col gap-2">
                        <button className="flex-1 lg:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button className="flex-1 lg:flex-none px-4 py-2 bg-white border-2 border-gray-300 hover:border-slate-700 text-gray-700 hover:text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;

