import { PptxViewer } from "@file-viewer/pptx";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLogger } from "@/shared/config/logging";
import { ssoClient } from "@/shared/api/ssoClient";
import { SlideQuiz } from './SlideQuiz';
import { normalizePptxRelationships } from '../lib/normalizePptxRelationships';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, FileText as DocumentIcon, Maximize, Minimize } from "lucide-react";
import "@file-viewer/pptx/styles.css";

const IconButton = ({ icon, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode }) => <button type="button" {...props}>{icon}</button>;

export interface PptxContentViewerProps {
  title: string;
  url: string;
  courseId?: string;
  lessonId?: string;
  resourceId?: string;
}

interface SlideSize {
  width: number;
  height: number;
}

const SLIDE_SCALE_BIAS = 1;

const logger = getLogger("course-pptx-viewer");

const getPreviewErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return null;
  }

  return "This presentation could not be previewed. Please try again or contact your educator.";
};

const getLogMetadata = (error: unknown) => {
  if (error instanceof Error) return { error: error.message };
  if (error && typeof error === 'object') {
    const diagnostic = error as Record<string, unknown>;
    return {
      error: typeof diagnostic.message === 'string' ? diagnostic.message : 'PPTX processing failed',
      code: diagnostic.code,
      stage: diagnostic.stage,
      detail: diagnostic.detail,
      cause: diagnostic.cause,
    };
  }
  return { error: String(error) };
};

const getSlideElements = (target: HTMLElement): HTMLElement[] =>
  Array.from(target.querySelectorAll<HTMLElement>(".slide, section[data-slide-index]")).filter(
    (element, index, elements) => elements.indexOf(element) === index,
  );

const getSlideSize = (slide: HTMLElement, preferredSize: SlideSize | null) => {
  if (preferredSize) return preferredSize;

  const width = Number.parseFloat(slide.style.width);
  const height = Number.parseFloat(slide.style.height);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  return {
    width: slide.offsetWidth || 1,
    height: slide.offsetHeight || 1,
  };
};

const getSlideStageScale = (viewport: HTMLElement, slideSize: SlideSize) => {
  const availableWidth = Math.max(viewport.clientWidth - 2, 1);
  const availableHeight = Math.max(viewport.clientHeight - 2, 1);

  if (!slideSize.width || !slideSize.height) return 1;

  return (
    Math.min(availableWidth / slideSize.width, availableHeight / slideSize.height) *
    SLIDE_SCALE_BIAS
  );
};

const applySlideShowLayout = (
  target: HTMLElement,
  viewport: HTMLElement,
  activeSlide: number,
  preferredSlideSize: SlideSize | null,
) => {
  const slides = getSlideElements(target);
  const activeSlideElement = slides[activeSlide - 1];
  const content = target.querySelector<HTMLElement>(".flyfish-pptx-content");
  const scaleBox = target.querySelector<HTMLElement>(".flyfish-pptx-scale-box");

  if (content) {
    content.style.transform = "none";
  }

  const slideSize = activeSlideElement
    ? getSlideSize(activeSlideElement, preferredSlideSize)
    : null;
  const scale = slideSize ? getSlideStageScale(viewport, slideSize) : 1;

  slides.forEach((slide, index) => {
    const isActive = index + 1 === activeSlide;
    slide.hidden = false;
    slide.style.display = isActive ? "block" : "none";
    slide.style.margin = "0";
    slide.style.boxShadow = "none";
    slide.style.transform = "";
    slide.style.transformOrigin = "";
  });

  if (scaleBox && slideSize) {
    scaleBox.style.display = "flex";
    scaleBox.style.alignItems = "center";
    scaleBox.style.justifyContent = "center";
    scaleBox.style.width = `${Math.ceil(slideSize.width * scale)}px`;
    scaleBox.style.height = `${Math.ceil(slideSize.height * scale)}px`;
    scaleBox.style.minHeight = "0";
    scaleBox.style.overflow = "hidden";
  }

  if (content && slideSize) {
    content.style.display = "block";
    content.style.width = `${slideSize.width}px`;
    content.style.height = `${slideSize.height}px`;
    content.style.margin = "0";
    content.style.overflow = "visible";
    content.style.transform = `scale(${scale})`;
    content.style.transformOrigin = "top left";
  }

  return slides.length;
};

