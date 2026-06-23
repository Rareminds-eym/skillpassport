// Pagination utility functions

// Pagination constants
export const PAGES_TO_SHOW = 5;
export const FIRST_PAGES = 3;

/**
 * Generate page numbers for pagination display with ellipsis handling
 * @param currentPage - The current active page number
 * @param totalPages - Total number of pages available
 * @returns Array of page numbers and ellipsis strings (...) for display
 */
export const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  // Guard clause: validate inputs
  if (totalPages <= 0 || currentPage < 1 || currentPage > totalPages) {
    return [];
  }

  const pages: (number | string)[] = [];
  const addedPages = new Set<number>();

  const addPage = (page: number) => {
    if (!addedPages.has(page)) {
      pages.push(page);
      addedPages.add(page);
    }
  };

  // If total pages is small, show all
  if (totalPages <= PAGES_TO_SHOW) {
    for (let i = 1; i <= totalPages; i++) {
      addPage(i);
    }
    return pages;
  }

  // Always show first 3 pages
  addPage(1);
  addPage(2);
  addPage(3);

  // Add ellipsis if there's a gap between page 3 and current page
  const needsLeftEllipsis = currentPage > PAGES_TO_SHOW;
  if (needsLeftEllipsis) {
    pages.push('...');
  }

  // Show current page if it's not already shown (i.e., not 1, 2, or 3)
  if (currentPage > FIRST_PAGES && currentPage < totalPages - 2) {
    addPage(currentPage);
  }

  // Add ellipsis before last pages if needed (only if we haven't already added one)
  const needsRightEllipsis = currentPage < totalPages - 4;
  if (needsRightEllipsis && pages[pages.length - 1] !== '...') {
    pages.push('...');
  }

  // Always show last 3 pages
  if (totalPages > FIRST_PAGES) {
    const lastPageStart = Math.max(4, totalPages - 2);
    for (let i = lastPageStart; i <= totalPages; i++) {
      addPage(i);
    }
  }

  return pages;
};
