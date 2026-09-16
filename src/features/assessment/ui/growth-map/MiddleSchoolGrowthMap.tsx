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
}

export const MiddleSchoolGrowthMap: React.FC<MiddleSchoolGrowthMapProps> = ({
  learnerInfo,
  reports,
  viewMode,
}) => {
  return <GrowthMapShell learnerInfo={learnerInfo} reports={reports} viewMode={viewMode} />;
};
