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
 fireEvent.change(screen.getByLabelText('Search submitted learners'),{target:{value:'alex'}});fireEvent.click(screen.getByRole('button',{name:/Alex/}));expect(select).toHaveBeenCalledWith('submission',expect.stringContaining('Alex - Planning'));
});
it('shows a clear empty state when no learner has submitted',async()=>{
 mocks.rows=[];render(<QueryClientProvider client={new QueryClient()}><GuideSubmissionPicker courseId="course" onSelect={()=>{}} onClose={()=>{}} disabled={false}/></QueryClientProvider>);
 expect(await screen.findByText('No submitted learner work is available for this course yet.')).toBeInTheDocument();
});

it('distinguishes identical titles and selects the exact zero-mark attempt',async()=>{
 mocks.rows=[{id:'one',learner:{name:'Anusha'},assignment:{id:'assignment-one',title:'Intermediate - 5 questions'},submissions:[{id:'submission-zero',file_name:'attempt-zero.pdf',submitted_at:'2026-11-21T03:00:00Z',results:[{status:'released',total_marks:0,maximum_marks:100}]}]},{id:'two',learner:{name:'Anusha'},assignment:{id:'assignment-two',title:'Intermediate - 5 questions'},submissions:[{id:'submission-75',file_name:'attempt-75.pdf',submitted_at:'2026-11-21T04:00:00Z',results:[{status:'released',total_marks:75,maximum_marks:100}]}]}];
 const select=vi.fn();render(<QueryClientProvider client={new QueryClient()}><GuideSubmissionPicker courseId="course" onSelect={select} onClose={()=>{}} disabled={false}/></QueryClientProvider>);
 const zero=await screen.findByRole('button',{name:/Score: 0\/100/});expect(screen.getByRole('button',{name:/Score: 75\/100/})).toBeInTheDocument();
 fireEvent.click(zero);expect(select).toHaveBeenCalledWith('submission-zero',expect.stringContaining('Score: 0/100'));
 fireEvent.change(screen.getByLabelText('Guide assignment'),{target:{value:'assignment-one'}});expect(screen.queryByRole('button',{name:/Score: 75/})).not.toBeInTheDocument();
});
it('offers separate choices for every attempt instead of silently selecting the first',async()=>{
 mocks.rows=[{id:'one',learner:{name:'Alex'},assignment:{id:'a',title:'Planning'},submissions:[{id:'old',file_name:'old.pdf'},{id:'new',file_name:'new.pdf'}]}];
 const select=vi.fn();render(<QueryClientProvider client={new QueryClient()}><GuideSubmissionPicker courseId="course" onSelect={select} onClose={()=>{}} disabled={false}/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:/new.pdf/}));expect(select).toHaveBeenCalledWith('new',expect.stringContaining('new.pdf'));
});
