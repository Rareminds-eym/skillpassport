import {withAuth,getContextUser} from '../../lib/auth';
import {getServiceClient} from '../../lib/supabase';
import {apiError,apiSuccess,apiDbError} from '../../lib/response';
export const onRequestGet=withAuth(async context=>{
 const url=new URL(context.request.url),kind=url.searchParams.get('kind')||'training',offset=Number(url.searchParams.get('offset')||0);
 if(!['training','certificate','experience','project'].includes(kind)||!Number.isInteger(offset)||offset<0||offset>100000)return apiError(400,'VALIDATION_ERROR','Invalid evidence source page.',context.request);
 const db=getServiceClient(context.env as any),user=getContextUser(context);
 const {data,error}=await db.rpc('list_learning_evidence_sources',{p_user:user.id,p_kind:kind,p_offset:offset});
 if(error)return apiDbError(error,context.request);
 const response=apiSuccess({...data,nextOffset:(data?.items||[]).length===50&&offset+50<=100000&&offset+50<Number(data?.total||0)?offset+50:null},context.request);
 response.headers.set('Cache-Control','private, no-store');return response;
});
