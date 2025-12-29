import { useState } from 'react';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: string;
  student: string;
  activity: string;
}

const MediaManager = () => {
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        const newMedia: MediaFile = {
          id: `M${String(uploadedFiles.length + 1).padStart(3, '0')}`,
          name: file.name,
          type: file.type.includes('image')
            ? 'Image'
            : file.type.includes('pdf')
              ? 'PDF'
              : 'Video',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          student: '-',
          activity: '-',
        };
        setUploadedFiles([...uploadedFiles, newMedia]);
        setIsUploading(false);
        e.target.value = '';
      }, 500);
    }
  };

  const handleDelete = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">
        Media Upload & Resource Management
      </h1>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Media for Students
        </h2>
        <label className="flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-2xl text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
          <CloudArrowUpIcon className="h-10 w-10 text-emerald-500 mb-2" />
          <span className="text-sm font-medium text-emerald-700">
            {isUploading
              ? 'Uploading...'
              : 'Upload certificates, photos, or videos'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            PDF, JPG, PNG, MP4 files supported
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.mp4"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Storage Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Storage Info
        </h2>
        <p className="text-sm text-gray-600">
          Used: {uploadedFiles.length > 0 ? `${uploadedFiles.length} files` : '0 files'}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(uploadedFiles.length * 5, 100)}%` }}
          />
        </div>
      </div>

      {/* Media Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 p-6 pb-4">
          Uploaded Media
        </h2>

        {uploadedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <DocumentIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No media uploaded yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Upload files using the section above
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Activity
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((media) => (
                  <tr key={media.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{media.name}</td>
                    <td className="px-4 py-3 text-sm">{media.type}</td>
                    <td className="px-4 py-3 text-sm">{media.size}</td>
                    <td className="px-4 py-3 text-sm">{media.student}</td>
                    <td className="px-4 py-3 text-sm">{media.activity}</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-emerald-600 hover:text-emerald-700 mr-2">
                        Preview
                      </button>
                      <button className="text-blue-600 hover:text-blue-700 mr-2">
                        Download
                      </button>
                      <button
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => handleDelete(media.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaManager;
