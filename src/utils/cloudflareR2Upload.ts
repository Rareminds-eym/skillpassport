import { supabase } from '../lib/supabaseClient';

/**
 * Upload Utility
 * Handles image uploads to Cloudflare R2 (via Edge Function) or Supabase Storage (fallback)
 */

interface R2UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  storage?: 'cloudflare-r2' | 'supabase-storage';
}

/**
 * Upload an image file to Cloudflare R2 (preferred) or Supabase Storage (fallback)
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

    // Try Cloudflare R2 first (via Edge Function)
    try {
      console.log('🚀 Attempting upload to Cloudflare R2...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', filename);

      const response = await fetch('/api/upload-to-r2', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Uploaded to Cloudflare R2:', data.url);
        return {
          success: true,
          url: data.url,
          storage: 'cloudflare-r2'
        };
      } else {
        console.log('⚠️ Cloudflare R2 not available, falling back to Supabase Storage');
      }
    } catch (r2Error) {
      console.log('⚠️ Cloudflare R2 error, falling back to Supabase Storage:', r2Error);
    }

    // Fallback to Supabase Storage
    console.log('📦 Uploading to Supabase Storage...');
    
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase storage error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(filename);

    console.log('✅ Uploaded to Supabase Storage:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      storage: 'supabase-storage'
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
 * Delete an image from Supabase Storage
 * @param url - The full URL of the image to delete
 * @returns Promise with success status
 */
export async function deleteFromCloudflareR2(url: string): Promise<boolean> {
  try {
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts.slice(-2).join('/'); // Get folder/filename

    const { error } = await supabase.storage
      .from('course-images')
      .remove([filename]);

    if (error) {
      console.error('Error deleting from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
