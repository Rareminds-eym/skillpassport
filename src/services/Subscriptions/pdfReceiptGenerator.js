import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDFReceiptGenerator Service
 * Handles generation and download of PDF receipts for payment transactions
 */

/**
 * Convert image to base64 for PDF embedding
 * @param {string} imagePath - Path to the image
 * @returns {Promise<string>} Base64 encoded image
 */
async function imageToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      ctx.drawImage(this, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imagePath;
  });
}

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

  // Load logos
  let companyLogo = null;
  let watermarkLogo = null;
  
  try {
    // Load company logo (top left)
    companyLogo = await imageToBase64('/RareMinds.webp');
  } catch (error) {
    console.warn('Could not load company logo:', error);
  }
  
  try {
    // Load watermark logo
    watermarkLogo = await imageToBase64('/RMLogo.webp');
  } catch (error) {
    console.warn('Could not load watermark logo:', error);
  }

  // Add watermark (behind all content)
  if (watermarkLogo) {
    const watermarkSize = 80;
    const watermarkX = (pageWidth - watermarkSize) / 2;
    const watermarkY = (pageHeight - watermarkSize) / 2;
    
    // Set transparency for watermark
    pdf.setGState(pdf.GState({ opacity: 0.1 }));
    pdf.addImage(watermarkLogo, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize);
    // Reset opacity
    pdf.setGState(pdf.GState({ opacity: 1.0 }));
  }

  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth, color = [0, 0, 0] } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    if (align === 'center') {
      pdf.text(text, x, y, { align: 'center', maxWidth });
    } else if (align === 'right') {
      pdf.text(text, x, y, { align: 'right', maxWidth });
    } else {
      pdf.text(text, x, y, { maxWidth });
    }
  };

  // Header Section with Logo and Company Details
  const headerHeight = 25;
  
  // Company Logo (top left) - increased width to prevent squashing
  if (companyLogo) {
    const logoWidth = 40;  // Increased width
    const logoHeight = 20; // Maintain aspect ratio
    pdf.addImage(companyLogo, 'PNG', margin, yPosition, logoWidth, logoHeight);
  }
  
  // Company Details (top right) - only address, phone, email
  const companyDetailsX = pageWidth - margin;
  let rightYPosition = yPosition + 2;
  
  // Address (handle multi-line)
  if (company.address) {
    const addressLines = company.address.split('\n');
    addressLines.forEach(line => {
      addText(line.trim(), companyDetailsX, rightYPosition, { 
        fontSize: 8, 
        align: 'right',
        color: [75, 85, 99] // Gray color
      });
      rightYPosition += 4;
    });
  }
  
  // Phone
  if (company.phone) {
    addText(`Phone: ${company.phone}`, companyDetailsX, rightYPosition, { 
      fontSize: 8, 
      align: 'right',
      color: [75, 85, 99]
    });
    rightYPosition += 4;
  }
  
  // Email
  if (company.email) {
    addText(`Email: ${company.email}`, companyDetailsX, rightYPosition, { 
      fontSize: 8, 
      align: 'right',
      color: [75, 85, 99]
    });
  }

  yPosition += headerHeight + 10;

  // Title with enhanced styling
  addText('PAYMENT RECEIPT', pageWidth / 2, yPosition, { 
    fontSize: 18, 
    fontStyle: 'bold', 
    align: 'center',
    color: [38, 99, 235]
  });
  yPosition += 8;
  
  // Subtitle
  addText('Transaction Confirmation', pageWidth / 2, yPosition, { 
    fontSize: 10, 
    align: 'center',
    color: [107, 114, 128]
  });
  yPosition += 15;

  // Decorative line with gradient effect
  pdf.setDrawColor(38, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Transaction Details Section with enhanced styling
  addText('Transaction Details', margin, yPosition, { 
    fontSize: 13, 
    fontStyle: 'bold',
    color: [31, 41, 55]
  });
  yPosition += 10;

  // Transaction info in two columns with better spacing
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;
  const labelWidth = 45;

  // Left column
  addText('Reference Number:', leftCol, yPosition, { 
    fontSize: 9, 
    fontStyle: 'bold',
    color: [75, 85, 99]
  });
  addText(transaction.payment_id || 'N/A', leftCol + labelWidth, yPosition, { 
    fontSize: 9,
    color: [31, 41, 55]
  });
  yPosition += 7;

  addText('Payment Date:', leftCol, yPosition, { 
    fontSize: 9, 
    fontStyle: 'bold',
    color: [75, 85, 99]
  });
  addText(transaction.payment_timestamp || new Date().toLocaleDateString(), leftCol + labelWidth, yPosition, { 
    fontSize: 9,
    color: [31, 41, 55]
  });
  yPosition += 7;

  // Reset y for right column
  yPosition -= 14;

  // Right column
  addText('Payment Method:', rightCol, yPosition, { 
    fontSize: 9, 
    fontStyle: 'bold',
    color: [75, 85, 99]
  });
  addText(transaction.payment_method || 'Card', rightCol + labelWidth, yPosition, { 
    fontSize: 9,
    color: [31, 41, 55]
  });
  yPosition += 7;

  addText('Status:', rightCol, yPosition, { 
    fontSize: 9, 
    fontStyle: 'bold',
    color: [75, 85, 99]
  });
  addText(transaction.status || 'Success', rightCol + labelWidth, yPosition, { 
    fontSize: 9,
    color: [34, 197, 94] // Success green
  });
  yPosition += 20;

  // Enhanced Amount Section with transparent background to show watermark
  const amountBoxHeight = 18;
  
  // Set transparent background (much lighter opacity)
  pdf.setGState(pdf.GState({ opacity: 0.3 })); // Reduced opacity for background
  pdf.setFillColor(248, 250, 252); // Light blue background
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, amountBoxHeight, 'F');
  
  // Reset opacity for border
  pdf.setGState(pdf.GState({ opacity: 0.4 })); // Semi-transparent border
  pdf.setDrawColor(226, 232, 240); // Border color
  pdf.setLineWidth(0.3);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, amountBoxHeight, 'S');
  
  // Reset opacity for text (full opacity)
  pdf.setGState(pdf.GState({ opacity: 1.0 }));
  yPosition += 12;

  addText('Total Amount:', margin + 8, yPosition, { 
    fontSize: 12, 
    fontStyle: 'bold',
    color: [31, 41, 55]
  });
  
  // Format amount properly for Indian Rupees - simpler approach
  const amount = transaction.amount || 0;
  const formattedAmount = `Rs. ${amount.toLocaleString('en-IN')}`;
  
  addText(formattedAmount, pageWidth - margin - 8, yPosition, { 
    fontSize: 16, 
    fontStyle: 'bold', 
    align: 'right',
    color: [38, 99, 235]
  });
  yPosition += 20;

  // Customer Details Section with enhanced styling
  addText('Customer Details', margin, yPosition, { 
    fontSize: 13, 
    fontStyle: 'bold',
    color: [31, 41, 55]
  });
  yPosition += 10;

  addText('Name:', leftCol, yPosition, { 
    fontSize: 9, 
    fontStyle: 'bold',
    color: [75, 85, 99]
  });
  addText(user.name || 'N/A', leftCol + labelWidth, yPosition, { 
    fontSize: 9,
    color: [31, 41, 55]
  });
  yPosition += 7;

  addText('Email:', leftCol, yPosition, { 
    fontSize: 9, 
    fontStyle: 'bold',
    color: [75, 85, 99]
  });
  addText(user.email || 'N/A', leftCol + labelWidth, yPosition, { 
    fontSize: 9,
    color: [31, 41, 55]
  });
  yPosition += 7;

  if (user.phone) {
    addText('Phone:', leftCol, yPosition, { 
      fontSize: 9, 
      fontStyle: 'bold',
      color: [75, 85, 99]
    });
    addText(user.phone, leftCol + labelWidth, yPosition, { 
      fontSize: 9,
      color: [31, 41, 55]
    });
    yPosition += 7;
  }

  // Subscription Details Section (if available) with enhanced styling
  if (subscription) {
    yPosition += 15;
    
    // Section divider
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    addText('Subscription Details', margin, yPosition, { 
      fontSize: 13, 
      fontStyle: 'bold',
      color: [31, 41, 55]
    });
    yPosition += 10;

    addText('Plan Type:', leftCol, yPosition, { 
      fontSize: 9, 
      fontStyle: 'bold',
      color: [75, 85, 99]
    });
    addText(subscription.plan_type || 'N/A', leftCol + labelWidth, yPosition, { 
      fontSize: 9,
      color: [38, 99, 235],
      fontStyle: 'bold'
    });
    yPosition += 7;

    addText('Billing Cycle:', leftCol, yPosition, { 
      fontSize: 9, 
      fontStyle: 'bold',
      color: [75, 85, 99]
    });
    addText(subscription.billing_cycle || 'N/A', leftCol + labelWidth, yPosition, { 
      fontSize: 9,
      color: [31, 41, 55]
    });
    yPosition += 7;

    addText('Start Date:', leftCol, yPosition, { 
      fontSize: 9, 
      fontStyle: 'bold',
      color: [75, 85, 99]
    });
    addText(subscription.subscription_start_date || 'N/A', leftCol + labelWidth, yPosition, { 
      fontSize: 9,
      color: [31, 41, 55]
    });
    yPosition += 7;

    addText('End Date:', leftCol, yPosition, { 
      fontSize: 9, 
      fontStyle: 'bold',
      color: [75, 85, 99]
    });
    addText(subscription.subscription_end_date || 'N/A', leftCol + labelWidth, yPosition, { 
      fontSize: 9,
      color: [31, 41, 55]
    });
    yPosition += 15;
  }

  // Enhanced Footer with branding - positioned at bottom with reduced padding
  yPosition = pageHeight - 25; // Reduced from 40 to 25
  
  // Footer divider
  pdf.setDrawColor(38, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6; // Reduced from 10 to 6

  addText('Thank you for your payment!', pageWidth / 2, yPosition, { 
    fontSize: 12, 
    align: 'center',
    fontStyle: 'bold',
    color: [38, 99, 235]
  });
  yPosition += 5; // Reduced from 8 to 5

  addText('For support, contact us at marketing@rareminds.in', pageWidth / 2, yPosition, { 
    fontSize: 9, 
    align: 'center',
    color: [107, 114, 128]
  });
  yPosition += 4; // Reduced from 6 to 4

  addText(`Generated on: ${receiptData.generatedAt || new Date().toLocaleString()}`, pageWidth / 2, yPosition, { 
    fontSize: 8, 
    align: 'center',
    color: [156, 163, 175]
  });

  // Return as blob
  return pdf.output('blob');
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
  downloadReceipt,
  generatePDFFromHTML
};
