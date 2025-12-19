import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar, 
  Building, 
  FileText,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SchoolAdminNotificationService } from '../../../services/schoolAdminNotificationService';
import TrainingDetailsModal from '../../../components/admin/schoolAdmin/TrainingDetailsModal';
import ExperienceDetailsModal from '../../../components/admin/schoolAdmin/ExperienceDetailsModal';
import ProjectDetailsModal from '../../../components/admin/schoolAdmin/ProjectDetailsModal';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

const Verifications: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"trainings" | "experiences" | "certificates" | "projects">("trainings");
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  const [pendingTrainings, setPendingTrainings] = useState<any[]>([]);
  const [pendingExperiences, setPendingExperiences] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get school ID
  useEffect(() => {
    const getSchoolId = async () => {
      console.log('🏫 Getting school ID for user:', user);
      
      if (!user) {
        console.log('❌ No user available');
        return;
      }

      if (user.school_id) {
        console.log('✅ Found user.school_id:', user.school_id);
        setSchoolId(user.school_id);
        return;
      }

      console.log('🔍 user.school_id not found, checking school_educators table...');
      
      try {
        const { data, error } = await supabase
          .from('school_educators')
          .select('school_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching school_id:', error);
          setSchoolId(undefined);
        } else if (data?.school_id) {
          console.log('✅ Found school_id from educators table:', data.school_id);
          setSchoolId(data.school_id);
        } else {
          console.log('❌ No school_id found in educators table');
          setSchoolId(undefined);
        }
      } catch (err) {
        console.error('❌ Failed to fetch school_id:', err);
        setSchoolId(undefined);
      }
    };

    getSchoolId();
  }, [user]);

  // Fetch data when school ID is available
  useEffect(() => {
    if (schoolId) {
      if (activeTab === 'trainings') {
        fetchTrainingData();
      } else if (activeTab === 'experiences') {
        fetchExperienceData();
      } else if (activeTab === 'projects') {
        fetchProjectData();
      }
    }
  }, [schoolId, activeTab]);

  const fetchTrainingData = async () => {
    if (!schoolId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching trainings for school:', schoolId);
      const pendingData = await SchoolAdminNotificationService.getPendingTrainings(schoolId);
      console.log('📊 Received training data:', pendingData);
      setPendingTrainings(pendingData || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExperienceData = async () => {
    if (!schoolId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching experiences for school:', schoolId);
      const pendingData = await SchoolAdminNotificationService.getPendingExperiences(schoolId);
      console.log('📊 Received experience data:', pendingData);
      setPendingExperiences(pendingData || []);
    } catch (error) {
      console.error('Error fetching experience data:', error);
      toast.error('Failed to load experience data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectData = async () => {
    console.log('🚀 fetchProjectData called, schoolId:', schoolId);
    console.log('👤 Current user:', user);
    
    if (!schoolId) {
      console.log('❌ No schoolId available, cannot fetch projects');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Fetching projects for school:', schoolId);
      const pendingData = await SchoolAdminNotificationService.getPendingProjects(schoolId);
      console.log('📊 Received project data:', pendingData);
      console.log('📊 Project count:', pendingData?.length || 0);
      setPendingProjects(pendingData || []);
    } catch (error) {
      console.error('❌ Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingAction = (action: string, training: any) => {
    if (action === 'view') {
      setSelectedTraining(training);
      setShowTrainingModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      fetchTrainingData(); // Refresh data
      toast.success(`Training ${action} successfully!`);
    }
  };

  const handleExperienceAction = (action: string, experience: any) => {
    if (action === 'view') {
      setSelectedExperience(experience);
      setShowExperienceModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      fetchExperienceData(); // Refresh data
      toast.success(`Experience ${action} successfully!`);
    }
  };

  const handleProjectAction = (action: string, project: any) => {
    if (action === 'view') {
      setSelectedProject(project);
      setShowProjectModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      fetchProjectData(); // Refresh data
      toast.success(`Project ${action} successfully!`);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'Duration not specified';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const tabs = {
    trainings: { label: "Training Approvals", icon: CheckCircle, count: pendingTrainings.length },
    experiences: { label: "Experience Approvals", icon: User, count: pendingExperiences.length },
    // certificates: { label: "Certificate Verification", icon: FileText, count: 0 },
    projects: { label: "Project Validation", icon: Building, count: pendingProjects.length }
  };

  // Filter trainings based on search and status
  const filteredTrainings = pendingTrainings.filter(training => {
    const matchesSearch = (training.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (training.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (training.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || training.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter experiences based on search and status
  const filteredExperiences = pendingExperiences.filter(experience => {
    const matchesSearch = (experience.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (experience.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (experience.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || experience.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter projects based on search and status
  const filteredProjects = pendingProjects.filter(project => {
    const matchesSearch = (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Verifications & Approvals
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Review and approve student submissions
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {Object.entries(tabs).map(([key, tab]) => {
            const Icon = tab.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === key
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === key 
                      ? "bg-white/20 text-white" 
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "trainings" && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search trainings, students, or organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Training Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTrainings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainings found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'All trainings have been reviewed'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTrainings.map((training) => (
                <div
                  key={training.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{training.student_name}</h3>
                        <p className="text-sm text-gray-600">{training.student_email}</p>
                      </div>
                    </div>
                    
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  {/* Training Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{training.title}</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{training.organization}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {formatDuration(training.start_date, training.end_date)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {formatDate(training.start_date)} - {formatDate(training.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrainingAction('view', training)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Experience Approvals Tab */}
      {activeTab === "experiences" && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search experiences, students, or organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Experience Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No experiences found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'All experiences have been reviewed'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExperiences.map((experience) => (
                <div
                  key={experience.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{experience.student_name}</h3>
                        <p className="text-sm text-gray-600">{experience.student_email}</p>
                      </div>
                    </div>
                    
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  {/* Experience Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{experience.role}</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{experience.organization}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {experience.duration || 'Duration not specified'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {formatDate(experience.start_date)} - {formatDate(experience.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExperienceAction('view', experience)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Other tabs content (placeholder) */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificate Verification</h3>
          <p className="text-gray-600">Coming soon - Certificate verification system</p>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search projects, students, or organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'All projects have been reviewed'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.project_id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.student_name}</h3>
                        <p className="text-sm text-gray-600">Student</p>
                      </div>
                    </div>
                    
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  {/* Project Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{project.title}</h4>
                    
                    <div className="space-y-2 text-sm">
                      {project.organization && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{project.organization}</span>
                        </div>
                      )}
                      
                      {project.status && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{project.status}</span>
                        </div>
                      )}
                      
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            {formatDate(project.start_date)} - {formatDate(project.end_date)}
                          </span>
                        </div>
                      )}

                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {project.tech_stack.slice(0, 3).map((tech, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {tech}
                              </span>
                            ))}
                            {project.tech_stack.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{project.tech_stack.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProjectAction('view', project)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* Training Details Modal */}
      <TrainingDetailsModal
        training={selectedTraining}
        isOpen={showTrainingModal}
        onClose={() => {
          setShowTrainingModal(false);
          setSelectedTraining(null);
        }}
        onAction={handleTrainingAction}
        currentUserId={user?.id}
      />

      {/* Experience Details Modal */}
      <ExperienceDetailsModal
        experience={selectedExperience}
        isOpen={showExperienceModal}
        onClose={() => {
          setShowExperienceModal(false);
          setSelectedExperience(null);
        }}
        onAction={handleExperienceAction}
        currentUserId={user?.id}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setSelectedProject(null);
        }}
        onAction={handleProjectAction}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default Verifications;