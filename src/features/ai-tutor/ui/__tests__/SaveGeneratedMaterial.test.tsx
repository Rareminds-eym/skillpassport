import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({action:vi.fn()}));
vi.mock('@/shared/model',()=>({useUser:()=>({id:'teacher'})}));
vi.mock('../../api/materialService',()=>({materialAction:mocks.action}));
import SaveGeneratedMaterial, { AllocateSavedMaterial } from '../SaveGeneratedMaterial';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('automatically saves before opening learner selection from the direct assign action',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='capabilities'?{enabled:true}:action==='choice'?{state:'unanswered'}:action==='save'?{state:'saved',id:'assignment',kind:'assignment'}:action==='allocation-learners'?{learners:[{id:'learner',name:'Alex'}],blockedCount:0}:{content:{questions:[]},grading_rules:[]});
 render(<QueryClientProvider client={new QueryClient()}><SaveGeneratedMaterial canAssign courseId="course" conversationId="conversation" messageId="message"/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Assign to learners'}));
 expect(await screen.findByRole('region',{name:'Assign saved material'})).toBeInTheDocument();
 expect(screen.queryByText('Saved to materials')).not.toBeInTheDocument();
 expect(mocks.action.mock.calls.filter(([action])=>action==='save')).toHaveLength(1);
 expect(mocks.action.mock.calls.some(([action])=>action==='allocate')).toBe(false);
 expect(await screen.findByLabelText('Alex')).toBeInTheDocument();
});
function show(){return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SaveGeneratedMaterial courseId="course" conversationId="conversation" messageId="message"/></QueryClientProvider>);}
it('keeps the direct-assignment save invisible until learner selection is ready',async()=>{
 let completeSave!:(value:unknown)=>void;
 const save=new Promise(resolve=>{completeSave=resolve;});
 mocks.action.mockImplementation((action:string)=>action==='capabilities'?Promise.resolve({enabled:true}):action==='choice'?Promise.resolve({state:'unanswered'}):action==='save'?save:action==='allocation-learners'?Promise.resolve({learners:[{id:'learner',name:'Alex'}],blockedCount:0}):Promise.resolve({content:{questions:[]},grading_rules:[]}));
 render(<QueryClientProvider client={new QueryClient()}><SaveGeneratedMaterial canAssign courseId="course" conversationId="conversation" messageId="message"/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Assign to learners'}));
 await waitFor(()=>expect(mocks.action.mock.calls.filter(([action])=>action==='save')).toHaveLength(1));
 expect(screen.queryByText('Save to materials')).not.toBeInTheDocument();
 expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Save'})).not.toBeInTheDocument();
 expect(screen.queryByRole('region',{name:'Assign saved material'})).not.toBeInTheDocument();
 completeSave({state:'saved',id:'assignment',kind:'assignment'});
 expect(await screen.findByRole('region',{name:'Assign saved material'})).toBeInTheDocument();
 expect(screen.queryByText('Saved to materials')).not.toBeInTheDocument();
 expect(mocks.action.mock.calls.some(([action])=>action==='allocate')).toBe(false);
});
it('restores the direct-assign action and error when background saving fails',async()=>{
 mocks.action.mockImplementation(async(action:string)=>{if(action==='capabilities')return {enabled:true};if(action==='choice')return {state:'unanswered'};throw new Error('Unable to prepare assignment');});
 render(<QueryClientProvider client={new QueryClient()}><SaveGeneratedMaterial canAssign courseId="course" conversationId="conversation" messageId="message"/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Assign to learners'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Unable to prepare assignment');
 expect(screen.getByRole('button',{name:'Assign to learners'})).toBeEnabled();
 expect(screen.queryByText('Saved to materials')).not.toBeInTheDocument();
});
it('does not save on generation and confirms only an explicit successful save',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='capabilities'?{enabled:true}:action==='choice'?{state:'unanswered'}:{state:'saved',id:'plan',kind:'lesson_plan'});
 show();fireEvent.click(await screen.findByRole('button',{name:'Save'}));
 expect(await screen.findByText('Saved to materials')).toBeInTheDocument();
 expect(mocks.action.mock.calls.filter(([action])=>action==='save')).toHaveLength(1);
});
it('persists Not now and never turns that choice into a material record',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='capabilities'?{enabled:true}:action==='choice'?{state:'unanswered'}:{state:'deferred'});
 show();await screen.findByRole('button',{name:'Save'});
 expect(mocks.action.mock.calls.some(([action])=>action==='save')).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Not now'}));
 await waitFor(()=>expect(screen.getByText('Not saved to the library.')).toBeInTheDocument());
 expect(mocks.action.mock.calls.some(([action])=>action==='save')).toBe(false);
});

