import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddLearnerModal from '../AddLearnerModal';
const f = vi.hoisted(() => ({ post: vi.fn(), create: vi.fn(), update: vi.fn(), upload: vi.fn(), legacy: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));

vi.mock('@/entities/user/api/userApiService', () => ({ default: { createLearner: f.create, updatelearnerDocuments: f.update } }));
vi.mock('@/shared/model/authStore', () => ({ useAuthStore: { getState: () => ({ user: { email: 'admin@example.test' } }) } }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { getAccessToken: f.legacy, fetch: f.upload } }));
beforeEach(() => {
  vi.clearAllMocks();
  f.legacy.mockReturnValue(null);
  f.post.mockResolvedValue({ data: { id: 'college-id', organization_type: 'college' } });
  f.create.mockResolvedValue({ data: { data: { learnerId: 'sso-user-id', authUserId: 'sso-user-id' } } });
  f.upload.mockResolvedValue({ success: true, url: 'https://storage.example.test/document.pdf' });
  f.update.mockResolvedValue({ success: true });
});
afterEach(cleanup);
function submit(files?: File[]) {
  const success = vi.fn();
  const { container, rerender } = render(<AddLearnerModal isOpen onClose={() => {}} onSuccess={success}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Manual Entry' }));
  const values: Record<string, string> = {
    "Enter learner's full name": 'QA Learner', 'learner@example.com': 'learner@example.test',
    'ENR2024001': 'ENR-QA-1', 'ROLL2024001': 'ROLL-QA-1', "Guardian's full name": 'QA Guardian',
    'guardian@example.com': 'guardian@example.test', 'Street address, building, etc.': 'QA Street',
    'City name': 'QA City', 'State/Province': 'QA State', '123456': '600001', 'District name': 'QA District'
  };
  for (const [placeholder, value] of Object.entries(values)) fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  for (const input of container.querySelectorAll('input[type=tel]')) fireEvent.change(input, { target: { value: '9876543210' } });
  fireEvent.change(container.querySelector('input[type=date]')!, { target: { value: '2000-01-01' } });
  const options = ['General', 'Merit', 'Male', 'A+', 'Father'];
  for (const select of container.querySelectorAll('select')) {
    const option = [...select.options].find(option => options.includes(option.value));
    if (option) fireEvent.change(select, { target: { value: option.value } });
  }
  const file = new File(['%PDF-1.4 synthetic'], 'document.pdf', { type: 'application/pdf' });
  fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: files || [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Learner' }));
  return { success, rerender };
}
it('uploads actual multipart through authenticated fetch without legacy token access', async () => {
 f.upload.mockResolvedValue(new Response(JSON.stringify({success:true,url:'https://storage.example.test/document.pdf'}),{status:200,headers:{'Content-Type':'application/json'}}));
 const {success}=submit();
 await waitFor(()=>expect(success).toHaveBeenCalledTimes(1));
 const [url,init]=f.upload.mock.calls[0];
 expect(url).toMatch(/\/storage\/upload$/);
 expect(init.body).toBeInstanceOf(FormData);
 expect(init.body.get('filename')).toBe('document.pdf');
 expect(init.body.get('context')).toBe('document');
 expect(init.body.get('file').name).toBe('document.pdf');
 expect(f.legacy).not.toHaveBeenCalled();
 expect(f.update).toHaveBeenCalledTimes(1);
});
it('keeps enrollment incomplete when the actual upload helper receives an authentication denial',async()=>{
 f.upload.mockResolvedValue(new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json'}}));
 const {success}=submit();
 expect(await screen.findByText(/Enrollment incomplete: document upload failed/)).toBeVisible();
 expect(f.create).toHaveBeenCalledTimes(1);
 expect(f.update).not.toHaveBeenCalled();
 expect(success).not.toHaveBeenCalled();
 expect(f.legacy).not.toHaveBeenCalled();
});
