declare module '@/utils/authErrorHandler' {
  export const AUTH_ERROR_CODES: {
    UNEXPECTED_ERROR: string;
    [key: string]: string;
  };
  
  export function generateCorrelationId(): string;
  export function logAuthEvent(level: string, message: string, metadata?: any): void;
}