it('explains incomplete class/section mappings instead of offering unusable recipients',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='allocation-learners'?{learners:[],blockedCount:2}:{content:{questions:[]},grading_rules:[]});
 render(<QueryClientProvider client={new QueryClient()}><AllocateSavedMaterial courseId="course" assignmentId="assignment"/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Assign to learners'}));
 expect(await screen.findByText('No eligible learners yet')).toBeInTheDocument();
 expect(screen.getByText(/2 learners need a class or active college section mapping/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Select all'})).not.toBeInTheDocument();
 expect(screen.getByLabelText('Assignment deadline')).toBeDisabled();
 expect(screen.getByRole('button',{name:'Confirm assignment'})).toBeDisabled();
 expect(mocks.action.mock.calls.some(([action])=>action==='allocate')).toBe(false);
});

it('shows an already-assigned state instead of offering the same recipients again',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='allocation-learners'?{learners:[],blockedCount:0,assignedCount:8,existingDueAt:'2026-12-01T12:00:00Z'}:{content:{questions:[]},grading_rules:[]});
 render(<QueryClientProvider client={new QueryClient()}><AllocateSavedMaterial courseId="course" assignmentId="assignment"/></QueryClientProvider>);
 expect(await screen.findByText('Assigned')).toBeInTheDocument();
 expect(mocks.action).toHaveBeenCalledWith('allocation-learners',{courseId:'course',assignmentId:'assignment'});
 expect(screen.queryByRole('button',{name:'Select all'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Assign to learners'})).not.toBeInTheDocument();
});

it('selects eligible learners, confirms a reviewed assignment and allows closing the form',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='allocation-learners'?{learners:[{id:'learner',name:'Alex'}],blockedCount:0}:action==='allocate'?{learnerCount:1}:{content:{questions:[]},grading_rules:[]});
 render(<QueryClientProvider client={new QueryClient()}><AllocateSavedMaterial courseId="course" assignmentId="assignment"/></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Assign to learners'}));
 fireEvent.click(await screen.findByRole('button',{name:'Select all'}));
 expect(screen.getByLabelText('Alex')).toBeChecked();
 fireEvent.click(screen.getByRole('button',{name:'Clear selection'}));
 expect(screen.getByLabelText('Alex')).not.toBeChecked();
 fireEvent.click(screen.getByLabelText('Alex'));
 fireEvent.change(screen.getByLabelText('Assignment deadline'),{target:{value:'2026-12-01T12:00'}});
 expect(screen.getByRole('button',{name:'Confirm assignment'})).toBeDisabled();
 fireEvent.click(screen.getByLabelText('I reviewed the questions, answers and rubrics.'));
 fireEvent.click(screen.getByRole('button',{name:'Confirm assignment'}));
 expect(await screen.findByText('Assignment confirmed for 1 learners.')).toBeInTheDocument();
 const assignedButton=screen.getByRole('button',{name:'Assigned'});
 expect(assignedButton).toBeDisabled();
 expect(screen.queryByRole('button',{name:'Confirm assignment'})).not.toBeInTheDocument();
 fireEvent.click(assignedButton);
 expect(mocks.action.mock.calls.filter(([action])=>action==='allocate')).toHaveLength(1);
 expect(mocks.action).toHaveBeenCalledWith('allocate',expect.objectContaining({courseId:'course',assignmentId:'assignment',learnerIds:['learner'],reviewed:true}));
 fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
 expect(screen.queryByRole('region',{name:'Assign saved material'})).not.toBeInTheDocument();
 expect(await screen.findByRole('button',{name:'Assign to learners'})).toBeInTheDocument();
});
