/**
 * DirectoryTreePanel - right slide-over with the recursive directory tree
 * (College: Department → Academic Year → Section).
 *
 * Reuses the shared `Sheet` for the panel shell. The tree itself is a small
 * recursive renderer, so deeper future hierarchies (School, University) render
 * without changes — they are just deeper `DirectoryNode` data.
 *
 * Behaviour: Departments and Years only expand/collapse (pure navigation).
 * Selecting a Section emits it upward via `onSelectSection`; this component
 * owns NO filtering logic — the dashboard derives the learner list from the
 * selected Section using the entity helpers (single source of truth).
 */

import { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { cn } from '@/shared/lib/utils';
import {
  buildLearnerCountByNode,
  type DirectoryNode,
  type LearnerDirectoryRow,
} from '@/entities/course-analytics';
import { resolveDirectoryIcon } from './iconMaps';

interface DirectoryTreePanelProps {
  tree: DirectoryNode[];
  /** All learners; used only to derive per-node count badges. */
  learners: LearnerDirectoryRow[];
  /** The id of whichever node (Department, Academic Year, or Section) is currently selected. */
  selectedSectionId: string | null;
  /**
   * Emits the chosen node (id + level: 'department' | 'academic-year' |
   * 'section') on selection, or `null` when cleared. Department and Academic
   * Year nodes are selectable too, not just Section leaves — the caller maps
   * the level to the right Learner Directory filter.
   */
  onSelectSection: (node: { id: string; level: string } | null) => void;
  /**
   * Fires synchronously right after any node is selected and the panel is
   * closed (never on a plain dismiss via the X button, overlay, or Escape
   * with no new selection). Safe to act on immediately — this project's
   * Sheet has no real CSS close animation (`tailwindcss-animate` is not
   * installed, so those utility classes are inert), so there is no
   * animation-driven scroll-lock delay to wait out. The dashboard uses this
   * to scroll to the Learner Directory — see that component's usage.
   */
  onSectionApplied?: () => void;
}

interface TreeNodeProps {
  node: DirectoryNode;
  counts: Map<string, number>;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  selectedSectionId: string | null;
  /** Section leaves only: applies the filter AND closes the panel (final level). */
  onSelectSection: (node: { id: string; level: string } | null) => void;
  /**
   * Department / Academic Year branches only: updates the filter WITHOUT
   * closing the panel or touching expand/collapse state — these levels are
   * navigation first, filter second, so selecting one must not interrupt
   * drilling further into the tree. See DirectoryTreePanel's handleSelectBranch.
   */
  onSelectBranch: (node: { id: string; level: string } | null) => void;
}

/**
 * Recursive node renderer. Every level (Department, Academic Year, Section)
 * is selectable (drives the Learner Directory). Branches additionally expand
 * on click; selecting a branch updates the filter but leaves the panel open
 * and expand state untouched (onSelectBranch), while selecting a Section
 * applies the filter and closes the panel since it's the final level
 * (onSelectSection).
 */
function TreeNode({
  node,
  counts,
  expandedIds,
  onToggle,
  selectedSectionId,
  onSelectSection,
  onSelectBranch,
}: TreeNodeProps) {
  const Icon = resolveDirectoryIcon(node.icon);
  // Prefer the backend-computed count already on the node (real data, once a
  // role's get-directory-tree action populates it) over the learnerDirectory-
  // derived map, which is still built from mock data until that section also
  // has a real backend — see DirectoryTreePanelProps.learners' doc comment.
  const count = node.count ?? counts.get(node.id) ?? 0;
  const isSelected = node.id === selectedSectionId;

  // Leaf (Section): selecting it drives the Learner Directory; clicking the
  // already-selected section clears the selection.
  if (node.selectable) {
    return (
      <button
        type="button"
        onClick={() => onSelectSection(isSelected ? null : { id: node.id, level: node.level })}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
          isSelected
            ? 'border-blue-300 bg-blue-50'
            : 'border-slate-200 bg-white hover:bg-slate-50',
        )}
      >
        <Icon
          className={cn('h-4 w-4 shrink-0', isSelected ? 'text-blue-600' : 'text-slate-400')}
          aria-hidden="true"
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm font-medium',
            isSelected ? 'text-blue-700' : 'text-slate-700',
          )}
        >
          {node.label}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600',
          )}
        >
          {count} {count === 1 ? 'Learner' : 'Learners'}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
      </button>
    );
  }

  // Branch (Department / Academic Year): selecting it drives the Learner
  // Directory to that whole department/year, AND expands its children so the
  // user can still drill into a specific Section — same click, both effects.
  // Uses onSelectBranch (not onSelectSection) so the panel stays open and
  // expand/collapse state is untouched — these levels are navigation first,
  // filter second, unlike a Section which is the final, closing selection.
  const isExpanded = expandedIds.has(node.id);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onToggle(node.id);
          onSelectBranch(isSelected ? null : { id: node.id, level: node.level });
        }}
        aria-expanded={isExpanded}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
          isSelected
            ? 'border-blue-300 bg-blue-50'
            : isExpanded
              ? 'border-blue-200 bg-blue-50/60'
              : 'border-transparent hover:bg-slate-50',
        )}
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
            isExpanded && 'rotate-90',
          )}
          aria-hidden="true"
        />
        <Icon
          className={cn('h-4 w-4 shrink-0', isSelected || isExpanded ? 'text-blue-600' : 'text-slate-400')}
          aria-hidden="true"
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm font-semibold',
            isSelected ? 'text-blue-700' : isExpanded ? 'text-blue-700' : 'text-slate-700',
          )}
        >
          {node.label}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
          )}
        >
          {count}
        </span>
      </button>

      {isExpanded && node.children?.length ? (
        <div className="ml-4 mt-2 flex flex-col gap-2 border-l border-slate-100 pb-1 pl-3">
          {node.childrenLabel && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {node.childrenLabel}
            </p>
          )}
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              counts={counts}
              expandedIds={expandedIds}
              onToggle={onToggle}
              selectedSectionId={selectedSectionId}
              onSelectSection={onSelectSection}
              onSelectBranch={onSelectBranch}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Every top-level node starts collapsed — the panel's default, resting state. */
function createDefaultExpandedIds(): Set<string> {
  return new Set<string>();
}

export function DirectoryTreePanel({
  tree,
  learners,
  selectedSectionId,
  onSelectSection,
  onSectionApplied,
}: DirectoryTreePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(createDefaultExpandedIds);
  // The panel's own open/closed state, now controlled (not left to Radix's
  // internal uncontrolled state) so selecting a Section can close it
  // programmatically — see handleSelectSection below.
  const [open, setOpen] = useState(false);

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Count badges derived from the actual learner rows (never hardcoded).
  const counts = useMemo(() => buildLearnerCountByNode(tree, learners), [tree, learners]);

  // Closing the panel (via the X button, overlay click, or Escape) clears ALL
  // expand/collapse state so it always reopens fully collapsed — the
  // currently selected Section (selectedSectionId) is untouched here; that's
  // owned by the parent dashboard, not this panel.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setExpandedIds(createDefaultExpandedIds());
    }
  };

  // Selecting a Section (the final, leaf level) applies the filter, closes
  // the panel, and reports the applied selection upward in one action — a
  // filter selection, not a persistent panel. `tailwindcss-animate` (the
  // classes driving Sheet's slide/fade transitions in shared/ui/sheet.jsx)
  // is not installed in this project, so those "animation" classes compile
  // to nothing and the sheet closes with no real CSS animation. That means
  // there is no exit-animation delay or scroll-lock hold to wait for, so the
  // scroll can fire immediately rather than waiting on Radix's
  // onCloseAutoFocus (which depends on FocusScope's unmount, itself gated by
  // Presence's animation detection — unreliable with no real animation
  // present, and internally deferred via Radix's own setTimeout(fn, 0)).
  const handleSelectSection = (node: { id: string; level: string } | null) => {
    onSelectSection(node);
    handleOpenChange(false);
    if (node) {
      onSectionApplied?.();
    }
  };

  // Selecting a Department or Academic Year (branch, navigation) updates the
  // filter only — the panel stays open and expand/collapse state is left
  // alone, so the user can keep drilling down. Passed straight through to
  // the raw onSelectSection prop, deliberately bypassing handleOpenChange
  // (which would otherwise close the panel AND reset expandedIds, discarding
  // the very expand toggle that just happened in the same click).
  const handleSelectBranch = (node: { id: string; level: string } | null) => {
    onSelectSection(node);
  };

  // Clear Filter: resets the Section selection (so the Learner Directory
  // reverts to its full, unfiltered dataset) AND collapses the tree back to
  // its default state — the same reset that already happens on close, just
  // triggered explicitly without requiring the user to close the panel.
  const handleClearFilter = () => {
    onSelectSection(null);
    setExpandedIds(createDefaultExpandedIds());
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filters
          {selectedSectionId && (
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-600"
              aria-hidden="true"
            />
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        {/*
          pr-12 reserves space for Radix's built-in Close (X) button, which is
          `absolute right-4 top-4` inside SheetContent (see shared/ui/sheet.jsx)
          and therefore sits outside this flex row entirely. Without this
          padding, "Clear Filter" — a normal flex child pushed to the far
          right by justify-between — renders directly under that fixed X,
          which is what caused the overlap.
        */}
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 py-4 pl-5 pr-12">
          <SheetTitle className="min-w-0 truncate text-sm font-semibold uppercase tracking-widest text-slate-700">
            Recursive Directory Tree
          </SheetTitle>
          {selectedSectionId && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Filter
            </button>
          )}
        </SheetHeader>

        <div className="flex h-[calc(100vh-61px)] flex-col gap-3 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              counts={counts}
              expandedIds={expandedIds}
              onToggle={toggle}
              selectedSectionId={selectedSectionId}
              onSelectSection={handleSelectSection}
              onSelectBranch={handleSelectBranch}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
