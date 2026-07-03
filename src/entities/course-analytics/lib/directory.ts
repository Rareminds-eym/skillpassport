/**
 * Directory tree domain logic (pure functions, no UI).
 *
 * Single home for Section-based filtering so no component duplicates it. All
 * helpers are fully recursive, so deeper future hierarchies (School,
 * University) work unchanged. A future backend can replace the callers'
 * data source without touching these signatures.
 */

import type { DirectoryNode, LearnerDirectoryRow } from '../model/types';

/**
 * Learners belonging to one Section. The Learner Directory renders exactly
 * this result for the selected Section — nothing more (not the department's
 * or year's learners).
 */
export function filterLearnersBySection(
  learners: LearnerDirectoryRow[],
  sectionId: string,
): LearnerDirectoryRow[] {
  return learners.filter((learner) => learner.sectionId === sectionId);
}

/**
 * Recursive learner counts for every node in the tree, derived from the actual
 * learner data (single source of truth — counts can never drift from the
 * rows). Selectable nodes count their own learners; branch nodes sum their
 * children.
 *
 * @returns Map of node id → learner count.
 */
export function buildLearnerCountByNode(
  tree: DirectoryNode[],
  learners: LearnerDirectoryRow[],
): Map<string, number> {
  const counts = new Map<string, number>();

  const visit = (node: DirectoryNode): number => {
    const count = node.selectable
      ? filterLearnersBySection(learners, node.id).length
      : (node.children ?? []).reduce((sum, child) => sum + visit(child), 0);
    counts.set(node.id, count);
    return count;
  };

  tree.forEach(visit);
  return counts;
}

/**
 * Path of nodes from a root down to the node with `id` (inclusive), e.g.
 * [Computer Science, 1st Year, Section A] — used for breadcrumb labels.
 * Returns null when the id is not in the tree.
 */
export function findNodePath(tree: DirectoryNode[], id: string): DirectoryNode[] | null {
  for (const node of tree) {
    if (node.id === id) return [node];
    const childPath = node.children ? findNodePath(node.children, id) : null;
    if (childPath) return [node, ...childPath];
  }
  return null;
}
