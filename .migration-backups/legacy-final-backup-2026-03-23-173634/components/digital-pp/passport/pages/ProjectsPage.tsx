import React from 'react';
import { motion } from 'framer-motion';
import { Folder, Github, ExternalLink, Calendar } from 'lucide-react';
import { Student } from '../../../types/student';
import PassportPage from '../PassportPage';

interface ProjectsPageProps {
  student: Student;
  isActive: boolean;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ student, isActive }) => {
  const projects = student.profile.projects || [];

  return (
    <PassportPage pageNumber={5} isActive={isActive}>
      <div className="p-8 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PROJECTS</h2>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
        </div>

        {/* Projects List */}
        {projects.length > 0 ? (
          <div className="flex-1 space-y-6">
            {projects.slice(0, 3).map((project, index) => (
              <motion.div
                key={project.id}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Folder className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    
                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.technologies.slice(0, 4).map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{project.technologies.length - 4} more
                        </span>
                      )}
                    </div>
                    
                    {/* Links and Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        {project.github_url && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Github className="w-3 h-3 mr-1" />
                            <span>Source</span>
                          </div>
                        )}
                        {project.live_url && (
                          <div className="flex items-center text-xs text-gray-500">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            <span>Live</span>
                          </div>
                        )}
                      </div>
                      
                      {project.startDate && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{new Date(project.startDate).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {projects.length > 3 && (
              <motion.div
                className="text-center p-4 bg-gray-50 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0.5 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-sm text-gray-600">
                  +{projects.length - 3} more projects available in full portfolio
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.5 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No projects information available</p>
            </div>
          </motion.div>
        )}

        {/* Footer Stamp */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isActive ? 1 : 0.5, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-block px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg transform rotate-1">
            <div className="text-xs font-bold">PROJECTS</div>
            <div className="text-xs">REVIEWED</div>
          </div>
        </motion.div>
      </div>
    </PassportPage>
  );
};

export default ProjectsPage;