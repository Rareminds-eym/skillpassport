import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import PanelLoadingSkeleton from '../PanelLoadingSkeleton';
afterEach(cleanup);
it('announces loading without visible text and respects reduced motion',()=>{
 render(<PanelLoadingSkeleton label="Loading progress" variant="progress"/>);
 expect(screen.getByRole('status',{name:'Loading progress'})).toBeInTheDocument();
 expect(screen.getByText('Loading progress')).toHaveClass('sr-only');
 expect(document.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
 expect(document.querySelector('.motion-reduce\\:animate-none')).not.toBeNull();
});
