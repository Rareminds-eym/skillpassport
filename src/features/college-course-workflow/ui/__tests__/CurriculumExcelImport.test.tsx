import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CurriculumExcelImport } from '../CurriculumExcelImport';

const mocks=vi.hoisted(() => ({ read:vi.fn(),download:vi.fn(),import:vi.fn() }));
vi.mock('../../lib/curriculumWorkbook',() => ({ readCurriculumWorkbook:mocks.read,downloadCurriculumTemplate:mocks.download }));
vi.mock('../../api/courseWorkflow',() => ({ courseWorkflow:{ import:mocks.import } }));
configure({ asyncUtilTimeout:10000 });
const context={ departmentId:'department',programId:'program',semester:1,academicYear:'2026-27' };
const courses=[{ code:'CS101',title:'Computing',credits:3,description:'',units:[{ code:'U1',name:'Algorithms',description:'',credits:1,duration:6,order:0,outcomes:[] }] }];
function mount(value=context) {
 const client=new QueryClient({ defaultOptions:{ mutations:{ retry:false } } });
 const onImported=vi.fn();
 const node=(ctx:typeof context) => <QueryClientProvider client={client}><CurriculumExcelImport context={ctx} onImported={onImported}/></QueryClientProvider>;
 return { ...render(node(value)),onImported,node };
}
beforeEach(() => { vi.resetAllMocks();mocks.read.mockResolvedValue(courses);mocks.import.mockResolvedValue([{ courseId:'course',curriculumId:'curriculum' }]); });
afterEach(cleanup);
async function upload() {
 fireEvent.change(screen.getByLabelText('Upload curriculum workbook'),{ target:{ files:[new File(['workbook'],'curriculum.xlsx')] } });
 await screen.findByText('CS101 · Computing');
}
describe('Excel import confirmation',() => {
 it('requires an academic context before enabling upload',() => {
  mount({ ...context,programId:'' });
  expect(screen.getByRole('button',{ name:'Upload Excel' })).toBeDisabled();
  expect(screen.getByRole('button',{ name:'Download Excel template' })).toBeEnabled();
 });
 it('previews without writing and imports only after confirmation',async() => {
  const { onImported }=mount();
  await upload();
  expect(mocks.import).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{ name:'Create draft curricula' }));
  await waitFor(() => expect(mocks.import).toHaveBeenCalledWith(context,courses));
  expect(await screen.findByRole('status')).toHaveTextContent('Created 1 draft curricula');
  expect(onImported).toHaveBeenCalledOnce();
 });
 it('requires a fresh preview if the academic selection changes',async() => {
  const view=mount();await upload();
  view.rerender(view.node({ ...context,programId:'different-program' }));
  expect(screen.getByRole('button',{ name:'Create draft curricula' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('Selection changed');
  expect(mocks.import).not.toHaveBeenCalled();
 });
 it('keeps the preview available when the server rejects an import',async() => {
  mocks.import.mockRejectedValue(new Error('Curriculum already exists'));
  const { onImported }=mount();await upload();
  fireEvent.click(screen.getByRole('button',{ name:'Create draft curricula' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Curriculum already exists');
  expect(screen.getByRole('button',{ name:'Create draft curricula' })).toBeEnabled();
  expect(onImported).not.toHaveBeenCalled();
 });
});
