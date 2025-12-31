/**
 * Example: How to integrate DocumentManager into Student Dashboard
 * Add this to your student dashboard or profile page
 */

import React from 'react';
import DocumentManager from '../components/Students/components/DocumentManager';
import { useAuth } from '../hooks/useAuth'; // Adjust import path as needed

const StudentDashboard = () => {
  const { user } = useAuth(); // Get current authenticated user

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2">
          {/* Your existing dashboard content */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
            {/* Profile content */}
          </div>
          
          {/* Other dashboard sections */}
        </div>

        {/* Right Column - Documents */}
        <div className="lg:col-span-1">
          {/* Document Manager Component */}
          <DocumentManager 
            studentId={user?.id} 
            className="mb-6"
          />
          
          {/* Other sidebar content */}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

/**
 * Alternative: Add as a separate tab in profile page
 */
const StudentProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'documents', label: 'Documents' }, // New tab
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <div>Profile content...</div>
        )}
        
        {activeTab === 'education' && (
          <div>Education content...</div>
        )}
        
        {activeTab === 'experience' && (
          <div>Experience content...</div>
        )}
        
        {activeTab === 'documents' && (
          <DocumentManager studentId={user?.id} />
        )}
        
        {activeTab === 'settings' && (
          <div>Settings content...</div>
        )}
      </div>
    </div>
  );
};

/**
 * Alternative: Add as a modal/popup
 */
const DocumentsModal = ({ isOpen, onClose, studentId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <DocumentManager studentId={studentId} className="border-0 shadow-none" />
        </div>
      </div>
    </div>
  );
};