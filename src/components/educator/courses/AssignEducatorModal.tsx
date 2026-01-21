import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';

interface Educator {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AssignEducatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (educatorId: string, educatorName: string) => void;
  currentEducatorId: string;
  currentEducatorName: string;
  schoolId: string;
}

const AssignEducatorModal: React.FC<AssignEducatorModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  currentEducatorId,
  currentEducatorName,
  schoolId,
}) => {
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEducatorId, setSelectedEducatorId] = useState(currentEducatorId);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && schoolId) {
      fetchEducators();
    }
  }, [isOpen, schoolId]);

  const fetchEducators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('school_educators')
        .select('user_id, first_name, last_name, email')
        .eq('school_id', schoolId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setEducators(data || []);
    } catch (error) {
      console.error('Error fetching educators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEducators = educators.filter((educator) => {
    const fullName = `${educator.first_name} ${educator.last_name}`.toLowerCase();
    const email = educator.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleAssign = () => {
    const selectedEducator = educators.find((e) => e.user_id === selectedEducatorId);
    if (selectedEducator) {
      const educatorName = `${selectedEducator.first_name} ${selectedEducator.last_name}`.trim();
      onAssign(selectedEducatorId, educatorName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Assign Educator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Educator */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-1">Current Educator</p>
            <p className="text-sm text-blue-700">{currentEducatorName}</p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search educators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Educators List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading educators...</p>
            </div>
          ) : filteredEducators.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No educators found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEducators.map((educator) => {
                const fullName = `${educator.first_name} ${educator.last_name}`.trim();
                const isSelected = educator.user_id === selectedEducatorId;

                return (
                  <button
                    key={educator.user_id}
                    onClick={() => setSelectedEducatorId(educator.user_id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          isSelected ? 'bg-indigo-600' : 'bg-gray-400'
                        }`}
                      >
                        {educator.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}
                        >
                          {fullName}
                        </p>
                        <p
                          className={`text-sm ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}
                        >
                          {educator.email}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedEducatorId || selectedEducatorId === currentEducatorId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Assign Educator
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignEducatorModal;
