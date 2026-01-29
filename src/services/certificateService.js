/**
 * Certificate Generation Service
 * Generates course completion certificates using Cloudflare R2 storage
 */

import { supabase } from '../lib/supabaseClient';
import { getPagesApiUrl } from '../utils/pagesUrl';

const STORAGE_API_URL = getPagesApiUrl('storage');

const generateCredentialId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
};

const generateCertificateImage = (studentName, courseName, completionDate, credentialId) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 850);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 850);

  // Borders
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, 1140, 790);
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 50, 1100, 750);

  // Corner decorations
  ctx.fillStyle = '#3b82f6';
  [[30, 30], [1130, 30], [30, 780], [1130, 780]].forEach(([x, y]) => {
    ctx.fillRect(x, y, 40, 8);
    ctx.fillRect(x, y, 8, 40);
  });

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('CERTIFICATE', 600, 130);
  ctx.fillStyle = '#3b82f6';
  ctx.font = '24px Georgia, serif';
  ctx.fillText('OF COMPLETION', 600, 170);

  // Decorative line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 200);
  ctx.lineTo(850, 200);
  ctx.stroke();

  // Content
  ctx.fillStyle = '#475569';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('This is to certify that', 600, 270);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText(studentName, 600, 340);

  // Name underline
  const nameWidth = ctx.measureText(studentName).width;
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(600 - nameWidth / 2 - 20, 355);
  ctx.lineTo(600 + nameWidth / 2 + 20, 355);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('has successfully completed the course', 600, 420);

  ctx.fillStyle = '#1e40af';
  ctx.font = ctx.measureText(courseName).width > 900 ? 'bold 28px Georgia, serif' : 'bold 36px Georgia, serif';
  ctx.fillText(courseName, 600, 490);

  ctx.fillStyle = '#475569';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(`Completed on ${completionDate}`, 600, 560);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px monospace';
  ctx.fillText(`Credential ID: ${credentialId}`, 600, 600);

  // Signature lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  [[200, 450], [750, 1000]].forEach(([start, end]) => {
    ctx.beginPath();
    ctx.moveTo(start, 720);
    ctx.lineTo(end, 720);
    ctx.stroke();
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('Course Instructor', 325, 745);
  ctx.fillText('Platform Administrator', 875, 745);

  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Skill Ecosystem Platform', 600, 800);

  return canvas.toDataURL('image/png', 1.0);
};

const dataURLtoBlob = (dataURL) => {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

const uploadToR2 = async (blob, studentId, courseId, credentialId) => {
  const filename = `certificates/${studentId}/${courseId}/${credentialId}.png`;
  const formData = new FormData();
  formData.append('file', blob, `${credentialId}.png`);
  formData.append('filename', filename);

  const response = await fetch(`${STORAGE_API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  
  // Return proxy URL instead of direct R2 URL (R2 bucket is not public)
  // This allows downloading through the storage-api worker which has R2 credentials
  return `${STORAGE_API_URL}/course-certificate?key=${encodeURIComponent(filename)}`;
};

export const generateCourseCertificate = async (studentId, studentName, courseId, courseName, educatorName) => {
  try {
    const credentialId = generateCredentialId();
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const certificateDataUrl = generateCertificateImage(studentName, courseName, completionDate, credentialId);
    let certificateUrl = certificateDataUrl;

    // Upload to R2
    try {
      const blob = dataURLtoBlob(certificateDataUrl);
      certificateUrl = await uploadToR2(blob, studentId, courseId, credentialId);
    } catch (err) {
      console.warn('R2 upload failed, using data URL:', err.message);
    }

    // Save to database
    await supabase.from('certificates').insert({
      student_id: studentId,
      title: `${courseName} - Course Completion`,
      issuer: educatorName || 'Skill Ecosystem Platform',
      level: 'Course Completion',
      credential_id: credentialId,
      link: certificateUrl,
      document_url: certificateUrl,
      issued_on: new Date().toISOString().split('T')[0],
      description: `Certificate of completion for "${courseName}"`,
      status: 'active',
      approval_status: 'approved',
      enabled: true
    });

    // Update enrollment
    await supabase
      .from('course_enrollments')
      .update({ certificate_url: certificateUrl })
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    // Embedding regeneration handled by database trigger on certificates table

    return { success: true, certificateUrl, credentialId };
  } catch (error) {
    console.error('Certificate generation error:', error);
    return { success: false, error: error.message };
  }
};

export const downloadCertificate = async (certificateUrl, courseName) => {
  const { getPagesApiUrl } = await import('../utils/pagesUrl');
  const STORAGE_API_URL = getPagesApiUrl('storage');
  
  try {
    // If it's a data URL, download directly
    if (certificateUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = certificateUrl;
      link.download = `${courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    let downloadUrl = certificateUrl;
    
    // If it's already a proxy URL, use it directly
    if (certificateUrl.includes('/course-certificate')) {
      downloadUrl = certificateUrl;
    } 
    // If it's a direct R2 URL, convert to proxy URL
    else if (certificateUrl.includes('.r2.dev/') || certificateUrl.includes('r2.cloudflarestorage.com')) {
      downloadUrl = `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}`;
    }
    // For any other URL, try using the proxy
    else {
      downloadUrl = `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}`;
    }
    
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Certificate download error:', error);
    throw error; // Re-throw so caller can handle it
  }
};

/**
 * Get the viewable/downloadable URL for a certificate
 * Converts direct R2 URLs to proxy URLs that work without public bucket access
 * @param {string} certificateUrl - The certificate URL
 * @param {string} mode - 'inline' for viewing in browser, 'download' for downloading
 */
export const getCertificateProxyUrl = (certificateUrl, mode = 'inline') => {
  const { getPagesApiUrl } = require('../utils/pagesUrl');
  const STORAGE_API_URL = getPagesApiUrl('storage');
  
  if (!certificateUrl) return null;
  
  // Data URLs work directly
  if (certificateUrl.startsWith('data:')) {
    return certificateUrl;
  }
  
  // Already a proxy URL - add/update mode parameter
  if (certificateUrl.includes('/course-certificate')) {
    const url = new URL(certificateUrl);
    url.searchParams.set('mode', mode);
    return url.toString();
  }
  
  // Convert R2 URL to proxy URL
  if (certificateUrl.includes('.r2.dev/') || certificateUrl.includes('r2.cloudflarestorage.com')) {
    return `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}&mode=${mode}`;
  }
  
  // For other URLs, try proxy
  return `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}&mode=${mode}`;
};
