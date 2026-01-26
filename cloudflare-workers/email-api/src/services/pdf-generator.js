/**
 * PDF generation service for registration receipts
 * Generates PDF receipts as base64 encoded strings
 */

/**
 * Generate a simple PDF receipt for event registration
 * Returns base64 encoded PDF
 */
export function generateRegistrationReceiptPDF(data) {
  const { name, email, phone, amount, orderId, campaign, date } = data;
  
  const registrationDate = date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });

  // Simple PDF structure (PDF 1.4 format)
  // This is a minimal PDF that displays the receipt information
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
    /F2 6 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 1200
>>
stream
BT
/F1 24 Tf
50 750 Td
(SKILL PASSPORT) Tj
0 -30 Td
/F1 18 Tf
(Pre-Registration Receipt) Tj
0 -50 Td
/F2 12 Tf
(Order ID: ${orderId || 'N/A'}) Tj
0 -20 Td
(Date: ${registrationDate}) Tj
0 -40 Td
/F1 14 Tf
(Registration Details) Tj
0 -25 Td
/F2 12 Tf
(Name: ${name}) Tj
0 -20 Td
(Email: ${email}) Tj
0 -20 Td
(Phone: ${phone}) Tj
0 -20 Td
(Campaign: ${campaign || 'Direct'}) Tj
0 -40 Td
/F1 14 Tf
(Payment Information) Tj
0 -25 Td
/F2 12 Tf
(Amount Paid: Rs. ${amount.toLocaleString()}) Tj
0 -20 Td
(Payment Status: Completed) Tj
0 -20 Td
(Payment Method: Razorpay) Tj
0 -60 Td
/F2 10 Tf
(Thank you for registering with Skill Passport!) Tj
0 -15 Td
(For any queries, contact: marketing@rareminds.in) Tj
0 -15 Td
(Phone: +91 9562481100) Tj
0 -40 Td
/F2 8 Tf
(This is a computer-generated receipt.) Tj
0 -10 Td
(© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000001526 00000 n 
0000001607 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
1683
%%EOF`;

  // Convert to base64
  const base64PDF = btoa(pdfContent);
  
  return base64PDF;
}

/**
 * Get PDF filename for the receipt
 */
export function getReceiptFilename(orderId) {
  const timestamp = new Date().toISOString().split('T')[0];
  return `SkillPassport_Receipt_${orderId || timestamp}.pdf`;
}
