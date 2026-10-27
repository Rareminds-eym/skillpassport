# Assessment-style worksheet PDF template

Date: 27 October 2026.

Updated the worksheet PDF to use the career assessment report's branding: a faint red bulb in the center (8% opacity), two smaller corner bulbs (5%), and blue section rules. The full Rareminds wordmark replaces the standalone header bulb. All content follows consistent 18 mm side margins on A4 pages.

The title uses a compact 17 pt style with course/difficulty metadata beneath it, without repeated worksheet labels. Learning objectives and instructions have understated blue-tinted blocks. Question numbers, wrapped text and answer options follow a shared grid. Questions stay with their multiple-choice options when the group fits on a page. Name/date fields, continuation headers and page counters remain consistent. Internal generation markers are removed from the presentation. Asset loading failure falls back to text branding without blocking the download.

Validation: eight focused PDF/export/download tests passed and lint passed for the renderer, logo loader and PDF tests. Generated the three-page `27102026_worksheet-template-preview.pdf` with the actual wordmark and bulb assets, rendered its first/last pages for visual inspection, and checked every text span with PyMuPDF: zero spans outside the expected page bounds. The sample exercises long questions, multiple-choice options, answer blanks, page breaks and a rubric table.

Affected renderer: src/features/ai-tutor/model/exportToPDF.ts. Learner downloads and educator PDF export actions both use this template. Download a new PDF to see the updated design; files already downloaded do not change. Word exports are unchanged.
