/**
 * PDF Receipt Generation Handler
 * GET /download-receipt/:orderId - Generate and download PDF receipt directly
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { errorResponse } from '../utils/response.js';
import { createSupabaseClient } from '../services/supabase.js';

/**
 * Generate PDF receipt and return as downloadable file
 * GET /download-receipt/:orderId
 */
export async function handlePDFReceipt(orderId, env) {
  if (!orderId) {
    return errorResponse('Order ID is required', null, 400);
  }

  try {
    // Fetch registration data from Supabase
    const supabase = createSupabaseClient(env);
    
    if (!supabase) {
      return errorResponse('Database connection failed', 'Supabase client could not be created', 500);
    }
    
    const { data, error: fetchError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return errorResponse('Failed to fetch receipt data', fetchError.message, 500);
    }

    if (!data) {
      return errorResponse('Receipt not found', 'No registration found for this order ID', 404);
    }

    // Generate PDF
    const pdfBytes = await generatePDF(data, orderId);

    // Return PDF as downloadable file
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SkillPassport_Receipt_${orderId}.pdf"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    return errorResponse('Failed to generate PDF receipt', error.message, 500);
  }
}

/**
 * Generate PDF document using pdf-lib
 */
async function generatePDF(data, orderId) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const { width, height } = page.getSize();
  
  // Colors
  const blue = rgb(0.118, 0.251, 0.686); // #1e40af
  const darkGray = rgb(0.216, 0.255, 0.318); // #374151
  const lightGray = rgb(0.420, 0.447, 0.502); // #6b7280
  
  let y = height - 60;
  
  // Header - SKILL PASSPORT
  page.drawText('SKILL PASSPORT', {
    x: width / 2 - 120,
    y: y,
    size: 24,
    font: boldFont,
    color: blue,
  });
  
  y -= 30;
  page.drawText('Pre-Registration Receipt', {
    x: width / 2 - 95,
    y: y,
    size: 18,
    font: boldFont,
    color: darkGray,
  });
  
  y -= 50;
  
  // Order details
  page.drawText(`Order ID: ${orderId}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 20;
  const date = new Date(data.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  page.drawText(`Date: ${date}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 40;
  
  // Registration Details Section
  page.drawText('Registration Details', {
    x: 50,
    y: y,
    size: 14,
    font: boldFont,
    color: darkGray,
  });
  
  y -= 25;
  page.drawText(`Name: ${data.full_name}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 20;
  page.drawText(`Email: ${data.email}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 20;
  page.drawText(`Phone: ${data.phone}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 40;
  
  // Payment Information Section
  page.drawText('Payment Information', {
    x: 50,
    y: y,
    size: 14,
    font: boldFont,
    color: darkGray,
  });
  
  y -= 25;
  page.drawText(`Amount Paid: Rs. ${data.amount || 250}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: blue,
  });
  
  y -= 20;
  page.drawText(`Payment Status: ${data.payment_status || 'Completed'}`, {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 20;
  page.drawText('Payment Method: Razorpay', {
    x: 50,
    y: y,
    size: 12,
    font: regularFont,
    color: darkGray,
  });
  
  y -= 60;
  
  // Footer
  page.drawText('Thank you for registering with Skill Passport!', {
    x: 50,
    y: y,
    size: 10,
    font: regularFont,
    color: lightGray,
  });
  
  y -= 18;
  page.drawText('For any queries, contact: marketing@rareminds.in', {
    x: 50,
    y: y,
    size: 10,
    font: regularFont,
    color: lightGray,
  });
  
  y -= 18;
  page.drawText('Phone: +91 9562481100', {
    x: 50,
    y: y,
    size: 10,
    font: regularFont,
    color: lightGray,
  });
  
  y -= 30;
  page.drawText('This is a computer-generated receipt.', {
    x: 50,
    y: y,
    size: 8,
    font: regularFont,
    color: lightGray,
  });
  
  y -= 14;
  page.drawText(`© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.`, {
    x: 50,
    y: y,
    size: 8,
    font: regularFont,
    color: lightGray,
  });
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
