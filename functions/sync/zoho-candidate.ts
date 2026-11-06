import type { PagesEnv, PagesFunction } from '../lib/types';
import { handleCandidateProjection, handleCandidateProjectionReadiness } from '../lib/zoho-candidate-projection';
export const onRequestPost: PagesFunction<PagesEnv> = context => handleCandidateProjection(context);
export const onRequestGet: PagesFunction<PagesEnv> = context => handleCandidateProjectionReadiness(context);
