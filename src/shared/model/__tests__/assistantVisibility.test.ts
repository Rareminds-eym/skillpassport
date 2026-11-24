import { afterEach, describe, expect, it } from 'vitest';
import { useAssistantVisibility } from '../assistantVisibility';

afterEach(() => useAssistantVisibility.getState().setFacilitatorOpen(false));
describe('assistant visibility', () => {
  it('shares facilitator visibility across independent UI components', () => {
    useAssistantVisibility.getState().setFacilitatorOpen(true);
    expect(useAssistantVisibility.getState().facilitatorOpen).toBe(true);
    useAssistantVisibility.getState().setFacilitatorOpen(false);
    expect(useAssistantVisibility.getState().facilitatorOpen).toBe(false);
  });
});
