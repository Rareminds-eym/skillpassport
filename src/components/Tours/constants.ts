import { TourKey } from './types';

export const TOUR_KEYS: Record<string, TourKey> = {
  DASHBOARD: 'dashboard',
  ASSESSMENT_TEST: 'assessment_test',
  ASSESSMENT_RESULT: 'assessment_result',
  ASSESSMENT_RESULT_AFTER12: 'assessment_result_after12',
  ASSESSMENT_RESULT_GENERIC: 'assessment_result_generic',
} as const;

export const TOUR_STORAGE_KEY = 'student_tour_progress';