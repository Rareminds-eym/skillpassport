/**
 * Analytics and Performance Types
 */

export type FunnelRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface GeographicLocation {
  city: string;
  count: number;
  percentage: number;
}

export interface TopHiringCollege {
  name: string;
  count: number;
  percentage: number;
}

export interface QualityMetrics {
  totalHired: number;
  avgAiScore: number;
  avgCgpa: number;
  genderDiversity: {
    male: number;
    female: number;
    other: number;
    malePercent: number;
    femalePercent: number;
    otherPercent: number;
  };
  ageDemographics: {
    averageAge: number;
    ageRanges: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };
  topCourses: {
    name: string;
    count: number;
    percentage: number;
  }[];
}
