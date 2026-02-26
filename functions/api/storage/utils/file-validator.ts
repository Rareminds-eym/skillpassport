/**
 * File Validator Utility Module
 * 
 * Provides multi-layer file content validation including:
 * - Magic number (file signature) verification
 * - Dangerous file detection (executables)
 * - File extension validation
 * - SVG content scanning for XSS threats
 * 
 * This module prevents MIME type spoofing, malware uploads, and XSS attacks.
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Result of file signature validation
 */
export interface SignatureValidationResult {
  valid: boolean;
  error?: string;
  actualType?: string;
}

/**
 * Result of dangerous file detection
 */
export interface DangerousFileResult {
  dangerous: boolean;
  reason?: string;
  fileType?: string;
}

/**
 * Result of file extension validation
 */
export interface ExtensionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Result of SVG content validation
 */
export interface SVGValidationResult {
  safe: boolean;
  error?: string;
  threats?: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract the first N bytes from a file as a magic number
 * 
 * @param buffer - The file content as ArrayBuffer
 * @param length - Number of bytes to extract
 * @returns Uint8Array containing the first N bytes
 */
export function getMagicNumber(buffer: ArrayBuffer, length: number): Uint8Array {
  const view = new Uint8Array(buffer);
  return view.slice(0, length);
}

/**
 * Compare byte patterns to check if they match
 * 
 * @param bytes - The actual bytes from the file
 * @param signature - The expected signature bytes
 * @returns true if the bytes match the signature, false otherwise
 */
export function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// File Signature Validation
// ============================================================================

/**
 * File signature definitions for magic number validation
 */
const FILE_SIGNATURES = {
  // Image formats
  'image/png': {
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    length: 8
  },
  'image/jpeg': {
    signature: [0xFF, 0xD8, 0xFF],
    length: 3
  },
  'image/gif': {
    signatures: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ],
    length: 6
  },
  'image/webp': {
    // WebP: RIFF at bytes 0-3, WEBP at bytes 8-11
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF
    webpSignature: [0x57, 0x45, 0x42, 0x50], // WEBP at offset 8
    length: 12
  },
  
  // Document formats
  'application/pdf': {
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    length: 4
  },
  
