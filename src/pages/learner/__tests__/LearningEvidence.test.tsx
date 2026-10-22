import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import LearningEvidence from '../LearningEvidence';
import {apiGet,apiPost} from '@/shared/api/apiClient';
vi.mock('@/shared/api/apiClient',()=>({apiGet:vi.fn(),apiPost:vi.fn()}));
const item={id:'request',level_id:'level',title:'Actual work',evidence_type:'work',evidence_url:'https://example.invalid/work',description:'Demonstrated outcomes',evaluation_type:'ai',status:'pending',version:5,ai_attempts:5,ai_last_attempt_at:new Date(Date.now()-2*86400000).toISOString()};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(apiPost).mockResolvedValue({data:{item}} as any);});
afterEach(cleanup);
function load(request:any,policy='ai'){vi.mocked(apiGet).mockImplementation(async(path)=>({data:String(path).includes('/catalog')?{levels:[]}:{items:[request],evaluationPolicy:policy}} as any));render(<LearningEvidence/>);}
it('allows an exhausted request to be requeued only after its recovery cooldown',async()=>{
 load(item);const button=await screen.findByRole('button',{name:'Request another evaluation round'});
 expect(button).not.toBeDisabled();fireEvent.change(screen.getByLabelText('Evidence source type'),{target:{value:'project'}});fireEvent.click(button);
 await waitFor(()=>expect(apiPost).toHaveBeenCalledWith('/learning/equivalencies',{action:'requeue-ai',id:'request'}));
 expect(screen.getByLabelText('Evidence source type')).toHaveValue('project');
});
it('explains paused attempts and prevents bypassing the recovery cooldown',async()=>{
 load({...item,ai_last_attempt_at:new Date().toISOString()});
 expect(await screen.findByRole('button',{name:'Request another evaluation round'})).toBeDisabled();
 expect(screen.getByText(/Automatic attempts paused/)).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Retry AI evaluation'})).toBeNull();
});
it('explains automatic retry and keeps a scheduled request from being retried early',async()=>{
 load({...item,ai_attempts:1,ai_next_attempt_at:new Date(Date.now()+60000).toISOString()});
 expect(await screen.findByRole('button',{name:'Retry AI evaluation'})).toBeDisabled();
 expect(screen.getByText(/retries automatically when due/)).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Request another evaluation round'})).toBeNull();
});

it('switches pending AI evidence to human-review guidance when institutional policy changes',async()=>{
 load({...item,ai_attempts:1},'human');
 expect(await screen.findByText(/This evidence is awaiting human review/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Retry AI evaluation'})).toBeNull();expect(screen.queryByRole('button',{name:'Request another evaluation round'})).toBeNull();
});

it('submits a profile source identity without copying its title or description',async()=>{
 vi.mocked(apiGet).mockImplementation(async(path)=>({data:String(path).includes('/catalog')?{levels:[{levelId:'target',capabilityName:'Frontend',levelNumber:1,title:'Required level'}]}:String(path).includes('/evidence-sources')?{items:[{id:'source',title:'Existing portfolio project'}]}:{items:[],evaluationPolicy:'human'}} as any));
 render(<LearningEvidence/>);
 await screen.findByRole('option',{name:'Existing portfolio project'});
 fireEvent.change(screen.getByLabelText('Target capability and level'),{target:{value:'target'}});
 fireEvent.change(screen.getByLabelText('Profile evidence'),{target:{value:'source'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit for review'}));
 await waitFor(()=>expect(apiPost).toHaveBeenCalledWith('/learning/equivalencies',{levelId:'target',sourceKind:'training',sourceId:'source'}));
 expect(screen.queryByLabelText('Evidence title')).toBeNull();expect(screen.queryByLabelText('Evidence link (HTTPS)')).toBeNull();
});
