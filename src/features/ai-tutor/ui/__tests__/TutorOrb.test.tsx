import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TutorOrb from '../TutorOrb';

afterEach(cleanup);

describe('learner tutor orb', () => {
  it('renders the shared animated illustration without educator actions', () => {
    const { container } = render(<TutorOrb />);
    expect(container.querySelector('.facilitator-orb svg')).toBeInTheDocument();
    expect(container.querySelector('.animate-facilitator-blink')).toBeInTheDocument();
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
