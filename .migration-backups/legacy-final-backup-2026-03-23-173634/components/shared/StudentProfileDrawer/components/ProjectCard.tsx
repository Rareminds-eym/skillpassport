import React from 'react';
import { ExternalLinkIcon, LinkIcon } from 'lucide-react';
import { Project } from '../types';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{project.title || 'Untitled Project'}</h4>
          {project.organization && (
            <p className="text-xs text-gray-600 mt-1">Organization: {project.organization}</p>
          )}
        </div>
        {project.status && <StatusBadge status={project.approval_status || project.status} />}
      </div>

      {project.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{project.description}</p>
      )}

      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {project.tech_stack.slice(0, 3).map((tech, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 3 && (
            <span className="text-xs text-gray-500">+{project.tech_stack.length - 3} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2 text-xs">
        {project.demo_link && (
          <a
            href={project.demo_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ExternalLinkIcon className="h-3 w-3 mr-1" />
            Demo
          </a>
        )}
        {project.github_link && (
          <a
            href={project.github_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-600 hover:text-gray-700"
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            GitHub
          </a>
        )}
      </div>

      {project.start_date && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {new Date(project.start_date).toLocaleDateString()}
          {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;