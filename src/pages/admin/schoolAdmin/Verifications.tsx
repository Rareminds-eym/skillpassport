// @ts-nocheck - Excluded from typecheck for gradual migration
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/Students/components/ui/card';
import { Button } from '@/components/Students/components/ui/button';
import { Badge } from '@/components/Students/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Students/components/ui/tabs';
import {
  Clock,
  XCircle,
  User,
  BookOpen,
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
  Timer,
  Eye,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Grid3X3,
  List,
  Mail,
  Award,
  Building,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SchoolAdminNotificationService } from '../../../services/schoolAdminNotificationService';
import TrainingDetailsModal from '../../../components/admin/schoolAdmin/TrainingDetailsModal';
import ExperienceDetailsModal from '../../../components/admin/schoolAdmin/ExperienceDetailsModal';
import ProjectDetailsModal from '../../../components/admin/schoolAdmin/ProjectDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../../../lib/supabaseClient';

const Verifications: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'trainings' | 'experiences' | 'certificates' | 'projects'
  >('trainings');
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Search and filter state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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
      toast({
        title: 'Error',
        description: 'Failed to load training data',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Failed to load experience data',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
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
      toast({
        title: 'Success',
        description: `Training ${action} successfully!`,
      });
    }
  };

  const handleExperienceAction = (action: string, experience: any) => {
    if (action === 'view') {
      setSelectedExperience(experience);
      setShowExperienceModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      fetchExperienceData(); // Refresh data
      toast({
        title: 'Success',
        description: `Experience ${action} successfully!`,
      });
    }
  };

  const handleProjectAction = (action: string, project: any) => {
    if (action === 'view') {
      setSelectedProject(project);
      setShowProjectModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      fetchProjectData(); // Refresh data
      toast({
        title: 'Success',
        description: `Project ${action} successfully!`,
      });
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

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchTrainingData(), fetchExperienceData(), fetchProjectData()]);
    setLoading(false);
    toast({
      title: 'Refreshed',
      description: 'Data has been refreshed successfully',
    });
  };

  // Pagination helper functions
  const getCurrentPageData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    setCurrentPage(1); // Reset to first page when changing tabs
    setSearchQuery(''); // Reset search when changing tabs
    setStatusFilter('all'); // Reset filter when changing tabs
  };

  const tabs = {
    trainings: { label: 'Training Approvals', icon: CheckCircle, count: pendingTrainings.length },
    experiences: { label: 'Experience Approvals', icon: User, count: pendingExperiences.length },
    // certificates: { label: "Certificate Verification", icon: FileText, count: 0 },
    projects: { label: 'Project Validation', icon: Building, count: pendingProjects.length },
  };

  // Filter functions
  const getFilteredTrainings = () => {
    return pendingTrainings.filter((training) => {
      const matchesSearch =
        (training.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (training.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (training.organization || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || training.approval_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredExperiences = () => {
    return pendingExperiences.filter((experience) => {
      const matchesSearch =
        (experience.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (experience.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (experience.organization || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || experience.approval_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredProjects = () => {
    return pendingProjects.filter((project) => {
      const matchesSearch =
        (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.organization || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || project.approval_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  // Get current page data for each tab (with filtering)
  const filteredTrainings = getFilteredTrainings();
  const filteredExperiences = getFilteredExperiences();
  const filteredProjects = getFilteredProjects();

  const currentTrainings = getCurrentPageData(filteredTrainings);
  const currentExperiences = getCurrentPageData(filteredExperiences);
  const currentProjects = getCurrentPageData(filteredProjects);

  // Get total pages for current tab (with filtering)
  const getCurrentTabTotalPages = () => {
    switch (activeTab) {
      case 'trainings':
        return getTotalPages(filteredTrainings);
      case 'experiences':
        return getTotalPages(filteredExperiences);
      case 'projects':
        return getTotalPages(filteredProjects);
      default:
        return 1;
    }
  };

  // Pagination Component
  const PaginationControls = ({
    totalPages,
    currentPage,
    onPageChange,
  }: {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6 px-4">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Training Card Component
  const TrainingCard = ({ training }: { training: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {training.student_name || 'Unknown Student'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(training.created_at || training.start_date).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{training.student_email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>{training.title}</span>
          </div>
          {training.organization && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{training.organization}</span>
              {training.organization.toLowerCase() === 'rareminds' && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">Rareminds Training</Badge>
              )}
            </div>
          )}

          {training.duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{training.duration}</span>
            </div>
          )}

          {training.hours_spent > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Timer className="w-4 h-4" />
              <span>{training.hours_spent} hours</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>School: {training.school_name || 'Unknown'}</span>
          </div>
        </div>

        {training.skills && training.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {training.skills.slice(0, 3).map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {training.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{training.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">School Admin</Badge>
          </div>
          <Button
            onClick={() => handleTrainingAction('view', training)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Experience Card Component
  const ExperienceCard = ({ experience }: { experience: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {experience.student_name || 'Unknown Student'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted:{' '}
            {new Date(experience.created_at || experience.start_date).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{experience.student_email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span>{experience.role}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{experience.organization}</span>
          </div>

          {experience.duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{experience.duration}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">School Admin</Badge>
          </div>
          <Button
            onClick={() => handleExperienceAction('view', experience)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Project Card Component
  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {project.student_name || 'Unknown Student'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(project.created_at || project.start_date).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{project.student_email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{project.title}</span>
          </div>

          {project.organization && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{project.organization}</span>
            </div>
          )}

          {project.status && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Status: {project.status}</span>
            </div>
          )}

          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} -
                {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          )}

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex flex-wrap gap-1">
                {project.tech_stack.slice(0, 3).map((tech: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {project.tech_stack.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{project.tech_stack.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">School Admin</Badge>
          </div>
          <Button
            onClick={() => handleProjectAction('view', project)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">School Verifications</h1>
              <p className="text-gray-600 mt-2">
                Review and approve student training and experience submissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Trainings</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingTrainings.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Experiences</p>
                  <p className="text-2xl font-bold text-green-600">{pendingExperiences.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pendingTrainings.length + pendingExperiences.length + pendingProjects.length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Role</p>
                  <p className="text-lg font-semibold text-purple-600">School Admin</p>
                </div>
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          // @ts-expect-error - Auto-suppressed for migration
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            // @ts-expect-error - Auto-suppressed for migration
            <TabsTrigger
              value="trainings"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <BookOpen className="w-4 h-4" />
              Training Approvals ({pendingTrainings.length})
            </TabsTrigger>
            // @ts-expect-error - Auto-suppressed for migration
            <TabsTrigger
              value="experiences"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Briefcase className="w-4 h-4" />
              Experience Approvals ({pendingExperiences.length})
            </TabsTrigger>
            // @ts-expect-error - Auto-suppressed for migration
            <TabsTrigger
              value="projects"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Building2 className="w-4 h-4" />
              Project Approvals ({pendingProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* Training Approvals Tab */}
          // @ts-expect-error - Auto-suppressed for migration
          <TabsContent value="trainings" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="p-4">
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

                <div className="flex items-center gap-4">
                  {/* View Toggle Buttons */}
                  <div className="flex items-center border border-gray-300 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="p-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
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
            </Card>

            {filteredTrainings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No trainings found'
                      : 'No Pending Training Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'All training submissions have been reviewed. New submissions will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {currentTrainings.map((training) => (
                    <TrainingCard key={training.id} training={training} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={getTotalPages(filteredTrainings)}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>

          {/* Experience Approvals Tab */}
          // @ts-expect-error - Auto-suppressed for migration
          <TabsContent value="experiences" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="p-4">
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

                <div className="flex items-center gap-4">
                  {/* View Toggle Buttons */}
                  <div className="flex items-center border border-gray-300 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="p-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
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
            </Card>

            {filteredExperiences.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No experiences found'
                      : 'No Pending Experience Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'All experience submissions have been reviewed. New submissions will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {currentExperiences.map((experience) => (
                    <ExperienceCard key={experience.id} experience={experience} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={getTotalPages(filteredExperiences)}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>

          {/* Project Approvals Tab */}
          // @ts-expect-error - Auto-suppressed for migration
          <TabsContent value="projects" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="p-4">
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

                <div className="flex items-center gap-4">
                  {/* View Toggle Buttons */}
                  <div className="flex items-center border border-gray-300 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="p-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
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
            </Card>

            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No projects found'
                      : 'No Pending Project Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'All project submissions have been reviewed. New submissions will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {currentProjects.map((project) => (
                    <ProjectCard key={project.project_id} project={project} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={getTotalPages(filteredProjects)}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

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
    </div>
  );
};

export default Verifications;
