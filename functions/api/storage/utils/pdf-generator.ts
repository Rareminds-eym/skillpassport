/**
 * Server-side Payment Receipt PDF Generator
 *
 * Uses pdf-lib (runs in Cloudflare Workers — no DOM, no browser APIs).
 * Produces the exact same design as the frontend generateReceipt():
 *   - Company logo (top-left)
 *   - Company details (top-right)
 *   - Centred "PAYMENT RECEIPT" title in brand blue
 *   - Two-column transaction details
 *   - Highlighted amount box
 *   - Customer details
 *   - Subscription details
 *   - Watermark logo (centre, 10% opacity)
 *   - Footer with support email and generation timestamp
 *
 * All colours match the frontend exactly:
 *   Brand blue  #2663EB  → rgb(38, 99, 235)
 *   Dark text   #1F2937  → rgb(31, 41, 55)
 *   Label grey  #4B5563  → rgb(75, 85, 99)
 *   Muted grey  #6B7280  → rgb(107, 114, 128)
 *   Light grey  #9CA3AF  → rgb(156, 163, 175)
 *   Success grn #22C55E  → rgb(34, 197, 94)
 *   Box bg      #F8FAFC  → rgb(248, 250, 252)
 *   Box border  #E2E8F0  → rgb(226, 232, 240)
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReceiptTransaction {
  payment_id: string;
  order_id?: string;
  amount: number;          // in rupees (not paise)
  currency?: string;
  payment_method?: string;
  payment_timestamp?: string;
  status?: string;
}

export interface ReceiptSubscription {
  plan_type?: string;
  plan_name?: string;
  billing_cycle?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

export interface ReceiptUser {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ReceiptCompany {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface ReceiptData {
  transaction: ReceiptTransaction;
  subscription?: ReceiptSubscription | null;
  user: ReceiptUser;
  company: ReceiptCompany;
  generatedAt?: string;
  /** Optional: pre-fetched logo bytes (PNG). If omitted, logo section is text-only. */
  logoBytes?: Uint8Array;
  /** Optional: pre-fetched watermark bytes (PNG). If omitted, watermark is skipped. */
  watermarkBytes?: Uint8Array;
}

// ─── Colour helpers ─────────────────────────────────────────────────────────

const C = {
  blue:        rgb(38/255,  99/255,  235/255),
  darkText:    rgb(31/255,  41/255,  55/255),
  labelGrey:   rgb(75/255,  85/255,  99/255),
  mutedGrey:   rgb(107/255, 114/255, 128/255),
  lightGrey:   rgb(156/255, 163/255, 175/255),
  successGreen:rgb(34/255,  197/255, 94/255),
  boxBg:       rgb(248/255, 250/255, 252/255),
  boxBorder:   rgb(226/255, 232/255, 240/255),
  white:       rgb(1, 1, 1),
  divider:     rgb(226/255, 232/255, 240/255),
};

// ─── Unit conversion ────────────────────────────────────────────────────────
// pdf-lib uses points (1 pt = 1/72 inch). A4 = 595.28 × 841.89 pt.
// We work in mm then convert: 1 mm = 2.8346 pt.
const mm = (v: number) => v * 2.8346;

// ─── Amount formatter ───────────────────────────────────────────────────────
function formatINR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

// ─── Date formatter ─────────────────────────────────────────────────────────
function fmtDate(d?: string | null): string {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
}

// ─── Main generator ─────────────────────────────────────────────────────────