const PptxViewerStatePanel: React.FC<{
  title: string;
  message: string;
  isLoading?: boolean;
}> = ({ title, message, isLoading = false }) => (
  <div role={isLoading ? "status" : "alert"} className="absolute inset-0 flex items-center justify-center bg-white p-6">
    <div className="w-full max-w-sm space-y-3 text-center">
      {isLoading ? (
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      ) : (
        <DocumentIcon size={44} className="mx-auto text-gray-400" />
      )}
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">{message}</p>
      </div>

    </div>
  </div>
);

export const PptxContentViewer: React.FC<PptxContentViewerProps> = ({ title, url, courseId, lessonId, resourceId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const viewportRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PptxViewer | null>(null);
  const activeSlideRef = useRef(1);
  const deckSlideSizeRef = useRef<SlideSize | null>(null);
  const layoutTimersRef = useRef<number[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastViewportSizeRef = useRef<SlideSize>({ width: 0, height: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Preparing presentation preview...");
  const [activeSlide, setActiveSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(0);

  const syncSlideShowLayout = useCallback(() => {
    const target = targetRef.current;
    const viewport = viewportRef.current;
    if (!target || !viewport) return;
    const nextSlideCount = applySlideShowLayout(
      target,
      viewport,
      activeSlideRef.current,
      deckSlideSizeRef.current,
    );
    setSlideCount((currentSlideCount) =>
      currentSlideCount === nextSlideCount ? currentSlideCount : nextSlideCount,
    );
  }, []);

  const scheduleSlideShowLayout = useCallback(() => {
    requestAnimationFrame(() => {
      syncSlideShowLayout();
      requestAnimationFrame(syncSlideShowLayout);
    });

    layoutTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });
    layoutTimersRef.current = [
      window.setTimeout(syncSlideShowLayout, 80),
      window.setTimeout(syncSlideShowLayout, 180),
    ];
  }, [syncSlideShowLayout]);

  const goToSlide = useCallback(
    (slide: number) => {
      const boundedSlide = Math.min(Math.max(slide, 1), Math.max(slideCount, 1));
      activeSlideRef.current = boundedSlide;
      setActiveSlide(boundedSlide);
      scheduleSlideShowLayout();
    },
    [scheduleSlideShowLayout, slideCount],
  );

  const goToNextSlide = useCallback(() => {
    if (activeSlide < slideCount) {
      goToSlide(activeSlide + 1);
    }
  }, [activeSlide, goToSlide, slideCount]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    lastViewportSizeRef.current = {
      width: Math.round(viewport.clientWidth),
      height: Math.round(viewport.clientHeight),
    };
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = new ResizeObserver((entries) => {
      const nextSize = {
        width: Math.round(entries[0]?.contentRect.width ?? viewport.clientWidth),
        height: Math.round(entries[0]?.contentRect.height ?? viewport.clientHeight),
      };
      const previousSize = lastViewportSizeRef.current;
      if (
        Math.abs(nextSize.width - previousSize.width) < 2 &&
        Math.abs(nextSize.height - previousSize.height) < 2
      ) {
        return;
      }

      lastViewportSizeRef.current = nextSize;
      scheduleSlideShowLayout();
    });
    resizeObserverRef.current.observe(viewport);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [scheduleSlideShowLayout]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return undefined;

    const abortController = new AbortController();
    let isActive = true;

    const cleanupViewer = () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      target.innerHTML = "";
      activeSlideRef.current = 1;
      deckSlideSizeRef.current = null;
      layoutTimersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
      layoutTimersRef.current = [];
      setActiveSlide(1);
      setSlideCount(0);
    };

    const renderPresentation = async () => {
      cleanupViewer();
      setStatus("loading");
      setMessage("Preparing presentation preview...");

      try {
        const response = await (url.startsWith('/api/storage/course-resource?') ? ssoClient.fetch.bind(ssoClient) : fetch)(url, {
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error("Presentation file could not be loaded.");

        const buffer = await normalizePptxRelationships(await response.arrayBuffer());
        if (!isActive) return;

        const viewer = await PptxViewer.open(buffer, target, {
          fitMode: "none",
          zoomPercent: 100,
          lazySlides: false,
          lazyMedia: true,
          onSlideSize: (size) => {
            const width = Number(size.width);
            const height = Number(size.height);
            if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
              deckSlideSizeRef.current = { width, height };
              scheduleSlideShowLayout();
            }
          },
          onSlideRendered: () => {
            if (isActive) scheduleSlideShowLayout();
          },
          onRenderComplete: () => {
            if (!isActive) return;
            requestAnimationFrame(() => {
              scheduleSlideShowLayout();
              setStatus("ready");
            });
          },
          onError: (error) => {
            logger.warn("PPTX preview failed", getLogMetadata(error));
            if (!isActive) return;
            const previewMessage = getPreviewErrorMessage(error);
            if (previewMessage) {
              setMessage(previewMessage);
              setStatus("error");
            }
          },
        });

        if (!isActive) {
          viewer.destroy();
          return;
        }

        viewerRef.current = viewer;
      } catch (error) {
        logger.warn("PPTX preview load failed", getLogMetadata(error));
        if (!isActive) return;
        const previewMessage = getPreviewErrorMessage(error);
        if (previewMessage) {
          setMessage(previewMessage);
          setStatus("error");
        }
      }
    };

    void renderPresentation();

    return () => {
      isActive = false;
      abortController.abort();
      cleanupViewer();
    };
  }, [scheduleSlideShowLayout, url]);

  return (
    <div ref={containerRef} className="relative flex h-full w-full flex-col overflow-hidden bg-gray-100 fullscreen:h-screen fullscreen:w-screen">
      <SlideQuiz courseId={courseId} lessonId={lessonId} resourceId={resourceId} slide={activeSlide} ready={status === 'ready'} />
      <div ref={viewportRef} className="min-h-0 flex-1 overflow-hidden bg-gray-100 p-0.5">
        <div
          ref={targetRef}
          className="flex h-full w-full items-center justify-center overflow-hidden bg-gray-100"
        />
      </div>

      {status === "ready" && <button
        type="button"
        aria-label={isFullscreen ? "Exit PPT fullscreen" : "Fullscreen PPT"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        onClick={async () => {
          try {
            if (document.fullscreenElement === containerRef.current) {
              await document.exitFullscreen();
            } else {
              if (!containerRef.current?.requestFullscreen) throw new Error("Fullscreen unavailable");
              await containerRef.current.requestFullscreen();
            }
            setFullscreenError(false);
          } catch { setFullscreenError(true); }
        }}
      >{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>}
      {fullscreenError && <p role="status" className="absolute right-3 top-3 z-20 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 shadow-sm">Fullscreen is unavailable in this browser.</p>}

      {status === "ready" && slideCount > 0 ? (
        <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-2 pointer-events-none">
          <IconButton
            aria-label="Previous PPT slide"
            className="h-8 w-8 rounded-lg bg-white/90 pointer-events-auto disabled:opacity-40 focus-visible:outline focus-visible:outline-indigo-600 text-gray-600 hover:text-gray-900"
            disabled={activeSlide <= 1}
            icon={<ChevronLeftIcon size={16} />}
            onClick={() => goToSlide(activeSlide - 1)}
          />

          <span className="min-w-12 rounded-md bg-white/90 px-2 py-1 text-center text-sm font-semibold tabular-nums text-gray-900 shadow-sm">
            {activeSlide} / {slideCount}
          </span>

          <IconButton
            aria-label="Next PPT slide"
            className="h-8 w-8 rounded-lg bg-white/90 pointer-events-auto disabled:opacity-40 focus-visible:outline focus-visible:outline-indigo-600 text-gray-600 hover:text-gray-900"
            disabled={activeSlide >= slideCount}
            icon={<ChevronRightIcon size={16} />}
            onClick={goToNextSlide}
          />
        </div>
      ) : null}

      {status === "loading" ? (
        <PptxViewerStatePanel title={title} message={message} isLoading />
      ) : null}

      {status === "error" ? (
        <PptxViewerStatePanel title={title} message={message} />
      ) : null}
    </div>
  );
};
