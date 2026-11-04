import {render,screen,cleanup,fireEvent,within} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
const exports=vi.hoisted(()=>({exportAs:vi.fn()}));
vi.mock('../../model/useExport',()=>({useExport:()=>({exportAs:exports.exportAs,isExporting:false})}));
vi.mock('@/shared/model',()=>({useUser:()=>({id:'student'})}));
vi.mock('../../api/materialService',()=>({materialAction:async(action:string,data?:{kind?:string})=>action==='capabilities'?{enabled:true}:action==='library'?(data?.kind==='lesson_plan'?[{id:'plan',title:'Saved time management plan',content:{markdown:'Lesson objectives and teaching activities'}}]:[{id:'assignment',title:'Worksheet one',content:{questions:[]}},{id:'other',title:'Worksheet two',content:{questions:[]}}]):[{id:'recipient',due_at:'2099-01-01',learner:{name:'Student'},assignment:{id:'assignment',title:'Time management',content:{questions:[]}},submissions:[{id:'submission',file_name:'answer.pdf',results:[{id:'result',status:'review_required'}]}]}]}));
vi.mock('../SaveGeneratedMaterial',()=>({AllocateSavedMaterial:()=> <span>Assigned</span>}));
vi.mock('../LearnerWorksheets',()=>({default:()=> <div>Legacy download list</div>}));
import SavedMaterialWorkspace, {LearnerProgressBrowser} from '../SavedMaterialWorkspace';
afterEach(cleanup);
it('handles 79 learners with paging, search, status filters, grid view and on-demand details',()=>{
 const rows=Array.from({length:79},(_,i)=>({id:`recipient-${i}`,due_at:'2099-01-01',learner:{name:`Learner ${String(i+1).padStart(2,'0')}`},assignment:{id:'assignment',title:'Worksheet',content:{questions:[]}},submissions:i===78?[{id:'submission',file_name:'answer.pdf',results:[{status:'review_required'}]}]:[]}));
 render(<QueryClientProvider client={new QueryClient()}><LearnerProgressBrowser rows={rows} courseId="course"/></QueryClientProvider>);
 expect(screen.getByRole('table')).toBeInTheDocument();
 expect(screen.getAllByRole('row')).toHaveLength(11);
 expect(screen.getByText('1–10 of 79 learners')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByText('11–20 of 79 learners')).toBeInTheDocument();
 fireEvent.change(screen.getByRole('textbox',{name:'Search learners'}),{target:{value:'learner 79'}});
 expect(screen.getByText('1–1 of 1 learners')).toBeInTheDocument();
 expect(screen.getByText('Learner 79')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Grid view'}));
 expect(screen.queryByRole('table')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'View Learner 79'}));
 expect(screen.getByRole('region',{name:'Learner 79 details'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Filter learner status'}),{target:{value:'Awaiting submission'}});
 expect(screen.getByText('No learners match your search or filter.')).toBeInTheDocument();
 expect(screen.queryByRole('region',{name:'Learner 79 details'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByRole('textbox',{name:'Search learners'}),{target:{value:''}});
 expect(screen.getByText('1–10 of 78 learners')).toBeInTheDocument();
});
it('offers PDF and Word exports from the saved assignment menu',async()=>{
 render(<QueryClientProvider client={new QueryClient()}><SavedMaterialWorkspace courseId="course" educator/></QueryClientProvider>);
 const trigger=await screen.findByRole('button',{name:'Export Worksheet one'});
 fireEvent.keyDown(trigger,{key:'ArrowDown'});
 fireEvent.click(await screen.findByRole('menuitem',{name:'Export PDF'}));
 expect(exports.exportAs).toHaveBeenCalledWith('pdf');
 fireEvent.keyDown(trigger,{key:'ArrowDown'});
 fireEvent.click(await screen.findByRole('menuitem',{name:'Export Word'}));
 expect(exports.exportAs).toHaveBeenCalledWith('docx');
});
it('shows submission status without exposing unreleased marks or a second submission control',async()=>{
 render(<QueryClientProvider client={new QueryClient()}><SavedMaterialWorkspace courseId="course" educator={false}/></QueryClientProvider>);
 expect(await screen.findByText('Evaluation: review required')).toBeInTheDocument();
 expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Submit document'})).not.toBeInTheDocument();
});

it('keeps old download-only worksheets collapsed separately from document assignments',async()=>{
 render(<QueryClientProvider client={new QueryClient()}><SavedMaterialWorkspace courseId="course" educator={false}/></QueryClientProvider>);
 const previous=await screen.findByRole('button',{name:'Previous worksheets'});
 expect(previous).toHaveAttribute('aria-expanded','false');
 expect(screen.queryByText('Legacy download list')).not.toBeInTheDocument();
 fireEvent.click(previous);
 expect(screen.getByText('Legacy download list')).toBeInTheDocument();
 expect(previous).toHaveAttribute('aria-expanded','true');
});

it('switches saved material types with accessible pill buttons instead of a dropdown',async()=>{
 render(<QueryClientProvider client={new QueryClient()}><SavedMaterialWorkspace courseId="course" educator={true}/></QueryClientProvider>);
 const assignments=await screen.findByRole('button',{name:'Assignments'});
 const plans=screen.getByRole('button',{name:'Lesson plans'});
 expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
 expect(within(screen.getByRole('group',{name:'Saved material type'})).queryByRole('button',{name:'Overview'})).not.toBeInTheDocument();
 expect(assignments).toHaveAttribute('aria-pressed','true');
 fireEvent.click(plans);
 expect(plans).toHaveAttribute('aria-pressed','true');
 expect(assignments).toHaveAttribute('aria-pressed','false');
});

it('shows saved lesson plans without assignment evaluation or submission status',async()=>{
 render(<QueryClientProvider client={new QueryClient()}><SavedMaterialWorkspace courseId="course" educator={true}/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Lesson plans'}));
 expect(await screen.findByText('Saved time management plan')).toBeInTheDocument();
 expect(screen.queryByLabelText('Assignment progress')).not.toBeInTheDocument();
 expect(screen.queryByText('Learner submissions and results')).not.toBeInTheDocument();
 expect(screen.queryByText(/Evaluation:/)).not.toBeInTheDocument();
 expect(screen.queryByText('No assignments allocated yet.')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Assignments'}));
 expect(await screen.findByText('Worksheet one')).toBeInTheDocument();
 const overviews=screen.getAllByText('Overview');
 expect(overviews).toHaveLength(2);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 fireEvent.click(overviews[0]);
 const first=await screen.findByRole('dialog',{name:'Worksheet one'});
 expect(within(first).getByText('Student')).toBeInTheDocument();
 fireEvent.click(within(first).getByRole('button',{name:'Close overview'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 fireEvent.click(screen.getAllByText('Overview')[1]);
 const second=await screen.findByRole('dialog',{name:'Worksheet two'});
 expect(within(second).queryByText('Student')).not.toBeInTheDocument();
 expect(within(second).getByText('No learners assigned yet.')).toBeInTheDocument();
});
