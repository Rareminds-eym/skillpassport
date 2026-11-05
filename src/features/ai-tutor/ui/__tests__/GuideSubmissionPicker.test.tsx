import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rows:[] as any[]}));
vi.mock('@/shared/model',()=>({useUser:()=>({id:'teacher'})}));
vi.mock('../../api/materialService',()=>({materialAction:async()=>mocks.rows}));
import GuideSubmissionPicker from '../GuideSubmissionPicker';
afterEach(cleanup);
it('selects only submitted work and filters by assignment and learner',async()=>{
 mocks.rows=[{id:'one',learner:{name:'Alex'},assignment:{id:'a',title:'Planning'},submissions:[{id:'submission'}]},{id:'two',learner:{name:'Sam'},assignment:{id:'b',title:'Time'},submissions:[]},{id:'three',learner:{name:'Bea'},assignment:{id:'b',title:'Time'},submissions:[{id:'other'}]}];
 const select=vi.fn();render(<QueryClientProvider client={new QueryClient()}><GuideSubmissionPicker courseId="course" onSelect={select} onClose={()=>{}} disabled={false}/></QueryClientProvider>);
 expect(await screen.findByText('Alex')).toBeInTheDocument();expect(screen.queryByText('Sam')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Guide assignment'),{target:{value:'a'}});expect(screen.queryByText('Bea')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search submitted learners'),{target:{value:'absent'}});expect(screen.getByText('No submissions match your selection.')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search submitted learners'),{target:{value:'alex'}});fireEvent.click(screen.getByRole('button',{name:/Alex/}));expect(select).toHaveBeenCalledWith('submission','Alex — Planning');
});
it('shows a clear empty state when no learner has submitted',async()=>{
 mocks.rows=[];render(<QueryClientProvider client={new QueryClient()}><GuideSubmissionPicker courseId="course" onSelect={()=>{}} onClose={()=>{}} disabled={false}/></QueryClientProvider>);
 expect(await screen.findByText('No submitted learner work is available for this course yet.')).toBeInTheDocument();
});
