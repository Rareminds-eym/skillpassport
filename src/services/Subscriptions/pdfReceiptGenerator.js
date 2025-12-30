import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDFReceiptGenerator Service
 * Handles generation and download of PDF receipts for payment transactions
 */

/**
 * Generate a PDF receipt from receipt data
 * @param {Object} receiptData - The receipt data
 * @param {Object} receiptData.transaction - Transaction details
 * @param {Object} receiptData.subscription - Subscription details
 * @param {Object} receiptData.user - User details
 * @param {Object} receiptData.company - Company information
 * @returns {Promise<Blob>} PDF blob
 */
export async function generateReceipt(receiptData) {
  const { transaction, subscription, user, company } = receiptData;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    
    if (align === 'center') {
      pdf.text(text, x, y, { align: 'center', maxWidth });
    } else if (align === 'right') {
      pdf.text(text, x, y, { align: 'right', maxWidth });
    } else {
      pdf.text(text, x, y, { maxWidth });
    }
  };

  // Header - Company Info
  addText(company.name || 'RareMinds', pageWidth / 2, yPosition, { 
    fontSize: 20, 
    fontStyle: 'bold', 
    align: 'center' 
  });
  yPosition += 10;

  if (company.address) {
    addText(company.address, pageWidth / 2, yPosition, { 
      fontSize: 9, 
      align: 'center',
      maxWidth: pageWidth - 2 * margin
    });
    yPosition += 6;
  }

  if (company.taxId) {
    addText(`Tax ID: ${company.taxId}`, pageWidth / 2, yPosition, { 
      fontSize: 9, 
      align: 'center' 
    });
    yPosition += 6;
  }

  yPosition += 10;

  // Title
  addText('PAYMENT RECEIPT', pageWidth / 2, yPosition, { 
    fontSize: 16, 
    fontStyle: 'bold', 
    align: 'center' 
  });
  yPosition += 15;

  // Horizontal line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Transaction Details Section
  addText('Transaction Details', margin, yPosition, { 
    fontSize: 12, 
    fontStyle: 'bold' 
  });
  yPosition += 8;

  // Transaction info in two columns
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;
  const labelWidth = 40;

  // Left column
  addText('Reference Number:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.payment_id || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  addText('Payment Date:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.payment_timestamp || new Date().toLocaleDateString(), leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  // Reset y for right column
  yPosition -= 12;

  // Right column
  addText('Payment Method:', rightCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.payment_method || 'Card', rightCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  addText('Status:', rightCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.status || 'Success', rightCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 12;

  // Amount Section
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
  yPosition += 10;

  addText('Total Amount:', margin + 5, yPosition, { fontSize: 11, fontStyle: 'bold' });
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: transaction.currency || 'INR',
    minimumFractionDigits: 0
  }).format(transaction.amount || 0);
  
  addText(formattedAmount, pageWidth - margin - 5, yPosition, { 
    fontSize: 14, 
    fontStyle: 'bold', 
    align: 'right' 
  });
  yPosition += 15;

  // Customer Details Section
  yPosition += 5;
  addText('Customer Details', margin, yPosition, { 
    fontSize: 12, 
    fontStyle: 'bold' 
  });
  yPosition += 8;

  addText('Name:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(user.name || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  addText('Email:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(user.email || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  if (user.phone) {
    addText('Phone:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(user.phone, leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;
  }

  // Subscription Details Section (if available)
  if (subscription) {
    yPosition += 10;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    addText('Subscription Details', margin, yPosition, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    yPosition += 8;

    addText('Plan Type:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.plan_type || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;

    addText('Billing Cycle:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.billing_cycle || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;

    addText('Start Date:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.subscription_start_date || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;

    addText('End Date:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.subscription_end_date || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 10;
  }

  // Footer
  yPosition = pageHeight - 30;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  addText('Thank you for your payment!', pageWidth / 2, yPosition, { 
    fontSize: 10, 
    align: 'center' 
  });
  yPosition += 6;

  addText(`Generated on: ${receiptData.generatedAt || new Date().toLocaleString()}`, pageWidth / 2, yPosition, { 
    fontSize: 8, 
    align: 'center' 
  });

  // Return as blob
  return pdf.output('blob');
}

/**
 * Generate a PDF receipt and return as base64 string
 * @param {Object} receiptData - The receipt data
 * @returns {Promise<string>} Base64 encoded PDF
 */
export async function generateReceiptBase64(receiptData) {
  const { transaction, subscription, user, company } = receiptData;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    
    if (align === 'center') {
      pdf.text(text, x, y, { align: 'center', maxWidth });
    } else if (align === 'right') {
      pdf.text(text, x, y, { align: 'right', maxWidth });
    } else {
      pdf.text(text, x, y, { maxWidth });
    }
  };

  // Header - Company Info
  addText(company.name || 'RareMinds', pageWidth / 2, yPosition, { 
    fontSize: 20, 
    fontStyle: 'bold', 
    align: 'center' 
  });
  yPosition += 10;

  if (company.address) {
    addText(company.address, pageWidth / 2, yPosition, { 
      fontSize: 9, 
      align: 'center',
      maxWidth: pageWidth - 2 * margin
    });
    yPosition += 6;
  }

  if (company.taxId) {
    addText(`Tax ID: ${company.taxId}`, pageWidth / 2, yPosition, { 
      fontSize: 9, 
      align: 'center' 
    });
    yPosition += 6;
  }

  yPosition += 10;

  // Title
  addText('PAYMENT RECEIPT', pageWidth / 2, yPosition, { 
    fontSize: 16, 
    fontStyle: 'bold', 
    align: 'center' 
  });
  yPosition += 15;

  // Horizontal line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Transaction Details Section
  addText('Transaction Details', margin, yPosition, { 
    fontSize: 12, 
    fontStyle: 'bold' 
  });
  yPosition += 8;

  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;
  const labelWidth = 40;

  addText('Reference Number:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.payment_id || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  addText('Payment Date:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.payment_timestamp || new Date().toLocaleDateString(), leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  yPosition -= 12;

  addText('Payment Method:', rightCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.payment_method || 'Card', rightCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  addText('Status:', rightCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(transaction.status || 'Success', rightCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 12;

  // Amount Section
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
  yPosition += 10;

  addText('Total Amount:', margin + 5, yPosition, { fontSize: 11, fontStyle: 'bold' });
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: transaction.currency || 'INR',
    minimumFractionDigits: 0
  }).format(transaction.amount || 0);
  
  addText(formattedAmount, pageWidth - margin - 5, yPosition, { 
    fontSize: 14, 
    fontStyle: 'bold', 
    align: 'right' 
  });
  yPosition += 15;

  // Customer Details Section
  yPosition += 5;
  addText('Customer Details', margin, yPosition, { 
    fontSize: 12, 
    fontStyle: 'bold' 
  });
  yPosition += 8;

  addText('Name:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(user.name || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  addText('Email:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
  addText(user.email || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
  yPosition += 6;

  if (user.phone) {
    addText('Phone:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(user.phone, leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;
  }

  // Subscription Details Section
  if (subscription) {
    yPosition += 10;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    addText('Subscription Details', margin, yPosition, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    yPosition += 8;

    addText('Plan Type:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.plan_type || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;

    addText('Billing Cycle:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.billing_cycle || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;

    addText('Start Date:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.subscription_start_date || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 6;

    addText('End Date:', leftCol, yPosition, { fontSize: 9, fontStyle: 'bold' });
    addText(subscription.subscription_end_date || 'N/A', leftCol + labelWidth, yPosition, { fontSize: 9 });
    yPosition += 10;
  }

  // Footer
  yPosition = pageHeight - 30;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  addText('Thank you for your payment!', pageWidth / 2, yPosition, { 
    fontSize: 10, 
    align: 'center' 
  });
  yPosition += 6;

  addText(`Generated on: ${receiptData.generatedAt || new Date().toLocaleString()}`, pageWidth / 2, yPosition, { 
    fontSize: 8, 
    align: 'center' 
  });

  // Return as base64 string (without data URI prefix)
  const base64 = pdf.output('datauristring');
  // Remove the "data:application/pdf;filename=generated.pdf;base64," prefix
  return base64.split(',')[1];
}

/**
 * Download a PDF receipt
 * @param {Object} receiptData - The receipt data
 * @param {string} filename - Optional custom filename
 * @returns {Promise<void>}
 */
export async function downloadReceipt(receiptData, filename) {
  try {
    const blob = await generateReceipt(receiptData);
    
    // Generate filename with timestamp if not provided
    const finalFilename = filename || `receipt-${Date.now()}.pdf`;
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading receipt:', error);
    throw new Error('Failed to download receipt. Please try again.');
  }
}

/**
 * Generate PDF from HTML element (alternative method)
 * @param {string} elementId - ID of the HTML element to convert
 * @param {string} filename - Filename for the PDF
 * @returns {Promise<void>}
 */
export async function generatePDFFromHTML(elementId, filename = `receipt-${Date.now()}.pdf`) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

export default {
  generateReceipt,
  generateReceiptBase64,
  downloadReceipt,
  generatePDFFromHTML
};
