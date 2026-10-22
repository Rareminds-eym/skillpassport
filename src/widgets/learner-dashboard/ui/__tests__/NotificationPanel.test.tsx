import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
const f=vi.hoisted(()=>({navigate:vi.fn(),read:vi.fn(),close:vi.fn(),items:[] as any[]}));
vi.mock('react-router-dom',()=>({useNavigate:()=>f.navigate}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>({id:'owner'})}));
vi.mock('@/features/notifications',()=>({useNotifications:()=>({items:f.items,markRead:f.read,markAllRead:vi.fn(),remove:vi.fn(),loadMore:vi.fn(),unreadCount:1,hasMore:false,loading:false,error:null})}));
import NotificationPanel from '../NotificationPanel';
beforeEach(()=>{vi.clearAllMocks();f.items=[{id:'alert',type:'new_opportunity',title:'Matching opening',message:'Your evaluated learning qualifies',read:false,created_at:new Date().toISOString(),opportunity_id:'11111111-1111-4111-8111-111111111111',learning_requirements_version:2}];});
afterEach(cleanup);
it('opens the job identified by typed notification references',()=>{
 render(<NotificationPanel isOpen onClose={f.close}/>);fireEvent.click(screen.getByText('Matching opening'));
 expect(f.navigate).toHaveBeenCalledWith('/learner/opportunities',{state:{selectedOpportunityId:f.items[0].opportunity_id}});expect(f.read).toHaveBeenCalledWith('alert');expect(f.close).toHaveBeenCalledOnce();
});
it('keeps old notifications without a job reference usable',()=>{
 delete f.items[0].opportunity_id;render(<NotificationPanel isOpen onClose={f.close}/>);fireEvent.click(screen.getByText('Matching opening'));
 expect(f.navigate).toHaveBeenCalledWith('/learner/opportunities',undefined);
});
it('does not change unrelated notification destinations',()=>{
 f.items[0].type='interview_scheduled';render(<NotificationPanel isOpen onClose={f.close}/>);fireEvent.click(screen.getByText('Matching opening'));
 expect(f.navigate).toHaveBeenCalledWith('/learner/applications');
});
