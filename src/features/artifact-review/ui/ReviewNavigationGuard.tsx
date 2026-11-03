import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

/** Data-router blocking also covers Back/Forward and programmatic navigation. */
export function ReviewNavigationGuard({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(dirty);
  const stay = useRef<HTMLButtonElement>(null);
  const leave = useRef<HTMLButtonElement>(null);
  const blocked = blocker.state === "blocked";
  useEffect(() => {
    if (!blocked) return;
    const previous = document.activeElement;
    stay.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [blocked]);
  if (!blocked) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="review-leave-title"
        aria-describedby="review-leave-description"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            blocker.reset();
          }
          if (event.key === "Tab") {
            event.preventDefault();
            (document.activeElement === stay.current
              ? leave.current
              : stay.current
            )?.focus();
          }
        }}
      >
        <h2 id="review-leave-title" className="text-lg font-semibold">
          Discard unsent review edits?
        </h2>
        <p
          id="review-leave-description"
          className="mt-3 text-sm text-slate-600"
        >
          Your review has not been submitted. Stay to continue editing, or leave
          and discard these changes.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={stay}
            type="button"
            onClick={() => blocker.reset()}
            className="rounded-lg border px-4 py-2 font-semibold"
          >
            Stay on review
          </button>
          <button
            ref={leave}
            type="button"
            onClick={() => blocker.proceed()}
            className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Discard and leave
          </button>
        </div>
      </div>
    </div>
  );
}
