import React from 'react';

export const LibraryHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        Library Module
      </h1>
      <p className="text-gray-600 text-sm sm:text-base">
        Manage books, track issues and returns, monitor overdue items
      </p>
    </div>
  );
};
