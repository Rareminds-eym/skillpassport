import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle } from 'lucide-react';
import { apiPost } from '@/shared/api/apiClient';

// Small Message Modal Component
const MessageModal = ({ educator, isOpen, onClose, onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject(educator?.type === 'school_educator' ? 'General Discussion' : '');
    }
  }, [isOpen, educator]);

  const handleSend = () => {
    if (message.trim()) {
      onSend({
        educatorId: educator.id,
        educatorType: educator.type,
        subject: educator.type === 'school_educator' ? 'General Discussion' : subject,
        initialMessage: message.trim()
      });
    }
  };

  if (!isOpen || !educator) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">New Conversation</h3>
              <p className="text-xs text-gray-500">Message your teacher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Selected Educator */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <img
              src={educator.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name)}&background=3B82F6&color=fff`}
              alt={educator.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{educator.name}</p>
              <p className="text-xs text-blue-600">
                {educator.type === 'school_educator' ? 'School Educator' : 'College Lecturer'}
              </p>
            </div>
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Subject Input for College Lecturers */}
          {educator.type === 'college_lecturer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's this about?
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Assignment help, Course question"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{subject.length}/100 characters</p>
            </div>
          )}

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type your message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
          </div>

          {/* Quick Suggestions */}
          {!message.trim() && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Quick starters:</p>
              <div className="flex flex-wrap gap-2">
                {(educator.type === 'school_educator' ? [
                  "Hi! I have a question",
                  "Need help with homework",
                  "Can you clarify something?"
                ] : [
                  "Hi! I have a question",
                  "Need help with assignment",
                  "Can you explain this topic?"
                ]).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMessage(suggestion)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={
              !message.trim() || 
              message.length > 500 ||
              (educator.type === 'college_lecturer' && !subject.trim()) ||
              isLoading
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Start Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const NewEducatorConversationModal = ({ isOpen, onClose, learnerId, onConversationCreated }) => {
  const [educators, setEducators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch learner's educators (from their classes)
  useEffect(() => {
    if (isOpen && learnerId) {
      fetchlearnerEducators();
    }
  }, [isOpen, learnerId]);

  const fetchlearnerEducators = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting fetchlearnerEducators for learnerId:', learnerId);

      // Get learner context (school_id, university_college_id)
      let { data: learnerData } = await apiPost('/messaging/actions', { action: 'fetch-learner-context', learnerId });

      // Fallback: try with user_id
      if (!learnerData) {
        const { data: learnerByUserId } = await apiPost('/messaging/actions', { action: 'fetch-learner-context-by-user-id', userId: learnerId });
        if (!learnerByUserId) {
          console.log('⚠️ Learner not found by id or user_id');
          setLoading(false);
          return;
        }
        learnerData = learnerByUserId;
      }

      const allEducators = [];

      // Fetch ALL school educators if learner has school_id
      if (learnerData?.school_id) {
        console.log('🏫 Fetching school educators for school_id:', learnerData.school_id);
        const { data: schoolEducators } = await apiPost('/messaging/actions', { action: 'fetch-recipients', conversationType: 'admin-educator', contextId: learnerData.school_id });
        if (schoolEducators) {
          const educatorList = schoolEducators.map(educator => ({
            id: educator.id,
            name: educator.name,
            email: educator.email,
            photo_url: educator.photo_url,
            type: 'school_educator',
            classes: []
          }));
          allEducators.push(...educatorList);
        }
      }

      // Fetch college lecturers if learner has university_college_id
      if (learnerData?.university_college_id) {
        console.log('🎓 Fetching college lecturers for college_id:', learnerData.university_college_id);
        const { data: allCollegeLecturers } = await apiPost('/messaging/actions', { action: 'fetch-recipients', conversationType: 'college-lecturer', contextId: learnerData.university_college_id });
        if (allCollegeLecturers && allCollegeLecturers.length > 0) {
          const collegeEducators = allCollegeLecturers.map(lecturer => ({
            id: lecturer.id,
            name: lecturer.name,
            email: lecturer.email,
            photo_url: null,
            type: 'college_lecturer',
            department: lecturer.department,
            specialization: lecturer.specialization,
            classes: []
          }));
          allEducators.push(...collegeEducators);
        } else {
          console.log('ℹ️ No college lecturers found in this college');
        }
      }

      console.log('📊 Final educators list:', allEducators);
      setEducators(allEducators);
    } catch (error) {
      console.error('❌ Error fetching educators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (conversationData) => {
    setSendingMessage(true);
    try {
      await onConversationCreated(conversationData);
      setShowMessageModal(false);
      handleClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEducatorSelect = (educator) => {
    setSelectedEducator(educator);
    setShowMessageModal(true);
  };

  const handleClose = () => {
    setSelectedEducator(null);
    setShowMessageModal(false);
    setSearchQuery('');
    onClose();
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    setSelectedEducator(null);
  };

  const filteredEducators = educators.filter(educator =>
    educator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    educator.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Main Educator Selection Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Educator</h2>
                <p className="text-sm text-gray-500">Choose who you want to message</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search educators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredEducators.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No educators found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEducators.map((educator) => (
                    <button
                      key={educator.id}
                      onClick={() => handleEducatorSelect(educator)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={educator.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name)}&background=3B82F6&color=fff`}
                          alt={educator.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {educator.name}
                          </h3>
                          <p className="text-sm text-gray-500">{educator.email}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {educator.type === 'school_educator' ? (
                              'School Educator'
                            ) : (
                              <>
                                College Lecturer
                                {educator.department && ` • ${educator.department}`}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-blue-600 group-hover:text-blue-700">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        educator={selectedEducator}
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        onSend={handleCreateConversation}
        isLoading={sendingMessage}
      />
    </>
  );
};

export default NewEducatorConversationModal;