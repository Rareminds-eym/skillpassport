import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Small Message Modal Component
const MessageModal = ({ student, isOpen, onClose, onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [customSubject, setCustomSubject] = useState('');

  // Predefined subjects for admin-student conversations
  const subjects = [
    'General Inquiry',
    'Academic Support',
    'Attendance Issue',
    'Fee Payment',
    'Document Request',
    'Complaint/Feedback',
    'Technical Support',
    'Admission Query',
    'Transfer Request',
    'Other'
  ];

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject('General Inquiry');
      setCustomSubject('');
    }
  }, [isOpen, student]);

  const handleSend = () => {
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject.trim();
    if (message.trim() && finalSubject) {
      onSend({
        studentId: student.id,
        subject: finalSubject,
        initialMessage: message.trim()
      });
    }
  };

  if (!isOpen || !student) return null;

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
              <p className="text-xs text-gray-500">Message your student</p>
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
          {/* Selected Student */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.email)}&background=3B82F6&color=fff`}
              alt={student.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{student.name || 'Unnamed Student'}</p>
              <p className="text-xs text-blue-600">
                {student.university || 'Student'}
                {student.branch_field && ` • ${student.branch_field}`}
                {student.grade && ` • Grade ${student.grade}${student.section ? `-${student.section}` : ''}`}
              </p>
            </div>
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's this about?
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (e.target.value !== 'Other') {
                  setCustomSubject('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
            
            {/* Custom Subject Input */}
            {subject === 'Other' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter your custom subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{customSubject.length}/100 characters</p>
              </div>
            )}
          </div>

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
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/1000 characters</p>
          </div>

          {/* Quick Suggestions */}
          {!message.trim() && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Quick starters:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Hi! I need to discuss something",
                  "Regarding your academic progress",
                  "Can we schedule a meeting?"
                ].map((suggestion, idx) => (
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
              message.length > 1000 ||
              (subject === 'Other' && !customSubject.trim()) ||
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
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const NewStudentConversationModal = ({ isOpen, onClose, schoolId, onConversationCreated }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch students from the school when modal opens or search query changes
  useEffect(() => {
    if (isOpen && schoolId) {
      fetchStudents();
    }
  }, [isOpen, schoolId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select('id, name, email, contact_number, university, branch_field, grade, section')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });

      const { data, error } = await query.limit(50); // Limit to 50 results for performance

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
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

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowMessageModal(true);
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setShowMessageModal(false);
    setSearchQuery('');
    onClose();
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (student.name && student.name.toLowerCase().includes(query)) ||
           (student.email && student.email.toLowerCase().includes(query)) ||
           (student.contact_number && student.contact_number.toLowerCase().includes(query)) ||
           (student.university && student.university.toLowerCase().includes(query)) ||
           (student.branch_field && student.branch_field.toLowerCase().includes(query));
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Main Student Selection Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Student</h2>
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
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? `No students found for "${searchQuery}"` : 'No students found'}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {searchQuery ? 'Try a different search term' : 'Start typing to search for students'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleStudentSelect(student)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.email)}&background=3B82F6&color=fff`}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {student.name || 'Unnamed Student'}
                          </h3>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          {(student.university || student.branch_field || student.grade) && (
                            <p className="text-xs text-blue-600 mt-1">
                              {student.university && `${student.university}`}
                              {student.branch_field && ` • ${student.branch_field}`}
                              {student.grade && ` • Grade ${student.grade}${student.section ? `-${student.section}` : ''}`}
                            </p>
                          )}
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
        student={selectedStudent}
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        onSend={handleCreateConversation}
        isLoading={sendingMessage}
      />
    </>
  );
};

export default NewStudentConversationModal;
