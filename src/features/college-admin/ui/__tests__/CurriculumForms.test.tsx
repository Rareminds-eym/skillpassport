import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddUnitModal, AddLearningOutcomeModal } from '../CollegeCurriculumBuilderUI';
vi.mock('@/features/college-admin',()=>({curriculumApprovalService:{},curriculumChangeRequestService:{}}));
vi.mock('@/features/analytics',()=>({KPICard:()=>null}));
vi.mock('@/shared/ui',()=>({Pagination:()=>null}));
afterEach(cleanup);
describe('curriculum persistence forms',()=>{
it('keeps unit values open on failure and awaits persistence before closing',async()=>{const close=vi.fn();const save=vi.fn().mockRejectedValueOnce(new Error('Database unavailable')).mockResolvedValueOnce(undefined);render(<AddUnitModal isOpen onClose={close} onCreated={save}/>);fireEvent.change(screen.getByPlaceholderText('e.g., Introduction to Data Structures'),{target:{value:'Algebra'}});fireEvent.change(screen.getByPlaceholderText('Brief description of what this unit covers...'),{target:{value:'Linear equations'}});fireEvent.click(screen.getByRole('button',{name:/Add Unit/i}));await screen.findByText('Database unavailable');expect(close).not.toHaveBeenCalled();expect(screen.getByPlaceholderText('e.g., Introduction to Data Structures')).toHaveValue('Algebra');fireEvent.click(screen.getByRole('button',{name:/Add Unit/i}));await waitFor(()=>expect(close).toHaveBeenCalledOnce());});
it('saves outcomes without mappings when no types are configured',async()=>{const save=vi.fn().mockResolvedValue(undefined);render(<AddLearningOutcomeModal isOpen onClose={vi.fn()} onCreated={save} units={[{id:'unit',name:'Algebra',description:'Basics',order:1}]} selectedUnitForOutcome="unit" assessmentTypes={[]}/>);fireEvent.change(screen.getByPlaceholderText('Describe what learners should be able to do after this unit...'),{target:{value:'Solve equations'}});fireEvent.click(screen.getByRole('button',{name:/Add Outcome/i}));await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({unitId:'unit',assessmentMappings:[]})));expect(screen.queryByText(/Loading available assessment/)).toBeNull();});
});