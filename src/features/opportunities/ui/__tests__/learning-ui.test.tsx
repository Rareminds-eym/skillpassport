import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,cleanup,waitFor} from '@testing-library/react';
import {useState} from 'react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {LearningRequirementsEditor,type LearningRequirement} from '../LearningRequirementsEditor';
import {LearningEligibilityPanel} from '../LearningEligibilityPanel';
import {RequisitionForm} from '@/pages/recruiter/components/RequisitionDialogs';
import {apiGet} from '@/shared/api/apiClient';
vi.mock('@/shared/api/apiClient',()=>({apiGet:vi.fn()}));
const front={levelId:'10000000-0000-4000-8000-000000000001',fingerprint:'a'.repeat(32),capabilityName:'Frontend',title:'Build a component',levelNumber:2,version:1,mandatory:true};
const back={...front,levelId:'10000000-0000-4000-8000-000000000002',capabilityName:'Backend',title:'Build an API'};
const catalog=[{...front,capabilityId:'front'},{...back,capabilityId:'back'}];
const originalScroll=Element.prototype.scrollIntoView;
beforeEach(()=>{vi.mocked(apiGet).mockReset().mockResolvedValue({data:{levels:catalog}} as any);vi.stubGlobal('ResizeObserver',class {observe(){}unobserve(){}disconnect(){}});Element.prototype.scrollIntoView=vi.fn();});
afterEach(()=>{cleanup();vi.unstubAllGlobals();Element.prototype.scrollIntoView=originalScroll;});
function Editor({initial=[],pending}:{initial?:LearningRequirement[];pending?:(pending:boolean)=>void}){const [value,setValue]=useState(initial);return <><LearningRequirementsEditor value={value} onChange={setValue} onPendingChange={pending}/><output aria-label="Saved requirements">{JSON.stringify(value)}</output></>;}
const saved=()=>JSON.parse(screen.getByLabelText('Saved requirements').textContent!);
async function choose(...names:string[]){await waitFor(()=>expect((screen.getByRole('button',{name:'Capabilities',exact:true}) as HTMLButtonElement).disabled).toBe(false));await userEvent.click(screen.getByRole('button',{name:'Capabilities',exact:true}));for(const name of names)await userEvent.click(await screen.findByRole('option',{name,exact:true}));await userEvent.click(screen.getByRole('button',{name:'Done',exact:true}));}
async function level(cap:string,title:RegExp){await userEvent.click(screen.getByRole('button',{name:`Level for ${cap}`,exact:true}));await userEvent.click(await screen.findByRole('option',{name:title}));}
const add=()=>screen.getByRole('button',{name:'Add selected requirements'});
it('keeps multiple capabilities selected and atomically adds each exact level with its policy',async()=>{
 render(<Editor/>);await choose('Frontend','Backend');expect(screen.getByRole('button',{name:'Capabilities'}).textContent).toContain('2 capabilities selected');
 await level('Frontend',/Build a component/);expect((add() as HTMLButtonElement).disabled).toBe(true);expect(saved()).toEqual([]);
 await level('Backend',/Build an API/);await userEvent.click(screen.getAllByLabelText('Required')[1]);await userEvent.click(add());
 expect(saved()).toEqual([front,{...back,mandatory:false}]);expect(screen.queryByRole('group',{name:'Requirement for Frontend'})).toBeNull();
});
it('deselects a draft without losing another level or editing existing requirements',async()=>{
 const existing={...front,levelId:'existing',mandatory:false};render(<Editor initial={[existing]}/>);await choose('Frontend','Backend');await level('Backend',/Build an API/);
 await userEvent.click(screen.getByRole('button',{name:'Remove selection Frontend'}));expect(screen.getByRole('button',{name:'Level for Backend'}).textContent).toBe('Level 2');await userEvent.click(add());expect(saved()).toEqual([existing,back]);
 await userEvent.click(screen.getAllByLabelText('Required')[1]);expect(saved()[1].mandatory).toBe(false);await userEvent.click(screen.getByRole('button',{name:'Remove Backend level 2'}));expect(saved()).toEqual([existing]);
});
it('supports search, Escape, deselection and clearing drafts with pending-state updates',async()=>{
 const pending=vi.fn();render(<Editor pending={pending}/>);await choose('Frontend');expect(pending).toHaveBeenLastCalledWith(true);
 await userEvent.click(screen.getByRole('button',{name:'Capabilities'}));fireEvent.change(screen.getByRole('combobox',{name:'Search capabilities'}),{target:{value:'missing'}});expect(await screen.findByText('No matches. Try another search.')).toBeTruthy();
 fireEvent.keyDown(screen.getByRole('combobox',{name:'Search capabilities'}),{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('combobox',{name:'Search capabilities'})).toBeNull());
 await userEvent.click(screen.getByRole('button',{name:'Clear selection'}));expect(pending).toHaveBeenLastCalledWith(false);await choose('Frontend');await choose('Frontend');expect(screen.queryByRole('group',{name:'Requirement for Frontend'})).toBeNull();expect(saved()).toEqual([]);
});
it('rejects duplicate levels and caps batch size at the remaining capacity',async()=>{
 vi.mocked(apiGet).mockResolvedValue({data:{levels:[...catalog,{...catalog[0],levelId:'front3',levelNumber:3,title:'Advanced component'}]}} as any);
 render(<Editor initial={[front]}/>);await choose('Frontend');await userEvent.click(screen.getByRole('button',{name:'Level for Frontend'}));expect((await screen.findByRole('option',{name:/Already added/})).getAttribute('aria-disabled')).toBe('true');await userEvent.click(screen.getByRole('option',{name:/Advanced component/}));await userEvent.click(add());expect(saved()).toHaveLength(2);
});
it('allows only one more capability when nineteen requirements already exist',async()=>{
 render(<Editor initial={Array.from({length:19},(_,i)=>({...front,levelId:`existing-${i}`}))}/>);await waitFor(()=>expect((screen.getByRole('button',{name:'Capabilities'}) as HTMLButtonElement).disabled).toBe(false));await userEvent.click(screen.getByRole('button',{name:'Capabilities'}));await userEvent.click(screen.getByRole('option',{name:'Frontend',exact:true}));expect(screen.getByRole('option',{name:/Backend/}).getAttribute('aria-disabled')).toBe('true');await userEvent.click(screen.getByRole('button',{name:'Done'}));await level('Frontend',/Build a component/);await userEvent.click(add());expect(saved()).toHaveLength(20);
});
it('blocks requisition save while a multi-capability draft remains unfinished',async()=>{
 const submit=vi.fn();render(<RequisitionForm recruiters={[]} onClose={vi.fn()} onSuccess={submit}/>);await choose('Frontend','Backend');fireEvent.submit(document.querySelector('form')!);expect((await screen.findByRole('alert')).textContent).toContain('Add the selected learning requirements or clear the capability selection before saving.');expect(submit).not.toHaveBeenCalled();
});
it('handles an empty catalog and safe retry',async()=>{
 vi.mocked(apiGet).mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue({data:{levels:[]}} as any);const submit=vi.fn(e=>e.preventDefault());render(<form onSubmit={submit}><Editor/></form>);await userEvent.click(await screen.findByRole('button',{name:'Retry'}));expect(await screen.findByText('No published learning levels available')).toBeTruthy();expect(submit).not.toHaveBeenCalled();
});
it('portals into the parent dialog and reflects disabled state',async()=>{
 const {rerender}=render(<div role="dialog" aria-label="Form"><LearningRequirementsEditor value={[]} onChange={vi.fn()}/></div>);await waitFor(()=>expect((screen.getByRole('button',{name:'Capabilities'}) as HTMLButtonElement).disabled).toBe(false));await userEvent.click(screen.getByRole('button',{name:'Capabilities'}));expect(screen.getByRole('dialog',{name:'Form'}).contains(await screen.findByRole('dialog',{name:'Choose capabilities'}))).toBe(true);
 rerender(<div role="dialog" aria-label="Form"><LearningRequirementsEditor value={[]} onChange={vi.fn()} disabled/></div>);await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Choose capabilities'})).toBeNull());expect(screen.getByRole('button',{name:'Capabilities'}).getAttribute('aria-expanded')).toBe('false');
});
it('keeps AI approval and unavailable verification labels distinct',()=>{
 render(<MemoryRouter><LearningEligibilityPanel job={{learning_requirements:[front],learning_eligibility:{state:'eligible',evaluationPolicy:'ai',criteria:[{...front,status:'eligible',reason:'AI_EVALUATED_EQUIVALENT'}]}}}/><LearningEligibilityPanel job={{learning_requirements:[front],learning_eligibility:{state:'unknown',criteria:[]}}}/></MemoryRouter>);expect(screen.getByText(/AI evaluated/)).toBeTruthy();expect(screen.queryByText(/Reviewer approved/)).toBeNull();expect(screen.getByText('Learning verification unavailable')).toBeTruthy();
});
