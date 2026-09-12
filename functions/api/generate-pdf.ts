import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { PDFDocument, rgb } from 'pdf-lib';

import { getContextUser, withAuth } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { getServiceClient } from '../lib/supabase';

const logger = createLogger('generate-pdf');

const REPORT_TYPE_SKILL_ASSESSMENT = 'skill_assessment';
const REPORT_TITLE_CAREER_ASSESSMENT = 'Career Assessment Report';

export const onRequestPost = withAuth(async (context: AuthenticatedContext): Promise<Response> => {
  const env = context.env as Record<string, string>;
  const authUser = getContextUser(context);

  let body: { html?: string; title?: string };
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { html, title } = body;
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Missing html' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let docTitle = title?.trim();
  if (!docTitle && html) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]?.trim()) {
      docTitle = titleMatch[1].trim();
    }
  }
  if (!docTitle) {
    docTitle = 'Career-Assessment-Report';
  }

  const cfApiToken = env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = env.CLOUDFLARE_ACCOUNT_ID;

  if (!cfApiToken) {
    logger.error('[generate-pdf] CLOUDFLARE_API_TOKEN not configured');
    return new Response(JSON.stringify({ error: 'PDF service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!cfAccountId) {
    logger.error('[generate-pdf] CLOUDFLARE_ACCOUNT_ID not configured');
    return new Response(JSON.stringify({ error: 'PDF service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Call Cloudflare Browser Run REST API to generate PDF ──
  let pdfBuffer: ArrayBuffer | undefined;
  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/browser-rendering/pdf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          pdfOptions: {
            format: 'a4',
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: true,
            headerTemplate: `
              <div style="font-size: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; width: 100%; text-align: center; margin: 0; padding: 0;">
                Career Assessment Report &bull; Confidential
              </div>
            `,
            footerTemplate: `
              <div style="font-size: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #94a3b8; width: 100%; text-align: center; margin: 0; padding: 0;">
                &copy; 2024 Skill Passport. All rights reserved. | Page <span class="pageNumber"></span>
              </div>
            `,
            margin: {
              top: '12mm',
              bottom: '12mm',
              left: '15mm',
              right: '15mm',
            },
          },
          gotoOptions: {
            waitUntil: 'networkidle0',
            timeout: 30000,
          },
        }),
      }
    );

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      logger.error('[generate-pdf] Cloudflare Browser Run API error', {
        status: cfRes.status,
        body: errText,
      });
      return new Response(JSON.stringify({ error: 'PDF generation failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    pdfBuffer = await cfRes.arrayBuffer();

    // ── Mask out header and footer ONLY on Page 1 (Cover Page) ──────────
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Set PDF Document Title metadata so PDF readers (like Adobe Acrobat) show learner name instead of about:blank
      // Length-capped to 255 chars to prevent potential ReDoS via pdf-lib's internal regex processing
      if (docTitle && docTitle.length < 256) {
        pdfDoc.setTitle(docTitle);
      }

      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Mask top header area on Page 1 (top 30 points = ~10.5mm)
        firstPage.drawRectangle({
          x: 0,
          y: height - 30,
          width: width,
          height: 30,
          color: rgb(1, 1, 1),
        });

        // Mask bottom footer area on Page 1 (bottom 23 points = ~8mm)
        firstPage.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: 23,
          color: rgb(1, 1, 1),
        });

        const modifiedBytes = await pdfDoc.save();
        pdfBuffer = modifiedBytes.buffer.slice(
          modifiedBytes.byteOffset,
          modifiedBytes.byteOffset + modifiedBytes.byteLength
        ) as ArrayBuffer;
      }
    } catch (maskErr: unknown) {
      logger.error('[generate-pdf] Failed to mask cover page header/footer', { error: maskErr instanceof Error ? maskErr.message : String(maskErr) });
    }

  } catch (err: unknown) {
    logger.error('[generate-pdf] Cloudflare Browser Run fetch failed', { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: 'PDF service unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Log the report — only reached after PDF generated successfully ──
  try {
    const supabase = getServiceClient(env as any);

    const { data: learnerRow } = await supabase
      .from('learners')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (learnerRow?.id) {
      const now = new Date();
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const academicYear = `${year}-${String(year + 1).slice(2)}`;

      const { error: insertError } = await supabase.from('learner_reports').insert({
        learner_id: learnerRow.id,
        report_type: REPORT_TYPE_SKILL_ASSESSMENT,
        title: REPORT_TITLE_CAREER_ASSESSMENT,
        academic_year: academicYear,
        data: {},
        generated_by: authUser.id,
        generated_date: now.toISOString(),
      });

      if (insertError) {
        logger.error('[generate-pdf] learner_reports insert failed', {
          error: insertError.message,
        });
        return new Response(JSON.stringify({ error: 'Failed to record report log' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (err: unknown) {
    logger.error('[generate-pdf] Failed to log report', { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: 'Failed to record report log' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Return PDF binary to frontend ──────────────────────────────────
  if (!pdfBuffer) {
    logger.error('[generate-pdf] pdfBuffer is undefined — this should not happen');
    return new Response(JSON.stringify({ error: 'PDF generation failed unexpectedly' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const downloadFilename = docTitle
    ? (docTitle.endsWith('.pdf') ? docTitle : `${docTitle}.pdf`)
    : 'Career-Assessment-Report.pdf';

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
    },
  });
});