/**
 * Generate a payment receipt PDF.
 * Returns the raw PDF bytes (Uint8Array) — ready to upload to R2.
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Uint8Array> {
  const { transaction, subscription, user, company, generatedAt, logoBytes, watermarkBytes } = data;

  const doc = await PDFDocument.create();
  const page = doc.addPage([mm(210), mm(297)]); // A4

  const { width, height } = page.getSize();
  const margin = mm(20);
  const contentWidth = width - 2 * margin;

  // Embed standard fonts (Helvetica family — matches jsPDF default)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── Watermark (drawn first so it sits behind all content) ──────────────
  if (watermarkBytes) {
    try {
      const wmImg = await doc.embedPng(watermarkBytes);
      const wmSize = mm(80);
      const wmX = (width  - wmSize) / 2;
      const wmY = (height - wmSize) / 2;
      page.drawImage(wmImg, {
        x: wmX, y: wmY,
        width: wmSize, height: wmSize,
        opacity: 0.08,
      });
    } catch (err) {
      console.warn('[GenerateReceiptPDF] Watermark embed failed (non-critical):', err);
    }
  }

  // ── Cursor (y counts DOWN from top in our helper, pdf-lib counts UP) ───
  // We track yFromTop and convert: pdfY = height - yFromTop
  let yFromTop = mm(20);

  const pdfY = (y: number) => height - y;

  // ── Helper: draw text ───────────────────────────────────────────────────
  const text = (
    str: string,
    x: number,
    y: number,
    opts: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {}
  ) => {
    const font = opts.bold ? fontBold : fontRegular;
    const size = opts.size ?? 10;
    const color = opts.color ?? C.darkText;
    const safeStr = String(str ?? '');

    let drawX = x;
    if (opts.align === 'center') {
      const w = font.widthOfTextAtSize(safeStr, size);
      drawX = x - w / 2;
    } else if (opts.align === 'right') {
      const w = font.widthOfTextAtSize(safeStr, size);
      drawX = x - w;
    }

    page.drawText(safeStr, {
      x: drawX,
      y: pdfY(y),
      size,
      font,
      color,
      maxWidth: opts.maxWidth,
    });
  };

  // ── Helper: horizontal rule ─────────────────────────────────────────────
  const hRule = (y: number, color = C.divider, thickness = 0.5) => {
    page.drawLine({
      start: { x: margin, y: pdfY(y) },
      end:   { x: margin + contentWidth, y: pdfY(y) },
      thickness,
      color,
    });
  };

  // ── Helper: filled rect ─────────────────────────────────────────────────
  const rect = (
    x: number, y: number, w: number, h: number,
    fill?: ReturnType<typeof rgb>,
    stroke?: ReturnType<typeof rgb>,
    strokeWidth = 0.3,
    opacity = 1
  ) => {
    if (fill) {
      page.drawRectangle({ x, y: pdfY(y + h), width: w, height: h, color: fill, opacity });
    }
    if (stroke) {
      page.drawRectangle({ x, y: pdfY(y + h), width: w, height: h, borderColor: stroke, borderWidth: strokeWidth, opacity });
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // HEADER — Logo (left) + Company details (right)
  // ════════════════════════════════════════════════════════════════════════
  const headerHeight = mm(25);

  if (logoBytes) {
    try {
      // pdf-lib supports PNG and JPEG only — WebP will throw and fall through to text
      let logoImg;
      try {
        logoImg = await doc.embedPng(logoBytes);
      } catch {
        try {
          logoImg = await doc.embedJpg(logoBytes);
        } catch {
          logoImg = null;
        }
      }
      if (logoImg) {
        const logoW = mm(40);
        const logoH = mm(20);
        page.drawImage(logoImg, {
          x: margin,
          y: pdfY(yFromTop + logoH),
          width: logoW,
          height: logoH,
        });
      } else {
        // Image format not supported (e.g. WebP) — render text logo
        text(company.name, margin, yFromTop + mm(10), { size: 14, bold: true, color: C.blue });
      }
    } catch (err) {
      console.warn('[GenerateReceiptPDF] Logo embed failed:', err);
      text(company.name, margin, yFromTop + mm(10), { size: 14, bold: true, color: C.blue });
    }
  } else {
    text(company.name, margin, yFromTop + mm(10), { size: 14, bold: true, color: C.blue });
  }

  // Company details — right-aligned
  const rightX = margin + contentWidth;
  let rightY = yFromTop + mm(2);

  if (company.address) {
    company.address.split('\n').forEach(line => {
      text(line.trim(), rightX, rightY, { size: 7, color: C.labelGrey, align: 'right' });
      rightY += mm(4);
    });
  }
  if (company.phone) {
    text(`Phone: ${company.phone}`, rightX, rightY, { size: 7, color: C.labelGrey, align: 'right' });
    rightY += mm(4);
  }
  if (company.email) {
    text(`Email: ${company.email}`, rightX, rightY, { size: 7, color: C.labelGrey, align: 'right' });
    rightY += mm(4);
  }
  if (company.taxId) {
    text(company.taxId, rightX, rightY, { size: 7, color: C.labelGrey, align: 'right' });
  }

  yFromTop += headerHeight + mm(10);

  // ════════════════════════════════════════════════════════════════════════
  // TITLE
  // ════════════════════════════════════════════════════════════════════════
  text('PAYMENT RECEIPT', width / 2, yFromTop, {
    size: 18, bold: true, color: C.blue, align: 'center',
  });
  yFromTop += mm(8);

  text('Transaction Confirmation', width / 2, yFromTop, {
    size: 10, color: C.mutedGrey, align: 'center',
  });
  yFromTop += mm(12);

  // Blue divider
  page.drawLine({
    start: { x: margin, y: pdfY(yFromTop) },
    end:   { x: margin + contentWidth, y: pdfY(yFromTop) },
    thickness: 0.8,
    color: C.blue,
  });
  yFromTop += mm(12);

  // ════════════════════════════════════════════════════════════════════════
  // TRANSACTION DETAILS — two columns
  // ════════════════════════════════════════════════════════════════════════
  text('Transaction Details', margin, yFromTop, { size: 13, bold: true, color: C.darkText });
  yFromTop += mm(10);

  const leftCol  = margin;
  const rightCol = margin + contentWidth / 2 + mm(10);
  const labelW   = mm(45);

  // Row 1 — left: Reference, right: Payment Method
  text('Reference Number:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
  text(transaction.payment_id || 'N/A', leftCol + labelW, yFromTop, { size: 9, color: C.darkText });

  text('Payment Method:', rightCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
  text(transaction.payment_method || 'Card', rightCol + labelW, yFromTop, { size: 9, color: C.darkText });
  yFromTop += mm(7);

  // Row 2 — left: Date, right: Status
  text('Payment Date:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
  text(transaction.payment_timestamp || fmtDate(new Date().toISOString()), leftCol + labelW, yFromTop, { size: 9, color: C.darkText });

  text('Status:', rightCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
  text(transaction.status || 'Success', rightCol + labelW, yFromTop, { size: 9, color: C.successGreen, bold: true });
  yFromTop += mm(18);

  // ════════════════════════════════════════════════════════════════════════
  // AMOUNT BOX
  // ════════════════════════════════════════════════════════════════════════
  const boxH = mm(18);
  rect(margin, yFromTop, contentWidth, boxH, C.boxBg, C.boxBorder, 0.3, 0.4);
  yFromTop += mm(12);

  text('Total Amount:', margin + mm(8), yFromTop, { size: 12, bold: true, color: C.darkText });
  text(formatINR(transaction.amount || 0), margin + contentWidth - mm(8), yFromTop, {
    size: 16, bold: true, color: C.blue, align: 'right',
  });
  yFromTop += mm(18);

  // ════════════════════════════════════════════════════════════════════════
  // CUSTOMER DETAILS
  // ════════════════════════════════════════════════════════════════════════
  text('Customer Details', margin, yFromTop, { size: 13, bold: true, color: C.darkText });
  yFromTop += mm(10);

  text('Name:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
  text(user.name || 'N/A', leftCol + labelW, yFromTop, { size: 9, color: C.darkText });
  yFromTop += mm(7);

  text('Email:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
  text(user.email || 'N/A', leftCol + labelW, yFromTop, { size: 9, color: C.darkText });
  yFromTop += mm(7);

  if (user.phone) {
    text('Phone:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
    text(user.phone, leftCol + labelW, yFromTop, { size: 9, color: C.darkText });
    yFromTop += mm(7);
  }

  // ════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION DETAILS (if present)
  // ════════════════════════════════════════════════════════════════════════
  if (subscription) {
    yFromTop += mm(12);
    hRule(yFromTop, C.divider, 0.3);
    yFromTop += mm(12);

    text('Subscription Details', margin, yFromTop, { size: 13, bold: true, color: C.darkText });
    yFromTop += mm(10);

    const planName = subscription.plan_name || subscription.plan_type || 'N/A';
    text('Plan Type:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
    text(planName, leftCol + labelW, yFromTop, { size: 9, bold: true, color: C.blue });
    yFromTop += mm(7);

    text('Billing Cycle:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
    text(subscription.billing_cycle ?? 'N/A', leftCol + labelW, yFromTop, { size: 9, color: C.darkText });
    yFromTop += mm(7);

    text('Start Date:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
    text(fmtDate(subscription.subscription_start_date), leftCol + labelW, yFromTop, { size: 9, color: C.darkText });
    yFromTop += mm(7);

    text('End Date:', leftCol, yFromTop, { size: 9, bold: true, color: C.labelGrey });
    text(fmtDate(subscription.subscription_end_date), leftCol + labelW, yFromTop, { size: 9, color: C.darkText });
  }

  // ════════════════════════════════════════════════════════════════════════
  // FOOTER — pinned to bottom of page
  // ════════════════════════════════════════════════════════════════════════
  const footerY = mm(272); // 25mm from bottom of A4 (297 - 25)

  page.drawLine({
    start: { x: margin, y: pdfY(footerY) },
    end:   { x: margin + contentWidth, y: pdfY(footerY) },
    thickness: 0.8,
    color: C.blue,
  });

  text('Thank you for your payment!', width / 2, footerY + mm(6), {
    size: 12, bold: true, color: C.blue, align: 'center',
  });
  text('For support, contact us at marketing@rareminds.in', width / 2, footerY + mm(11), {
    size: 9, color: C.mutedGrey, align: 'center',
  });
  text(
    `Generated on: ${generatedAt || new Date().toLocaleString('en-IN')}`,
    width / 2, footerY + mm(15),
    { size: 8, color: C.lightGrey, align: 'center' }
  );

  return doc.save();
}

/**
 * Fetch an image from a URL and return its bytes.
 * Returns undefined on any error — callers treat images as optional.
 */
export async function fetchImageBytes(url: string): Promise<Uint8Array | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return undefined;
  }
}
