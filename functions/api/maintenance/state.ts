import { createSupabaseClient } from '../../lib/supabase'
import type { PagesEnv, PagesFunction } from '../../lib/types'
import { jsonResponse } from '../../lib/response'

export const onRequest: PagesFunction<PagesEnv> = async ({ env }) => {
  try {
    const supabase = createSupabaseClient(env)
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_bypass_token'])

    if (error) {
      return jsonResponse({ error: 'Failed to fetch maintenance config' }, 500)
    }

    const modeConfig = data?.find(d => d.key === 'maintenance_mode')
    const tokenConfig = data?.find(d => d.key === 'maintenance_bypass_token')

    return jsonResponse({
      maintenance_mode: modeConfig?.value ?? 'false',
      maintenance_bypass_token: tokenConfig?.value ?? null,
    })
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
}
