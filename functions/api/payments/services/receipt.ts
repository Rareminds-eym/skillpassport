/**
 * Receipt PDF generation service
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ReceiptData } from '../types';

/**
 * Generate receipt PDF content as base64 using pdf-lib
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
    const base64 = btoa(binary);
    
    console.log(`[PDF-GEN] PDF generation success - ${base64.length} chars`);
    return base64;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PDF-GEN] PDF generation failed: ${errorMsg}`);
    throw error;
  }
}
