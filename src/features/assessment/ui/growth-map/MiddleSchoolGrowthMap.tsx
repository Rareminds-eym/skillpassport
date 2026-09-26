import React from 'react';
import { GrowthMapShell } from './GrowthMapShell';
import type { StageReports } from './growthStageConfig';
import type { GrowthMapViewMode } from './ViewToggle';
import './growth-map-journey.css';

interface MiddleSchoolGrowthMapProps {
  learnerInfo: {
    name: string;
    grade: string;
    school: string;
    enrollmentNumber?: string;
    assessmentDate?: string;
  };
  reports: StageReports;
  viewMode?: GrowthMapViewMode;
  /** Needed to persist Growth Map stage-completion progress. */
  attemptId?: string;
}

export const MiddleSchoolGrowthMap: React.FC<MiddleSchoolGrowthMapProps> = ({
  learnerInfo,
  reports,
  viewMode,
  attemptId,
}) => {
  return (
    <GrowthMapShell
      learnerInfo={learnerInfo}
      reports={reports}
      viewMode={viewMode}
      attemptId={attemptId}
    />
  );
};
