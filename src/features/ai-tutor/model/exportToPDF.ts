import { getLogger } from '@/shared/config';
import { loadLogo, WATERMARK_CONFIG } from './logoLoader';
import { parseMarkdownLines } from '@/shared/utils';
import type { jsPDF } from 'jspdf';

const logger = getLogger('export-to-pdf');

interface ExportToPDFOptions {
  content: string;
  courseTitle: string;
  lessonTitle: string;
  filename: string;
}

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const LINE_HEIGHT = 7;
const MAX_WIDTH = PAGE_WIDTH - (MARGIN * 2);

/**
 * Add watermark to all pages in the PDF
 * GState must be passed from the caller since it's part of the jsPDF dynamic import
 */
function addWatermark(doc: jsPDF, GStateConstructor: new (options: { opacity: number }) => unknown): void {
  const totalPages = doc.getNumberOfPages();
  
  // Hoist GState objects outside the loop
  const dimState = new GStateConstructor({ opacity: 0.15 });
  const fullState = new GStateConstructor({ opacity: 1 });
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Apply watermark state
    doc.setFontSize(55);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(210, 210, 210);
    
    // Apply opacity using setGState
    (doc as unknown as { setGState: (state: unknown) => void }).setGState(dimState);
    
    // Center of page
    const centerX = PAGE_WIDTH / 2;
    const centerY = PAGE_HEIGHT / 2;
    
    // Draw diagonal watermark text
    doc.text(WATERMARK_CONFIG.text, centerX, centerY, {
      align: 'center',
      angle: WATERMARK_CONFIG.angle,
    });
    
    // Restore ALL state properties
    (doc as unknown as { setGState: (state: unknown) => void }).setGState(fullState);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setDrawColor(0, 0, 0);
  }
}

/**
 * Split text into lines that fit within the page width
 * 
 * This function breaks down a text string into multiple lines based on word boundaries,
 * ensuring each line fits within the specified maximum width when rendered in the PDF.
 * 
 * @param doc - A jsPDF instance used to measure text width via `doc.getTextWidth()`
 * @param text - The text string to split into lines
 * @param maxWidth - The maximum width (in mm) that each line can occupy
 * @returns An array of strings, where each string represents a line that fits within maxWidth
 */
function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = doc.getTextWidth(testLine);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Export content to PDF with proper formatting
 * Uses dynamic import to reduce initial bundle size
 */
