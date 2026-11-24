import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import Builder from '../CollegeCurriculumBuilderUI';
const m=vi.hoisted(()=>({affiliation:vi.fn()}));
vi.mock('@/features/college-admin',()=>({curriculumApprovalService:{checkCollegeAffiliation:m.affiliation},curriculumChangeRequestService:{}}));
vi.mock('@/features/analytics',()=>({KPICard:()=>null}));
vi.mock('@/shared/ui',()=>({Pagination:()=>null}));
const props={selectedAcademicYear:'2026-2027',selectedDepartment:'d',selectedProgram:'p',selectedSemester:'1',selectedCourse:'c',academicYears:['2026-2027'],departments:[{id:'d',name:'Science'}],programs:[{id:'p',name:'Computing'}],semesters:['1'],courses:[{id:'c',value:'c',label:'Mathematics'}],units:[{id:'u',name:'Algebra',description:'Equations',order:1}],learningOutcomes:[{id:'o',unitId:'u',outcome:'Solve equations',assessmentMappings:[{assessmentType:'Quiz',weightage:100}]}]};
beforeEach(()=>{m.affiliation.mockResolvedValue({success:true,data:{isAffiliated:false}});});afterEach(cleanup);
describe('curriculum approval actions',()=>{
it('calls approval for complete drafts, then exposes publish after approval',async()=>{const approve=vi.fn(),publish=vi.fn();const view=render(<Builder {...props} status="draft" onApprove={approve} onPublish={publish}/>);fireEvent.click(await screen.findByRole('button',{name:'Approve Curriculum'}));expect(approve).toHaveBeenCalledOnce();expect(publish).not.toHaveBeenCalled();expect(screen.queryByRole('button',{name:'Publish Curriculum'})).toBeNull();view.rerender(<Builder {...props} status="approved" onApprove={approve} onPublish={publish}/>);expect(screen.getByText('Curriculum Approved')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Publish Curriculum'}));expect(publish).toHaveBeenCalledOnce();});
it('keeps university-affiliated drafts on the request-approval flow',async()=>{m.affiliation.mockResolvedValue({success:true,data:{isAffiliated:true,universityName:'University'}});render(<Builder {...props} status="draft"/>);expect(await screen.findByRole('button',{name:'Request for Approval'})).toBeEnabled();expect(screen.queryByRole('button',{name:'Approve Curriculum'})).toBeNull();expect(screen.queryByRole('button',{name:'Publish Curriculum'})).toBeNull();});
});