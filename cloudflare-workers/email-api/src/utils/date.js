/**
 * Date and time utilities
 */

export function calculateDaysUntilLaunch(launchDate) {
  const launchDateTime = new Date(launchDate);
  const now = new Date();
  return Math.ceil((launchDateTime - now) / (1000 * 60 * 60 * 24));
}

export function getTodayStartOfDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function calculateBackoffHours(retryCount) {
  return Math.pow(2, retryCount);
}

export function getHoursSince(date) {
  const now = new Date();
  const past = new Date(date);
  return (now - past) / (1000 * 60 * 60);
}
