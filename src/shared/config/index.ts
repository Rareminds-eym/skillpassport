/**
 * Shared Configuration Public API
 * 
 * Exports shared configuration used across the application.
 */

export * from './alerts';
export * from './fileSizeLimits';
export * from './logging';
export * from './metrics-dashboard';
export * from './monitoring';
export { getTimeUntilFullRegOpens, FULL_REGISTRATION_START_DATE } from './registrationConfig';
export { formatRegistrationDate } from './registrationConfig';
export { isFullRegistrationOpen } from './registrationConfig';

