import { withAuth } from '../../lib/auth';
import type { PagesFunction } from '../../lib/types';

const PUBLIC_POST_ROUTES = new Set(['/verification', '/password-reset']);

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/email', '');

  if (context.request.method === 'GET') {
    return context.next();
  }

  if (PUBLIC_POST_ROUTES.has(path)) {
    return context.next();
  }

  return withAuth(async () => context.next())(context);
};
