import { getLogger } from '@/shared/config/logging';

const logger = getLogger('logo-loader');

export interface LogoData {
  dataUrl: string;        // jsPDF → doc.addImage(logo.dataUrl, 'PNG', ...)
  arrayBuffer: ArrayBuffer; // docx  → new ImageRun({ data: logo.arrayBuffer, type: 'png' })
  naturalWidth: number;   // Original image width in pixels
  naturalHeight: number;  // Original image height in pixels
}

export const WATERMARK_CONFIG = {
  text: 'RareMinds',
  color: {
    pdf: [200, 200, 200] as [number, number, number], // RGB for jsPDF
    docx: 'DDDDDD',                                   // hex for docx
  },
  opacity: 0.2,   // PDF only
  fontSize: {
    pdf: 50,
    docx: 80,     // docx size is in half-points
  },
  angle: 45,      // PDF only (DOCX uses frame positioning)
} as const;

/**
 * Load and convert logo image to multiple formats for PDF and DOCX export
 * Fetches /RMLogo.webp, converts WebP → PNG, returns both dataUrl and ArrayBuffer
 * 
 * @returns LogoData with both formats, or null on any failure
 */
export async function loadLogo(): Promise<LogoData | null> {
  try {
    // Step 1: Fetch the logo
    const response = await fetch('/RMLogo.webp');
    if (!response.ok) {
      logger.warn('Logo image not found', { status: response.status });
      return null;
    }
    
    const blob = await response.blob();
    
    // Step 2: Read blob as base64 using FileReader
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    
    // Step 3: Convert WebP → PNG via Canvas and capture dimensions
    const pngResult = await new Promise<{ dataUrl: string; width: number; height: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const pngDataUrl = ctx ? canvas.toDataURL('image/png') : null;
        resolve(pngDataUrl ? {
          dataUrl: pngDataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        } : null);
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    
    if (!pngResult) {
      logger.warn('Failed to convert logo to PNG');
      return null;
    }
    
    // Step 4: Convert dataUrl to ArrayBuffer for DOCX
    const parts = pngResult.dataUrl.split(',');
    if (parts.length !== 2 || !parts[1]) {
      logger.warn('Failed to extract base64 data from PNG dataUrl');
      return null;
    }
    const base64Data = parts[1];
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    
    return {
      dataUrl: pngResult.dataUrl,
      arrayBuffer,
      naturalWidth: pngResult.width,
      naturalHeight: pngResult.height,
    };
  } catch (err) {
    logger.warn('Failed to load logo', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
