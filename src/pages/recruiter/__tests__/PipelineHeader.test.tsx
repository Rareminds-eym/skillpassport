import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {PipelineHeader} from '@/features/recruiter-pipeline/ui/pipeline/PipelineHeader';
afterEach(cleanup);
it('keeps UUID job identifiers intact when choosing a job from the overflow selector',()=>{
 const jobs=Array.from({length:6},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,title:`Role ${i+1}`}));
 const select=vi.fn();render(<PipelineHeader opportunities={jobs} selectedJob={jobs[0].id} setSelectedJob={select} globalSearch="" setGlobalSearch={vi.fn()} getTotalCandidates={()=>0} onAddCandidates={vi.fn()} onExportPipeline={vi.fn()} onRefresh={vi.fn()}/>);
 fireEvent.change(screen.getByRole('combobox',{name:'More jobs'}),{target:{value:jobs[5].id}});
 expect(select).toHaveBeenCalledWith(jobs[5].id);
});
