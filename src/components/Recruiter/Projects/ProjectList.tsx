import React from 'react';
import { Project } from '../../../types/project';
import ProjectCard from './ProjectCard';
import { EmptyState, LoadingSkeleton } from './components/ProjectAtoms';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewProject: (id: string) => void;
  onCreateProject?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  loading = false,
  viewMode = 'grid',
  onViewProject,
  onCreateProject
}) => {
  if (loading) {
    return <LoadingSkeleton count={6} />;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Start by creating your first project. Post projects and receive proposals from talented freelancers."
        actionLabel="Create Project"
        onAction={onCreateProject}
        icon={
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100">
            <RocketLaunchIcon className="h-8 w-8 text-purple-600" />
          </div>
        }
      />
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
      : 'space-y-4'
    }>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onView={onViewProject}
        />
      ))}
    </div>
  );
};

export default ProjectList;

