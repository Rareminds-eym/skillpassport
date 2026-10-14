import {beforeEach,it,expect,vi} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {act,cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
const f=vi.hoisted(()=>({teaching:vi.fn(),api:vi.fn(),courses:vi.fn()}));
vi.mock('@/features/external-teaching/api/teachingApi',()=>({teaching:f.teaching}));
vi.mock('@/features/external-teaching/ui/CollegeTrainingAttendance',()=>({default:()=>null}));
vi.mock('@/features/admin',async()=>({AddAttendanceSessionModal:(await import('@/features/admin/ui/modals/AddAttendanceSessionModal')).default,AttendanceBulkImportModal:()=>null,AttendanceDetailsModal:()=>null,LearnerHistoryModal:()=>null}));
vi.mock('@/features/college-admin',()=>({curriculumService:{getDepartments:async()=>[{id:'department',name:'Business'}],getPrograms:async()=>[{id:'program',name:'MBA'}],getCourses:f.courses}}));
vi.mock('@/shared/api/apiClient',()=>({apiPost:f.api}));
vi.mock('@/shared/lib',()=>({formatProgramLabel:(name:string)=>name}));
vi.mock('@/shared/ui',()=>({Pagination:()=>null,SearchBar:()=>null}));
vi.mock('@/features/analytics',()=>({KPICard:()=>null}));
vi.mock('react-apexcharts',()=>({default:()=>null}));
import AttendanceTracking from '../Attendancetracking';
beforeEach(()=>{
 cleanup();vi.clearAllMocks();
 f.courses.mockResolvedValue([]);
 f.api.mockImplementation(async(_path,params)=>({data:params.action==='resolve-college-id'?{collegeId:'college'}:params.action==='get-available-semesters'?[{semester:4}]:params.action==='get-filter-options'?{departments:[],courses:[],semesters:[],sections:['A'],faculty:[{value:'faculty',label:'College faculty'}],subjects:[]}:params.action==='get-analytics'?{totalSessions:0,completedSessions:0,avgAttendance:'0',totallearners:0,totalPresent:0,totalAbsent:0,lowAttendanceSessions:0}:{}}));
 f.teaching.mockImplementation(async(action,payload)=>action==='class_sections'?[{id:'class',section:'A',academic_year:'2026-2027'}]:action==='mapped_courses'?[{course_id:'course',title:'AI Tools for Teachers',mapping_id:'mapping',staff_name:'Hari',staff_id:'staff',assignment_version:1}]:[]);
});
async function selectClass(){
 render(<AttendanceTracking/>);
 const open=await screen.findByRole('button',{name:'New Session'});
 await act(async()=>{fireEvent.click(open);});
 await screen.findByRole('option',{name:'Business'});
 await change('Department','department');
 await screen.findByRole('option',{name:'MBA'});
 await change('Course','program');
 await screen.findByRole('option',{name:'Semester 4'});
 await change('Semester','4');
 await screen.findByRole('option',{name:'Section A'});
 await change('Section','A');
}
async function change(label:string,value:string){await act(async()=>{fireEvent.change(screen.getByLabelText(label),{target:{value}});});}
it('lists mapped training courses without first manually entering a date and auto-fills faculty',async()=>{
 await selectClass();
 const date=(screen.getByLabelText('Session date') as HTMLInputElement).value;
 expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
 await screen.findByRole('option',{name:'AI Tools for Teachers'});
 await waitFor(()=>expect(screen.getByLabelText('Subject')).toBeEnabled());
 expect(f.teaching).toHaveBeenCalledWith('mapped_courses',{collegeId:'college',sectionId:'class',date});
 await change('Subject','training:course');
 await waitFor(()=>expect(screen.getByLabelText('Faculty')).toHaveValue('mapping'));
 expect(screen.queryByRole('group',{name:'Academic Subjects'})).not.toBeInTheDocument();
 f.teaching.mockImplementation(async(action)=>action==='mapped_courses'?[]:[{id:'class',section:'A',academic_year:'2026-2027'}]);
 await change('Session date','2030-01-01');
 await waitFor(()=>expect(screen.getByLabelText('Subject')).toBeDisabled());
 expect(screen.getByLabelText('Faculty')).toHaveValue('');
 expect(await screen.findByText('No training courses are mapped to this class for the selected date.')).toBeInTheDocument();
 expect(screen.queryByRole('group',{name:'Training Courses'})).not.toBeInTheDocument();
});
it('keeps academic subjects selectable alongside mapped training courses',async()=>{
 f.courses.mockResolvedValue([{id:'academic',course_code:'MBA101',course_name:'Finance'}]);
 await selectClass();
 await screen.findByRole('option',{name:'AI Tools for Teachers'});
 expect(screen.getByRole('option',{name:'MBA101 - Finance'})).toBeInTheDocument();
 await waitFor(()=>expect(screen.getByLabelText('Subject')).toBeEnabled());
 await change('Subject','academic');
 expect(screen.getByLabelText('Subject')).toHaveValue('academic');
 expect(screen.getByRole('option',{name:'College faculty'})).toBeInTheDocument();
});
it('shows the class lookup failure instead of silently clearing it and displaying empty groups',async()=>{
 f.teaching.mockImplementation(async action=>{if(action==='class_sections')throw new Error('Class lookup unavailable');return [];});
 await selectClass();
 expect(await screen.findByRole('alert')).toHaveTextContent('Class lookup unavailable');
 expect(screen.getByLabelText('Subject')).toBeDisabled();
 expect(screen.queryByRole('group',{name:'Training Courses'})).not.toBeInTheDocument();
});

it('shows the conflicting booking in the modal and re-enables creation without clearing the form',async()=>{
 await selectClass();
 await screen.findByRole('option',{name:'AI Tools for Teachers'});
 await change('Subject','training:course');
 await waitFor(()=>expect(screen.getByLabelText('Faculty')).toHaveValue('mapping'));
 const selectedDate=(screen.getByLabelText('Session date') as HTMLInputElement).value;
 await change('Start Time','16:00');
 await change('End Time','17:00');
 const original=f.teaching.getMockImplementation()!;
 f.teaching.mockImplementation(async(action,payload)=>action==='college_sessions'?[{organization_staff_id:'staff',date:selectedDate,status:'scheduled',subject_name:'Existing Training',start_time:'14:00:00',end_time:'17:11:00'}]:original(action,payload));
 fireEvent.click(screen.getByRole('button',{name:'Create Session',exact:true}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Hari is already booked for Existing Training from 14:00 to 17:11');
 expect(screen.getByRole('button',{name:'Create Session',exact:true})).toBeEnabled();
 expect(screen.getByLabelText('Subject')).toHaveValue('training:course');
 expect(f.teaching.mock.calls.some(([action])=>action==='create_session')).toBe(false);
});
