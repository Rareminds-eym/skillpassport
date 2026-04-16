
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  Clock, 
  XCircle, 
  User, 
  BookOpen, 
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
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
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/shared/api';
import { useUser } from '@/stores';
import { CollegeAdminNotificationService } from '@/features/college-admin';
import { 
  TrainingDetailsModal, 
  ExperienceDetailsModal, 
  ProjectDetailsModal 
} from '@/features/school-admin';
import { getLogger } from '@/shared/config/logging';

// Constants
const ITEMS_PER_PAGE = 6;

/**
 * Shared helper — resolves the college ID for the current user.
 * Checks user object first, then queries college_lecturers and organizations in parallel.
 */
async function getCollegeId(user) {
  if (!user) {
    throw new Error('User is required to fetch college ID');
  }
  
  const userId = user.id || user;
  const userEmail = user.email;
  
  if (user.college_id) return user.college_id;

  // Query college_lecturers and organizations in parallel to reduce latency
  const [educatorResult, orgResult] = await Promise.all([
    // Query college_lecturers by user_id OR email in a single query
    supabase
      .from('college_lecturers')
      .select('collegeId')
      .or(`user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ''}`)
      .maybeSingle(),
    // Query organizations in parallel
    supabase
      .from('organizations')
      .select('id')
      .eq('admin_id', userId)
      .eq('organization_type', 'college')
      .maybeSingle()
  ]);

  const { data: educatorData, error: educatorError } = educatorResult;
  const { data: orgData, error: orgError } = orgResult;

  if (educatorError) throw educatorError;
  if (educatorData?.collegeId) return educatorData.collegeId;

  if (orgError) throw orgError;
  return orgData?.id || null;
}

// ---------------------------------------------------------------------------
// Module-scope card components — defined outside CollegeVerifications to
// prevent unnecessary remounts on every parent render.
// ---------------------------------------------------------------------------

