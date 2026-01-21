import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import type { Student, PortfolioSettings } from '../types/student';

// Export portfolio as PDF
export const exportAsPDF = async (
  elementIdOrElement: string | HTMLElement = 'portfolio-content',
  filename: string = 'portfolio.pdf'
): Promise<void> => {
  try {
    let element: HTMLElement | null;

    if (typeof elementIdOrElement === 'string') {
      element = document.getElementById(elementIdOrElement);
    } else {
      element = elementIdOrElement;
    }

    if (!element) {
      throw new Error('Portfolio content not found');
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
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
      version: '1.0',
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    throw error;
  }
};

// Export as standalone HTML - captures actual rendered portfolio

export const exportAsHTML = async (
  student: Student,
  settings: PortfolioSettings,
  preferences: any,
  filename: string = 'portfolio.html'
): Promise<void> => {
  try {
    // Get the main portfolio container that has the actual layout rendered
    const portfolioContainer =
      document.querySelector('[data-layout-container]') ||
      document.querySelector('main') ||
      document.body;

    if (!portfolioContainer) {
      throw new Error('Portfolio content not found');
    }

    // Clone the content to avoid modifying the original
    const clonedContent = portfolioContainer.cloneNode(true) as HTMLElement;

    // Remove navigation, headers, and UI controls that shouldn't be in export
    clonedContent
      .querySelectorAll('header, nav, .fixed, [class*="back-button"], button[type="button"]')
      .forEach((el) => {
        const element = el as HTMLElement;
        // Keep social media links and project buttons
        if (
          !element.closest('a[href^="http"]') &&
          !element.querySelector('svg[class*="lucide"]')?.closest('a')
        ) {
          el.remove();
        }
      });

    // Convert all relative image URLs to absolute
    clonedContent.querySelectorAll('img').forEach((img) => {
      if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('http')) {
        img.src = new URL(img.src, window.location.origin).href;
      }
      img.setAttribute('onerror', "this.style.display='none'");
    });

    // Remove framer-motion animation attributes to prevent errors
    clonedContent.querySelectorAll('[style*="transform"], [style*="opacity"]').forEach((el) => {
      (el as HTMLElement).style.transform = '';
      (el as HTMLElement).style.opacity = '1';
    });

    // Build the complete HTML document with all necessary dependencies
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Professional portfolio of ${student.profile.name || 'Portfolio'}">
    <title>${student.profile.name || 'Portfolio'} - Professional Portfolio</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            overflow-x: hidden;
        }
        
        .fixed {
            position: relative !important;
        }
        
        html {
            scroll-behavior: smooth;
        }
        
        /* Disable animations for export */
        * {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
        }
        
        .bg-gradient-to-br,
        .bg-gradient-to-r,
        .bg-gradient-to-t {
            background-size: 200% 200%;
        }
        
        .group:hover .group-hover\\:scale-110 {
            transform: none;
        }
        
        @media print {
            body {
                background: white !important;
            }
            
            .no-print {
                display: none !important;
            }
            
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        .min-h-screen {
            min-height: auto;
        }
        
        section {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    ${clonedContent.innerHTML}
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 40px 20px; margin-top: 60px;">
        <p style="font-size: 1.1em; font-weight: 600;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="margin-top: 10px; opacity: 0.9; font-size: 0.95em;">This portfolio was created using Rareminds Skill Ecosystem Platform</p>
        ${
          preferences.includeContactDetails && student.profile.email
            ? `
        <div style="margin-top: 20px;">
            <a href="mailto:${student.profile.email}" style="color: white; text-decoration: none; opacity: 0.9;">📧 ${student.profile.email}</a>
        </div>
        `
            : ''
        }
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
        
        document.querySelectorAll('[style*="transform"]').forEach(el => {
            el.style.transform = '';
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
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
        light: options.color?.light || '#FFFFFF',
      },
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
        url,
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
      format: 'a4',
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
    // Note: phone and location fields are in Student object
    const studentData = student as Student;
    if (studentData.contact_number) {
      pdf.text(studentData.contact_number, leftMargin, yPosition);
      yPosition += 5;
    }
    if (studentData.district_name) {
      pdf.text(studentData.district_name, leftMargin, yPosition);
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

      student.profile.education.forEach((edu) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(edu.degree, leftMargin, yPosition);
        yPosition += 5;

        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `${edu.institution} | ${edu.startDate} - ${edu.endDate || 'Present'}`,
          leftMargin,
          yPosition
        );
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
      const skillsText = student.profile.skills.map((s) => s.name).join(', ');
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

      student.profile.projects.forEach((project) => {
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
