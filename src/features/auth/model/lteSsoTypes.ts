export interface GenerateLteCodeResponse {
  redirectUrl: string;
  codeExpiresAt: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}
