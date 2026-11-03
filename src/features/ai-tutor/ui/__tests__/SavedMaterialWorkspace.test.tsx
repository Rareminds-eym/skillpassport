import {render,screen,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/shared/model',()=>({useUser:()=>({id:'student'})}));
vi.mock('../../api/materialService',()=>({materialAction:async(action:string)=>action==='capabilities'?{enabled:true}:[{id:'recipient',due_at:'2099-01-01',learner:{name:'Student'},assignment:{title:'Time management',content:{questions:[]}},submissions:[{id:'submission',file_name:'answer.pdf',results:[{id:'result',status:'review_required'}]}]}]}));
import SavedMaterialWorkspace from '../SavedMaterialWorkspace';
afterEach(cleanup);
it('shows submission status without exposing unreleased marks or a second submission control',async()=>{
 render(<QueryClientProvider client={new QueryClient()}><SavedMaterialWorkspace courseId="course" educator={false}/></QueryClientProvider>);
 expect(await screen.findByText('Evaluation: review required')).toBeInTheDocument();
 expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Submit document'})).not.toBeInTheDocument();
});
