import { useEffect,useState,type ReactNode } from 'react';
import { Navigate,useLocation } from 'react-router-dom';
import { useUser } from '@/shared/model/authStore';
import { teaching } from '../api/teachingApi';
import PageLoader from './PageLoader';
import EducatorLayout from '@/app/layouts/EducatorLayout';
import {AssignedTeachingContext} from '../model/teachingContext';
export const externalEducatorPaths=new Set(['dashboard','learners','courses','browse-courses','mark-attendance','account','settings','college-assignments']);
export default function ExternalEducatorGate({children}:{children:ReactNode}){
  const user=useUser();const location=useLocation();const candidate=['educator','rm_trainer','trainer'].includes(user?.role||'')||user?.roles?.some(role=>['educator','rm_trainer','trainer'].includes(role))||user?.user_metadata?.portal_mode==='assigned_trainer';
  const [result,setResult]=useState<{actor:string;context:any}|null>(null);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
  const setupRequired=user?.user_metadata?.must_change_password===true || user?.user_metadata?.first_login_setup_required===true;
  useEffect(()=>{let active=true;setResult(null);setError('');if(user&&candidate&&!setupRequired)teaching('context').then(context=>{if(active)setResult({actor:user.id,context});}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[user?.id,candidate,attempt,setupRequired]);
  if(user&&setupRequired)return <Navigate to="/reset-password?setup=educator" replace/>;
  if(!user||!candidate)return <>{children}</>;
  if(error)return <div role="alert" className="p-6"><p>{error}</p><button className="text-indigo-700 underline" onClick={()=>setAttempt(value=>value+1)}>Retry educator access</button></div>;
  if(!result||result.actor!==user.id)return <PageLoader message="Verifying your assigned educator access…"/>;
  if(!result.context.external)return <>{children}</>;
  if(!result.context.delegatedAccess)return <div className="p-6"><h1 className="text-xl font-semibold">Teaching access pending</h1><p>Ask your Rareminds administrator to enable your assigned teaching access.</p></div>;
  const segment=location.pathname.split('/')[2]||'dashboard';
  const parts=location.pathname.split('/');
  // Assigned educators open assigned course content through the course
  // player, exactly like other roles — only the course list itself redirects.
  if(segment==='courses'&&parts[4]==='learn')return <AssignedTeachingContext.Provider value={result.context}><EducatorLayout/></AssignedTeachingContext.Provider>;
  if(!externalEducatorPaths.has(segment))return <Navigate to="/educator/dashboard" replace/>;
  if(segment==='courses')return <Navigate to="/educator/browse-courses" replace/>;
  return <AssignedTeachingContext.Provider value={result.context}><EducatorLayout/></AssignedTeachingContext.Provider>;
}
