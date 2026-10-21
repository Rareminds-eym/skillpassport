import {beforeEach,describe,expect,it,vi} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {render,screen} from '@testing-library/react';
const f=vi.hoisted(()=>({user:{id:'trainer',role:'educator'} as any,call:vi.fn(),path:'/educator/dashboard'}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>f.user}));
vi.mock('../../api/teachingApi',()=>({teaching:f.call}));
vi.mock('react-router-dom',()=>({useLocation:()=>({pathname:f.path}),Navigate:({to}:{to:string})=><p>Redirect {to}</p>}));
vi.mock('@/app/layouts/EducatorLayout',()=>({default:()=> <p>Existing educator layout</p>}));
import ExternalEducatorGate from '../ExternalEducatorGate';
describe('positive external educator portal gate',()=>{
 beforeEach(()=>{vi.clearAllMocks();f.user={id:'trainer',role:'educator'};f.path='/educator/dashboard';});
 it('uses the existing educator layout after verified delegated context',async()=>{f.call.mockResolvedValue({external:true,delegatedAccess:true,staff:{id:'staff'}});render(<ExternalEducatorGate><p>General modules</p></ExternalEducatorGate>);expect(screen.queryByText('General modules')).not.toBeInTheDocument();expect(await screen.findByText('Existing educator layout')).toBeInTheDocument();});
 it('uses the existing reset-password route before fetching teaching data',()=>{f.user.user_metadata={first_login_setup_required:true};render(<ExternalEducatorGate><p>General modules</p></ExternalEducatorGate>);expect(screen.getByText('Redirect /reset-password?setup=educator')).toBeInTheDocument();expect(f.call).not.toHaveBeenCalled();});
 it('keeps ordinary educator layout',async()=>{f.call.mockResolvedValue({external:false});render(<ExternalEducatorGate><p>General modules</p></ExternalEducatorGate>);expect(await screen.findByText('General modules')).toBeInTheDocument();});
 it('fails closed on context error',async()=>{f.call.mockRejectedValue(new Error('Access unavailable'));render(<ExternalEducatorGate><p>General modules</p></ExternalEducatorGate>);expect(await screen.findByRole('alert')).toHaveTextContent('Access unavailable');expect(screen.queryByText('General modules')).not.toBeInTheDocument();});
 it('redirects excluded routes without rendering their children',async()=>{f.path='/educator/analytics';f.call.mockResolvedValue({external:true,delegatedAccess:true});render(<ExternalEducatorGate><p>Analytics data</p></ExternalEducatorGate>);expect(await screen.findByText('Redirect /educator/dashboard')).toBeInTheDocument();expect(screen.queryByText('Analytics data')).not.toBeInTheDocument();});
 it('does not expose the removed assignments route',async()=>{f.path='/educator/assignments';f.call.mockResolvedValue({external:true,delegatedAccess:true});render(<ExternalEducatorGate><p>Assignment portal</p></ExternalEducatorGate>);expect(await screen.findByText('Redirect /educator/dashboard')).toBeInTheDocument();expect(screen.queryByText('Assignment portal')).not.toBeInTheDocument();});
});
