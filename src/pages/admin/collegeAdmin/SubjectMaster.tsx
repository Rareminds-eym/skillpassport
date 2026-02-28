import React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

// ==================== COURSE MASTER - TEMPORARILY DISABLED ====================
// This entire component has been commented out for maintenance purposes.
// To restore functionality, uncomment the code below and remove this placeholder.

const SubjectMaster: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Course Master
          </h2>
          <p className="text-gray-600 mb-4">
            This feature is currently under maintenance
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              The Course Master functionality has been temporarily disabled for system updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectMaster;

/* 
// ==================== ORIGINAL COURSE MASTER CODE (COMMENTED OUT) ====================
// 
// import React, { useState, useEffect } from 'react';
// import {
//   PlusIcon,
//   MagnifyingGlassIcon,
//   PencilIcon,
//   TrashIcon,
//   BookOpenIcon,
//   AcademicCapIcon,
//   ClockIcon,
//   UserGroupIcon,
//   ChevronDownIcon,
//   FunnelIcon,
//   XMarkIcon,
// } from '@heroicons/react/24/outline';
// import { supabase } from '../../../lib/supabaseClient';
// import { usePermissions } from '../../../hooks/usePermissions';
// import { useAuth } from '../../../context/AuthContext';
// import toast from 'react-hot-toast';
// 
// interface Subject {
//   id: string;
//   subject_name: string;
//   subject_code: string;
//   credits: number;
//   department: string;
//   semester: number;
//   subject_type: 'theory' | 'practical' | 'lab';
//   description?: string;
//   prerequisites?: string;
//   is_active: boolean;
//   created_at: string;
//   updated_at: string;
// }
// 
// interface SubjectFormData {
//   subject_name: string;
//   subject_code: string;
//   credits: number;
//   department: string;
//   semester: number;
//   subject_type: 'theory' | 'practical' | 'lab';
//   description: string;
//   prerequisites: string;
//   is_active: boolean;
// }
// 
// const SubjectMaster: React.FC = () => {
//   // All the original component code would be here...
//   // This has been commented out to disable the functionality
// };
// 
// export default SubjectMaster;
*/