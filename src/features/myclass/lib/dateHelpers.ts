/**
 * Date utility functions for assignment handling
 * Centralized to avoid duplication across components
 */

export const parseAsLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const dueDateStr = dateString.replace('Z', '').replace('+00:00', '').replace('T', ' ');
  return new Date(dueDateStr);
};

export const isOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
  const dueDay = new Date(dueDateStr);
  dueDay.setHours(0, 0, 0, 0);
  return dueDay.getTime() < today.getTime();
};

export const normalizeDateString = (dateString: string): string => {
  return dateString.replace('Z', '').replace('+00:00', '').replace('T', ' ');
};

export const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};
