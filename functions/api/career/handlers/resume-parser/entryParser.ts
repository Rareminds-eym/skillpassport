/**
 * Shared forward-scanning entry parser for Projects and Experience.
 *
 * Both sections have the same underlying shape: a sequence of "entries" (one
 * project, one job), each made of a header phase (title / role+org+dates,
 * possibly wrapped across several physical lines) followed by a description
 * phase (bullets/sentences), with blank lines, PDF page breaks, and wrapped
 * header lines scattered through the middle that must NOT be read as entry
 * boundaries.
 *
 * Earlier versions of the Projects parser handled this with several
 * independent passes layered on top of a blind blank-line split
 * (splitEntries -> page-break merge -> per-line title scan -> wrapped-title
 * join), each added to patch one specific resume's failure. Experience had
 * none of these passes at all, so the same page-break/blank-line problems
 * that were patched for Projects reappeared, unfixed, in Experience.
 *
 * This module replaces all of that with one traversal: read the section's
 * lines in order, track a single state (no entry open / accumulating a
 * header / accumulating a description), and only close the current entry
 * when a line gives strong, section-specific evidence that a new entry is
 * starting. Blank lines and page breaks are never boundary signals — they're
 * either skipped (before an entry has opened, or while still in the header
 * phase) or absorbed into the open entry's description.
 */

/** One raw entry's lines, split into its header phase and description phase. */
export interface RawEntry {
  headerLines: string[];
  descriptionLines: string[];
}

/**
 * Section-specific classifier the traversal delegates to. Both predicates
 * receive only the information available at that point in the scan (never a
 * look-ahead), so the engine stays a single forward pass.
 */
export interface EntryClassifier {
  /**
   * True when `line` reads as strong, unambiguous evidence that a new entry
   * begins here — evaluated against the entry accumulated so far (its header
   * and description lines to this point), not just the immediately
   * preceding line. Only consulted once the current entry has already left
   * its header phase (see isHeaderContinuation) — never used to end a
   * header phase that might still be wrapping.
   */
  isNewEntryStart(line: string, current: RawEntry): boolean;

  /**
   * True when `line` still belongs to the header phase (title, or role/org/
   * dates) rather than starting the description phase. Called only while
   * the current entry has no description lines yet, so this decides how
   * long a wrapped multi-line header keeps absorbing lines.
   */
  isHeaderContinuation(line: string, current: RawEntry): boolean;
}

/**
 * Forward-scan `sectionText` into raw entries using `classifier`. Blank
 * lines are read as ordinary content, not separators:
 *   - before any entry is open, a blank line is simply skipped;
 *   - once an entry is open, a blank line never closes it — it's dropped
 *     (not appended to either phase) and the entry stays open, so a PDF
 *     page-break join or a stray paragraph-gap in the middle of one entry
 *     can never fabricate a new entry on its own.
 * A new entry starts only when isNewEntryStart() finds strong evidence, or
 * there is no entry open yet (the very first non-blank line always opens
 * one, since there is nothing else it could be).
 */
export function scanEntries(sectionText: string, classifier: EntryClassifier): RawEntry[] {
  const lines = sectionText.split('\n').map((line) => line.trim());

  const entries: RawEntry[] = [];
  let current: RawEntry | null = null;

  for (const line of lines) {
    if (!line) continue; // blank line: never a boundary, just skipped

    if (!current) {
      current = { headerLines: [line], descriptionLines: [] };
      entries.push(current);
      continue;
    }

    const stillInHeader = current.descriptionLines.length === 0;

    if (stillInHeader && classifier.isHeaderContinuation(line, current)) {
      current.headerLines.push(line);
      continue;
    }

    if (classifier.isNewEntryStart(line, current)) {
      current = { headerLines: [line], descriptionLines: [] };
      entries.push(current);
      continue;
    }

    current.descriptionLines.push(line);
  }

  return entries;
}
