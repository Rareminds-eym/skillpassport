import { afterEach, describe, expect, it, vi } from 'vitest';
import { caretPosition } from '../caretPosition';

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

describe('textarea visual caret', () => {
  it('uses selection position, wrapping styles and scroll offsets without leaving a mirror', () => {
    const input = document.createElement('textarea');
    input.value = 'First line\nSecond line';
    input.style.lineHeight = '20px';
    input.style.fontFamily = 'Arial';
    input.setSelectionRange(12, 12);
    input.scrollTop = 20;
    document.body.append(input);
    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({ left: 100, right: 400, top: 500, bottom: 560, width: 300, height: 60 } as DOMRect);
    const original = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.tagName === 'SPAN') {
        expect(this.parentElement?.style.whiteSpace).toBe('pre-wrap');
        expect(this.parentElement?.style.width).toBe('300px');
        expect(this.parentElement?.textContent).toBe(input.value.slice(0, 13));
        return { left: 180, top: 540 } as DOMRect;
      }
      return original.call(this);
    });
    expect(caretPosition(input)).toEqual({ x: 180, y: 530 });
    expect(document.body.children).toHaveLength(1);
  });
});
