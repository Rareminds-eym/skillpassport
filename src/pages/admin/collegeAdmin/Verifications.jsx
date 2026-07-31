
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/ButtonNew';
import { Badge } from '@/shared/ui/Badge';
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
  Zap,
  FileText,
  Menu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '@/shared/api/apiClient';

import { CollegeAdminNotificationService } from '@/features/college-admin';
import { 
  TrainingDetailsModal, 
  ExperienceDetailsModal, 
  ProjectDetailsModal,
  CertificateDetailsModal,
  SkillDetailsModal
} from '@/features/school-admin';
import { getLogger } from '@/shared/config/logging';

import { useUser } from '@/shared/model/authStore';
const CollegeVerifications = () => {
  const logger = getLogger('college-admin-verifications');
  const [activeTab, setActiveTab] = useState('trainings');
  const [pendingTrainings, setPendingTrainings] = useState([]);
  const [pendingExperiences, setPendingExperiences] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [pendingCertificates, setPendingCertificates] = useState([]);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); 

  const user = useUser();

  // Fetch pending trainings for college admin (Using database approval_authority)
  const fetchPendingTrainings = async () => {
    try {
      logger.info('Fetching pending trainings using CollegeAdminNotificationService...');
      
      const response = await apiPost('/college-admin/verifications', { action: 'resolve-college-id' });
      const collegeId = response.data?.collegeId;
      
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
  };

  // Fetch pending experiences for college admin (Using database approval_authority)
  const fetchPendingExperiences = async () => {
    try {
      logger.info('Fetching pending experiences using CollegeAdminNotificationService...');
      
      const response = await apiPost('/college-admin/verifications', { action: 'resolve-college-id' });
      const collegeId = response.data?.collegeId;
      
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
  };

  // Fetch pending projects for college admin (Using database approval_authority)
  const fetchPendingProjects = async () => {
    try {
      logger.info('Fetching pending projects using CollegeAdminNotificationService...');
      
      const response = await apiPost('/college-admin/verifications', { action: 'resolve-college-id' });
      const collegeId = response.data?.collegeId;
      
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
  };

  // Fetch pending certificates for college admin
  const fetchPendingCertificates = async () => {
    try {
      logger.info('Fetching pending certificates using CollegeAdminNotificationService...');
      const response = await apiPost('/college-admin/verifications', { action: 'resolve-college-id' });
      const collegeId = response.data?.collegeId;
      if (!collegeId) {
        logger.warn('No college ID found - showing empty list');
        setPendingCertificates([]);
        return;
      }
      logger.info('Using college_id:', collegeId);
      const certificates = await CollegeAdminNotificationService.getPendingCertificates(collegeId);
      logger.info('Certificates fetched via notification service:', certificates.length);
      setPendingCertificates(certificates || []);
    } catch (error) {
      logger.error('Error in fetchPendingCertificates:', error);
      toast.error("Failed to fetch pending certificates");
    }
  };

  // Fetch pending skills for college admin
  const fetchPendingSkills = async () => {
    try {
      logger.info('Fetching pending skills using CollegeAdminNotificationService...');
      const response = await apiPost('/college-admin/verifications', { action: 'resolve-college-id' });
      const collegeId = response.data?.collegeId;
      if (!collegeId) {
        logger.warn('No college ID found - showing empty list');
        setPendingSkills([]);
        return;
      }
      logger.info('Using college_id:', collegeId);
      const skills = await CollegeAdminNotificationService.getPendingSkills(collegeId);
      logger.info('Skills fetched via notification service:', skills.length);
      setPendingSkills(skills || []);
    } catch (error) {
      logger.error('Error in fetchPendingSkills:', error);
      toast.error("Failed to fetch pending skills");
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPendingTrainings(),
        fetchPendingExperiences(),
        fetchPendingProjects(),
        fetchPendingCertificates(),
        fetchPendingSkills()
      ]);
      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle training actions
  const handleTrainingAction = async (action, training) => {
    if (action === 'view') {
      setSelectedTraining(training);
      setShowTrainingModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      // Refresh data after approval/rejection
      await fetchPendingTrainings();
      toast.success(`Training ${action} successfully!`);
    }
  };

  // Handle experience actions
  const handleExperienceAction = async (action, experience) => {
    if (action === 'view') {
      setSelectedExperience(experience);
      setShowExperienceModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      // Refresh data after approval/rejection
      await fetchPendingExperiences();
      toast.success(`Experience ${action} successfully!`);
    }
  };

  // Handle project actions
  const handleProjectAction = async (action, project) => {
    if (action === 'view') {
      setSelectedProject(project);
      setShowProjectModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      // Refresh data after approval/rejection
      await fetchPendingProjects();
      toast.success(`Project ${action} successfully!`);
    }
  };

  // Handle certificate actions
  const handleCertificateAction = async (action, certificate) => {
    if (action === 'view') {
      setSelectedCertificate(certificate);
      setShowCertificateModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      await fetchPendingCertificates();
      toast.success(`Certificate ${action} successfully!`);
    }
  };

  // Handle skill actions
  const handleSkillAction = async (action, skill) => {
    if (action === 'view') {
      setSelectedSkill(skill);
      setShowSkillModal(true);
    } else if (action === 'approved' || action === 'rejected') {
      await fetchPendingSkills();
      toast.success(`Skill ${action} successfully!`);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPendingTrainings(),
      fetchPendingExperiences(),
      fetchPendingProjects(),
      fetchPendingCertificates(),
      fetchPendingSkills()
    ]);
    setLoading(false);
    toast.success("Data has been refreshed successfully");
  };

  // Pagination helper functions
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
    setSearchQuery(''); // Reset search when changing tabs
    setStatusFilter('all'); // Reset filter when changing tabs
  };

  // Filter functions
  const getFilteredTrainings = () => {
    return pendingTrainings.filter(training => {
      const matchesSearch = (training.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (training.learner?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (training.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || training.approval_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredExperiences = () => {
    return pendingExperiences.filter(experience => {
      const matchesSearch = (experience.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (experience.learner?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (experience.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || experience.approval_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredProjects = () => {
    return pendingProjects.filter(project => {
      const matchesSearch = (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (project.learner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (project.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.approval_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredCertificates = () => {
    return pendingCertificates.filter(certificate => {
      const matchesSearch = (certificate.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (certificate.learner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (certificate.issuer || certificate.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || certificate.approval_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredSkills = () => {
    return pendingSkills.filter(skill => {
      const matchesSearch = (skill.skill_name || skill.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (skill.learner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (skill.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || skill.approval_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Get current page data for each tab (with filtering)
  const filteredTrainings = getFilteredTrainings();
  const filteredExperiences = getFilteredExperiences();
  const filteredProjects = getFilteredProjects();
  const filteredCertificates = getFilteredCertificates();
  const filteredSkills = getFilteredSkills();
  
  const currentTrainings = getCurrentPageData(filteredTrainings);
  const currentExperiences = getCurrentPageData(filteredExperiences);
  const currentProjects = getCurrentPageData(filteredProjects);
  const currentCertificates = getCurrentPageData(filteredCertificates);
  const currentSkills = getCurrentPageData(filteredSkills);

  // Get total pages for current tab (with filtering)
  const getCurrentTabTotalPages = () => {
    switch (activeTab) {
      case 'trainings':
        return getTotalPages(filteredTrainings);
      case 'experiences':
        return getTotalPages(filteredExperiences);
      case 'projects':
        return getTotalPages(filteredProjects);
      case 'certificates':
       return getTotalPages(filteredCertificates);
      case 'skills':
       return getTotalPages(filteredSkills);
      default:
        return 1;
    }
  };

  // Pagination Component
  const PaginationControls = ({ totalPages, currentPage, onPageChange }) => {
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
                variant={page === currentPage ? "default" : "outline"}
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
  const TrainingCard = ({ training }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {training.learner?.name || 'Unknown Learner'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(training.created_at).toLocaleDateString()}
          </div>
        </div>
       
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{training.learner?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>
              {training.title}
            </span>
          </div>
          {training.organization && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{training.organization}</span>
              {training.organization.toLowerCase() === 'rareminds' && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                   Rareminds Training
                </Badge>
              )}
            </div>
          )}
          
          {training.duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{training.duration}</span>
            </div>
          )}
          
          {/* {training.hours_spent > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Timer className="w-4 h-4" />
              <span>{training.hours_spent} hours</span>
            </div>
          )} */}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>College: {training.learner?.college_school_name || 'Unknown'}</span>
          </div>
        </div>
        
        {/* {training.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {training.description}
          </p>
        )} */}
        
        {training.skills && training.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {training.skills.slice(0, 3).map((skill, index) => (
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
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              College Admin
            </Badge>
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
  const ExperienceCard = ({ experience }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {experience.learner?.name || 'Unknown Learner'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(experience.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{experience.learner?.email}</span>
          </div>
          {/* <div className="flex-1">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {experience.role}
            </h4>
          </div> */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span>
              {experience.role}
            </span>
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
          
          {/* <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>College: {experience.learner?.college_school_name || 'Unknown'}</span>
          </div> */}
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              College Admin
            </Badge>
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
  const ProjectCard = ({ project }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {project.title}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="font-bold text-base text-gray-900">
              {project.learner_name || 'Unknown Learner'}
            </span>
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
                {project.tech_stack.slice(0, 3).map((tech, index) => (
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
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              College Admin
            </Badge>
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

  // Certificate Card Component
  const CertificateCard = ({ certificate }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {certificate.learner_name || 'Unknown Learner'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(certificate.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{certificate.learner_email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>{certificate.title}</span>
          </div>
          {certificate.issuer && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{certificate.issuer}</span>
            </div>
          )}
          {certificate.issued_on && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Issued: {new Date(certificate.issued_on).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              College Admin
            </Badge>
          </div>
          <Button
            onClick={() => handleCertificateAction('view', certificate)}
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

  // Skill Card Component
  const SkillCard = ({ skill }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {skill.learner_name || 'Unknown Learner'}
            </h3>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            Submitted: {new Date(skill.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{skill.learner_email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Zap className="w-4 h-4" />
            <span className="font-semibold">{skill.skill_name || skill.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {skill.level && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4" />
                <span>Level: {skill.level} / 5</span>
              </div>
            )}
            {skill.type && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Type: {skill.type}</span>
              </div>
            )}
          </div>
          {skill.category && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>Category: {skill.category}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              College Admin
            </Badge>
          </div>
          <Button
            onClick={() => handleSkillAction('view', skill)}
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

  // Mobile Tab Menu Component
  const tabOptions = useMemo(() =>  [
    { value: 'trainings', label: 'Training', icon: BookOpen, count: pendingTrainings.length },
    { value: 'experiences', label: 'Experience', icon: Briefcase, count: pendingExperiences.length },
    { value: 'projects', label: 'Project', icon: Building2, count: pendingProjects.length },
    { value: 'certificates', label: 'Certificate', icon: Award, count: pendingCertificates.length },
    { value: 'skills', label: 'Skills', icon: Zap, count: pendingSkills.length },
  ], [
  pendingTrainings.length,
  pendingExperiences.length,
  pendingCertificates.length,
  pendingSkills.length,
  pendingProjects.length,
]);

  const MobileTabMenu = ({ activeTab, onTabChange, counts, tabOptions }) => {
    const [open, setOpen] = useState(false);
    const active = tabOptions.find(t => t.value === activeTab);
    const ActiveIcon = active?.icon || BookOpen;

    return (
      <div className="lg:hidden relative mb-2">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle verification category menu"
          aria-expanded={open}
          aria-haspopup="true"
          className="flex items-center justify-between w-full bg-gray-100 rounded-lg px-4 py-3 font-medium text-gray-700"
        >
          <div className="flex items-center gap-2">
            <ActiveIcon className="w-4 h-4 text-blue-600" />
            <span>{active?.label} ({counts[activeTab] ?? 0})</span>
          </div>
          <div className="flex flex-col gap-1">
            <Menu className="w-5 h-5 text-gray-600" />
          </div>
        </button>
        {open && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
            {tabOptions.map(({ value, label, icon: Icon, count }) => (
              <button
                key={value}
                onClick={() => { onTabChange(value); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  activeTab === value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label} ({count})
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

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
                Review and approve learner training and experience submissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
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

          <Card className="bg-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Projects</p>
                  <p className="text-2xl font-bold text-indigo-600">{pendingProjects.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Certificates</p>
                  <p className="text-2xl font-bold text-purple-600">{pendingCertificates.length}</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Skills</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingSkills.length}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pendingTrainings.length + pendingExperiences.length + pendingProjects.length + pendingCertificates.length + pendingSkills.length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Desktop tabs */}
          <TabsList className="hidden lg:grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="trainings" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-black data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <BookOpen className="w-4 h-4" />
              Training ({pendingTrainings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="experiences" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-black data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Briefcase className="w-4 h-4" />
              Experience ({pendingExperiences.length})
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-black data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Building2 className="w-4 h-4" />
              Project ({pendingProjects.length})
            </TabsTrigger>
            <TabsTrigger 
              value="certificates" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-black data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Award className="w-4 h-4" />
              Certificate ({pendingCertificates.length})
            </TabsTrigger>
            <TabsTrigger 
              value="skills" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-black data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 transition-all duration-200 rounded-md"
            >
              <Zap className="w-4 h-4" />
              Skills ({pendingSkills.length})
            </TabsTrigger>
          </TabsList>

          {/* Mobile tab dropdown */}
          <MobileTabMenu
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabOptions={tabOptions}
            counts={{
              trainings: pendingTrainings.length,
              experiences: pendingExperiences.length,
              projects: pendingProjects.length,
              certificates: pendingCertificates.length,
              skills: pendingSkills.length,
            }}
          />

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
                      placeholder="Search trainings, learners, or organizations..."
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
          <TabsContent value="experiences" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search experiences, learners, or organizations..."
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
          <TabsContent value="projects" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search projects, learners, or organizations..."
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

          {/* Certificate Approvals Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search certificates, learners, or issuers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg p-1">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="p-2">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="p-2">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
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
            </Card>

            {filteredCertificates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all' ? 'No certificates found' : 'No Pending Certificate Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'All certificate submissions have been reviewed. New submissions will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                  {currentCertificates.map((certificate) => (
                    <CertificateCard key={certificate.id} certificate={certificate} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={getTotalPages(filteredCertificates)}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>

          {/* Skills Approvals Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search skills, learners, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg p-1">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="p-2">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="p-2">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
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
            </Card>

            {filteredSkills.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || statusFilter !== 'all' ? 'No skills found' : 'No Pending Skill Approvals'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'All skill submissions have been reviewed. New submissions will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                  {currentSkills.map((skill) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
                <PaginationControls
                  totalPages={getTotalPages(filteredSkills)}
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

        {/* Certificate Details Modal */}
        <CertificateDetailsModal
          certificate={selectedCertificate}
          isOpen={showCertificateModal}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedCertificate(null);
          }}
          onAction={handleCertificateAction}
          currentUserId={user?.id}
        />

        {/* Skill Details Modal */}
        <SkillDetailsModal
          skill={selectedSkill}
          isOpen={showSkillModal}
          onClose={() => {
            setShowSkillModal(false);
            setSelectedSkill(null);
          }}
          onAction={handleSkillAction}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
};

export default CollegeVerifications;