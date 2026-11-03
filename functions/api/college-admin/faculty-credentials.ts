import { z } from 'zod';
import { getContextUser, withAuth } from '../../lib/auth';
import { FacultyCredentialsError, resendFacultyCredentials } from '../../lib/faculty-credentials';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import type { PagesEnv } from '../../lib/types';

export const onRequestPost = withAuth(async context => {
  const parsed = z.object({ facultyId: z.string().uuid() }).strict().safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', 'A valid faculty ID is required.', context.request);
  const env = context.env as unknown as PagesEnv;
  try {
    const result = await resendFacultyCredentials(env, getServiceClient(env), getContextUser(context), parsed.data.facultyId, context.request.url);
    return apiSuccess(result, context.request);
  } catch (error) {
    if (error instanceof FacultyCredentialsError)
      return apiError(error.status, error.status === 403 ? 'FORBIDDEN' : error.code, error.message, context.request);
    return apiError(503, 'CREDENTIAL_DELIVERY_ERROR', 'Credential delivery is unavailable. Please try again later.', context.request);
  }
});
