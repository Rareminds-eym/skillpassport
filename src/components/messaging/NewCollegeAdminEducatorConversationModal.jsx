import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  AcademicCapIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Modal for college admins to start conversations with college educators
 */
const NewCollegeAdminEducatorConversationModal = ({
  isOpen,
  onClose,
  onCreateConversation,
  adminId,
  collegeId
}) => {
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [educators, setEducators] = useState([]);
  const [loadingEducators, setLoadingEducators] = useState(false);

  // Predefined subjects for college admin-educator conversations
  const predefinedSubjects = [
    'General Discussion',
    'Course Planning',
    'Student Issues',
    'Department Matters',
    'Resource Allocation',
    'Policy Updates',
    'Schedule Coordination',
    'Performance Review',
    'Administrative Notice',
    'Other'
  ];

  // Fetch college educators
  useEffect(() => {
    const fetchEducators = async () => {
      if (!collegeId || !isOpen) return;

      setLoadingEducators(true);
      try {
        console.log('🔍 [NewCollegeAdminEducatorModal] Fetching educators for college:', collegeId);

        const { data: educatorData, error: educatorError } = await supabase
          .from('college_lecturers')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            email,
            department,
            specialization,
            phone
          `)
          .eq('collegeId', collegeId)
          .order('first_name', { ascending: true });

        if (educatorError) {
          console.error('❌ [NewCollegeAdminEducatorModal] Error fetching educators:', educatorError);
          throw educatorError;
        }

        console.log('✅ [NewCollegeAdminEducatorModal] Educators loaded:', educatorData?.length || 0);
        setEducators(educatorData || []);

      } catch (error) {
        console.error('❌ [NewCollegeAdminEducatorModal] Error:', error);
        toast.error('Failed to load college educators');
      } finally {
        setLoadingEducators(false);
      }
    };

    fetchEducators();
  }, [collegeId, isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedEducator(null);
      setSubject('General Discussion');
      setCustomSubject('');
      setInitialMessage('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter educators based on search query
  const filteredEducators = educators.filter(educator => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const fullName = `${educator.first_name} ${educator.last_name}`.toLowerCase();
    const email = educator.email?.toLowerCase() || '';
    const department = educator.department?.toLowerCase() || '';
    const specialization = educator.specialization?.toLowerCase() || '';
    
    return fullName.includes(query) || 
           email.includes(query) || 
           department.includes(query) || 
           specialization.includes(query);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEducator) {
      toast.error('Please select a college educator');
      return;
    }

    // Determine the final subject to use
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject.trim();
    
    if (!finalSubject) {
      toast.error(subject === 'Other' ? 'Please enter a custom subject' : 'Please select a subject');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 [NewCollegeAdminEducatorModal] Creating conversation:', {
        adminId,
        educatorId: selectedEducator.id,
        collegeId,
        subject: finalSubject,
        hasInitialMessage: !!initialMessage.trim()
      });

      await onCreateConversation({
        adminId,
        educatorId: selectedEducator.id,
        collegeId,
        subject: finalSubject,
        initialMessage: initialMessage.trim()
      });

      // Reset form and close modal
      setSelectedEducator(null);
      setSubject('General Discussion');
      setCustomSubject('');
      setInitialMessage('');
      setSearchQuery('');
      onClose();
      
    } catch (error) {
      console.error('❌ [NewCollegeAdminEducatorModal] Error creating conversation:', error);
      toast.error('Failed to start conversation with college educator');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Message College Educator</h2>
              <p className="text-sm text-gray-500">Start a conversation with a college educator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          {loadingEducators ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Educator Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Select College Educator *
                </label>
                
                {/* Search */}
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Educator List */}
                <div className="border-2 border-gray-300 rounded-xl max-h-48 overflow-y-auto">
                  {filteredEducators.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ExclamationTriangleIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-gray-600 text-sm">
                        {searchQuery ? `No educators found for "${searchQuery}"` : 'No college educators found'}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-blue-600 text-sm hover:underline mt-1"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredEducators.map((educator) => (
                      <button
                        key={educator.id}
                        type="button"
                        onClick={() => setSelectedEducator(educator)}
                        className={`w-full p-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                          selectedEducator?.id === educator.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {educator.first_name} {educator.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {educator.email}
                            </p>
                            {educator.department && (
                              <p className="text-xs text-blue-600 truncate">
                                {educator.department}
                                {educator.specialization && ` • ${educator.specialization}`}
                              </p>
                            )}
                          </div>
                          {selectedEducator?.id === educator.id && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    // Clear custom subject when switching away from "Other"
                    if (e.target.value !== 'Other') {
                      setCustomSubject('');
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  required
                >
                  {predefinedSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
                
                {/* Custom Subject Input - Show when "Other" is selected */}
                {subject === 'Other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter your custom subject..."
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      maxLength={100}
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-blue-600">
                        Enter a custom subject for your conversation
                      </p>
                      <span className="text-xs text-gray-400">
                        {customSubject.length}/100
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Choose the topic for your conversation with the educator
                </p>
              </div>

              {/* Initial Message */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Initial Message (Optional)
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your message to the college educator..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Send an initial message to start the conversation
                  </p>
                  <span className="text-xs text-gray-400">
                    {initialMessage.length}/500
                  </span>
                </div>
              </div>

              {/* Selected Educator Preview */}
              {selectedEducator && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900">
                        {selectedEducator.first_name} {selectedEducator.last_name}
                      </h3>
                      <p className="text-blue-600 text-sm">{selectedEducator.email}</p>
                      {selectedEducator.department && (
                        <p className="text-blue-500 text-xs">
                          {selectedEducator.department}
                          {selectedEducator.specialization && ` • ${selectedEducator.specialization}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Administrative Communication
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This will create a private conversation between you and the selected college educator. 
                      Use this for administrative matters, policy updates, or departmental coordination.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!loadingEducators && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedEducator || !subject.trim() || (subject === 'Other' && !customSubject.trim())}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  Start Conversation
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCollegeAdminEducatorConversationModal;