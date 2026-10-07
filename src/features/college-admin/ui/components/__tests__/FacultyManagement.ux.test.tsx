import { cleanup, fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FacultyList from '../FacultyList';
import FacultyOnboarding from '../FacultyOnboarding';
import FacultyBulkImport from '../FacultyBulkImport';
import FacultyManagementDashboard from '../FacultyManagementDashboard';

const mocks = vi.hoisted(() => ({api:vi.fn(), create:vi.fn(), upload:vi.fn(), multiUpload:vi.fn(), status:vi.fn(), errors:vi.fn(), queue:vi.fn(), stats:vi.fn()}));
vi.mock('@/shared/api/apiClient', () => ({ apiPost:mocks.api }));
vi.mock('@/shared/api/ssoClient', () => ({ssoClient:{getAccessToken:()=> 'test'}}));
vi.mock('@/shared/model/authStore', () => {
 const user={id:'admin',email:'admin@example.test'};
 return {useUser:()=>user,useAuthStore:Object.assign((select:any)=>select({user}),{getState:()=>({user})})};
});
vi.mock('@/shared/api',()=>({uploadFile:mocks.upload,uploadMultipleFiles:mocks.multiUpload,validateFile:()=>({valid:true})}));
vi.mock('@/entities/user',()=>({userApiService:{createCollegeStaff:mocks.create}}));
vi.mock('@/features/college-admin',()=>({getFacultyStatistics:mocks.stats,FacultyDocumentViewerModal:()=>null}));
vi.mock('@/features/college-admin/api/facultyBulkImportService',()=>({facultyBulkImportService:{getBulkStatus:mocks.status,getBulkErrors:mocks.errors,queueBulkUpload:mocks.queue}}));
vi.mock('../CalendarTimetable',()=>({default:()=>null}));
vi.mock('../EducatorAttendanceTracking',()=>({default:()=>null}));
vi.mock('../FacultyPerformanceAnalytics',()=>({default:()=>null}));
vi.mock('../SwapRequestsManagement',()=>({default:()=>null}));
vi.mock('@/features/college-admin/ui/FacultyLeaveManagement',()=>({default:()=>null}));
const faculty={id:'faculty-1',collegeId:'college',first_name:'Ada',last_name:'Lovelace',email:'ada@example.test',accountStatus:'active',createdAt:'2026-01-01',updatedAt:'2026-01-01'};
beforeEach(()=>{
 vi.clearAllMocks();sessionStorage.clear();
 mocks.api.mockImplementation(async (_url,body)=>({data:body.action==='get-lecturers'?[faculty]:body.action==='resolve-user-college'?{college_id:'college'}:{exists:false}}));
 mocks.stats.mockResolvedValue({total:1,active:1,pending:0,verified:1,inactive:0});
 mocks.multiUpload.mockResolvedValue([]);
 mocks.upload.mockResolvedValue({success:true,url:'https://example.test/document.pdf'});
 mocks.create.mockResolvedValue({success:true,data:{staffId:'new-faculty',emailStatus:'sent'}});
});
afterEach(()=>{cleanup();vi.useRealTimers();});

describe('faculty list recovery and access',()=>{
 it('finishes loading when no college is linked',async()=>{
  render(<FacultyList collegeId={null}/>);
  expect(await screen.findByText('No College Found')).toBeInTheDocument();
  expect(screen.queryByText('Loading faculty...')).toBeNull();
 });
 it('shows a retryable error rather than an empty college',async()=>{
  mocks.api.mockRejectedValueOnce(new Error('offline'));
  render(<FacultyList collegeId="college"/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load faculty');
  fireEvent.click(screen.getByRole('button',{name:'Try again'}));
  expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
 });
 it('searches full names and offers filter recovery',async()=>{
  render(<FacultyList collegeId="college"/>);
  await screen.findByText('Ada Lovelace');
  const search=screen.getByRole('textbox',{name:/Search faculty/});
  fireEvent.change(search,{target:{value:'  Ada Lovelace  '}});
  expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  fireEvent.change(search,{target:{value:'no match'}});
  expect(screen.getByText('No faculty match your filters')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));
  expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
 });
 it('exposes resend on the faculty row and confirms rotation before sending',async()=>{
  render(<FacultyList collegeId="college"/>);
  fireEvent.click(await screen.findByRole('button',{name:'Resend credentials to Ada Lovelace'}));
  const dialog=screen.getByRole('dialog');
  expect(within(dialog).getByText(/signs them out of all sessions/)).toBeInTheDocument();
  expect(mocks.api.mock.calls.some(([url])=>url==='/college-admin/faculty-credentials')).toBe(false);
  mocks.api.mockImplementation(async (url)=>url==='/college-admin/faculty-credentials'?{data:{emailStatus:'sent',email:'ada@example.test'}}:{data:[faculty]});
  fireEvent.click(within(dialog).getByRole('button',{name:'Reset password and email credentials'}));
  expect(await within(dialog).findByRole('status')).toHaveTextContent('New credentials emailed');
  expect(mocks.api).toHaveBeenCalledWith('/college-admin/faculty-credentials',{facultyId:'faculty-1'});
 });
 it('explains when the password changed but delivery could not be confirmed',async()=>{
  render(<FacultyList collegeId="college"/>);
  fireEvent.click(await screen.findByRole('button',{name:'Resend credentials to Ada Lovelace'}));
  const dialog=screen.getByRole('dialog');
  mocks.api.mockImplementation(async (url)=>url==='/college-admin/faculty-credentials'?{data:{emailStatus:'failed',email:'ada@example.test'}}:{data:[faculty]});
  fireEvent.click(within(dialog).getByRole('button',{name:'Reset password and email credentials'}));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('password was changed');
 });
 it('announces failed status changes and closes the accessible dialog with Escape',async()=>{
  render(<FacultyList collegeId="college"/>);
  fireEvent.click(await screen.findByRole('button',{name:'View'}));
  const dialog=screen.getByRole('dialog',{name:'Ada Lovelace'});
  mocks.api.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(within(dialog).getByRole('button',{name:'Suspended'}));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Could not update');
  fireEvent.keyDown(dialog,{key:'Escape'});
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 });
});

describe('faculty onboarding',()=>{
 it('preserves an unfinished form across tabs and supports arrow navigation',async()=>{
  render(<FacultyManagementDashboard/>);
  await screen.findByText('Ada Lovelace');
  const tab=screen.getByRole('tab',{name:/Onboarding/});
  fireEvent.click(tab);
  fireEvent.change(screen.getByLabelText('First Name *'),{target:{value:'Grace'}});
  fireEvent.click(screen.getByRole('tab',{name:/^Faculty /}));
  fireEvent.click(tab);
  expect(screen.getByLabelText('First Name *')).toHaveValue('Grace');
  fireEvent.keyDown(tab,{key:'ArrowRight'});
  expect(screen.getByRole('tab',{name:/Timetable/})).toHaveAttribute('aria-selected','true');
 });
 it('saves the joining date, allows zero experience, and retries profile failure without another account',async()=>{
  const {container}=render(<FacultyOnboarding collegeId="college"/>);
  for(const [label,value] of [['First Name *','Grace'],['Last Name *','Hopper'],['Email *','grace@example.test'],['Employee ID *','F42'],['Date of Joining','2026-10-07']]) fireEvent.change(screen.getByLabelText(label),{target:{value}});
  fireEvent.change(screen.getByLabelText('Department *'),{target:{value:'Computer Science & Engineering'}});
  fireEvent.change(screen.getByLabelText('Subject name'),{target:{value:'Computing'}});
  fireEvent.click(screen.getByRole('button',{name:'Add Subject'}));
  const inputs=container.querySelectorAll('input[type="file"]');
  for(const input of Array.from(inputs).slice(0,2)) {
   fireEvent.change(input,{target:{files:[new File(['x'],'document.pdf',{type:'application/pdf'})]}});
   await waitFor(()=>expect(input).not.toBeDisabled());
  }
  mocks.api.mockImplementation(async (_url,body)=>{if(body.action==='update-lecturer')throw new Error('offline');return {data:{exists:false}}});
  fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent('account was created');
  expect(screen.getByRole('alert')).toHaveFocus();
  expect(mocks.api).toHaveBeenCalledWith('/college-admin/faculty',expect.objectContaining({action:'update-lecturer',dateOfJoining:'2026-10-07'}));
  mocks.api.mockResolvedValue({data:{}});
  fireEvent.click(screen.getByRole('button',{name:'Retry saving details'}));
  expect(await screen.findByRole('status')).toHaveTextContent('created successfully');
  expect(mocks.create).toHaveBeenCalledTimes(1);
 });
});

async function fillOnboarding() {
 for (const [label,value] of [['First Name *','Grace'],['Last Name *','Hopper'],['Email *','grace@example.test'],['Employee ID *','F42']]) {
  fireEvent.change(screen.getByLabelText(label),{target:{value}});
 }
 fireEvent.change(screen.getByLabelText('Department *'),{target:{value:'Computer Science & Engineering'}});
 fireEvent.change(screen.getByLabelText('Subject name'),{target:{value:'Computing'}});
 fireEvent.click(screen.getByRole('button',{name:'Add Subject'}));
 for(const label of ['Upload degree certificate','Upload ID proof']) {
  const input=screen.getByLabelText(label);
  await userEvent.upload(input as HTMLInputElement,new File(['x'],'document.pdf',{type:'application/pdf'}));
  await waitFor(()=>expect(input).not.toBeDisabled());
 }
}

describe('onboarding upload and save edge cases',()=>{
 it('keeps filenames paired with URLs after partial failures and removal',async()=>{
  const {container}=render(<FacultyOnboarding collegeId="college"/>);
  await fillOnboarding();
  const upload=screen.getByLabelText('Upload experience letters');
  mocks.multiUpload.mockResolvedValueOnce([{success:true,url:'https://example.test/first.pdf'},{success:false,error:'offline'}]);
  fireEvent.change(upload,{target:{files:[new File(['a'],'first.pdf'),new File(['b'],'failed.pdf')]}});
  expect(await screen.findByRole('alert')).toHaveTextContent('failed.pdf');
  expect(screen.getByRole('button',{name:'Remove experience letter first.pdf'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Remove experience letter failed.pdf'})).toBeNull();
  mocks.multiUpload.mockResolvedValueOnce([{success:true,url:'https://example.test/retried.pdf'}]);
  fireEvent.change(upload,{target:{files:[new File(['b'],'failed.pdf')]}});
  await screen.findByRole('button',{name:'Remove experience letter failed.pdf'});
  fireEvent.click(screen.getByRole('button',{name:'Remove experience letter first.pdf'}));
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/college-admin/faculty',expect.objectContaining({action:'update-lecturer',experience_letters_url:['https://example.test/retried.pdf']})));
  expect(await screen.findByRole('status')).toHaveTextContent('created successfully');
 });
 it('reports email failure without recreating a successfully onboarded account',async()=>{
  mocks.create.mockResolvedValueOnce({success:true,data:{staffId:'new-faculty',emailStatus:'failed'}});
  const {container}=render(<FacultyOnboarding collegeId="college"/>);
  await fillOnboarding();
  fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent('Open Faculty → Resend credentials');
  expect(screen.getByLabelText('First Name *')).toHaveValue('');
  expect(mocks.create).toHaveBeenCalledTimes(1);
 });
 it('locks every editable control while saving and allows the same file on the next onboarding',async()=>{
  const user=userEvent.setup();
  const {container}=render(<FacultyOnboarding collegeId="college"/>);
  await fillOnboarding();
  const file=new File(['degree'],'reusable.pdf',{type:'application/pdf'});
  const input=screen.getByLabelText('Upload degree certificate') as HTMLInputElement;
  await user.upload(input,file);
  await waitFor(()=>expect(input).not.toBeDisabled());
  const uploadCalls=mocks.upload.mock.calls.length;
  let finishCreate!:(value:unknown)=>void;
  mocks.create.mockImplementationOnce(()=>new Promise(resolve=>{finishCreate=resolve}));
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(()=>expect(mocks.create).toHaveBeenCalledTimes(1));
  for(const control of container.querySelectorAll('form input, form select, form button')) expect(control).toBeDisabled();
  const firstName=screen.getByLabelText('First Name *');
  await user.type(firstName,'Changed');
  expect(firstName).toHaveValue('Grace');
  await act(async()=>finishCreate({success:true,data:{staffId:'new-faculty',emailStatus:'sent'}}));
  expect(await screen.findByRole('status')).toHaveTextContent('created successfully');
  expect(firstName).toHaveValue('');
  expect(input.value).toBe('');
  expect(input.files).toHaveLength(0);
  await user.upload(input,file);
  await waitFor(()=>expect(mocks.upload).toHaveBeenCalledTimes(uploadCalls+1));
  expect(mocks.upload).toHaveBeenLastCalledWith(file,'teachers/degrees');
 });
});

describe('bulk import recovery',()=>{
 it('resumes a persisted batch and checks its status without submitting another import',async()=>{
  sessionStorage.setItem('faculty-import:admin:college','batch-1');
  mocks.status.mockResolvedValue({success:true,data:{status:'completed',processed_rows:2,total_rows:2,success_count:2,failed_count:0}});
  render(<FacultyBulkImport collegeId="college"/>);
  await waitFor(()=>expect(mocks.status).toHaveBeenCalledWith('batch-1'));
  expect(mocks.queue).not.toHaveBeenCalled();
  await waitFor(()=>expect(screen.queryByText('Choose CSV File')).toBeNull());
 });
 it('retains the running batch after polling fails and provides Check status',async()=>{
  vi.useFakeTimers();
  sessionStorage.setItem('faculty-import:admin:college','batch-2');
  mocks.status.mockResolvedValue({success:false,error:{message:'offline'}});
  render(<FacultyBulkImport collegeId="college"/>);
  await act(async()=>{await vi.advanceTimersByTimeAsync(10000)});
  expect(screen.getByRole('alert')).toHaveTextContent('may still be running');
  expect(screen.getByRole('button',{name:'Check status'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/Import .* Faculty Members/})).toBeNull();
  expect(sessionStorage.getItem('faculty-import:admin:college')).toBe('batch-2');
 });
});

describe('credential action availability',()=>{
 it('hides educator resend for college administrators and explains the alternative',async()=>{
  mocks.api.mockResolvedValue({data:[{...faculty,metadata:{role:'college_admin',roles:['College Admin']}}]});
  render(<FacultyList collegeId="college"/>);
  await screen.findByText('Ada Lovelace');
  expect(screen.queryByRole('button',{name:/Resend credentials/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'View'}));
  expect(within(screen.getByRole('dialog')).getByText(/Forgot password/)).toBeInTheDocument();
 });
 it('disables resend during cooldown and reenables it when the time expires',async()=>{
  mocks.api.mockResolvedValue({data:[{...faculty,credentials_email_attempted_at:new Date().toISOString()}]});
  render(<FacultyList collegeId="college"/>);
  const resend=await screen.findByRole('button',{name:'Resend credentials to Ada Lovelace'});
  expect(resend).toBeDisabled();expect(resend).toHaveTextContent(/Resend in/);
  const future=Date.now()+61_000;
  const clock=vi.spyOn(Date,'now').mockReturnValue(future);
  try { await waitFor(()=>expect(resend).toBeEnabled(),{timeout:2000}); } finally { clock.mockRestore(); }
 });
 it('keeps the delivery result when saving the status fails',async()=>{
  render(<FacultyList collegeId="college"/>);
  fireEvent.click(await screen.findByRole('button',{name:'Resend credentials to Ada Lovelace'}));
  mocks.api.mockImplementation(async url=>url==='/college-admin/faculty-credentials'?{data:{emailStatus:'sent',email:'ada@example.test',statusSaved:false}}:{data:[faculty]});
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Reset password and email credentials'}));
  const result=await within(screen.getByRole('dialog')).findByRole('status');
  expect(result).toHaveTextContent('New credentials emailed');
  expect(result).toHaveTextContent('Email status could not be saved');
 });
 it('shows the administrator rate limit and disables another attempt',async()=>{
  render(<FacultyList collegeId="college"/>);
  fireEvent.click(await screen.findByRole('button',{name:'Resend credentials to Ada Lovelace'}));
  mocks.api.mockRejectedValue(Object.assign(new Error('Wait five minutes before trying again.'),{status:429,code:'RESET_RATE_LIMITED'}));
  const confirm=within(screen.getByRole('dialog')).getByRole('button',{name:'Reset password and email credentials'});
  fireEvent.click(confirm);
  expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('five minutes');
  expect(confirm).toBeDisabled();
 });
});
