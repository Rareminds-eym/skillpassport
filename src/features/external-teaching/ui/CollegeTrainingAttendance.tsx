import { useEffect, useState } from 'react';
import { teaching } from '../api/teachingApi';
import { toast } from '@/shared/ui';

export default function CollegeTrainingAttendance({collegeId,initialSessionId}:{collegeId:string;initialSessionId?:string}) {
  const [sessions,setSessions]=useState<any[]>([]),[sessionId,setSessionId]=useState(initialSessionId||'');
  const [roster,setRoster]=useState<any>(null),[marks,setMarks]=useState<Record<string,string>>({});
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{let alive=true;teaching('college_sessions',{collegeId}).then(rows=>{if(alive)setSessions(rows);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[collegeId,initialSessionId]);
  useEffect(()=>{if(initialSessionId)setSessionId(initialSessionId);},[initialSessionId]);
  useEffect(()=>{let alive=true;setRoster(null);setMarks({});if(sessionId)teaching('session_roster',{sessionId}).then(data=>{if(alive){setRoster(data);setMarks(Object.fromEntries(data.learners.map((l:any)=>[l.learner_id,l.status||''])));setError('');}}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[sessionId]);
  async function save(){if(!roster)return;setBusy(true);try{
    const records=Object.entries(marks).filter(([,status])=>status).map(([learnerId,status])=>({learnerId,status}));
    if(!records.length)throw new Error('Select at least one learner attendance status.');
    await teaching('mark_learners',{sessionId,version:roster.session.version,attendanceRevision:roster.session.attendance_revision,records});
    setRoster(await teaching('session_roster',{sessionId}));toast.success('Learner attendance saved.');setError('');
  }catch(e){setError(e instanceof Error?e.message:'Attendance could not be saved.');}finally{setBusy(false);}}
  return <section className="my-6 rounded-xl border bg-white p-4 space-y-3"><h2 className="text-lg font-semibold">Training course attendance</h2>
    <label className="block">Scheduled class<select aria-label="Training attendance session" value={sessionId} onChange={e=>setSessionId(e.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Select a training class</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.date} {s.start_time} · {s.subject_name} · {s.faculty_name} · {s.section}</option>)}</select></label>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {roster&&<><p>{roster.session.subject_name} · {roster.session.faculty_name} · {roster.session.status}</p>
      {roster.learners.length===0&&<p>No learners matched this class and specialization when it was scheduled.</p>}
      {roster.learners.map((l:any)=><label key={l.learner_id} className="flex flex-col sm:flex-row justify-between gap-2 border-b py-2">{l.learner_name} ({l.roll_number})<select aria-label={`Attendance for ${l.learner_name}`} value={marks[l.learner_id]||''} onChange={e=>setMarks(prev=>({...prev,[l.learner_id]:e.target.value}))} className="rounded border p-2"><option value="">Unmarked</option>{['present','absent','late','excused'].map(s=><option key={s}>{s}</option>)}</select></label>)}
      <button onClick={save} disabled={busy||roster.session.status==='cancelled'||!!roster.session.locked_at} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{busy?'Saving…':'Save learner attendance'}</button></>}
  </section>;
}
