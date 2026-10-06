import { useAuthStore } from "@/shared/model/authStore";
import { useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { REVIEW_VIEWS, type ReviewView } from "../api/reviews";
import ReviewSettings from "./ReviewSettings";
import ReviewsBoard, { type BoardQuery } from "./ReviewsBoard";

const TABS = [
  { id: "reviews", label: "Reviews" },
  { id: "settings", label: "Settings" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * Administrator page for artifact reviews.
 *
 * The administrator does not review. They see every review of their
 * organization, assign educators, and set how work is evaluated. State lives in
 * the URL (?tab, ?view, ?q, ?page) so a filtered view can be bookmarked or shared.
 */
export default function ReviewOperations() {
  const userId = useAuthStore((state) => state.user?.id);
  const [params, setParams] = useSearchParams();
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ reviews: null, settings: null });

  const tab: TabId = params.get("tab") === "settings" ? "settings" : "reviews";
  const viewParam = params.get("view");
  const page = Number(params.get("page") ?? 1);
  const query: BoardQuery = {
    view: (REVIEW_VIEWS as readonly string[]).includes(viewParam ?? "") ? (viewParam as ReviewView) : "all",
    q: (params.get("q") ?? "").slice(0, 100),
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };

  const update = useCallback(
    (next: Record<string, string | null>) =>
      setParams(
        (current) => {
          const merged = new URLSearchParams(current);
          for (const [key, value] of Object.entries(next)) {
            if (value === null || value === "" || (key === "page" && value === "1") || (key === "view" && value === "all"))
              merged.delete(key);
            else merged.set(key, value);
          }
          return merged;
        },
        { replace: true },
      ),
    [setParams],
  );
  const onQuery = useCallback(
    (next: Partial<BoardQuery>) =>
      update({
        ...(next.view !== undefined ? { view: next.view } : {}),
        ...(next.q !== undefined ? { q: next.q } : {}),
        ...(next.page !== undefined ? { page: String(next.page) } : {}),
      }),
    [update],
  );

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const move = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!move) return;
    event.preventDefault();
    const target = TABS[(index + move + TABS.length) % TABS.length]!;
    update({ tab: target.id === "reviews" ? null : target.id });
    tabRefs.current[target.id]?.focus();
  };

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Artifact reviews</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
          See every artifact review in your organization and assign educators to them. Educators do the
          reviewing; you keep work moving.
        </p>
      </header>

      <div role="tablist" aria-label="Artifact review sections" className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map((item, index) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[item.id] = node;
              }}
              id={`review-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`review-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => update({ tab: item.id === "reviews" ? null : item.id })}
              onKeyDown={(event) => onTabKey(event, index)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 ${selected ? "border-indigo-700 text-indigo-800" : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`review-panel-${tab}`}
        aria-labelledby={`review-tab-${tab}`}
        tabIndex={0}
        className="mt-6 focus:outline-none"
      >
        {tab === "reviews" ? (
          <ReviewsBoard userId={userId} query={query} onQuery={onQuery} />
        ) : (
          <ReviewSettings userId={userId} />
        )}
      </div>
    </main>
  );
}
