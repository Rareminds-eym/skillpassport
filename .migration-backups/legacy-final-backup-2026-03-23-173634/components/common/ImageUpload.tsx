import React, { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { uploadToCloudflareR2 } from '../../utils/cloudflareR2Upload';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  folder = 'courses',
  label = 'Thumbnail/Icon',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [storageInfo, setStorageInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to Cloudflare R2 or Supabase Storage
      const result = await uploadToCloudflareR2(file, folder);

      if (result.success && result.url) {
        onImageChange(result.url);
        setPreview(result.url);
        
        // Show which storage was used
        const storageName = result.storage === 'cloudflare-r2' 
          ? '☁️ Cloudflare R2' 
          : '📦 Supabase Storage';
        setStorageInfo(`Uploaded to ${storageName}`);
        
        // Clear storage info after 3 seconds
        setTimeout(() => setStorageInfo(null), 3000);
      } else {
        setError(result.error || 'Upload failed');
        setPreview(currentImage || null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="flex items-center gap-3">
        {/* Preview or Upload Button */}
        <div
          onClick={!uploading ? handleClick : undefined}
          className={`relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden ${
            uploading
              ? 'border-gray-300 bg-gray-50 cursor-wait'
              : 'border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50 cursor-pointer transition-colors'
          }`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </>
          ) : uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-xs text-gray-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <PhotoIcon className="h-10 w-10" />
              <span className="text-xs">Click to upload</span>
            </div>
          )}
        </div>

        {/* Upload Instructions */}
        <div className="flex-1">
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">Upload course thumbnail</p>
            <ul className="text-xs space-y-0.5">
              <li>• Recommended: 800x600px or 16:9 ratio</li>
              <li>• Max size: 5MB</li>
              <li>• Formats: PNG, JPG, JPEG, GIF, WebP</li>
            </ul>
          </div>

          {!preview && (
            <button
              onClick={handleClick}
              disabled={uploading}
              className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Choose File
            </button>
          )}
        </div>
      </div>

      {/* Storage Info Message */}
      {storageInfo && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{storageInfo}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
