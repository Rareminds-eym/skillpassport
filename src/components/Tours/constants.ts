import { TourKey } from './types';

export const TOUR_KEYS: Record<string, TourKey> = {
  DASHBOARD: 'dashboard',
  ASSESSMENT_TEST: 'assessment_test',
  ASSESSMENT_RESULT: 'assessment_result',
} as const;

export const TOUR_STORAGE_KEY = 'student_tour_progress';