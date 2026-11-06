-- Synthetic selector/projection fixture only. The existing authoritative
-- qualification engine is represented by a controlled snapshot result here.
CREATE TABLE public.user_capability_level_progress(user_id uuid,level_id uuid,status text,updated_at timestamptz,reviewed boolean DEFAULT true);
CREATE FUNCTION public.job_learning_snapshot(p_user uuid,p_levels uuid[],p_policy text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
 SELECT jsonb_build_object('revision',md5(coalesce(jsonb_agg(level_id ORDER BY level_id),'[]')::text),'levels',
 coalesce(jsonb_agg(jsonb_build_object('levelId',level_id,'capabilityName','Fixture capability','title','Fixture achievement',
 'levelNumber',2,'fingerprint',repeat('a',32),'approved',reviewed,'evidence',jsonb_build_array('PRIVATE REVIEW'))),'[]'))
 FROM public.user_capability_level_progress WHERE user_id=p_user AND level_id=ANY(p_levels);
$$;
