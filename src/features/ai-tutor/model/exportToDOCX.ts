import { saveAs } from 'file-saver';
import { getLogger } from '@/shared/config';
import { loadLogo, WATERMARK_CONFIG } from './logoLoader';
import { parseMarkdownLines, type ParsedLine } from '@/shared/utils';
import type {
  IParagraphOptions,
  IRunOptions,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  UnderlineType,
} from 'docx';

const logger = getLogger('export-to-docx');

interface ExportToDOCXOptions {
  content: string;
  courseTitle: string;
  lessonTitle: string;
  filename: string;
}

interface DocxConstructors {
  Paragraph: new (_options: IParagraphOptions) => Paragraph;
  TextRun: new (_options: IRunOptions) => TextRun;
  HeadingLevel: typeof HeadingLevel;
  BorderStyle: typeof BorderStyle;
  ShadingType: typeof ShadingType;
  UnderlineType: typeof UnderlineType;
}

/**
 * Render parsed markdown lines to DOCX paragraphs
 */
async function renderParsedLinesToDocx(
  parsedLines: ParsedLine[],
  docxConstructors: DocxConstructors
): Promise<Paragraph[]> {
  const {
    Paragraph,
    TextRun,
    HeadingLevel,
    BorderStyle,
    ShadingType,
    UnderlineType,
  } = docxConstructors;

  const paragraphs: Paragraph[] = [];

  for (const line of parsedLines) {
    switch (line.type) {
      case 'blank':
        paragraphs.push(
          new Paragraph({
            text: '',
            spacing: { after: 100 },
          })
        );
        break;

      case 'separator':
        paragraphs.push(
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: 'DDDDDD',
                space: 1,
              },
            },
            spacing: { after: 160 },
            children: [],
          })
        );
        break;

      case 'answer_key':
        paragraphs.push(
          new Paragraph({
            shading: {
              fill: 'F0F0F0',
              type: ShadingType.CLEAR,
            },
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Answer Key',
                bold: true,
                size: 26,
                color: '444444',
              }),
            ],
          })
        );
        break;

      case 'blank_line': {
        const parts = line.raw.split('__________');
        const runs: TextRun[] = [];

        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) {
            runs.push(
              new TextRun({
                text: parts[i],
                size: 22,
              })
            );
          }
          if (i < parts.length - 1) {
            runs.push(
              new TextRun({
                text: '          ', // spaces
                underline: {
                  type: UnderlineType.SINGLE,
                  color: '555555',
                },
                size: 22,
              })
            );
          }
        }

        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 80 },
          })
        );
        break;
      }

      case 'heading':
        if (line.level === 1) {
          paragraphs.push(
            new Paragraph({
              text: line.text,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 },
            })
          );
        } else if (line.level === 2) {
          paragraphs.push(
            new Paragraph({
              text: line.text,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            })
          );
        } else if (line.level === 3) {
          paragraphs.push(
            new Paragraph({
              text: line.text,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          );
        }
        break;

      case 'bold': {
        const runs: TextRun[] = [];
        for (const segment of line.segments) {
          runs.push(
            new TextRun({
              text: segment.text,
              bold: segment.bold,
            })
          );
        }
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 100 },
          })
        );
        break;
      }

      case 'bullet':
        paragraphs.push(
          new Paragraph({
            text: line.text,
            bullet: {
              level: 0,
            },
            spacing: { after: 80 },
          })
        );
        break;

      case 'numbered':
        paragraphs.push(
          new Paragraph({
            text: line.text,
            numbering: {
              reference: 'default-numbering',
              level: 0,
            },
            spacing: { before: 120, after: 80 },
          })
        );
        break;

      case 'normal':
        paragraphs.push(
          new Paragraph({
            text: line.text,
            spacing: { after: 100 },
          })
        );
        break;
    }
  }

  return paragraphs;
}

/**
 * Export content to DOCX with proper formatting
 * Uses dynamic import to reduce initial bundle size
 */
