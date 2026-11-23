import { useEffect, useRef, useState } from 'react';
import type { PptxViewer } from '@file-viewer/pptx';
import workerUrl from '@file-viewer/pptx/worker/pptx.worker.js?url';
import { ChevronLeft, ChevronRight, FileText, RotateCw } from 'lucide-react';

type SlideSize = { width: number; height: number };
const control = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-default disabled:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600';

// Uses the same native renderer and one-slide layout as LTE's PptxContentViewer.
// The supplied blob URL has already passed the lesson resource access checks.
export function LessonPresentationViewer({ url, title }: { url: string; title: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeSlide, setActiveSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(0);
  const [ratio, setRatio] = useState(16 / 9);
  const [attempt, setAttempt] = useState(0);
  const activeRef = useRef(1);
  const layoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    if (!host || !viewport) return;
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const target = document.createElement('div');
    target.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;overflow:hidden;font-family:Arial,sans-serif;color:#111827;';
    shadow.appendChild(target);
    const controller = new AbortController();
    let disposed = false;
    let viewer: PptxViewer | undefined;
    let slideSize: SlideSize | undefined;
    let frame = 0;
    activeRef.current = 1;
    setActiveSlide(1); setSlideCount(0); setRatio(16 / 9); setStatus('loading');

    const layout = () => {
      if (disposed) return;
      const slides = Array.from(target.querySelectorAll<HTMLElement>('.slide, section[data-slide-index]'));
      const selected = slides[activeRef.current - 1];
      if (!selected) return;
      const size = slideSize || { width: parseFloat(selected.style.width) || selected.offsetWidth, height: parseFloat(selected.style.height) || selected.offsetHeight };
      if (!size.width || !size.height) return;
      const scale = Math.min(Math.max(viewport.clientWidth - 2, 1) / size.width, Math.max(viewport.clientHeight - 2, 1) / size.height);
      slides.forEach((slide, index) => {
        slide.hidden = false;
        slide.style.display = index + 1 === activeRef.current ? 'block' : 'none';
        slide.style.margin = '0'; slide.style.boxShadow = 'none';
        slide.style.transform = ''; slide.style.transformOrigin = '';
      });
      const content = target.querySelector<HTMLElement>('.flyfish-pptx-content');
      const box = target.querySelector<HTMLElement>('.flyfish-pptx-scale-box');
      if (box) Object.assign(box.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', width: `${Math.ceil(size.width * scale)}px`, height: `${Math.ceil(size.height * scale)}px`, minHeight: '0', overflow: 'hidden' });
      if (content) Object.assign(content.style, { display: 'block', width: `${size.width}px`, height: `${size.height}px`, margin: '0', overflow: 'visible', transform: `scale(${scale})`, transformOrigin: 'top left' });
      setSlideCount(current => current === slides.length ? current : slides.length);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout); };
    layoutRef.current = schedule;
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Presentation is unavailable.');
        const buffer = await response.arrayBuffer();
        const { PptxViewer: Renderer } = await import('@file-viewer/pptx');
        if (disposed) return;
        const instance = await Renderer.open(buffer, target, {
          workerUrl, styleRoot: shadow, fitMode: 'none', zoomPercent: 100,
          lazySlides: false, lazyMedia: true,
          onSlideSize: size => {
            const width = Number(size.width), height = Number(size.height);
            if (!disposed && width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)) {
              slideSize = { width, height }; setRatio(width / height); schedule();
            }
          },
          onSlideRendered: schedule,
          onRenderComplete: () => { if (!disposed) { schedule(); setStatus('ready'); } },
          onError: () => { if (!disposed) setStatus('error'); },
        });
        if (disposed) { instance.destroy(); return; }
        viewer = instance;
      } catch {
        if (!disposed && !controller.signal.aborted) setStatus('error');
      }
    })();
    return () => {
      disposed = true; controller.abort(); observer.disconnect(); cancelAnimationFrame(frame);
      layoutRef.current = () => {}; viewer?.destroy(); target.remove();
    };
  }, [url, attempt]);

  const goTo = (slide: number) => {
    const bounded = Math.min(Math.max(slide, 1), slideCount);
    if (!bounded) return;
    activeRef.current = bounded; setActiveSlide(bounded); layoutRef.current();
  };
  return <section aria-label={`Presentation: ${title}`}>
    <div ref={viewportRef} role="region" aria-label="Presentation slides. Use the left and right arrow keys to change slides." tabIndex={status === 'ready' ? 0 : -1} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); goTo(activeRef.current + (event.key === 'ArrowRight' ? 1 : -1)); }
    }} style={{ aspectRatio: ratio }} className="relative w-full overflow-hidden bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600">
      <div ref={hostRef} className="h-full w-full" />
      {status === 'loading' && <div role="status" className="absolute inset-0 flex items-center justify-center gap-3 bg-white p-4 text-center text-sm text-gray-500"><span className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-200 border-t-gray-500 motion-safe:animate-spin" aria-hidden="true" />Preparing presentation...</div>}
      {status === 'error' && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center bg-white p-4 text-center"><FileText className="mb-2 h-6 w-6 text-gray-400" aria-hidden="true" /><p className="!text-sm !font-semibold text-gray-900">Presentation preview unavailable</p><p className="mt-2 max-w-sm !text-xs !leading-5 text-gray-500">Try again or download the original presentation above.</p><button type="button" className={`${control} mt-3 gap-2 px-3 text-xs`} onClick={() => setAttempt(value => value + 1)}><RotateCw className="h-4 w-4" aria-hidden="true" />Try again</button></div>}
    </div>
    {status === 'ready' && slideCount > 0 && <nav aria-label="Presentation navigation" className="flex items-center justify-center gap-4 border-t border-gray-200 bg-white px-4 py-2"><button type="button" aria-label="Previous PPT slide" className={control} disabled={activeSlide <= 1} onClick={() => goTo(activeSlide - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button><span role="status" className="min-w-16 text-center text-sm tabular-nums text-gray-600">{activeSlide} / {slideCount}</span><button type="button" aria-label="Next PPT slide" className={control} disabled={activeSlide >= slideCount} onClick={() => goTo(activeSlide + 1)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button></nav>}
  </section>;
}
