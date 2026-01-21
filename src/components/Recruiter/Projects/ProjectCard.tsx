import React from 'react';
import { Project } from '../../../types/project';
import { ClockIcon, UserGroupIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import {
  StatusBadge,
  PriorityBadge,
  BudgetDisplay,
  SkillTag,
  CategoryBadge,
} from './components/ProjectAtoms';

interface ProjectCardProps {
  project: Project;
  onView: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onView }) => {
  const daysRemaining = project.deadline_for_proposals
    ? Math.ceil(
        (new Date(project.deadline_for_proposals).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onView(project.id)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={project.category} />
              <PriorityBadge priority={project.priority} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors">
              {project.title}
            </h3>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

        {/* Budget & Duration */}
        <div className="flex items-center gap-4 mb-4">
          <BudgetDisplay min={project.budget_min} max={project.budget_max} size="sm" />
          {project.duration_value && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4" />
              <span>
                {project.duration_value} {project.duration_unit}
              </span>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.skills_required.slice(0, 4).map((skill, idx) => (
            <SkillTag key={idx} skill={skill} variant="purple" />
          ))}
          {project.skills_required.length > 4 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{project.skills_required.length - 4} more
            </span>
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>{project.proposal_count} proposals</span>
            </div>
            {daysRemaining && daysRemaining > 0 && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{daysRemaining} days left</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(project.id);
            }}
            className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <EyeIcon className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
