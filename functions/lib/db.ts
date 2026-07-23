import { createSupabaseAdminClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppDatabase } from '@rareminds-eym/supabase-typegen/types/app.generated';
import type { PagesEnv } from './types';

export type DbClient = SupabaseClient<AppDatabase>;

export function createDb(env: PagesEnv): DbClient {
  return createSupabaseAdminClient(env);
}
