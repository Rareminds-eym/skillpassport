import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({action:vi.fn()}));
vi.mock('@/shared/model',()=>({useUser:()=>({id:'teacher'})}));
vi.mock('../../api/materialService',()=>({materialAction:mocks.action}));
import SaveGeneratedMaterial from '../SaveGeneratedMaterial';
afterEach(()=>{cleanup();vi.clearAllMocks();});
function show(){return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SaveGeneratedMaterial courseId="course" conversationId="conversation" messageId="message"/></QueryClientProvider>);}
it('does not save on generation and confirms only an explicit successful save',async()=>{
 mocks.action.mockImplementation(async(action:string)=>action==='capabilities'?{enabled:true}:action==='choice'?{state:'unanswered'}:{state:'saved',id:'plan',kind:'lesson_plan'});
 show();fireEvent.click(await screen.findByRole('button',{name:'Save'}));
 expect(await screen.findByText('Saved independently of this conversation.')).toBeInTheDocument();
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
