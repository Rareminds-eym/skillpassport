import React from "react";
import { FolderGit2, Plus, Edit, Calendar, ExternalLink, Github, Globe, Code, CheckCircle, Clock } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const ProjectsTab = ({ 
  projectsData, 
  setShowProjectsModal 
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return "";
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    if (isNaN(start.getTime())) return "";
    if (endDate && isNaN(end.getTime())) return "";
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    
    const startLabel = formatDate(start);
    const endLabel = endDate ? formatDate(end) : 'Present';
    
    return `${startLabel} - ${endLabel}`;
  };

  const parseTechnologies = (technologies) => {
    if (!technologies) return [];
    if (Array.isArray(technologies)) return technologies;
    return technologies.split(',').map(tech => tech.trim()).filter(tech => tech);
  };

  const getProjectTypeColor = (type) => {
    // Ensure type is a string and handle null/undefined cases
    const typeStr = type && typeof type === 'string' ? type.toLowerCase() : '';
    
    switch (typeStr) {
      case 'web':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'mobile':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'desktop':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'api':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-blue-600" />
          Projects & Internships
        </h3>
        <Button
          onClick={() => setShowProjectsModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      {projectsData?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <FolderGit2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">
            No projects added yet
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add your personal projects, internship work, and portfolio pieces
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {(projectsData || [])
            .filter(project => project.enabled !== false) // Only show enabled projects
            .map((project) => {
              // VERSIONING: If project has pending edit, show verified_data
              const displayProject = project.has_pending_edit && project.verified_data 
                ? {
                    ...project,
                    title: project.verified_data.title,
                    description: project.verified_data.description,
                    role: project.verified_data.role,
                    startDate: project.verified_data.startDate || project.verified_data.start_date,
                    endDate: project.verified_data.endDate || project.verified_data.end_date,
                    technologies: project.verified_data.technologies || project.verified_data.tech_stack,
                    githubUrl: project.verified_data.githubUrl || project.verified_data.github_link,
                    demoUrl: project.verified_data.demoUrl || project.verified_data.demo_link,
                    type: project.verified_data.type,
                    // Keep original approval_status for badge display
                    approval_status: project.verified_data.approval_status || 'verified',
                    _hasPendingEdit: false // Don't show pending badge for verified version
                  }
                : project;
              
              return displayProject;
            })
            .sort((a, b) => {
              // Sort by start date, most recent first
              const dateA = new Date(a.startDate || 0);
              const dateB = new Date(b.startDate || 0);
              return dateB - dateA;
            })
            .map((project, idx) => {
              const technologies = parseTechnologies(project.technologies);
              
              return (
                <div
                  key={project.id || `project-${idx}`}
                  className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-bold text-gray-900">
                          {project.title || project.name || project.projectName || project.project_name || "Project"}
                        </h4>
                        
                        {/* Badge Display Logic */}
                        {(project.approval_status === "verified" || project.approval_status === "approved") && !project._hasPendingEdit && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        
                        {(!project.approval_status || project.approval_status === 'pending') && !project._hasPendingEdit && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowProjectsModal(true)}
                          className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {project.role && (
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-blue-600 font-medium">
                            {project.role}
                          </p>
                        </div>
                      )}

                      {(project.startDate || project.endDate) && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(project.startDate)}
                              {project.endDate && ` - ${formatDate(project.endDate)}`}
                            </span>
                          </div>
                          
                          {project.startDate && (
                            <span className="font-medium">
                              {calculateDuration(project.startDate, project.endDate)}
                            </span>
                          )}
                        </div>
                      )}

                      {project.type && (
                        <div className="mb-3">
                          <Badge className={`px-3 py-1 text-xs font-medium border ${getProjectTypeColor(project.type)}`}>
                            {project.type}
                          </Badge>
                        </div>
                      )}

                      {project.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {project.description}
                        </p>
                      )}

                      {technologies.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Technologies:</p>
                          <div className="flex flex-wrap gap-1">
                            {technologies.slice(0, 6).map((tech, techIdx) => (
                              <Badge 
                                key={techIdx}
                                variant="secondary" 
                                className="text-xs px-2 py-1"
                              >
                                {tech}
                              </Badge>
                            ))}
                            {technologies.length > 6 && (
                              <Badge variant="secondary" className="text-xs px-2 py-1">
                                +{technologies.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {project.githubUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(project.githubUrl, '_blank')}
                            className="text-xs px-3 py-1 h-7 flex items-center gap-1"
                          >
                            <Github className="w-3 h-3" />
                            Code
                          </Button>
                        )}
                        
                        {project.demoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(project.demoUrl, '_blank')}
                            className="text-xs px-3 py-1 h-7 flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" />
                            Live Demo
                          </Button>
                        )}
                        
                        {project.projectUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(project.projectUrl, '_blank')}
                            className="text-xs px-3 py-1 h-7 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Project
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;