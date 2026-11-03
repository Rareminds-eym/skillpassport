import {describe,it,expect,vi} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
vi.mock('@/features/educator/model/useEducatorSchool',()=>({useEducatorSchool:()=>({school:null,college:null,educatorType:null,loading:false})}));
import Sidebar from '../Sidebar';
import {AssignedTeachingContext,type TeachingContext} from '@/features/external-teaching/model/teachingContext';
describe('existing educator navigation for assigned trainers',()=>{
  it('keeps the allowed tabs and locks deferred learning tools',()=>{
    const context={external:true,delegatedAccess:true,staff:{id:'staff',name:'Hari'},mappings:[]} as TeachingContext;
    render(<MemoryRouter><AssignedTeachingContext.Provider value={context}><Sidebar setActiveTab={vi.fn()} showMobileMenu={false}/></AssignedTeachingContext.Provider></MemoryRouter>);
    for(const title of ['Dashboard','Learners','Mark Attendance','Courses','Learning & Evaluation'])expect(screen.getByText(title)).toBeInTheDocument();
    for(const title of ['Teaching Intelligence','Assessment Results','TimeTable','Settings','Analytics'])expect(screen.queryByText(title)).not.toBeInTheDocument();
    expect(screen.getByText('Assignments').closest('button')).toBeDisabled();
  });
});
