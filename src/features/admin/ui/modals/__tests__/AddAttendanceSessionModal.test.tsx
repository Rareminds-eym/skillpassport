import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import Modal from '../AddAttendanceSessionModal';
const base = {isOpen:true,onClose:vi.fn(),onCreateSession:vi.fn(),onCreateAndStart:vi.fn(),onFormChange:vi.fn(),formData:{date:'2026-10-16',startTime:'09:00',endTime:'10:00'},departments:[],courses:[],semesters:[],sections:[],subjects:[],faculty:[],learners:[]};
it('locks mapped date and time while leaving an unmapped schedule editable',()=>{
 const {rerender}=render(<Modal {...base} schedule={{fixedDate:'2026-10-16',slots:[{start_time:'09:00',end_time:'10:00'}]}}/>);
 expect(screen.getByLabelText('Session date')).toBeDisabled();
 expect(screen.getByLabelText('Start Time')).toBeDisabled();
 expect(screen.getByLabelText('End Time')).toBeDisabled();
 rerender(<Modal {...base}/>);
 expect(screen.getByLabelText('Session date')).toBeEnabled();
 expect(screen.getByLabelText('Start Time')).toBeEnabled();
 expect(screen.getByLabelText('End Time')).toBeEnabled();
 cleanup();
});
it('allows selecting between assigned slots and keeps range dates editable',()=>{
 render(<Modal {...base} schedule={{minDate:'2026-10-16',maxDate:'2026-10-20',slots:[{start_time:'09:00',end_time:'10:00'},{start_time:'14:00',end_time:'15:00'}]}}/>);
 expect(screen.getByLabelText('Session date')).toBeEnabled();
 expect(screen.getByLabelText('Session date')).toHaveAttribute('max','2026-10-20');
 fireEvent.change(screen.getByLabelText('Assigned time slot'),{target:{value:'1'}});
 expect(base.onFormChange).toHaveBeenCalledWith('startTime','14:00');
 expect(base.onFormChange).toHaveBeenCalledWith('endTime','15:00');
 cleanup();
});
