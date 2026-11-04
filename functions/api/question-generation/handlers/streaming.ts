/** SSE delivery begins only after canonical persistence and owned version
 * binding. Generated answer keys never enter the event stream. */
import type { PagesEnv } from '../../../lib/types';
import { apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { ownQuestionLearner } from '../../../lib/assessment-question-owner';
import { deliverGeneratedQuestions } from '../../../lib/assessment-question-safety';
import { generateAptitudeQuestions } from './career-aptitude';

export async function handleStreamingAptitude(request:Request,env:PagesEnv,context?:any):Promise<Response> {
 if(request.method!=='POST')return apiError(405,'ERROR','Method not allowed',request);
 if(!context?.data?.user?.sub)return apiError(401,'AUTHENTICATION_REQUIRED','Authentication required',request);
 let body:any;
 try{body=await request.json();}catch{return apiError(400,'VALIDATION_ERROR','Invalid JSON',request);}
 const {streamId,learnerId,attemptId,questionsPerCategory=5}=body||{};
 if(typeof streamId!=='string'||!streamId)return apiError(400,'VALIDATION_ERROR','Stream ID is required',request);
 try{await ownQuestionLearner(context,learnerId,attemptId);}
 catch{return apiError(403,'ACCESS_DENIED','Question attempt access denied',request);}
 const lookup=await createSupabaseAdminClient(env).from('personal_assessment_streams').select('id,grade_level').eq('id',streamId).eq('is_active',true).maybeSingle();
 if(lookup.error||!lookup.data)return apiError(400,'VALIDATION_ERROR','Invalid streamId',request);
 let questions:any[];
 try{
  const generated=await generateAptitudeQuestions(env,streamId,questionsPerCategory,learnerId,attemptId,lookup.data.grade_level);
  questions=await deliverGeneratedQuestions(context,{attemptId,streamId,questionType:'aptitude',questions:generated});
 }catch{return apiError(503,'QUESTION_BINDING_UNAVAILABLE','Question generation or version binding unavailable',request);}
 const encoder=new TextEncoder();
 const stream=new ReadableStream({start(controller){
  const event=(value:any)=>controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
  event({type:'progress',message:'Questions ready',count:0,total:questions.length});
  for(const [index,question]of questions.entries())event({type:'question',data:question,count:index+1,total:questions.length});
  event({type:'complete',message:'All questions generated successfully',count:questions.length,total:questions.length});
  controller.close();
 }});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
