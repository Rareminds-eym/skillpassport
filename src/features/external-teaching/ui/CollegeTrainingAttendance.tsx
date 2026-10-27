import { useEffect, useMemo, useState } from 'react';
import { markCombinedLearners, teaching } from '../api/teachingApi';
import { combinedMarkPayload, eventSessionLabel, eventSessionStatus, findSessionEvent, groupSessionEvents } from '../model/combinedClass';
import { toast } from '@/shared/ui';

const singleLabel=(s:any)=>`${s.date} ${s.start_time} · ${s.subject_name} · ${s.faculty_name} · ${s.section}`;

export default function CollegeTrainingAttendance({collegeId,initialSessionId,educator=false}:{collegeId?:string;initialSessionId?:string;educator?:boolean}) {
  const [sessions,setSessions]=useState<any[]>([]),[sessionId,setSessionId]=useState(initialSessionId||'');
  // One roster per class: a single-class session has one, a combined class session has one for each class.
  const [rosters,setRosters]=useState<any[]|null>(null),[marks,setMarks]=useState<Record<string,string>>({});
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const events=useMemo(()=>groupSessionEvents(sessions),[sessions]);
  const event=sessionId?findSessionEvent(events,sessionId):undefined;
  const groupId=event?.groupId||null;
  const targetIds=event?event.sessions.map(s=>s.id):sessionId?[sessionId]:[];
  const targetKey=targetIds.join(',');
  const loadRosters=(ids:string[])=>Promise.all(ids.map(id=>teaching('session_roster',{sessionId:id})));
  useEffect(()=>{let alive=true;teaching(educator?'sessions':'college_sessions',educator?{}:{collegeId}).then(rows=>{if(alive)setSessions(rows);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[collegeId,initialSessionId,educator]);
  useEffect(()=>{if(initialSessionId)setSessionId(initialSessionId);},[initialSessionId]);
  useEffect(()=>{let alive=true;setRosters(null);setMarks({});if(targetKey)loadRosters(targetKey.split(',')).then(data=>{if(alive){setRosters(data);setMarks(Object.fromEntries(data.flatMap((r:any)=>r.learners.map((l:any)=>[l.learner_id,l.status||'']))));setError('');}}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[targetKey]);
  async function save(){if(!rosters)return;setBusy(true);try{
    if(groupId){
      const payload=combinedMarkPayload(groupId,rosters.map((r:any,i:number)=>({sessionId:targetIds[i],version:r.session.version,attendanceRevision:r.session.attendance_revision,learnerIds:r.learners.map((l:any)=>l.learner_id)})),marks);
      if(!payload)throw new Error('Select at least one learner attendance status.');
      await markCombinedLearners(payload);
    }else{
      const records=Object.entries(marks).filter(([,status])=>status).map(([learnerId,status])=>({learnerId,status}));
      if(!records.length)throw new Error('Select at least one learner attendance status.');
      await teaching('mark_learners',{sessionId:targetIds[0],version:rosters[0].session.version,attendanceRevision:rosters[0].session.attendance_revision,records});
    }
    setRosters(await loadRosters(targetIds));toast.success('Learner attendance saved.');setError('');
  }catch(e){setError(e instanceof Error?e.message:'Attendance could not be saved.');}finally{setBusy(false);}}
  const learnerRow=(l:any)=><label key={l.learner_id} className="flex flex-col sm:flex-row justify-between gap-2 border-b py-2">{l.learner_name} ({l.roll_number})<select aria-label={`Attendance for ${l.learner_name}`} value={marks[l.learner_id]||''} onChange={e=>setMarks(prev=>({...prev,[l.learner_id]:e.target.value}))} className="rounded border p-2"><option value="">Unmarked</option>{['present','absent','late','excused'].map(s=><option key={s}>{s}</option>)}</select></label>;
  const first=rosters?.[0];
  const closed=!rosters||(groupId?rosters.every((r:any)=>r.session.status==='cancelled'||!!r.session.locked_at):first.session.status==='cancelled'||!!first.session.locked_at);
  return <section className="my-6 rounded-xl border bg-white p-4 space-y-3"><h2 className="text-lg font-semibold">Training course attendance</h2>
    <label className="block">Scheduled class<select aria-label="Training attendance session" value={event?event.key:sessionId} onChange={e=>setSessionId(e.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Select a training class</option>{events.map(ev=><option key={ev.key} value={ev.key}>{eventSessionLabel(ev,singleLabel)}</option>)}</select></label>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {first&&!groupId&&<><p>{first.session.subject_name} · {first.session.faculty_name} · {first.session.status}</p>
      {first.learners.length===0&&<p>No learners matched this class and specialization when it was scheduled.</p>}
      {first.learners.map(learnerRow)}</>}
    {first&&groupId&&<><p>{first.session.subject_name} · {first.session.faculty_name} · Combined: {rosters!.length} classes, {rosters!.reduce((n:number,r:any)=>n+r.learners.length,0)} students · {eventSessionStatus({groupId,key:groupId,representative:first.session,sessions:rosters!.map((r:any)=>r.session)})}</p>
      {rosters!.map((r:any,i:number)=><div key={targetIds[i]} aria-label={`Class ${i+1}`}>
        <h3 className="mt-3 font-medium">Class {i+1} · {r.session.program_name} · Section {r.session.section} · {r.learners.length} students</h3>
        {r.learners.length===0&&<p>No learners matched this class when it was scheduled.</p>}
        {r.learners.map(learnerRow)}</div>)}</>}
    {rosters&&<button onClick={save} disabled={busy||closed} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{busy?'Saving…':'Save learner attendance'}</button>}
  </section>;
}
