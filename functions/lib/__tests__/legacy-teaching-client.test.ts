import {describe,expect,it,vi} from 'vitest';
import {legacyTeachingClient} from '../legacy-teaching-client';
describe('legacy attendance query isolation',()=>{
 function fixture(){const result={eq:vi.fn(),is:vi.fn()};const builder={select:vi.fn(()=>result),update:vi.fn(()=>result),delete:vi.fn(()=>result),insert:vi.fn(()=>result)};const db={from:vi.fn(()=>builder),rpc:vi.fn()};return {db,builder,result,scoped:legacyTeachingClient(db as any)};}
 it('leaves existing assignment APIs untouched',()=>{const f=fixture();expect(f.scoped.from('assignments')).toBe(f.builder);expect(f.scoped.from('learner_assignments')).toBe(f.builder);expect(f.scoped.from('assignment_attachments')).toBe(f.builder);});
 it('isolates legacy attendance registers too',()=>{const f=fixture();f.scoped.from('college_attendance_sessions').select('*');expect(f.result.eq).toHaveBeenCalledWith('instructor_source','legacy_college');f.scoped.from('college_attendance_records').select('*');expect(f.result.is).toHaveBeenCalledWith('organization_staff_id',null);});
});
