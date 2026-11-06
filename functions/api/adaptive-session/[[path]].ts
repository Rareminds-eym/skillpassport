/**
 * Adaptive Session API Router
 * 
 * Handles all adaptive aptitude test session management endpoints.
 * This API eliminates CORS issues by handling all Supabase operations server-side.
 * 
 * Endpoints:
 * - POST /initialize - Start new test session
 * - GET /next-question/:sessionId - Get next question
 * - POST /submit-answer - Submit answer and update session
 * - POST /complete/:sessionId - Complete test and calculate results
 * - GET /results/:sessionId - Get test results
 * - GET /results/learner/:learnerId - Get all results for learner
 * - GET /resume/:sessionId - Resume in-progress test
 * - GET /find-in-progress/:learnerId - Find in-progress session
 * - POST /abandon/:sessionId - Abandon session
 * - POST /link-to-attempt - Link adaptive session to assessment attempt
 */

import type { PagesFunction } from '../../lib/types';
import { apiError } from '../../lib/response';
import { withAuth } from '../../lib/auth';
import { initializeHandler } from './handlers/initialize';
import { nextQuestionHandler } from './handlers/next-question';
import { submitAnswerHandler } from './handlers/submit-answer';
import { completeHandler } from './handlers/complete';
import { getResultsHandler, getlearnerResultsHandler } from './handlers/results';
import { resumeHandler, findInProgressHandler } from './handlers/resume';
import { abandonHandler } from './handlers/abandon';
import { onRequestPost as linkToAttemptHandler } from './link-to-attempt';
import {authorizeAdaptiveSession,privateAdaptiveResponse} from '../../lib/adaptive-session-boundary';

export const onRequest: PagesFunction = async (context) => {
 const request=context.request,url=new URL(request.url),path=url.pathname.replace('/api/adaptive-session',''),method=request.method;
 const routes:[string,RegExp,any][]=[
  ['POST',/^\/initialize$/,initializeHandler],
  ['GET',/^\/next-question\/[^/]+$/,nextQuestionHandler],
  ['POST',/^\/submit-answer$/,submitAnswerHandler],
  ['POST',/^\/complete\/[^/]+$/,completeHandler],
  ['GET',/^\/results\/learner\/[^/]+$/,getlearnerResultsHandler],
  ['GET',/^\/results\/[^/]+$/,getResultsHandler],
  ['GET',/^\/resume\/[^/]+$/,resumeHandler],
  ['GET',/^\/find-in-progress\/[^/]+$/,findInProgressHandler],
  ['POST',/^\/abandon\/[^/]+$/,abandonHandler],
 ];
 try{
  return await withAuth(async(authContext:any)=>{
   if(method==='POST'&&path==='/link-to-attempt')return linkToAttemptHandler(authContext);
   const route=routes.find(([verb,pattern])=>verb===method&&pattern.test(path));
   if(!route)return apiError(404,'NOT_FOUND','Not found',request);
   const authorized=await authorizeAdaptiveSession(authContext,path,method);
   if(authorized instanceof Response)return authorized;
   return privateAdaptiveResponse(await route[2](authorized.context));
  })(context);
 }catch{
  return apiError(503,'SESSION_UNAVAILABLE','Session authority unavailable',request);
 }
};