const PaginationControls = ({ totalPages, currentPage, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Windowed page numbers: show currentPage ± 2 with ellipsis
  const getPageNumbers = () => {
    const delta = 2;
    const pages = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    
    // Deduplicate in case of small totalPages (e.g., totalPages === 2)
    return [...new Set(pages)];
  };

  return (
    <div className="flex items-center justify-between mt-6 px-4">
      <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />Previous
        </Button>
        {getPageNumbers().map((page, i) =>
          page === '...'
            ? <span key={`ellipsis-${i}`} className="px-1 text-gray-400 select-none">…</span>
            : <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-8 h-8 p-0"
              >{page}</Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Next<ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const TrainingCard = ({ training, onAction }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-600" />
          <h3 className="font-bold text-lg text-gray-900">{training.student?.name || 'Unknown Student'}</h3>
        </div>
        <div className="text-xs text-gray-500 ml-4">Submitted: {new Date(training.created_at).toLocaleDateString()}</div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-4 h-4" /><span>{training.student?.email}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><Award className="w-4 h-4" /><span>{training.title}</span></div>
        {training.organization && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" /><span>{training.organization}</span>
            {training.organization.toLowerCase() === 'rareminds' && (
              <Badge className="bg-purple-100 text-purple-700 text-xs">Rareminds Training</Badge>
            )}
          </div>
        )}
        {training.duration && <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-4 h-4" /><span>{training.duration}</span></div>}
        <div className="flex items-center gap-2 text-sm text-gray-600"><GraduationCap className="w-4 h-4" /><span>College: {training.student?.college_school_name || 'Unknown'}</span></div>
      </div>
      {training.skills && training.skills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {training.skills.slice(0, 3).map((skill, index) => (
            <Badge key={`${training.id}-skill-${skill}-${index}`} variant="outline" className="text-xs">{skill}</Badge>
          ))}
          {training.skills.length > 3 && <Badge variant="outline" className="text-xs">+{training.skills.length - 3} more</Badge>}
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-yellow-100 text-yellow-800 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
          <Badge className="bg-blue-100 text-blue-700 text-xs">College Admin</Badge>
        </div>
        <Button onClick={() => onAction('view', training)} className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0" size="sm">
          <Eye className="w-4 h-4 mr-2" />View Details
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ExperienceCard = ({ experience, onAction }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-600" />
          <h3 className="font-bold text-lg text-gray-900">{experience.student?.name || 'Unknown Student'}</h3>
        </div>
        <div className="text-xs text-gray-500 ml-4">Submitted: {new Date(experience.created_at).toLocaleDateString()}</div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-4 h-4" /><span>{experience.student?.email}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><Briefcase className="w-4 h-4" /><span>{experience.role}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><Building2 className="w-4 h-4" /><span>{experience.organization}</span></div>
        {experience.duration && <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-4 h-4" /><span>{experience.duration}</span></div>}
      </div>
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-yellow-100 text-yellow-800 text-xs"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>
          <Badge className="bg-blue-100 text-blue-700 text-xs">College Admin</Badge>
        </div>
        <Button onClick={() => onAction('view', experience)} className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0" size="sm">
          <Eye className="w-4 h-4 mr-2" />View Details
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ProjectCard = ({ project, onAction }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1"><h3 className="font-semibold text-lg text-gray-900 mb-2">{project.title}</h3></div>
        <div className="text-xs text-gray-500 ml-4">Submitted: {new Date(project.created_at).toLocaleDateString()}</div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600"><User className="w-4 h-4" /><span className="font-bold text-base text-gray-900">{project.student_name || 'Unknown Student'}</span></div>
        {project.organization && <div className="flex items-center gap-2 text-sm text-gray-600"><Building2 className="w-4 h-4" /><span>{project.organization}</span></div>}
        {project.status && <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" /><span>Status: {project.status}</span></div>}
        {(project.start_date || project.end_date) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</span>
          </div>
        )}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tech_stack.slice(0, 3).map((tech, index) => (
              <Badge key={`tech-${index}-${tech}`} variant="secondary" className="text-xs">{tech}</Badge>
            ))}
            {project.tech_stack.length > 3 && <Badge variant="secondary" className="text-xs">+{project.tech_stack.length - 3} more</Badge>}
          </div>
        )}
      </div>
      {project.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-yellow-100 text-yellow-800 text-xs"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>
          <Badge className="bg-blue-100 text-blue-700 text-xs">College Admin</Badge>
        </div>
        <Button onClick={() => onAction('view', project)} className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0" size="sm">
          <Eye className="w-4 h-4 mr-2" />View Details
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------

const CollegeVerifications = () => {
  const logger = getLogger('college-admin-verifications');
  const [activeTab, setActiveTab] = useState('trainings');
  const [pendingTrainings, setPendingTrainings] = useState([]);
  const [pendingExperiences, setPendingExperiences] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  // Per-tab pagination state
  const [trainingsPage, setTrainingsPage] = useState(1);
  const [experiencesPage, setExperiencesPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); 

  const user = useUser();
  const userId = user?.id;

  // Fetch pending trainings for college admin (Using database approval_authority)
  const fetchPendingTrainings = useCallback(async () => {
    try {
      logger.info('Fetching pending trainings using CollegeAdminNotificationService...');

      const collegeId = await getCollegeId(user);

      if (!collegeId) {
        logger.warn('No college ID found - showing empty list');
        setPendingTrainings([]);
        return;
      }

      logger.info('Using college_id:', collegeId);

      const trainings = await CollegeAdminNotificationService.getPendingTrainings(collegeId);
      logger.info('Trainings fetched via notification service:', trainings.length);
      setPendingTrainings(trainings);
    } catch (error) {
      logger.error('Error in fetchPendingTrainings:', error);
      toast.error("Failed to fetch pending trainings");
    }
  }, [userId]);

  // Fetch pending experiences for college admin (Using database approval_authority)
  const fetchPendingExperiences = useCallback(async () => {
    try {
      logger.info('Fetching pending experiences using CollegeAdminNotificationService...');

      const collegeId = await getCollegeId(user);

      if (!collegeId) {
        logger.warn('No college ID found - showing empty list');
        setPendingExperiences([]);
        return;
      }

      logger.info('Using college_id:', collegeId);

      const experiences = await CollegeAdminNotificationService.getPendingExperiences(collegeId);
      logger.info('Experiences fetched via notification service:', experiences.length);
      setPendingExperiences(experiences);
    } catch (error) {
      logger.error('Error in fetchPendingExperiences:', error);
      toast.error("Failed to fetch pending experiences");
    }
  }, [userId]);

  // Fetch pending projects for college admin (Using database approval_authority)
  const fetchPendingProjects = useCallback(async () => {
    try {
      logger.info('Fetching pending projects using CollegeAdminNotificationService...');

      const collegeId = await getCollegeId(user);

      if (!collegeId) {
        logger.warn('No college ID found - showing empty list');
        setPendingProjects([]);
        return;
      }

      logger.info('Using college_id:', collegeId);

      const projects = await CollegeAdminNotificationService.getPendingProjects(collegeId);
      logger.info('Projects fetched via notification service:', projects.length);
      setPendingProjects(projects);
    } catch (error) {
      logger.error('Error in fetchPendingProjects:', error);
      toast.error(error.message || "Failed to load pending projects");
    }
  }, [userId]);

  // Initial data fetch - depend only on userId to prevent infinite loop
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const collegeId = await getCollegeId(user);

        if (!collegeId) {
          logger.warn('No college ID found - showing empty lists');
          setPendingTrainings([]);
          setPendingExperiences([]);
          setPendingProjects([]);
          setLoading(false);
          return;
        }

        logger.info('Using college_id:', collegeId);

        const [trainings, experiences, projects] = await Promise.all([
          CollegeAdminNotificationService.getPendingTrainings(collegeId),
          CollegeAdminNotificationService.getPendingExperiences(collegeId),
          CollegeAdminNotificationService.getPendingProjects(collegeId)
        ]);

        setPendingTrainings(trainings);
        setPendingExperiences(experiences);
        setPendingProjects(projects);
      } catch (error) {
        logger.error('Error fetching data:', error);
        toast.error("Failed to load pending items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle training actions
  const handleTrainingAction = useCallback(async (action, training) => {
    if (action === 'view') {
      setSelectedTraining(training);
      setShowTrainingModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      await fetchPendingTrainings();
      toast.success(`Training ${action} successfully!`);
    }
  }, [fetchPendingTrainings]);

  // Handle experience actions
  const handleExperienceAction = useCallback(async (action, experience) => {
    if (action === 'view') {
      setSelectedExperience(experience);
      setShowExperienceModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      await fetchPendingExperiences();
      toast.success(`Experience ${action} successfully!`);
    }
  }, [fetchPendingExperiences]);

  // Handle project actions
  const handleProjectAction = useCallback(async (action, project) => {
    if (action === 'view') {
      setSelectedProject(project);
      setShowProjectModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      await fetchPendingProjects();
      toast.success(`Project ${action} successfully!`);
    }
  }, [fetchPendingProjects]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingTrainings(),
        fetchPendingExperiences(),
        fetchPendingProjects()
      ]);
      toast.success("Data has been refreshed successfully");
    } finally {
      setLoading(false);
    }
  }, [fetchPendingTrainings, fetchPendingExperiences, fetchPendingProjects]);

  // Pagination helper functions
  const getPageData = (data, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Reset pagination when search or filter changes - collapsed into single effect
  useEffect(() => {
    setTrainingsPage(1);
    setExperiencesPage(1);
    setProjectsPage(1);
  }, [searchQuery, statusFilter]);

  // Filter functions - memoized to avoid recomputing on unrelated re-renders
  const filteredTrainings = useMemo(() => {
    return pendingTrainings.filter(training => {
      const matchesSearch = (training.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (training.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (training.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || training.approval_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [pendingTrainings, searchQuery, statusFilter]);

  const filteredExperiences = useMemo(() => {
    return pendingExperiences.filter(experience => {
      const matchesSearch = (experience.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (experience.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (experience.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || experience.approval_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [pendingExperiences, searchQuery, statusFilter]);

  const filteredProjects = useMemo(() => {
    return pendingProjects.filter(project => {
      const matchesSearch = (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (project.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (project.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.approval_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [pendingProjects, searchQuery, statusFilter]);
  
  const currentTrainings = getPageData(filteredTrainings, trainingsPage);
  const currentExperiences = getPageData(filteredExperiences, experiencesPage);
  const currentProjects = getPageData(filteredProjects, projectsPage);

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
              <h1 className="text-3xl font-bold text-gray-900">College Verifications</h1>
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
                    {pendingTrainings.length + pendingExperiences.length}
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
                  <p className="text-lg font-semibold text-purple-600">College Admin</p>
                </div>
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="trainings" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <BookOpen className="w-4 h-4" />
              Training Approvals ({pendingTrainings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="experiences" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Briefcase className="w-4 h-4" />
              Experience Approvals ({pendingExperiences.length})
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Building2 className="w-4 h-4" />
              Project Approvals ({pendingProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* Training Approvals Tab */}
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
                    {searchQuery || statusFilter !== 'all' ? 'No trainings found' : 'No Pending Training Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'All training submissions have been reviewed. New submissions will appear here.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {currentTrainings.map((training) => (
                    <TrainingCard key={training.id} training={training} onAction={handleTrainingAction} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={Math.ceil(filteredTrainings.length / ITEMS_PER_PAGE)}
                  currentPage={trainingsPage}
                  onPageChange={setTrainingsPage}
                />
              </>
            )}
          </TabsContent>

          {/* Experience Approvals Tab */}
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
            </Card>

            {filteredExperiences.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all' ? 'No experiences found' : 'No Pending Experience Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'All experience submissions have been reviewed. New submissions will appear here.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {currentExperiences.map((experience) => (
                    <ExperienceCard key={experience.id} experience={experience} onAction={handleExperienceAction} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE)}
                  currentPage={experiencesPage}
                  onPageChange={setExperiencesPage}
                />
              </>
            )}
          </TabsContent>

          {/* Project Approvals Tab */}
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
            </Card>

            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No Pending Project Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'All project submissions have been reviewed. New submissions will appear here.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {currentProjects.map((project) => (
                    <ProjectCard key={project.project_id} project={project} onAction={handleProjectAction} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)}
                  currentPage={projectsPage}
                  onPageChange={setProjectsPage}
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

export default CollegeVerifications;