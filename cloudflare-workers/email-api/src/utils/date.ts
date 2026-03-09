/**
 * Date and time utilities
 */

export function calculateDaysUntilLaunch(launchDate: string): number {
  const launchDateTime = new Date(launchDate);
  const now = new Date();
  return Math.ceil((launchDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTodayStartOfDay(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function calculateBackoffHours(retryCount: number): number {
  return Math.pow(2, retryCount);
}

export function getHoursSince(date: string): number {
  const now = new Date();
  const past = new Date(date);
  return (now.getTime() - past.getTime()) / (1000 * 60 * 60);
}
