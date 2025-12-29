/**
 * Upload Utility
 * Handles image uploads to Cloudflare R2 via storage-api worker
 */

// Storage API worker URL - update this with your deployed worker URL
const STORAGE_API_URL = import.meta.env.VITE_STORAGE_API_URL || 'https://storage-api.rareminds.workers.dev';

interface R2UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to Cloudflare R2
 * @param file - The image file to upload
 * @param folder - The folder path (e.g., 'courses')
 * @returns Promise with the uploaded file URL
 */
export async function uploadToCloudflareR2(
  file: File,
  folder: string = 'courses'
): Promise<R2UploadResponse> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please upload an image file (PNG, JPG, JPEG, GIF, WebP)'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Image size must be less than 5MB'
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

    console.log('🚀 Uploading to Cloudflare R2...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);

    const response = await fetch(`${STORAGE_API_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Upload failed:', errorData);
      return {
        success: false,
        error: errorData.error || `Upload failed with status ${response.status}`
      };
    }

    const data = await response.json();
    console.log('✅ Uploaded to Cloudflare R2:', data.url);
    
    return {
      success: true,
      url: data.url
    };

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete an image from Cloudflare R2
 * @param url - The full URL of the image to delete
 * @returns Promise with success status
 */
export async function deleteFromCloudflareR2(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${STORAGE_API_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      console.error('Error deleting from R2:', await response.text());
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
