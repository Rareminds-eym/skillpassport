import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const f=vi.hoisted(()=>({navigate:vi.fn(),status:vi.fn(),state:undefined as undefined|{courseId:string}}));
vi.mock('react-router-dom',()=>({useNavigate:()=>f.navigate,useLocation:()=>({state:f.state})}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>({id:'qa-user',email:'qa@example.test'})}));
vi.mock('@/entities/learner',()=>({useLearnerDataByEmail:()=>({learnerData:{id:'qa-learner'}})}));
vi.mock('@/features/assessment/api/externalAssessmentService',()=>({checkAssessmentStatus:f.status}));
import AssessmentStart from '../AssessmentStart';
beforeEach(()=>{vi.clearAllMocks();f.state=undefined;f.status.mockResolvedValue({status:'not_started',attempt:null});});
afterEach(cleanup);
it('starts a general assessment without a fabricated internal course identifier',async()=>{
 render(<AssessmentStart/>);
 const button=await screen.findByRole('button',{name:'Start Assessment'});
 await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);
 expect(f.navigate).toHaveBeenCalledWith('/learner/assessment/dynamic',expect.objectContaining({state:expect.objectContaining({courseId:undefined,courseName:'General Assessment'})}));
});
it('preserves a real internal course identifier',async()=>{
 f.state={courseId:'30000000-0000-4000-8000-000000000001'};render(<AssessmentStart/>);
 const button=await screen.findByRole('button',{name:'Start Assessment'});
 await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);
 expect(f.navigate.mock.calls[0][1].state.courseId).toBe(f.state.courseId);
});
