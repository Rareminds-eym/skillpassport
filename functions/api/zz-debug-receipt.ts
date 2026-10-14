// @public-endpoint: TEMPORARY diagnostic route (deleted after the receipt-crash investigation). Not for commit.
import { APP_URL } from './email/types';
import { generateReceiptPDF, fetchImageBytes } from './storage/utils/pdf-generator';
import { R2Client } from './storage/utils/r2-client';

// Runs the same steps as verify-payment's generateAndUploadReceipt without signup/payment.
//   ?logo=1|0   download the production logo and embed it (default 1)
//   ?wm=1|0     also use it as the watermark (default 1; ignored when logo=0)
//   ?r2=1|0     save the PDF to the local R2 bucket (default 1)
//   ?bg=1|0     answer first and run in context.waitUntil, like verify-payment (default 1)
const log = (message: string, extra: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ level: 'info', message, service: 'zz-debug-receipt', timestamp: new Date().toISOString(), ...extra }));

export async function onRequest(context: { request: Request; env: any; waitUntil?: (p: Promise<unknown>) => void }): Promise<Response> {
  const q = new URL(context.request.url).searchParams;
  const withLogo = q.get('logo') !== '0';
  const withWatermark = q.get('wm') !== '0';
  const toR2 = q.get('r2') !== '0';
  const background = q.get('bg') !== '0';
  const id = q.get('id') ?? String(Date.now());

  const run = async () => {
    log('DEBUG receipt start', { id, withLogo, withWatermark, toR2, background });
    let logoBytes: Uint8Array | undefined;
    if (withLogo) logoBytes = await fetchImageBytes(`${APP_URL}/RareMinds ISO Logo-01.png`);
    log('DEBUG logo', { id, logoBytes: logoBytes?.length ?? 'none' });
    log('Generating PDF receipt', { id });
    const pdfBytes = await generateReceiptPDF({
      transaction: { payment_id: `pay_dbg_${id}`, order_id: `order_dbg_${id}`, amount: 999, currency: 'INR', payment_method: 'netbanking', payment_timestamp: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'Success' },
      subscription: { plan_name: 'Career Accelerator', plan_type: 'Career Accelerator', billing_cycle: 'yearly', subscription_start_date: new Date().toISOString(), subscription_end_date: new Date(Date.now() + 365 * 864e5).toISOString() },
      user: { name: 'E2E Debug', email: 'debug@example.com', phone: '9876543210' },
      company: { name: 'Rareminds', address: '231, 2nd stage, 13th Cross Road\nHoysala Nagar, Indiranagar\nBengaluru, Karnataka 560001', phone: '+91 9902326951', email: 'marketing@rareminds.in', taxId: 'GSTIN: 29ABCDE1234F1Z5' },
      generatedAt: new Date().toLocaleString('en-IN'),
      logoBytes,
      watermarkBytes: withWatermark ? logoBytes : undefined,
    });
    log('PDF generated successfully', { id, size: pdfBytes.buffer.byteLength });
    if (toR2) {
      const r2 = new R2Client(context.env);
      log('Uploading receipt to R2', { id });
      await r2.upload(`payment_pdf/user_debug/dbg_${id}.pdf`, pdfBytes.buffer as ArrayBuffer, 'application/pdf');
      log('Receipt uploaded successfully to R2', { id });
    }
    log('DEBUG receipt done', { id });
  };

  if (background && context.waitUntil) {
    context.waitUntil(run().catch((e) => log('DEBUG receipt FAILED', { id, error: String(e) })));
    return new Response(`started ${id}\n`);
  }
  try { await run(); return new Response(`done ${id}\n`); } catch (e) { return new Response(`failed ${id}: ${String(e)}\n`, { status: 500 }); }
}
