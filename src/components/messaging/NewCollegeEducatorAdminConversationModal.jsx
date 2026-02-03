import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  AcademicCapIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Modal for college educators to start conversations with college admins
 */
const NewCollegeEducatorAdminConversationModal = ({
  isOpen,
  onClose,
  onCreateConversation,
  educatorId,
  collegeId
}) => {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loadingCollege, setLoadingCollege] = useState(false);

  // Predefined subjects for college educator-admin conversations
  const predefinedSubjects = [
    'General Discussion',
    'Course Planning',
    'Student Issues',
    'Department Matters',
    'Resource Requests',
    'Policy Questions',
    'Schedule Coordination',
    'Academic Support',
    'Administrative Help',
    'Other'
  ];

  // Fetch college information
  useEffect(() => {
    const fetchCollegeInfo = async () => {
      if (!collegeId || !isOpen) return;

      setLoadingCollege(true);
      try {
        console.log('🔍 [NewCollegeEducatorAdminModal] Fetching college info for:', collegeId);

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, admin_id')
          .eq('id', collegeId)
          .eq('organization_type', 'college')
          .single();

        if (orgError) {
          console.error('❌ [NewCollegeEducatorAdminModal] Error fetching college:', orgError);
          throw orgError;
        }

        console.log('✅ [NewCollegeEducatorAdminModal] College info loaded:', orgData);
        setCollegeInfo(orgData);

      } catch (error) {
        console.error('❌ [NewCollegeEducatorAdminModal] Error:', error);
        toast.error('Failed to load college information');
      } finally {
        setLoadingCollege(false);
      }
    };

    fetchCollegeInfo();
  }, [collegeId, isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSubject('General Discussion');
      setCustomSubject('');
      setInitialMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine the final subject to use
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject.trim();
    
    if (!finalSubject) {
      toast.error(subject === 'Other' ? 'Please enter a custom subject' : 'Please select a subject');
      return;
    }

    if (!collegeInfo?.admin_id) {
      toast.error('College admin not found');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 [NewCollegeEducatorAdminModal] Creating conversation:', {
        educatorId,
        collegeId,
        adminId: collegeInfo.admin_id,
        subject: finalSubject,
        hasInitialMessage: !!initialMessage.trim()
      });

      await onCreateConversation({
        educatorId,
        collegeId,
        adminId: collegeInfo.admin_id,
        subject: finalSubject,
        initialMessage: initialMessage.trim()
      });

      // Reset form and close modal
      setSubject('General Discussion');
      setCustomSubject('');
      setInitialMessage('');
      onClose();
      
    } catch (error) {
      console.error('❌ [NewCollegeEducatorAdminModal] Error creating conversation:', error);
      toast.error('Failed to start conversation with college admin');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Message College Admin</h2>
              <p className="text-sm text-gray-500">Start a conversation with your college administrator</p>
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
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          {loadingCollege ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !collegeInfo ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-gray-600 font-medium">College information not found</p>
              <p className="text-gray-400 text-sm mt-1">Unable to load college admin details</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* College Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">{collegeInfo.name}</h3>
                    <p className="text-blue-600 text-sm">College Administration</p>
                  </div>
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
                  Choose the topic for your conversation with the college admin
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
                  placeholder="Type your message to the college admin..."
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

              {/* Info Box */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Direct Communication
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This will create a private conversation between you and the college administrator. 
                      Use this for academic matters, policy questions, or administrative support.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {collegeInfo && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-white">
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
              disabled={isLoading || !subject.trim() || (subject === 'Other' && !customSubject.trim())}
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

export default NewCollegeEducatorAdminConversationModal;