/** Measure the visual caret using the textarea's font, wrapping and scroll offsets. */
export function caretPosition(input: HTMLTextAreaElement): { x: number; y: number } {
  const bounds = input.getBoundingClientRect();
  const style = getComputedStyle(input);
  const mirror = document.createElement('div');
  mirror.setAttribute('aria-hidden', 'true');
  for (const property of [
    'box-sizing', 'font-family', 'font-size', 'font-weight', 'font-style',
    'font-variant', 'line-height', 'letter-spacing', 'word-spacing', 'text-transform',
    'text-indent', 'text-align', 'direction', 'tab-size', 'padding-top', 'padding-right',
    'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width',
    'border-bottom-width', 'border-left-width',
  ]) mirror.style.setProperty(property, style.getPropertyValue(property));
  Object.assign(mirror.style, {
    position: 'fixed', left: `${bounds.left}px`, top: `${bounds.top}px`,
    width: `${bounds.width}px`, height: 'auto', visibility: 'hidden',
    pointerEvents: 'none', whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
    borderStyle: 'solid',
  });
  const position = input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;
  mirror.textContent = input.value.slice(0, position);
  const marker = document.createElement('span');
  marker.textContent = input.value.slice(position, position + 1) || '\u200b';
  mirror.append(marker);
  document.body.append(mirror);
  try {
    const caret = marker.getBoundingClientRect();
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;
    return {
      x: Math.max(bounds.left, Math.min(bounds.right, caret.left - input.scrollLeft)),
      y: Math.max(bounds.top, Math.min(bounds.bottom, caret.top - input.scrollTop + lineHeight / 2)),
    };
  } finally { mirror.remove(); }
}
