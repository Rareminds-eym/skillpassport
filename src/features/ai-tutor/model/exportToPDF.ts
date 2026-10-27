import { getLogger } from '@/shared/config/logging';
import { loadLogo } from './logoLoader';
import { stripWorksheetMarkers } from '@/shared/utils';
import type { jsPDF } from 'jspdf';

const logger = getLogger('export-to-pdf');
interface ExportToPDFOptions { content: string; courseTitle: string; lessonTitle: string; filename: string }
const WIDTH = 210, HEIGHT = 297, MARGIN = 18, BOTTOM = 272, TEXT_WIDTH = WIDTH - MARGIN * 2;
const INK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const BLUE: [number, number, number] = [37, 99, 235];
const LINE: [number, number, number] = [226, 232, 240];

function clean(text: string): string {
  return text.replace(/<!--\s*(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*-->/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/\*\*|__([^_]+)__|`/g, '$1')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, ' - ')
    .replace(/\u2026/g, '...').replace(/\uFE0F/g, '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
}

/** Build a print-friendly A4 resource. Kept separate from saving for layout verification. */
export async function createWorksheetPDF({ content, courseTitle, lessonTitle }: Omit<ExportToPDFOptions, 'filename'>): Promise<jsPDF> {
  if (!content.trim()) throw new Error('Content is empty');
  if (content.length > 500_000) throw new Error('Content is too large to export (max 500,000 characters)');
  const { jsPDF: PDF } = await import('jspdf');
  const doc = new PDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const [logo, watermark] = await Promise.all([loadLogo('/RareMinds ISO Logo-01.png'), loadLogo()]);
  const lines = stripWorksheetMarkers(content).replace(/\r/g, '').split('\n');
  const titleIndex = lines.findIndex(line => /^\s*(?:#{1,3}\s*)?(?:\*\*)?title\s*:/i.test(line));
  const title = clean(titleIndex >= 0 ? lines[titleIndex].replace(/^\s*(?:#{1,3}\s*)?(?:\*\*)?title\s*:\s*/i, '') : courseTitle);
  doc.setProperties({ title, subject: `${courseTitle} | ${lessonTitle}`, author: 'RareMinds', creator: 'SkillPassport' });
  let y = 20;
  const decorated = new Set<number>();
  const backgrounds = new Set<number>();
  function background() {
    const page = doc.getCurrentPageInfo().pageNumber;
    if (backgrounds.has(page)) return;
    backgrounds.add(page);
    if (!watermark || watermark.naturalWidth <= 0 || watermark.naturalHeight <= 0) return;
    const aspect = watermark.naturalHeight / watermark.naturalWidth;
    // Match the assessment report's 8% center / 5% corner bulb branding, behind content.
    for (const mark of [{ x: (WIDTH - 96) / 2, y: 108, width: 96, opacity: 0.08 }, { x: MARGIN, y: 58, width: 46, opacity: 0.05 }, { x: WIDTH - MARGIN - 46, y: 58, width: 46, opacity: 0.05 }]) {
      doc.saveGraphicsState();
      try {
        doc.setGState(doc.GState({ opacity: mark.opacity }));
        doc.addImage(watermark.dataUrl, 'PNG', mark.x, mark.y, mark.width, mark.width * aspect, 'worksheet-background');
      } catch { logger.warn('Worksheet background unavailable; continuing without it'); }
      finally { doc.restoreGraphicsState(); }
    }
  }
  function font(size = 10.5, weight: 'normal' | 'bold' = 'normal', color = INK) {
    doc.setFont('helvetica', weight); doc.setFontSize(size); doc.setTextColor(...color);
  }
  function fit(text: string, maxWidth: number) {
    let result = clean(text);
    while (result && doc.getTextWidth(result) > maxWidth) result = result.slice(0, -1);
    return result.length < clean(text).length ? `${result.slice(0, -3)}...` : result;
  }
  function rule(at: number) { doc.setDrawColor(...LINE); doc.setLineWidth(0.25); doc.line(MARGIN, at, WIDTH - MARGIN, at); }
  function continuation() {
    const page = doc.getCurrentPageInfo().pageNumber;
    if (decorated.has(page)) return;
    decorated.add(page);
    font(8, 'normal', MUTED); doc.text(fit(title, TEXT_WIDTH - 55), MARGIN, 19);
    doc.setTextColor(...BLUE); doc.text('RAREMINDS / SKILLPASSPORT', WIDTH - MARGIN, 19, { align: 'right' });
    rule(23);
  }
  function newPage() { doc.addPage(); background(); continuation(); y = 33; }
  function ensure(space: number) { if (y + space > BOTTOM) newPage(); }
  function paragraph(text: string, options: { size?: number; bold?: boolean; indent?: number; after?: number; keep?: number } = {}) {
    const size = options.size || 10.5, indent = options.indent || 0, height = size * 0.3528 * 1.5;
    font(size, options.bold ? 'bold' : 'normal');
    const wrapped = doc.splitTextToSize(clean(text), TEXT_WIDTH - indent) as string[];
    ensure(Math.min(wrapped.length * height + (options.keep || 0), BOTTOM - 33));
    for (const line of wrapped) { ensure(height); font(size, options.bold ? 'bold' : 'normal'); doc.text(line, MARGIN + indent, y); y += height; }
    y += options.after ?? 1.5;
  }
  function section(text: string) {
    ensure(20); y += 4;
    font(11, 'bold');
    const wrapped = doc.splitTextToSize(clean(text), TEXT_WIDTH) as string[];
    for (const line of wrapped) { ensure(12); font(11, 'bold'); doc.text(line, MARGIN, y); y += 5.8; }
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.35); doc.line(MARGIN, y, WIDTH - MARGIN, y); y += 6;
  }

  // Small brand mark, one document title, and useful metadata instead of a cover page.
  background();
  let logoAdded = false;
  if (logo && logo.naturalWidth > 0 && logo.naturalHeight > 0) {
    const scale = Math.min(39 / logo.naturalWidth, 12 / logo.naturalHeight);
    try { doc.addImage(logo.dataUrl, 'PNG', MARGIN, 13, logo.naturalWidth * scale, logo.naturalHeight * scale); logoAdded = true; }
    catch { logger.warn('PDF logo unavailable; using text branding'); }
  }
  if (!logoAdded) { font(12, 'bold', BLUE); doc.text('RareMinds', MARGIN, 22); }
  font(8, 'bold', BLUE); doc.text(/lesson plan/i.test(lessonTitle) ? 'LESSON PLAN' : 'COURSE WORKSHEET', WIDTH - MARGIN, 20, { align: 'right' });
  rule(29); y = 39;
  paragraph(title, { size: 17, bold: true, after: 0.5 });
  const courseLabel = clean(courseTitle).replace(/\s+worksheet$/i, '');
  const level = /\b(beginner|intermediate|advanced)\b/i.exec(lessonTitle)?.[1];
  const subtitle = [courseLabel !== title ? courseLabel : '', level ? `${level[0].toUpperCase()}${level.slice(1).toLowerCase()}` : clean(lessonTitle)].filter(Boolean).join('  /  ');
  font(9, 'normal', MUTED);
  for (const line of doc.splitTextToSize(subtitle, TEXT_WIDTH) as string[]) { ensure(5); font(9, 'normal', MUTED); doc.text(line, MARGIN, y); y += 5; }
  y += 3;
  if (/worksheet|quiz|assessment/i.test(`${courseTitle} ${lessonTitle}`)) {
    ensure(14); font(8.5, 'normal', MUTED);
    doc.text('Name', MARGIN, y); doc.text('Date', MARGIN + 120, y);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3);
    doc.line(MARGIN + 12, y + 0.5, MARGIN + 105, y + 0.5); doc.line(MARGIN + 130, y + 0.5, WIDTH - MARGIN, y + 0.5);
    y += 11;
  }
  decorated.add(1);

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index].trim(), text = clean(raw);
    if (index === titleIndex || !text && /<!--/.test(raw)) continue;
    if (!text) { y = Math.min(y + 2, BOTTOM); continue; }
    if (/^[-*_]{3,}$/.test(text)) { ensure(7); rule(y); y += 6; continue; }
    if (text === 'RareMinds' || text.toLowerCase() === title.toLowerCase()) continue;

    if (/^\|/.test(raw) && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|\s*$/.test(lines[index + 1])) {
      const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(clean);
      const head = cells(raw), body: string[][] = []; index += 2;
      while (index < lines.length && /^\s*\|/.test(lines[index])) { body.push(cells(lines[index])); index++; }
      index--;
      ensure(20);
      const { default: autoTable } = await import('jspdf-autotable');
      autoTable(doc, { startY: y, head: [head], body, theme: 'plain', margin: { left: MARGIN, right: MARGIN, top: 32, bottom: HEIGHT - BOTTOM },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, textColor: INK, lineColor: LINE, lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: [248, 250, 252], textColor: INK, fontStyle: 'bold' },
        willDrawPage: () => { background(); if (doc.getCurrentPageInfo().pageNumber > 1) continuation(); },
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
      continue;
    }
    const heading = /^#{1,6}\s+(.+)$/.exec(text);
    if (heading || /^(?:answer key|sample answers|solutions|word bank|questions|instructions|grading rubric|scoring guide)\s*:?$/i.test(text)) { section(heading ? heading[1] : text.replace(/:$/, '')); continue; }
    const numbered = /^(\d+)[.)]\s+(.+)$/.exec(text);
    if (numbered) {
      const height = 5.55;
      font(); const wrapped = doc.splitTextToSize(numbered[2], TEXT_WIDTH - 9) as string[];
      let optionHeight = 0;
      for (let next = index + 1; next < lines.length; next++) {
        const candidate = clean(lines[next]);
        if (!candidate) { optionHeight += 2; continue; }
        if (!/^[A-Da-d][.)]\s+/.test(candidate)) break;
        font(10); optionHeight += (doc.splitTextToSize(candidate, TEXT_WIDTH - 9) as string[]).length * 5.3 + 0.5;
      }
      ensure(Math.min(wrapped.length * height + optionHeight + 4, BOTTOM - 33));
      font(9.5, 'bold', BLUE); doc.text(`${numbered[1]}.`, MARGIN, y);
      for (const line of wrapped) { ensure(height); font(); doc.text(line, MARGIN + 9, y); y += height; }
      y += 3;
      continue;
    }
    const option = /^([A-Da-d])[.)]\s+(.+)$/.exec(text);
    if (option) { paragraph(`${option[1].toUpperCase()}.  ${option[2]}`, { size: 10, indent: 9, after: 0.5 }); continue; }
    const bullet = /^[-*•]\s+(.+)$/.exec(text);
    if (bullet) { ensure(7); doc.setFillColor(...MUTED); doc.circle(MARGIN + 1.5, y - 1, 0.55, 'F'); paragraph(bullet[1], { indent: 6, after: 1 }); continue; }
    const label = /^(Learning Objective|Learning Objectives|Instructions|Duration|Grade|Materials|Objective)\s*:\s*(.+)$/i.exec(text);
    if (label) {
      font(9.5); const wrapped = doc.splitTextToSize(label[2], TEXT_WIDTH - 10) as string[];
      const cardHeight = 11 + wrapped.length * 5;
      if (cardHeight <= BOTTOM - 33) {
        ensure(cardHeight + 4);
        doc.setFillColor(248, 250, 255); doc.roundedRect(MARGIN, y - 3, TEXT_WIDTH, cardHeight, 1.5, 1.5, 'F');
        font(7.5, 'bold', BLUE); doc.text(label[1].toUpperCase(), MARGIN + 4, y + 1); y += 7;
        for (const line of wrapped) { font(9.5); doc.text(line, MARGIN + 4, y); y += 5; }
        y += 5;
      } else paragraph(`${label[1]}: ${label[2]}`, { size: 9.5, after: 3 });
      continue;
    }
    paragraph(text, { bold: /^\*\*[^*]+\*\*\s*$/.test(raw) });
  }

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page); rule(280);
    font(8, 'normal', MUTED); doc.text(fit(`RareMinds SkillPassport | ${courseTitle.replace(/\s+worksheet$/i, '')}`, TEXT_WIDTH - 35), MARGIN, 286);
    doc.text(`${page} / ${total}`, WIDTH - MARGIN, 286, { align: 'right' });
  }
  return doc;
}

export async function exportToPDF({ filename, ...options }: ExportToPDFOptions): Promise<void> {
  try {
    const doc = await createWorksheetPDF(options);
    doc.save(`${filename}.pdf`);
    logger.info('PDF export successful', { filename, pages: doc.getNumberOfPages() });
  } catch (error) {
    logger.error('PDF export failed', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error('Failed to export PDF');
  }
}