export async function exportToPDF({
  content,
  courseTitle,
  lessonTitle,
  filename,
}: ExportToPDFOptions): Promise<void> {
  try {
    if (!content || !content.trim()) {
      throw new Error('Content is empty');
    }

    if (content.length > 500_000) {
      throw new Error('Content is too large to export (max 500,000 characters)');
    }

    // Lazy load jsPDF - reduces initial bundle by ~200KB
    const jsPDFModule = await import('jspdf');
    const { jsPDF } = jsPDFModule;
    
    // GState is needed for watermark opacity
    const GState = (jsPDFModule as unknown as { GState?: new (options: { opacity: number }) => unknown }).GState;
    
    if (!GState) {
      throw new Error('jsPDF GState not available');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Use state object to track y position
    const state = { y: MARGIN };

    // Helper to check if we need a new page
    const checkPageBreak = (requiredSpace: number): void => {
      if (state.y + requiredSpace > PAGE_HEIGHT - MARGIN) {
        doc.addPage();
        state.y = MARGIN;
      }
    };

    // Add branding logo at the top
    const logo = await loadLogo();
    if (logo) {
      try {
        const MAX_LOGO_WIDTH = 25;   // mm — small, professional
        const MAX_LOGO_HEIGHT = 10;  // mm — hard cap on height
        const aspectRatio = logo.naturalHeight / logo.naturalWidth;
        const logoWidth = Math.min(MAX_LOGO_WIDTH, logo.naturalWidth * 0.264); // px to mm
        const logoHeight = logoWidth * aspectRatio;
        
        // If height still exceeds cap, scale width down to match
        const finalLogoHeight = Math.min(logoHeight, MAX_LOGO_HEIGHT);
        const finalLogoWidth = finalLogoHeight / aspectRatio;
        
        // Align logo to the left at top margin
        const logoX = MARGIN;
        const logoY = MARGIN;
        
        doc.addImage(logo.dataUrl, 'PNG', logoX, logoY, finalLogoWidth, finalLogoHeight);
        state.y = MARGIN + finalLogoHeight + 3; // tight spacing after logo
      } catch (err) {
        logger.warn('Failed to add logo to PDF', { error: err instanceof Error ? err.message : String(err) });
        // Continue without logo if it fails
      }
    }

    // Add a thin header rule line after logo
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, state.y, PAGE_WIDTH - MARGIN, state.y);
    state.y += 6;

    // Header - Course Title
    doc.setFontSize(16); // slightly smaller looks cleaner
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // near-black, not pure black
    const courseTitleLines = splitTextToLines(doc, courseTitle, MAX_WIDTH);
    for (const line of courseTitleLines) {
      checkPageBreak(LINE_HEIGHT);
      doc.text(line, MARGIN, state.y);
      state.y += LINE_HEIGHT;
    }

    state.y += 3;

    // Lesson Title
    doc.setFontSize(13); // professional sizing
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const lessonTitleLines = splitTextToLines(doc, lessonTitle, MAX_WIDTH);
    for (const line of lessonTitleLines) {
      checkPageBreak(LINE_HEIGHT);
      doc.text(line, MARGIN, state.y);
      state.y += LINE_HEIGHT;
    }

    state.y += 2;

    // Generated Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    checkPageBreak(LINE_HEIGHT);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, MARGIN, state.y);
    state.y += LINE_HEIGHT + 5;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, state.y, PAGE_WIDTH - MARGIN, state.y);
    state.y += 8;

    // Content
    doc.setTextColor(0, 0, 0);
    const parsedContent = parseMarkdownLines(content);

    for (const item of parsedContent) {
      switch (item.type) {
        case 'blank':
          state.y += LINE_HEIGHT * 0.5;
          break;

        case 'separator':
          checkPageBreak(6);
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(MARGIN, state.y, PAGE_WIDTH - MARGIN, state.y);
          state.y += 6;
          break;

        case 'answer_key':
          checkPageBreak(14);
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(MARGIN, state.y - 4, MAX_WIDTH, 10, 2, 2, 'F');
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text('Answer Key', MARGIN + 3, state.y + 3);
          state.y += 14;
          doc.setTextColor(0, 0, 0);
          break;

        case 'blank_line': {
          checkPageBreak(LINE_HEIGHT);
          const lineText = item.raw;
          const parts = lineText.split('__________');
          let xPos = MARGIN;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              doc.text(parts[i], xPos, state.y);
              xPos += doc.getTextWidth(parts[i]);
            }
            if (i < parts.length - 1) {
              // Draw underline instead of underscores
              doc.setDrawColor(80, 80, 80);
              doc.setLineWidth(0.4);
              doc.line(xPos, state.y, xPos + 30, state.y);
              xPos += 32;
            }
          }
          state.y += LINE_HEIGHT;
          break;
        }

        case 'heading':
          if (item.level === 1) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            checkPageBreak(LINE_HEIGHT + 4);
            state.y += 4;
          } else if (item.level === 2) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            checkPageBreak(LINE_HEIGHT + 3);
            state.y += 3;
          } else if (item.level === 3) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            checkPageBreak(LINE_HEIGHT + 2);
            state.y += 2;
          }
          
          {
            const lines = splitTextToLines(doc, item.text, MAX_WIDTH);
            for (const line of lines) {
              checkPageBreak(LINE_HEIGHT);
              doc.text(line, MARGIN, state.y);
              state.y += LINE_HEIGHT;
            }
            state.y += 2;
          }
          break;

        case 'bold': {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          
          const boldText = item.segments.map(seg => seg.text).join('');
          const lines = splitTextToLines(doc, boldText, MAX_WIDTH);
          for (const line of lines) {
            checkPageBreak(LINE_HEIGHT);
            doc.text(line, MARGIN, state.y);
            state.y += LINE_HEIGHT;
          }
          break;
        }

        case 'bullet': {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          const lines = splitTextToLines(doc, '• ' + item.text, MAX_WIDTH);
          for (const line of lines) {
            checkPageBreak(LINE_HEIGHT);
            doc.text(line, MARGIN, state.y);
            state.y += LINE_HEIGHT;
          }
          break;
        }

        case 'numbered': {
          checkPageBreak(LINE_HEIGHT + 3);
          state.y += 3;
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 20, 20);
          
          const lines = splitTextToLines(doc, `${item.n}. ${item.text}`, MAX_WIDTH);
          for (const line of lines) {
            checkPageBreak(LINE_HEIGHT);
            doc.text(line, MARGIN, state.y);
            state.y += LINE_HEIGHT;
          }
          break;
        }

        case 'normal': {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          const lines = splitTextToLines(doc, item.text, MAX_WIDTH);
          for (const line of lines) {
            checkPageBreak(LINE_HEIGHT);
            doc.text(line, MARGIN, state.y);
            state.y += LINE_HEIGHT;
          }
          break;
        }
      }
    }

    // Add watermark to all pages
    addWatermark(doc, GState);

    // Add page numbers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        PAGE_WIDTH / 2,
        PAGE_HEIGHT - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`${filename}.pdf`);
    
    logger.info('PDF export successful', { filename, pages: doc.getNumberOfPages() });
  } catch (err) {
    logger.error('PDF export failed', err instanceof Error ? err : new Error(String(err)));
    throw err instanceof Error ? err : new Error('Failed to export PDF');
  }
}
