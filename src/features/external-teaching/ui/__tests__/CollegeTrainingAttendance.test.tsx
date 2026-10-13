import {describe,expect,it,vi} from 'vitest';import '@testing-library/jest-dom/vitest';import {fireEvent,render,screen,waitFor} from '@testing-library/react';
const f=vi.hoisted(()=>({call:vi.fn()}));vi.mock('../../api/teachingApi',()=>({teaching:f.call}));vi.mock('@/shared/ui',()=>({toast:{error:vi.fn(),success:vi.fn()}}));
import CollegeTrainingAttendance from '../CollegeTrainingAttendance';
describe('same college-created training register',()=>{
 it('marks the existing session with concurrency revisions and actual learner IDs',async()=>{f.call.mockImplementation(async action=>action==='college_sessions'?[{id:'session',subject_name:'Analytics',date:'2026-10-13',start_time:'09:00',faculty_name:'Hari',section:'A'}]:action==='session_roster'?{session:{id:'session',version:4,attendance_revision:2,status:'scheduled'},learners:[{learner_id:'learner',learner_name:'Student',roll_number:'1',status:null}]}:{});
  render(<CollegeTrainingAttendance collegeId="college" initialSessionId="session"/>);fireEvent.change(await screen.findByLabelText('Attendance for Student'),{target:{value:'present'}});fireEvent.click(screen.getByRole('button',{name:'Save learner attendance'}));await waitFor(()=>expect(f.call).toHaveBeenCalledWith('mark_learners',{sessionId:'session',version:4,attendanceRevision:2,records:[{learnerId:'learner',status:'present'}]}));
 });
});