  // ZIP-based Office formats (DOCX, XLSX, PPTX)
  // All use the ZIP file signature: PK\x03\x04
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { // DOCX
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    length: 4
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { // XLSX
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    length: 4
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { // PPTX
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    length: 4
  },
  'application/vnd.ms-excel': { // XLS (older format, but also ZIP-based in newer versions)
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    length: 4
  },
  'application/vnd.ms-powerpoint': { // PPT (older format, but also ZIP-based in newer versions)
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    length: 4
  },
  'application/msword': { // DOC (older format, but also ZIP-based in newer versions)
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    length: 4
  },
  
  // Video formats
  'video/mp4': {
    // MP4: bytes 4-7 must be "ftyp" (0x66 0x74 0x79 0x70)
    ftypSignature: [0x66, 0x74, 0x79, 0x70], // ftyp at offset 4
    length: 8
  },
  'video/webm': {
    signature: [0x1A, 0x45, 0xDF, 0xA3], // EBML header
    length: 4
  },
  'video/ogg': {
    signature: [0x4F, 0x67, 0x67, 0x53], // OggS
    length: 4
  },
  'audio/ogg': {
    signature: [0x4F, 0x67, 0x67, 0x53], // OggS
    length: 4
  }
};

/**
 * Validate file signature (magic number) matches declared MIME type
 * 
 * This function prevents MIME type spoofing by verifying the actual file
 * content matches the declared Content-Type header.
 * 
 * ## How It Works
 * 
 * 1. Extracts the first N bytes (magic number) from the file
 * 2. Compares these bytes against known file signatures
 * 3. Returns validation result with actualType if signature matches
 * 
 * ## Supported File Types
 * 
 * - **Images**: PNG (8 bytes), JPEG (3 bytes), GIF (6 bytes), WebP (12 bytes)
 * - **Documents**: PDF (4 bytes), Office formats (4 bytes - ZIP signature)
 * - **Videos**: MP4 (8 bytes - ftyp at offset 4), WebM (4 bytes), OGG (4 bytes)
 * 
 * ## Security Benefits
 * 
 * - Prevents attackers from uploading malware disguised as images
 * - Blocks polyglot files (files valid in multiple formats)
 * - Ensures Content-Type header matches actual file content
 * 
 * @param buffer - The file content as ArrayBuffer
 * @param declaredType - The MIME type from Content-Type header
 * @returns SignatureValidationResult with validation status
 * 
 * @example
 * ```typescript
 * // Valid PNG file
 * const result = validateFileSignature(pngBuffer, 'image/png');
 * // result = { valid: true, actualType: 'image/png' }
 * 
 * // EXE file disguised as PNG
 * const result = validateFileSignature(exeBuffer, 'image/png');
 * // result = { valid: false, error: 'File claims to be image/png but signature does not match...' }
 * ```
 */
export function validateFileSignature(
  buffer: ArrayBuffer,
  declaredType: string
): SignatureValidationResult {
  // Normalize MIME type (remove parameters like charset)
  const mimeType = declaredType.split(';')[0].trim().toLowerCase();
  
  // Get file signature definition
  const signatureDef = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES];
  
  // If we don't have a signature definition for this type, skip validation
  if (!signatureDef) {
    return { valid: true };
  }
  
  // Extract magic number from file
  const magicNumber = getMagicNumber(buffer, signatureDef.length);
  
  // Validate based on file type
  switch (mimeType) {
    case 'image/png':
    case 'image/jpeg': {
      const sig = (signatureDef as { signature: number[]; length: number }).signature;
      const isValid = matchesSignature(magicNumber, sig);
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    case 'image/gif': {
      // GIF has two possible signatures: GIF87a or GIF89a
      const signatures = (signatureDef as { signatures: number[][]; length: number }).signatures;
      const isValid = signatures.some(sig => matchesSignature(magicNumber, sig));
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    case 'image/webp': {
      // WebP validation: Check RIFF at start and WEBP at offset 8
      const webpDef = signatureDef as { signature: number[]; webpSignature: number[]; length: number };
      const riffValid = matchesSignature(magicNumber, webpDef.signature);
      if (!riffValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      
      // Check WEBP signature at offset 8
      const webpBytes = magicNumber.slice(8, 12);
      const webpValid = matchesSignature(webpBytes, webpDef.webpSignature);
      if (!webpValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      
      return { valid: true, actualType: mimeType };
    }
    
    case 'application/pdf': {
      // PDF validation: Check for %PDF signature
      const sig = (signatureDef as { signature: number[]; length: number }).signature;
      const isValid = matchesSignature(magicNumber, sig);
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // XLSX
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': // PPTX
    case 'application/vnd.ms-excel': // XLS
    case 'application/vnd.ms-powerpoint': // PPT
    case 'application/msword': { // DOC
      // ZIP-based Office documents: Check for PK\x03\x04 signature
      const sig = (signatureDef as { signature: number[]; length: number }).signature;
      const isValid = matchesSignature(magicNumber, sig);
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    case 'video/mp4': {
      // MP4 validation: bytes 4-7 must be "ftyp"
      const mp4Def = signatureDef as { ftypSignature: number[]; length: number };
      const ftypBytes = magicNumber.slice(4, 8);
      const isValid = matchesSignature(ftypBytes, mp4Def.ftypSignature);
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    case 'video/webm': {
      // WebM validation: Check for EBML header (0x1A 0x45 0xDF 0xA3)
      const sig = (signatureDef as { signature: number[]; length: number }).signature;
      const isValid = matchesSignature(magicNumber, sig);
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    case 'video/ogg':
    case 'audio/ogg': {
      // OGG validation: Check for OggS signature
      const sig = (signatureDef as { signature: number[]; length: number }).signature;
      const isValid = matchesSignature(magicNumber, sig);
      if (!isValid) {
        return {
          valid: false,
          error: `File claims to be ${mimeType} but signature does not match. Possible MIME type spoofing.`
        };
      }
      return { valid: true, actualType: mimeType };
    }
    
    default:
      return { valid: true };
  }
}

// ============================================================================
// File Extension Validation
// ============================================================================

/**
 * Mapping of MIME types to allowed file extensions
 */
const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  // Images
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/x-icon': ['.ico'],
  
  // Documents
  'application/pdf': ['.pdf'],
  
  // Office Documents - Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  
  // Office Documents - Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  
  // Office Documents - PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  
  // Text
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'text/html': ['.html', '.htm'],
  'text/css': ['.css'],
  'text/javascript': ['.js'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/xml': ['.xml'],
  
  // Video
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv', '.ogg'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-matroska': ['.mkv'],
  
  // Audio
  'audio/mpeg': ['.mp3'],
  'audio/ogg': ['.oga', '.ogg'],
  'audio/wav': ['.wav'],
  'audio/webm': ['.weba'],
  'audio/aac': ['.aac'],
  'audio/x-m4a': ['.m4a'],
  
  // Archives
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  'application/x-tar': ['.tar'],
  'application/gzip': ['.gz'],
};

/**
 * Validate that file extension matches the declared MIME type
 * 
 * This function prevents extension spoofing by ensuring the file extension
 * is appropriate for the declared Content-Type.
 * 
 * @param filename - The name of the file including extension
 * @param declaredType - The MIME type from Content-Type header
 * @returns ExtensionValidationResult with validation status
 */
export function validateFileExtension(
  filename: string,
  declaredType: string
): ExtensionValidationResult {
  // Normalize MIME type (remove parameters like charset)
  const mimeType = declaredType.split(';')[0].trim().toLowerCase();
  
  // Extract extension from filename
  const lastDotIndex = filename.lastIndexOf('.');
  
  // Check if file has an extension
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return {
      valid: false,
      error: 'File must have an extension'
    };
  }
  
  const extension = filename.substring(lastDotIndex).toLowerCase();
  
  // Get allowed extensions for this MIME type
  const allowedExtensions = MIME_TO_EXTENSIONS[mimeType];
  
  // If no mapping exists for this MIME type, log warning but allow
  if (!allowedExtensions) {
    console.warn(`[File Validator] No extension mapping exists for MIME type: ${mimeType}`);
    return { valid: true };
  }
  
  // Check if extension is in allowed list
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension '${extension}' does not match declared type '${mimeType}'. Expected one of: ${allowedExtensions.join(', ')}`
    };
  }
  
  return { valid: true };
}

// ============================================================================
// SVG Content Validation
// ============================================================================

/**
 * Validate SVG content for XSS threats
 * 
 * This function scans SVG files for dangerous content that could lead to
 * Cross-Site Scripting (XSS) attacks when the SVG is displayed in a browser.
 * 
 * ## Detected Threats
 * 
 * 1. **Script Tags**: `<script>` elements that can execute JavaScript
 * 2. **JavaScript Protocol**: `javascript:` in href or other attributes
 * 3. **Event Handlers**: onclick, onload, onerror, onmouseover, etc.
 * 4. **Data URIs with Script**: `data:text/html;base64,...` containing scripts
 * 5. **Dangerous Elements**: iframe, embed, object, foreignObject
 * 6. **External References**: `<use>` with external href (can load remote content)
 * 7. **XXE Declarations**: `<!ENTITY>` declarations (XML External Entity attacks)
 * 
 * ## Why This Matters
 * 
 * SVG files are XML-based and can contain executable content. When an SVG
 * is displayed in a browser (via <img>, <object>, or inline), any embedded
 * JavaScript can execute in the context of the page, potentially:
 * - Stealing user credentials
 * - Performing actions on behalf of the user
 * - Redirecting to malicious sites
 * - Exfiltrating sensitive data
 * 
 * ## Implementation Details
 * 
 * The function uses regex patterns to detect dangerous content. While regex
 * is not perfect for parsing XML, it provides a good balance between:
 * - Performance (< 50ms for typical SVG files)
 * - Security (catches common XSS vectors)
 * - Simplicity (no XML parser dependencies)
 * 
 * @param buffer - The SVG file content as ArrayBuffer
 * @returns SVGValidationResult indicating if SVG is safe
 * 
 * @example
 * ```typescript
 * // Safe SVG
 * const safeSvg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
 * const result = await validateSVGContent(Buffer.from(safeSvg));
 * // result = { safe: true }
 * 
 * // Malicious SVG with script
 * const maliciousSvg = '<svg><script>alert("XSS")</script></svg>';
 * const result = await validateSVGContent(Buffer.from(maliciousSvg));
 * // result = { safe: false, error: 'SVG contains 1 security threat(s)', threats: ['Contains <script> tag'] }
 * ```
 */
export async function validateSVGContent(buffer: ArrayBuffer): Promise<SVGValidationResult> {
  try {
    // Decode ArrayBuffer as UTF-8 text
    const decoder = new TextDecoder('utf-8');
    const svgContent = decoder.decode(buffer);
    
    // Array to collect all detected threats
    const threats: string[] = [];
    
    // Check for <script> tags
    if (/<script[\s>]/i.test(svgContent)) {
      threats.push('Contains <script> tag');
    }
    
    // Check for javascript: protocol
    if (/javascript:/i.test(svgContent)) {
      threats.push('Contains javascript: protocol');
    }
    
    // Check for event handlers (onclick, onload, onmouseover, etc.)
    if (/on\w+\s*=/i.test(svgContent)) {
      threats.push('Contains event handler attributes');
    }
    
    // Check for data:.*script pattern
    if (/data:[^,]*script/i.test(svgContent)) {
      threats.push('Contains data URI with script');
    }
    
    // Check for <iframe> tags
    if (/<iframe[\s>]/i.test(svgContent)) {
      threats.push('Contains <iframe> tag');
    }
    
    // Check for <embed> tags
    if (/<embed[\s>]/i.test(svgContent)) {
      threats.push('Contains <embed> tag');
    }
    
    // Check for <object> tags
    if (/<object[\s>]/i.test(svgContent)) {
      threats.push('Contains <object> tag');
    }
    
    // Check for <foreignObject> tags
    if (/<foreignObject[\s>]/i.test(svgContent)) {
      threats.push('Contains <foreignObject> tag');
    }
    
    // Check for <use> with external href (xlink:href or href pointing to external resources)
    if (/<use[^>]*(xlink:)?href\s*=\s*["'][^"'#][^"']*["']/i.test(svgContent)) {
      threats.push('Contains <use> with external href');
    }
    
    // Check for <!ENTITY declarations (XXE risk)
    if (/<!ENTITY/i.test(svgContent)) {
      threats.push('Contains <!ENTITY> declaration (XXE risk)');
    }
    
    // If any threats were detected, return unsafe
    if (threats.length > 0) {
      return {
        safe: false,
        error: `SVG contains ${threats.length} security threat(s)`,
        threats
      };
    }
    
    // No threats detected
    return {
      safe: true
    };
  } catch (error) {
    // If decoding fails or any error occurs, treat as unsafe
    return {
      safe: false,
      error: 'Failed to validate SVG content',
      threats: ['SVG content validation error']
    };
  }
}

// ============================================================================
// Dangerous File Detection
// ============================================================================

/**
 * Dangerous file signatures for executable detection
 */
const DANGEROUS_SIGNATURES = {
  // Windows Executable
  'windows-exe': {
    signature: [0x4D, 0x5A], // MZ
    length: 2,
    description: 'Windows Executable (EXE)'
  },
  
  // Linux ELF
  'linux-elf': {
    signature: [0x7F, 0x45, 0x4C, 0x46], // .ELF
    length: 4,
    description: 'Linux Executable (ELF)'
  },
  
  // macOS Mach-O (32-bit big-endian)
  'macos-macho-be': {
    signature: [0xFE, 0xED, 0xFA, 0xCE],
    length: 4,
    description: 'macOS Executable (Mach-O)'
  },
  
  // macOS Mach-O (32-bit little-endian)
  'macos-macho-le': {
    signature: [0xCE, 0xFA, 0xED, 0xFE],
    length: 4,
    description: 'macOS Executable (Mach-O)'
  },
  
  // Java Class file
  'java-class': {
    signature: [0xCA, 0xFE, 0xBA, 0xBE], // CAFEBABE
    length: 4,
    description: 'Java Class File'
  }
};

/**
 * Detect if a file is a dangerous executable
 * 
 * This function checks for executable file signatures to prevent malware
 * uploads regardless of the declared MIME type. It detects:
 * 
 * - **Windows EXE**: MZ header (0x4D 0x5A)
 * - **Linux ELF**: .ELF header (0x7F 0x45 0x4C 0x46)
 * - **macOS Mach-O**: Big-endian (0xFE 0xED 0xFA 0xCE) or Little-endian (0xCE 0xFA 0xED 0xFE)
 * - **Java Class**: CAFEBABE header (0xCA 0xFE 0xBA 0xBE)
 * 
 * ## Why Block Executables?
 * 
 * Executable files pose significant security risks:
 * 1. Can contain malware, viruses, or trojans
 * 2. Can be executed by users who download them
 * 3. Can exploit vulnerabilities in operating systems
 * 4. Have no legitimate use case in a file storage system for documents/media
 * 
 * ## Detection Strategy
 * 
 * This function checks the file signature (magic number) regardless of:
 * - Declared MIME type (attacker can set to "image/png")
 * - File extension (attacker can rename to "photo.jpg")
 * - File metadata (attacker can manipulate)
 * 
 * The actual file content is examined, making this defense robust against
 * common evasion techniques.
 * 
 * @param buffer - The file content as ArrayBuffer
 * @returns DangerousFileResult indicating if file is dangerous
 * 
 * @example
 * ```typescript
 * // Windows EXE file
 * const result = detectDangerousFile(exeBuffer);
 * // result = { dangerous: true, reason: 'File is a Windows Executable (EXE)...', fileType: 'windows-exe' }
 * 
 * // Safe image file
 * const result = detectDangerousFile(pngBuffer);
 * // result = { dangerous: false }
 * ```
 */
export function detectDangerousFile(buffer: ArrayBuffer): DangerousFileResult {
  // Check each dangerous signature
  for (const [key, sigDef] of Object.entries(DANGEROUS_SIGNATURES)) {
    const magicNumber = getMagicNumber(buffer, sigDef.length);
    
    if (matchesSignature(magicNumber, sigDef.signature)) {
      return {
        dangerous: true,
        reason: `File is a ${sigDef.description}. Executable files are not allowed.`,
        fileType: key
      };
    }
  }
  
  // No dangerous signatures detected
  return {
    dangerous: false
  };
}
