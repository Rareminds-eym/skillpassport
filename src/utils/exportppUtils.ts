import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import type { Student, PortfolioSettings } from '../types/student';

// Export portfolio as PDF
export const exportAsPDF = async (
  elementId: string = 'portfolio-content',
  filename: string = 'portfolio.pdf'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Portfolio content not found');
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Export portfolio data as JSON
export const exportAsJSON = (
  student: Student,
  settings: PortfolioSettings,
  filename: string = 'portfolio-data.json'
): void => {
  try {
    const data = {
      student,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    throw error;
  }
};

// Export as standalone HTML
export const exportAsHTML = async (
  elementId: string = 'portfolio-content',
  filename: string = 'portfolio.html'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Portfolio content not found');
    }

    // Get all stylesheets
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Portfolio</title>
    <style>
        ${styles}
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }
    </style>
</head>
<body>
    ${element.outerHTML}
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting HTML:', error);
    throw error;
  }
};

// Generate QR Code for portfolio URL
export const generateQRCode = async (
  url: string,
  options: {
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  } = {}
): Promise<string> => {
  try {
    const qrDataURL = await QRCode.toDataURL(url, {
      width: options.width || 300,
      margin: 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Download QR Code as image
export const downloadQRCode = async (
  url: string,
  filename: string = 'portfolio-qr-code.png'
): Promise<void> => {
  try {
    const qrDataURL = await generateQRCode(url, { width: 500 });
    
    // Convert data URL to blob
    const response = await fetch(qrDataURL);
    const blob = await response.blob();
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};

// Share via Web Share API (if available)
export const sharePortfolio = async (
  title: string,
  text: string,
  url: string
): Promise<boolean> => {
  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      });
      return true;
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      return false; // Indicates fallback was used
    }
  } catch (error) {
    console.error('Error sharing:', error);
    throw error;
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
};

// Generate shareable link (using current URL or custom format)
export const generateShareableLink = (userId?: string): string => {
  const baseUrl = window.location.origin;
  
  if (userId) {
    return `${baseUrl}/portfolio?user=${userId}`;
  }
  
  // Generate random ID for demo
  const randomId = Math.random().toString(36).substring(2, 10);
  return `${baseUrl}/portfolio?id=${randomId}`;
};

// Export resume as simple formatted PDF
export const exportResume = async (
  student: Student,
  filename: string = 'resume.pdf'
): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const leftMargin = 20;
    const pageWidth = 210;

    // Header - Name and Contact
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(student.profile.name || 'Portfolio', leftMargin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (student.profile.email) {
      pdf.text(student.profile.email, leftMargin, yPosition);
      yPosition += 5;
    }
    // Note: phone and location fields may not exist in StudentProfile type
    const profile = student.profile as any;
    if (profile.phone) {
      pdf.text(profile.phone, leftMargin, yPosition);
      yPosition += 5;
    }
    if (profile.location) {
      pdf.text(profile.location, leftMargin, yPosition);
      yPosition += 10;
    }

    // Bio/Summary
    if (student.profile.bio) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Professional Summary', leftMargin, yPosition);
      yPosition += 7;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const bioLines = pdf.splitTextToSize(student.profile.bio, pageWidth - 40);
      pdf.text(bioLines, leftMargin, yPosition);
      yPosition += bioLines.length * 5 + 5;
    }

    // Education
    if (student.profile.education && student.profile.education.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Education', leftMargin, yPosition);
      yPosition += 7;

      student.profile.education.forEach(edu => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(edu.degree, leftMargin, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${edu.institution} | ${edu.startDate} - ${edu.endDate || 'Present'}`, leftMargin, yPosition);
        yPosition += 5;
        
        if (edu.grade) {
          pdf.text(`Grade: ${edu.grade}`, leftMargin, yPosition);
          yPosition += 5;
        }
        yPosition += 3;
      });
    }

    // Skills
    if (student.profile.skills && student.profile.skills.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Skills', leftMargin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const skillsText = student.profile.skills.map(s => s.name).join(', ');
      const skillsLines = pdf.splitTextToSize(skillsText, pageWidth - 40);
      pdf.text(skillsLines, leftMargin, yPosition);
      yPosition += skillsLines.length * 5 + 5;
    }

    // Projects
    if (student.profile.projects && student.profile.projects.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Projects', leftMargin, yPosition);
      yPosition += 7;

      student.profile.projects.forEach(project => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(project.title, leftMargin, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(project.description, pageWidth - 40);
        pdf.text(descLines, leftMargin, yPosition);
        yPosition += descLines.length * 5 + 3;
      });
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating resume:', error);
    throw error;
  }
};
