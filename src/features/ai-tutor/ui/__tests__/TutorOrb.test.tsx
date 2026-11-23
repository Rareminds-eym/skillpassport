import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../caretPosition', () => ({ caretPosition: (input: HTMLTextAreaElement) => ({ x: 100 + input.selectionStart * 20, y: 600 }) }));
import TutorOrb from '../TutorOrb';
afterEach(cleanup);
describe('learner tutor orb', () => {
  it('follows the typing caret and selections, then resets on blur', () => {
    const { container } = render(<div data-orb-pointer-area><TutorOrb /><textarea data-orb-caret aria-label="Composer" /></div>);
    const orb = container.querySelector<HTMLDivElement>('.facilitator-orb')!;
    vi.spyOn(orb, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300 } as DOMRect);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    input.focus();
    fireEvent.input(input, { target: { value: 'abcdefghij' } });
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('4.5px');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('6px');
    input.setSelectionRange(0, 0);
    fireEvent.select(input);
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('-4.5px');
    input.blur();
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
    fireEvent.input(input, { target: { value: 'other text' } });
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
  });
  it('renders the shared animated illustration without educator actions', () => {
    const { container } = render(<TutorOrb />);
    expect(container.querySelector('.facilitator-orb svg')).toBeInTheDocument();
    expect(container.querySelector('.animate-facilitator-blink')).toBeInTheDocument();
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
it('uses real audio energy only while listening or speaking',()=>{
  const view=render(<TutorOrb voiceState="speaking" level={.8}/>);
  expect(view.container.querySelector('.facilitator-orb')).toHaveStyle({'--voice-energy':'0.8'});
  expect(view.container.querySelector('.voice-orb-mouth')).toBeNull();expect(view.container.querySelectorAll('.voice-aura-line')).toHaveLength(6);expect(view.container.querySelector('.voice-aura-tick')).toBeNull();expect(view.container.querySelector('.voice-flowing-waves')).toBeNull();expect(view.container.querySelector('.voice-aura-line')).toHaveAttribute('d',expect.stringContaining('M 145 47 C 53'));
  view.rerender(<TutorOrb voiceState="thinking" level={.8}/>);
  expect(view.container.querySelector('.facilitator-orb')).toHaveStyle({'--voice-energy':'0'});
  expect(view.container.querySelector('.voice-orb-mouth')).toBeNull();
  view.rerender(<TutorOrb voiceState="listening" level={2}/>);
  expect(view.container.querySelector('.facilitator-orb')).toHaveStyle({'--voice-energy':'1'});
  view.rerender(<TutorOrb voiceState="listening" level={NaN}/>);
  expect(view.container.querySelector('.facilitator-orb')).toHaveStyle({'--voice-energy':'0'});
});
it('separates listening, loading and speaking and drives each ripple from its frequency band',()=>{
  const callbacks:Array<FrameRequestCallback>=[];const raf=vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{callbacks.push(callback);return callbacks.length;});const cancel=vi.spyOn(window,'cancelAnimationFrame');
  try{
    const view=render(<TutorOrb voiceState="listening" level={.5} tone={[.9,.4,.1]}/>);
    const orb=view.container.querySelector<HTMLElement>('.facilitator-orb')!;
    const time=performance.now();callbacks.at(-1)!(time+16);callbacks.at(-1)!(time+60);
    expect(orb.dataset.voiceMode).toBe('listening');expect(Number(orb.style.getPropertyValue('--voice-low'))).toBeGreaterThan(Number(orb.style.getPropertyValue('--voice-high')));
    view.rerender(<TutorOrb voiceState="thinking" level={0}/>);expect(orb.dataset.voiceMode).toBe('loading');expect(cancel).toHaveBeenCalled();
    view.rerender(<TutorOrb voiceState="preparing"/>);expect(orb.dataset.voiceMode).toBe('loading');
    view.rerender(<TutorOrb voiceState="speaking" level={.8}/>);expect(orb.dataset.voiceMode).toBe('speaking');
    view.unmount();expect(cancel).toHaveBeenCalled();
  }finally{raf.mockRestore();cancel.mockRestore();}
});
it('keeps the outer ripple beyond both inner ripples and renders a separate loading indicator',()=>{
  const view=render(<TutorOrb voiceState="speaking" tone={[1,0,0]}/>);
  const arcs=view.container.querySelectorAll<SVGPathElement>('.voice-aura-line');
  expect(arcs[0]).toHaveAttribute('d',expect.stringContaining('M 145 47 C 53'));
  expect(arcs[1]).toHaveAttribute('d',expect.stringContaining('M 132 29 C 26'));
  expect(arcs[2]).toHaveAttribute('d',expect.stringContaining('M 160 12 C -12'));
  expect(arcs[2].style.getPropertyValue('--band')).toContain('max(var(--voice-low,0),var(--voice-mid,0),var(--voice-high,0))');
  view.rerender(<TutorOrb voiceState="thinking"/>);
  expect(view.container.querySelector('.voice-loading-track')).toBeInTheDocument();expect(view.container.querySelector('.voice-loading-inner')).toBeInTheDocument();expect(view.container.querySelector('.voice-loading-dots')).toBeNull();
});
