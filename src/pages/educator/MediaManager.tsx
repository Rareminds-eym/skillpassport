import { useState } from 'react';

const mockMedia = [
  { id: 'M001', name: 'certificate.pdf', type: 'PDF', size: '2.3 MB', student: 'John Doe', activity: 'Science Project' },
  { id: 'M002', name: 'portfolio.jpg', type: 'Image', size: '1.5 MB', student: 'Priya S.', activity: 'Art Portfolio' },
];

const MediaManager = () => {
  const [uploadedFiles, setUploadedFiles] = useState(mockMedia);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload
      const newMedia = {
        id: `M${String(uploadedFiles.length + 1).padStart(3, '0')}`,
        name: file.name,
        type: file.type.includes('image') ? 'Image' : file.type.includes('pdf') ? 'PDF' : 'Video',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        student: 'New Student',
        activity: 'New Activity',
      };
      setUploadedFiles([...uploadedFiles, newMedia]);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Media Upload & Resource Management</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Media for Students</h2>
        <label className="flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-2xl text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
          <span className="text-sm font-medium text-emerald-700">Upload certificates, photos, or videos</span>
          <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, MP4 files supported</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.mp4"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Storage Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Info</h2>
        <p className="text-sm text-gray-600">Used: 45.2 GB / 100 GB</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }} />
        </div>
      </div>

      {/* Media Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 p-6 pb-4">Uploaded Media</h2>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Size</th>
              <th className="px-4 py-2 text-left">Student</th>
              <th className="px-4 py-2 text-left">Activity</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploadedFiles.map(media => (
              <tr key={media.id} className="border-b">
                <td className="px-4 py-2">{media.name}</td>
                <td className="px-4 py-2">{media.type}</td>
                <td className="px-4 py-2">{media.size}</td>
                <td className="px-4 py-2">{media.student}</td>
                <td className="px-4 py-2">{media.activity}</td>
                <td className="px-4 py-2">
                  <button className="text-emerald-600 mr-2">Preview</button>
                  <button className="text-blue-600 mr-2">Download</button>
                  <button className="text-rose-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MediaManager;
