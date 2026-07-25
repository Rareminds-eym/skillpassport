import { createSupabaseAdminClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from './types';

export type DbClient = SupabaseClient<any>;

export function createDb(env: PagesEnv): DbClient {
  return createSupabaseAdminClient(env);
}
