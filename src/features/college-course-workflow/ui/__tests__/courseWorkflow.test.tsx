import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { EducatorMappedCourses } from '../EducatorMappedCourses';
import { CourseAccessReview } from '../CourseAccessReview';
import { AddCurriculumContent } from '../AddCurriculumContent';

const mocks=vi.hoisted(() => ({ history:vi.fn(),createAssessmentType:vi.fn(),assessmentTypes:vi.fn(),courses:vi.fn(),content:vi.fn(),raremindsContent:vi.fn(),propose:vi.fn(),add:vi.fn(),overview:vi.fn(),setAccess:vi.fn(),review:vi.fn() }));
configure({ asyncUtilTimeout: 10000 });
vi.mock('../../api/courseWorkflow',() => ({ courseWorkflow:mocks }));
vi.mock('@/shared/model/authStore',() => ({ useUser:() => ({ id:'educator' }) }));
const course={ id:'course',title:'Computing',code:'CS101',description:'Fundamentals',ownership:'institution',program_id:'program',semester:1,can_propose_edits:false };
function mount(node: React.ReactNode, path = '/') {
  const client=new QueryClient({ defaultOptions:{ queries:{ retry:false },mutations:{ retry:false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.history.mockResolvedValue([]);
  mocks.assessmentTypes.mockResolvedValue([]);
  mocks.courses.mockResolvedValue({ isCollegeEducator:true,courses:[course,{ ...course,id:'rare',title:'Communication',ownership:'rareminds',program_id:null,semester:null }] });
  mocks.content.mockResolvedValue([{ id:'curriculum',academic_year:'2026-27',status:'published',units:[{ id:'unit',code:'U1',name:'Algorithms',description:'Original content' }],outcomes:[] }]);
  mocks.propose.mockResolvedValue({ status:'pending' });
  mocks.add.mockResolvedValue({ status:'pending' });
  mocks.overview.mockResolvedValue({ mappings:[{ id:'mapping',course_code:'CS101',course_name:'Computing',faculty_name:'Ada',faculty_access:'read',semester:1 }],requests:[] });
});
afterEach(cleanup);

describe('review history tabs', () => {
  it('separates the educators decisions from curriculum content', async () => {
    mocks.content.mockResolvedValue([{ id: 'curriculum', academic_year: '2026-2027', status: 'published', units: [{ id: 'unit', name: 'Current unit', description: 'Current content' }], outcomes: [], change_history: [
      { id: 'decision', status: 'approved', timestamp: '2026-11-13T04:00:00Z', review_notes: 'Good detail', original_change: { requested_by: 'educator', change_type: 'unit_add', data: { after: { name: 'Reviewed unit' } } } },
      { id: 'private', status: 'rejected', original_change: { requested_by: 'other-user', data: { after: { name: 'Other educator decision' } } } },
    ] }]);
    mount(<EducatorMappedCourses />);
    fireEvent.click(await screen.findByRole('button', { name: 'View course' }));
    await screen.findByText('Current content');
    expect(screen.queryByText('Good detail')).toBeNull();
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Review decisions/ }), { button: 0, ctrlKey: false });
    expect(screen.getByText('Good detail')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reviewed unit' })).toBeInTheDocument();
    expect(screen.queryByText('Current content')).toBeNull();
    expect(screen.queryByText('Other educator decision')).toBeNull();
  });

  it('shows approved and rejected admin decisions in their own tabs', async () => {
    mocks.history.mockResolvedValue([{ id: 'curriculum', academic_year: '2026-2027', course: { course_name: 'Computing' }, change_history: ['approved', 'rejected'].map(status => ({
      id: status, status, review_notes: `${status} note`, original_change: { source: 'faculty_course', requester_name: 'faculty@example.test', change_type: 'unit_add', data: { after: { name: `${status} unit` } } },
    })) }]);
    mount(<CourseAccessReview embedded mode="reviews" />);
    await screen.findByText("You're all caught up");
    expect(mocks.history).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Approved' }), { button: 0, ctrlKey: false });
    expect(await screen.findByText('approved note')).toBeInTheDocument();
    expect(screen.queryByText('rejected note')).toBeNull();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Rejected' }), { button: 0, ctrlKey: false });
    expect(await screen.findByText('rejected note')).toBeInTheDocument();
    expect(screen.queryByText('approved note')).toBeNull();
  });
});

describe('educator curriculum dialog', () => {
  it('creates and selects a college assessment type without losing the outcome draft', async () => {
    mocks.createAssessmentType.mockResolvedValue({ id: 'quiz', name: 'Quiz' });
    mount(<AddCurriculumContent course={{ ...course, ownership: 'institution', can_propose_edits: true }} curriculum={{ id: 'curriculum', academic_year: '2026-2027', status: 'published', units: [{ id: 'unit', code: 'U1', name: 'Algebra', description: '', order_index: 0 }], outcomes: [] }} unitId="unit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add learning outcome' }));
    fireEvent.change(screen.getByLabelText('Learning outcome'), { target: { value: 'Solve equations' } });
    fireEvent.click(screen.getByRole('button', { name: /Add assessment type/ }));
    fireEvent.change(screen.getByLabelText('Assessment type name'), { target: { value: 'Quiz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save assessment type' }));
    await waitFor(() => expect(mocks.createAssessmentType).toHaveBeenCalledWith('course', 'program', 'Quiz', ''));
    await waitFor(() => expect(screen.getByLabelText('Assessment Type')).toHaveValue('Quiz'));
    expect(screen.getByLabelText('Learning outcome')).toHaveValue('Solve equations');
    fireEvent.click(screen.getByRole('button', { name: 'Add Assessment Mapping' }));
    expect(screen.getByLabelText('Remove Quiz mapping')).toBeInTheDocument();
  });
  it('keeps unit details across tabs and submits its learning outcomes together', async () => {
    mount(<AddCurriculumContent course={{ ...course, ownership: 'institution', can_propose_edits: true }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add unit' }));
    expect(screen.getByRole('tab', { name: '2. Learning outcomes' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Academic year'), { target: { value: '2026-2027' } });
    fireEvent.change(screen.getByLabelText('Unit code'), { target: { value: 'U2' } });
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'Matrices' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next: Learning outcomes' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit for approval' })).toBeEnabled());
    expect(screen.getByLabelText('Select Unit/Module')).toHaveValue('draft-unit');
    fireEvent.change(screen.getByLabelText('Learning outcome'), { target: { value: 'Solve equations' } });
    fireEvent.change(screen.getByLabelText("Bloom's Taxonomy Level"), { target: { value: 'Apply' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add another learning outcome' }));
    fireEvent.click(screen.getByRole('tab', { name: '1. Course unit' }));
    expect(screen.getByLabelText('Unit name')).toHaveValue('Matrices');
    fireEvent.click(screen.getByRole('tab', { name: '2. Learning outcomes' }));
    fireEvent.change(screen.getByLabelText('Learning outcome'), { target: { value: 'Explain determinants' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'unit', code: 'U2', name: 'Matrices', outcomes: [{ text: 'Solve equations', bloomLevel: 'Apply', assessments: [] }, { text: 'Explain determinants', bloomLevel: undefined, assessments: [] }] })));
  });
  it('submits one structured outcome with Bloom level and assessment mappings', async () => {
    mocks.assessmentTypes.mockResolvedValue([{ id: 'quiz', name: 'Quiz' }]);
    mount(<AddCurriculumContent course={{ ...course, ownership: 'institution', can_propose_edits: true }} curriculum={{ id: 'curriculum', academic_year: '2026-2027', status: 'published', units: [{ id: 'unit', code: 'U1', name: 'Algebra', description: '', order_index: 0 }], outcomes: [] }} unitId="unit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add learning outcome' }));
    await screen.findByRole('option', { name: 'Quiz' });
    fireEvent.change(screen.getByLabelText('Learning outcome'), { target: { value: 'Solve matrix equations' } });
    fireEvent.change(screen.getByLabelText("Bloom's Taxonomy Level"), { target: { value: 'Apply' } });
    expect(screen.getByRole('button', { name: 'Submit for approval' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Assessment Type'), { target: { value: 'Quiz' } });
    fireEvent.change(screen.getByLabelText('Weightage % (Optional)'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Assessment Mapping' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ unitId: 'unit', outcome_text: 'Solve matrix equations', bloom_level: 'Apply', assessment_mappings: [{ assessmentType: 'Quiz', weightage: 25 }] })));
  });
  it('restores focus and keeps an unfinished unit when cancelled and reopened', async () => {
    mount(<AddCurriculumContent course={{ ...course, ownership: 'institution', can_propose_edits: true }} />);
    const trigger = screen.getByRole('button', { name: 'Add unit' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Add unit' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'Matrices' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByLabelText('Unit name')).toHaveValue('Matrices');
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it('keeps the form and its values available after a rejected submission', async () => {
    mocks.add.mockRejectedValue(new Error('This unit code already exists'));
    mount(<AddCurriculumContent course={{ ...course, ownership: 'institution', can_propose_edits: true }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add unit' }));
    fireEvent.change(screen.getByLabelText('Academic year'), { target: { value: '2026-2027' } });
    fireEvent.change(screen.getByLabelText('Unit code'), { target: { value: 'U1' } });
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'Matrices' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next: Learning outcomes' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit for approval' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This unit code already exists');
    expect(screen.getByLabelText('Unit name')).toHaveValue('Matrices');
    expect(screen.getByRole('button', { name: 'Submit for approval' })).toBeEnabled();
  });
});
describe('mapped educator courses',() => {
  it('filters assignments across departments, programs, semesters and access, and clears them',async() => {
    mocks.courses.mockResolvedValue({ courses:[
      { ...course,department_id:'science',department_name:'Science',program_name:'Computing',semester:1 },
      { ...course,id:'math',title:'Mathematics',program_id:'math-program',program_name:'Mathematics',department_id:'science',department_name:'Science',semester:2,can_propose_edits:true },
      { ...course,id:'history',title:'History',program_id:'arts-program',program_name:'History',department_id:'arts',department_name:'Arts',semester:3 },
    ] });
    mount(<EducatorMappedCourses embedded/>);
    expect(await screen.findByRole('heading',{ name:'History' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filter by department'),{ target:{ value:'science' } });
    expect(screen.queryByRole('heading',{ name:'History' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Filter by program'),{ target:{ value:'math-program' } });
    fireEvent.change(screen.getByLabelText('Filter by semester'),{ target:{ value:'2' } });
    fireEvent.change(screen.getByLabelText('Filter by access'),{ target:{ value:'edit' } });
    expect(screen.getByRole('heading',{ name:'Mathematics' })).toBeInTheDocument();
    expect(screen.queryByRole('heading',{ name:'Computing' })).toBeNull();
    fireEvent.click(screen.getByRole('button',{ name:'Clear filters' }));
    expect(screen.getByRole('heading',{ name:'History' })).toBeInTheDocument();
    expect(screen.getByRole('heading',{ name:'Computing' })).toBeInTheDocument();
  });
  it('resets dependent selections when the department changes',async() => {
    mocks.courses.mockResolvedValue({ courses:[{ ...course,department_id:'science',department_name:'Science',program_name:'Computing' },{ ...course,id:'history',title:'History',program_id:'arts-program',program_name:'History',department_id:'arts',department_name:'Arts',semester:2 }] });
    mount(<EducatorMappedCourses embedded/>);
    await screen.findByRole('heading',{ name:'Computing' });
    fireEvent.change(screen.getByLabelText('Filter by program'),{ target:{ value:'program' } });
    fireEvent.change(screen.getByLabelText('Filter by semester'),{ target:{ value:'1' } });
    fireEvent.change(screen.getByLabelText('Filter by department'),{ target:{ value:'arts' } });
    expect(screen.getByLabelText('Filter by program')).toHaveValue('');
    expect(screen.getByLabelText('Filter by semester')).toHaveValue('');
    expect(screen.getByRole('heading',{ name:'History' })).toBeInTheDocument();
  });
  it('shows card skeletons while assigned courses load, without a false empty state',() => {
    mocks.courses.mockReturnValue(new Promise(() => {}));
    mount(<EducatorMappedCourses embedded/>);
    expect(screen.getByRole('status',{ name:'Loading assigned courses' })).toBeInTheDocument();
    expect(screen.queryByText(/No college courses mapped/)).toBeNull();
  });
  it('shows curriculum skeletons while opening course details',async() => {
    mocks.content.mockReturnValue(new Promise(() => {}));
    mount(<EducatorMappedCourses embedded/>);
    fireEvent.click(await screen.findByRole('button',{ name:'View course' }));
    expect(screen.getByRole('status',{ name:'Loading course curriculum' })).toBeInTheDocument();
    expect(screen.queryByText('Curriculum not available yet')).toBeNull();
  });
  it('allows edit-enabled faculty to submit the first unit before adding outcomes',async() => {
    mocks.courses.mockResolvedValue({ isCollegeEducator:true,courses:[{ ...course,can_propose_edits:true }] });
    mocks.content.mockResolvedValue([]);
    mount(<EducatorMappedCourses embedded/>);
    fireEvent.click(await screen.findByRole('button',{ name:'View course' }));
    fireEvent.click(await screen.findByRole('button',{ name:'Add unit' }));
    fireEvent.change(screen.getByLabelText('Academic year'),{ target:{ value:'2026-2027' } });
    fireEvent.change(screen.getByLabelText('Unit code'),{ target:{ value:'U1' } });
    fireEvent.change(screen.getByLabelText('Unit name'),{ target:{ value:'Algebra' } });
    fireEvent.click(screen.getByRole('button',{ name:'Next: Learning outcomes' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit for approval' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button',{ name:'Submit for approval' }));
    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ courseId:'course',programId:'program',academicYear:'2026-2027',entityType:'unit',name:'Algebra',code:'U1' })));
  });
  it('opens course details in a drawer and explains missing curriculum',async() => {
    mocks.content.mockResolvedValue([]);
    mount(<EducatorMappedCourses embedded/>);
    fireEvent.click(await screen.findByRole('button',{ name:'View course' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Computing');
    expect(await screen.findByText('Curriculum not available yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{ name:'Close course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('shows only assigned college courses when embedded under the Browse Courses header tabs',async() => {
    mount(<EducatorMappedCourses embedded/>);
    expect(await screen.findByRole('heading',{ name:'Computing' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('heading',{ name:'Courses' })).toBeNull();
    expect(screen.queryByRole('heading',{ name:'Communication' })).toBeNull();
  });
  it('separates ownership and offers assignments only for college courses',async() => {
    mount(<EducatorMappedCourses/>);
    expect(await screen.findByRole('heading',{ name:'Computing' })).toBeInTheDocument();
    expect(screen.getByRole('link',{ name:'Create assignment' })).toHaveAttribute('href',expect.stringContaining('courseId=course'));
    expect(screen.queryByRole('heading',{ name:'Communication' })).toBeNull();
    fireEvent.click(screen.getByRole('tab',{ name:'Resource Studio' }));
    expect(screen.getByRole('heading',{ name:'Communication' })).toBeInTheDocument();
    expect(screen.queryByRole('link',{ name:'Create assignment' })).toBeNull();
  });
  it('keeps read-only faculty from editing content',async() => {
    mount(<EducatorMappedCourses/>);
    fireEvent.click(await screen.findByRole('button',{ name:'View course' }));
    expect(await screen.findByText('Original content')).toBeInTheDocument();
    expect(screen.queryByRole('button',{ name:'Propose unit edit' })).toBeNull();
    expect(screen.queryByRole('button',{ name:'Add unit' })).toBeNull();
    expect(screen.queryByRole('button',{ name:'Add learning outcome' })).toBeNull();
  });
  it('submits an edit proposal without replacing visible content',async() => {
    mocks.courses.mockResolvedValue({ isCollegeEducator:true,courses:[{ ...course,can_propose_edits:true }] });
    mount(<EducatorMappedCourses/>);
    fireEvent.click(await screen.findByRole('button',{ name:'View course' }));
    fireEvent.click(await screen.findByRole('button',{ name:'Propose unit edit' }));
    fireEvent.change(screen.getByLabelText('Unit description'),{ target:{ value:'Proposed content' } });
    fireEvent.click(screen.getByRole('button',{ name:'Submit for approval' }));
    await waitFor(() => expect(mocks.propose).toHaveBeenCalledWith('curriculum','unit','unit',{ name:'Algorithms',description:'Proposed content' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Current content is unchanged');
    expect(screen.getByText('Original content')).toBeInTheDocument();
  });
  it('shows a recoverable error when mapped courses cannot load',async() => {
    mocks.courses.mockRejectedValue(new Error('Course service unavailable'));
    mount(<EducatorMappedCourses/>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Course service unavailable');
    expect(screen.getByRole('button',{ name:'Try again' })).toBeInTheDocument();
  });
});
describe('admin course permissions',() => {
  it('saves the selected faculty permission',async() => {
    mocks.setAccess.mockResolvedValue({ updated:true });
    mount(<CourseAccessReview/>);
    fireEvent.click(await screen.findByRole('button',{ name:'Propose edits' }));
    await waitFor(() => expect(mocks.setAccess).toHaveBeenCalledWith('mapping','edit'));
  });
  it('shows the proposed difference before an admin approves',async() => {
    mocks.overview.mockResolvedValue({ mappings:[],requests:[{ id:'request',course_name:'Computing',requester_email:'ada@example.test',entity_type:'unit',before_data:{ name:'Algorithms',description:'Original content' },proposed_data:{ name:'Algorithms',description:'Proposed content' } }] });
    mocks.review.mockResolvedValue({ reviewed:true });
    mount(<CourseAccessReview/>);
    expect(await screen.findByText(/Original content/)).toBeInTheDocument();
    expect(screen.getByText(/Proposed content/, { selector:'dd' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{ name:'Review change' }));
    fireEvent.change(screen.getByLabelText('Review note'),{ target:{ value:'Reviewed' } });
    fireEvent.click(screen.getByRole('button',{ name:'Approve change' }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith('request','approved','Reviewed'));
  });
});

describe('educator review queue states',()=>{
 it('shows a compact empty queue and supports refreshing',async()=>{mount(<CourseAccessReview embedded mode="reviews"/>);expect(await screen.findByText("You're all caught up")).toBeInTheDocument();expect(screen.getByText('No changes awaiting review.')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Refresh'}));await waitFor(()=>expect(mocks.overview.mock.calls.length).toBeGreaterThan(1));});
 it('shows a loading state without a premature empty queue',()=>{mocks.overview.mockReturnValue(new Promise(()=>{}));mount(<CourseAccessReview embedded mode="reviews"/>);expect(screen.getByRole('status',{name:'Loading educator changes'})).toBeInTheDocument();expect(screen.queryByText("You're all caught up")).toBeNull();});
 it('refreshes the builder after rejection and removes the reviewed request',async()=>{const request={id:'request',course_name:'Computing',requester_email:'ada@example.test',entity_type:'unit',before_data:{},proposed_data:{name:'New unit',description:'New content'}};mocks.overview.mockResolvedValueOnce({mappings:[],requests:[request]}).mockResolvedValue({mappings:[],requests:[]});mocks.review.mockResolvedValue({reviewed:true});const onReviewed=vi.fn();mount(<CourseAccessReview embedded mode="reviews" onReviewed={onReviewed}/>);fireEvent.click(await screen.findByRole('button',{name:'Review change'}));fireEvent.change(screen.getByLabelText('Review note'),{target:{value:'Please revise'}});fireEvent.click(screen.getByRole('button',{name:'Reject change'}));await waitFor(()=>expect(mocks.review).toHaveBeenCalledWith('request','rejected','Please revise'));await waitFor(()=>expect(onReviewed).toHaveBeenCalledOnce());expect(await screen.findByText("You're all caught up")).toBeInTheDocument();});
 it('keeps the request available when review fails',async()=>{mocks.overview.mockResolvedValue({mappings:[],requests:[{id:'request',course_name:'Computing',requester_email:'ada@example.test',entity_type:'unit',before_data:{},proposed_data:{name:'New unit'}}]});mocks.review.mockRejectedValue(new Error('Content changed. Please reload.'));const onReviewed=vi.fn();mount(<CourseAccessReview embedded mode="reviews" onReviewed={onReviewed}/>);fireEvent.click(await screen.findByRole('button',{name:'Review change'}));fireEvent.click(screen.getByRole('button',{name:'Approve change'}));expect(await screen.findByRole('alert')).toHaveTextContent('Content changed');expect(onReviewed).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Approve change'})).toBeEnabled();});
});

describe('educator curriculum content management',()=>{
 beforeEach(()=>{mocks.courses.mockResolvedValue({courses:[{...course,can_propose_edits:true}]});});
 it('shows unit and outcome metadata and submits an outcome edit for approval',async()=>{mocks.content.mockResolvedValue([{id:'curriculum',academic_year:'2026-2027',status:'published',units:[{id:'unit',code:'U1',name:'Algebra',description:'Matrices',credits:3,estimated_duration:6,duration_unit:'hours'}],outcomes:[{id:'outcome',unit_id:'unit',outcome_text:'Solve matrices',bloom_level:'Apply',assessment_mappings:[{assessmentType:'Quiz',weightage:25}]}]}]);mount(<EducatorMappedCourses/>);fireEvent.click(await screen.findByRole('button',{name:'View course'}));expect(await screen.findByText('Solve matrices')).toBeInTheDocument();expect(screen.getByText('Quiz 25%')).toBeInTheDocument();expect(screen.getByText('Apply')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Propose outcome edit'}));fireEvent.change(screen.getByLabelText('Learning outcome'),{target:{value:'Solve engineering matrix problems'}});fireEvent.click(screen.getByRole('button',{name:'Submit for approval'}));await waitFor(()=>expect(mocks.propose).toHaveBeenCalledWith('curriculum','outcome','outcome',{outcome_text:'Solve engineering matrix problems'}));expect(screen.getByText('Solve matrices')).toBeInTheDocument();});
 it('shows pending submissions and blocks duplicate edits',async()=>{mocks.content.mockResolvedValue([{id:'curriculum',academic_year:'2026-2027',status:'published',units:[{id:'unit',code:'U1',name:'Algebra',description:'Matrices'}],outcomes:[],pending_changes:[{id:'req',requested_by:'educator',entity_id:'unit',change_type:'unit_edit',status:'pending',data:{after:{name:'Updated Algebra'}}}]}]);mount(<EducatorMappedCourses/>);fireEvent.click(await screen.findByRole('button',{name:'View course'}));expect(await screen.findByText('Awaiting administrator approval (1)')).toBeInTheDocument();expect(screen.getByText('Edit: Updated Algebra')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Propose unit edit'})).toBeDisabled();});
 it('adds an outcome to the correct existing unit without changing current content',async()=>{mount(<EducatorMappedCourses/>);fireEvent.click(await screen.findByRole('button',{name:'View course'}));fireEvent.click(await screen.findByRole('button',{name:'Add learning outcome'}));fireEvent.change(screen.getByLabelText('Learning outcome'),{target:{value:'Explain algorithms'}});await waitFor(()=>expect(screen.getByRole('button',{name:'Submit for approval'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Submit for approval'}));await waitFor(()=>expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({curriculumId:'curriculum',unitId:'unit',entityType:'outcome',outcome_text:'Explain algorithms'})));expect(screen.getByText('Original content')).toBeInTheDocument();});
});

it('shows the educator their reviewed submissions and administrator feedback',async()=>{mocks.courses.mockResolvedValue({courses:[{...course,can_propose_edits:true}]});mocks.content.mockResolvedValue([{id:'curriculum',academic_year:'2026-2027',status:'published',units:[],outcomes:[],change_history:[{id:'review',status:'rejected',review_notes:'Please include examples',original_change:{requested_by:'educator',data:{after:{name:'Advanced algebra'}}}},{id:'other',status:'rejected',review_notes:'Private feedback',original_change:{requested_by:'another-educator',data:{after:{name:'Other proposal'}}}}]}]);mount(<EducatorMappedCourses/>);fireEvent.click(await screen.findByRole('button',{name:'View course'}));fireEvent.mouseDown(await screen.findByRole('tab',{name:/Review decisions/}),{button:0,ctrlKey:false});expect(screen.getByText('Advanced algebra')).toBeInTheDocument();expect(screen.getByText('Please include examples')).toBeInTheDocument();expect(screen.queryByText('Private feedback')).toBeNull();});

describe('curriculum notification deep links', () => {
 it('opens the requested pending review directly', async () => {
  mocks.overview.mockResolvedValue({mappings:[],requests:[{id:'request',course_name:'Computing',requester_email:'ada@example.test',entity_type:'unit',before_data:{},proposed_data:{name:'Requested unit'}}]});
  mount(<CourseAccessReview embedded mode="reviews" />, '/?reviewChange=request');
  expect(await screen.findByRole('button',{name:'Approve change'})).toBeInTheDocument();
 });
 it('opens the educators course on the decisions tab', async () => {
  mocks.content.mockResolvedValue([{id:'curriculum',academic_year:'2026-27',status:'published',units:[],outcomes:[],change_history:[{id:'request',status:'rejected',review_notes:'Please revise this unit',original_change:{requested_by:'educator',change_type:'unit_add',data:{after:{name:'Reviewed unit'}}}}]}]);
  mount(<EducatorMappedCourses />, '/?courseId=course&programId=program&reviewChange=request');
  expect(await screen.findByText('Please revise this unit')).toBeInTheDocument();
  expect(screen.getByRole('tab',{name:/Review decisions/})).toHaveAttribute('data-state','active');
 });
});
