/**
 * Receipt PDF generation and storage service
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Env, ReceiptData } from '../types';
import { STORAGE_API_URL } from '../config';

/**
 * Generate receipt PDF as base64
 */
export async function generateReceiptPdfBase64(receiptData: ReceiptData): Promise<string> {
  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate, userName, userEmail, paymentMethod, paymentDate } = receiptData;
  
  console.log(`[PDF-GEN] Starting PDF generation for payment: ${paymentId}`);
  
  const formatAmount = (a: number) => `Rs. ${a.toLocaleString('en-IN')}`;

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();
    
    let y = height - 50;
    
    // Title
    page.drawText('PAYMENT RECEIPT', { x: 50, y, size: 24, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
    y -= 40;
    
    page.drawText('RareMinds - Skill Passport', { x: 50, y, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 50;
    
    // Transaction Details
    page.drawText('Transaction Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    
    page.drawText(`Reference: ${paymentId}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Order ID: ${orderId}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Date: ${paymentDate}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Payment Method: ${paymentMethod}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Status: Success`, { x: 50, y, size: 10, font, color: rgb(0.13, 0.77, 0.37) });
    y -= 40;
    
    // Amount
    page.drawText('Amount Paid', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    page.drawText(formatAmount(amount), { x: 50, y, size: 20, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
    y -= 50;
    
    // Customer Details
    page.drawText('Customer Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    page.drawText(`Name: ${userName}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Email: ${userEmail}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;
    
    // Subscription Details
    page.drawText('Subscription Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    page.drawText(`Plan: ${planName}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Billing Cycle: ${billingCycle}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Valid Until: ${subscriptionEndDate}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 50;
    
    // Footer
    page.drawText('Thank you for your payment!', { x: 50, y, size: 12, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
    y -= 20;
    page.drawText('For support: marketing@rareminds.in', { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 15;
    page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 50, y, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
    
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    
    console.log(`[PDF-GEN] PDF generated successfully: ${pdfBytes.length} bytes`);
    return btoa(binary);
  } catch (error) {
    console.error(`[PDF-GEN] Error:`, error);
    throw error;
  }
}

/**
 * Upload receipt to R2 storage via storage-api worker
 */
export async function uploadReceiptToR2(
  env: Env,
  pdfBase64: string,
  paymentId: string,
  userId: string,
  filename: string,
  userName?: string
): Promise<{ success: boolean; url?: string; fileKey?: string; error?: string }> {
  console.log(`[RECEIPT] Uploading receipt for payment: ${paymentId}`);
  
  try {
    const requestBody = JSON.stringify({
      pdfBase64,
      paymentId,
      userId,
      userName,
      filename,
    });
    
    let response: Response;
    const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
    
    // Use Service Binding if available
    if (env.STORAGE_SERVICE) {
      console.log(`[RECEIPT] Using Service Binding to storage-api`);
      response = await env.STORAGE_SERVICE.fetch('https://storage-api/upload-payment-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    } else {
      console.log(`[RECEIPT] Using HTTP fetch to: ${storageUrl}`);
      response = await fetch(`${storageUrl}/upload-payment-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[RECEIPT] Upload failed: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json() as { success: boolean; url?: string; fileKey?: string };
    console.log(`[RECEIPT] Upload result:`, result);
    return result;
  } catch (error) {
    console.error(`[RECEIPT] Error:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get receipt download URL
 */
export function getReceiptDownloadUrl(env: Env, fileKey: string): string {
  const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
  return `${storageUrl}/payment-receipt?key=${encodeURIComponent(fileKey)}&mode=download`;
}
