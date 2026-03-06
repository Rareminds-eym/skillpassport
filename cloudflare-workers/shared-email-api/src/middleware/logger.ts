/**
 * Logging middleware
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...data,
  };
  
  console.log(JSON.stringify(logData));
}

export function logRequest(request: Request, context: any) {
  log('info', 'Incoming request', {
    method: request.method,
    url: request.url,
    context,
  });
}

export function logResponse(request: Request, response: Response, context: any, duration: number) {
  log('info', 'Response sent', {
    method: request.method,
    url: request.url,
    status: response.status,
    duration: `${duration}ms`,
    context,
  });
}

export function logError(error: any, context?: any) {
  log('error', error.message || 'Unknown error', {
    error: error.stack || error.toString(),
    ...context,
  });
}
