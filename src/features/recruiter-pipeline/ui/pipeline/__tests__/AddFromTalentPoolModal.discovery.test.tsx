import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const { learners } = vi.hoisted(() => ({ learners: vi.fn() }));
vi.mock('@/entities/learner/model/useLearners', () => ({ useLearners: learners }));
vi.mock('@/features/recruiter-pipeline', () => ({ addCandidateToPipeline: vi.fn() }));
vi.mock('@/features/notifications', () => ({ createNotification: vi.fn() }));
import { AddFromTalentPoolModal } from '../AddFromTalentPoolModal';
import { loadRecruiterTalentRows } from '../../../api/talentPoolService';
it('does not read candidates while closed and surfaces the primary reader failure when opened', () => {
  learners.mockReturnValue({ learners: [], loading: false, error: 'Discovery unavailable' });
  const props = { isOpen: false, onClose: vi.fn(), requisitionId: 'fixture', targetStage: 'sourced' };
  const view = render(<AddFromTalentPoolModal {...props} />);
  expect(learners).not.toHaveBeenCalled();
  view.rerender(<AddFromTalentPoolModal {...props} isOpen />);
  expect(learners).toHaveBeenCalledWith({ loadRows: loadRecruiterTalentRows });
  expect(screen.getByText('Discovery unavailable')).toBeTruthy();
  expect(screen.getByRole('alert').textContent).toContain('Candidates could not be loaded');
  expect(screen.queryByText('No candidates found')).toBeNull();
});