export async function exportToDOCX({
  content,
  courseTitle,
  lessonTitle,
  filename,
}: ExportToDOCXOptions): Promise<void> {
  try {
    if (!content || !content.trim()) {
      throw new Error('Content is empty');
    }

    if (content.length > 500_000) {
      throw new Error('Content is too large to export (max 500,000 characters)');
    }

    // Lazy load docx library - reduces initial bundle by ~150KB
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      AlignmentType,
      ImageRun,
      Header,
      BorderStyle,
      Footer,
      PageNumber,
      HeadingLevel,
      ShadingType,
      UnderlineType,
    } = await import('docx');

    const sections: Paragraph[] = [];

    // Add branding logo at the top
    const logo = await loadLogo();
    if (logo) {
      try {
        // Max logo dimensions in pixels (96px = 1 inch)
        const MAX_LOGO_WIDTH_PX = 80;   // ~0.83 inch — small, professional
        const MAX_LOGO_HEIGHT_PX = 32;  // hard cap on height
        const aspectRatio = logo.naturalHeight / logo.naturalWidth;
        const rawWidth = Math.min(MAX_LOGO_WIDTH_PX, logo.naturalWidth);
        const rawHeight = rawWidth * aspectRatio;
        const finalHeightPx = Math.min(rawHeight, MAX_LOGO_HEIGHT_PX);
        const finalWidthPx = Math.round(finalHeightPx / aspectRatio);
        
        // Convert pixels to EMUs (English Metric Units) for DOCX
        const PX_TO_EMU = 9525;
        
        sections.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 }, // tight spacing below logo
            children: [
              new ImageRun({
                data: logo.arrayBuffer,
                type: 'png',
                transformation: {
                  width: finalWidthPx * PX_TO_EMU,
                  height: finalHeightPx * PX_TO_EMU,
                },
              }),
            ],
          })
        );
      } catch (err) {
        logger.warn('Failed to add logo to DOCX', { 
          error: err instanceof Error ? err.message : String(err) 
        });
        // Continue without logo if it fails
      }
    }

    // Add a thin border line after logo
    sections.push(
      new Paragraph({
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 4,
            color: 'DDDDDD', // light gray rule
            space: 1,
          },
        },
        spacing: { after: 160 },
        children: [],
      })
    );

    // Header - Course Title
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: courseTitle,
            bold: true,
            size: 32,          // 16pt — slightly reduced
            color: '1A1A1A',   // near-black
            font: 'Arial',
          }),
        ],
        spacing: { after: 120 },
      })
    );

    // Lesson Title
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: lessonTitle,
            size: 26, // 13pt — professional sizing
            color: '1A1A1A',
            font: 'Arial',
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // Generated Date
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            size: 20, // 10pt
            color: '666666',
            font: 'Arial',
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Content
    const parsedLines = parseMarkdownLines(content);
    const contentParagraphs = await renderParsedLinesToDocx(parsedLines, {
      Paragraph,
      TextRun,
      HeadingLevel,
      BorderStyle,
      ShadingType,
      UnderlineType,
    });
    sections.push(...contentParagraphs);

    // Create watermark paragraph for header
    const watermarkParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: WATERMARK_CONFIG.text,
          bold: true,
          size: 72,        // 36pt
          color: 'E0E0E0', // lighter gray
          font: 'Arial',
        }),
      ],
      frame: {
        position: { x: 2400, y: 4800 }, // better centered
        width: 6000,
        height: 1800,
        anchor: {
          horizontal: 'page',
          vertical: 'page',
        },
        type: 'absolute',
      },
    });

    // Create document with watermark in header and page numbers in footer
    const doc = new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [watermarkParagraph],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: ['Page ', PageNumber.CURRENT],
                      size: 18,
                      color: '999999',
                    }),
                    new TextRun({
                      children: [' of ', PageNumber.TOTAL_PAGES],
                      size: 18,
                      color: '999999',
                    }),
                  ],
                }),
              ],
            }),
          },
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: sections,
        },
      ],
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.LEFT,
              },
            ],
          },
        ],
      },
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);

    logger.info('DOCX export successful', { filename });
  } catch (err) {
    logger.error('DOCX export failed', err instanceof Error ? err : new Error(String(err)));
    throw err instanceof Error ? err : new Error('Failed to export DOCX');
  }
}
