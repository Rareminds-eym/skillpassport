import type { GatewayAction } from '../types';
import { createWriteDb } from '../write-db';
import { upsertSingleProgressPayload } from '../../../../../lib/lte/lte-sync-write';
import { getServiceClient } from '../../../../../lib/supabase';

/**
 * Single-door gateway action: `lte:sync`
 * Executed when auth-sync-consumer processes a queue event from `lte-db-sync-queue`.
 * Accepts self-contained progress payload directly from queue and performs DB upsert.
 */
export const handleLteSync: GatewayAction = async (ctx, payload) => {
  const userId = ctx.userId;

  const db = createWriteDb(ctx.env);
  const learner = await db.queryOne<{ id: string }>(
    `learners?user_id=eq.${encodeURIComponent(userId)}&select=id`
  );

  if (!learner) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Learner profile not found' } };
  }

  let syncResult;
  if(payload.schemaVersion===2){
    const {data,error}=await getServiceClient(ctx.env).rpc('apply_lte_progress_snapshot',{p_learner:learner.id,p_payload:payload});
    if(error)throw new Error('LTE progress transaction failed');
    syncResult=data;
  }else{
    const prior=await db.queryOne<{id:string;source_revision:number|null}>(`trainings?learner_id=eq.${encodeURIComponent(learner.id)}&source=eq.lte&lte_course_id=eq.${encodeURIComponent(String(payload.lteCourseId||payload.levelId||''))}&select=id,source_revision`);
    syncResult=prior?.source_revision!=null?{synced:true,trainingId:prior.id}:await upsertSingleProgressPayload(db,learner.id,payload);
  }
  return {
    ok: true,
    data: {
      synced: syncResult.synced,
      trainingId: syncResult.trainingId,
      timestamp: new Date().toISOString(),
    },
  };
};
