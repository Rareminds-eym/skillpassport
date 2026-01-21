import React from 'react';

interface FacultyBulkImportProps {
  collegeId: string | null;
}

const FacultyBulkImport: React.FC<FacultyBulkImportProps> = ({ collegeId }) => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Bulk Faculty Import</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Import multiple faculty members at once using CSV file
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-gray-600">Bulk import feature coming soon...</p>
      </div>
    </div>
  );
};

export default FacultyBulkImport;
