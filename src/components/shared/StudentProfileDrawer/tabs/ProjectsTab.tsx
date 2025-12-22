import React from 'react';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import { Project } from '../types';
import { ProjectCard } from '../components';

interface ProjectsTabProps {
  projects: Project[];
  loading?: boolean;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ projects, loading = false }) => {
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Projects</h3>
        <span className="text-sm text-gray-600">{projects?.length || 0} total</span>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-2">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1">Student hasn't added any projects to their portfolio</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;