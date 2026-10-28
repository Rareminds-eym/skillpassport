import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiPost } from '@/shared/api/apiClient';
import { ProfileValidationService } from '../profileValidationService';

vi.mock('@/shared/api/apiClient', () => ({ apiPost: vi.fn() }));

describe('job application profile validation', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([
    { contactNumber: '9876543210' },
    { contact_number: '9876543210' },
    { phone: '9876543210' },
    { contactNumber: '   ', contact_number: '9876543210' },
    { contactNumber: null, contact_number: '', phone: '9876543210' },
  ])('accepts a saved phone number in %j', async contact => {
    vi.mocked(apiPost).mockResolvedValue({
      data: { id: 'learner-1', name: 'Test Learner', email: 'learner@example.com', ...contact },
    });

    const result = await ProfileValidationService.validateProfileForJobApplication('learner-1');

    expect(result.isComplete).toBe(true);
    expect(result.completionPercentage).toBe(100);
    expect(result.missingFields).toEqual([]);
  });

  it('still blocks applications when all phone fields are empty', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      data: {
        id: 'learner-1', name: 'Test Learner', email: 'learner@example.com',
        contactNumber: ' ', contact_number: null, phone: '',
      },
    });

    const result = await ProfileValidationService.validateProfileForJobApplication('learner-1');

    expect(result.isComplete).toBe(false);
    expect(result.completionPercentage).toBe(67);
    expect(result.missingFields).toEqual(['Phone Number']);
  });
});
