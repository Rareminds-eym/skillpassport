/** SP training status for LTE-sourced courses (after the LTE→SP status mapping). */
export type LteTrainingStatus = 'not_started' | 'in_progress' | 'ongoing' | 'completed' | 'paused';

/** Human-readable labels for LTE statuses — shared by card + level ladder. */
export const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  mastered: 'Mastered',
  in_progress: 'In progress',
  ongoing: 'In Progress',
  not_started: 'Not started',
  paused: 'Paused',
};

/** One level of an LTE capability (a row in the level ladder). */
export interface LteLevel {
  id?: string;
  code?: string;
  title: string;
  status?: string;
  completionPercentage?: number;
  totalModules?: number;
  completedModules?: number;
}

/** The learning item shape LteLearningCard consumes (source === 'lte'). */
export interface LteLearningItem {
  id: string;
  title: string;
  course: string;
  organization: string;
  provider: string;
  description: string;
  status: LteTrainingStatus;
  completedModules: number;
  totalModules: number;
  hoursSpent: number;
  progress?: number;
  source: string;
  resumeUrl?: string;
  lteLevels?: LteLevel[];
  lteCode?: string;
  lteCurrentLevel?: number;
  lteTotalLevels?: number;
}

export interface LteLearningCardProps {
  item: LteLearningItem;
  onContinue?: (item: LteLearningItem) => void;
  viewMode?: 'grid' | 'list';
}