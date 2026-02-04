import React, { useState, useEffect } from 'react';
import { X, Search, Building2, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewAdminConversationModal = ({ isOpen, onClose, studentId, onConversationCreated }) => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Predefined subjects for school admin conversations
  const adminSubjects = [
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

  // Fetch student's school information
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentSchool();
    }
  }, [isOpen, studentId]);

  const fetchStudentSchool = async () => {
    setLoading(true);
    try {
      // Get student's school information from organizations table
      const { data: studentData, error } = await supabase
        .from('students')
        .select(`
          school_id,
          school:organizations!students_school_id_fkey (
            id,
            name,
            city,
            state,
            organization_type
          )
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;

      if (studentData?.school) {
        // Map the organization data to match expected school structure
        const schoolData = {
          id: studentData.school.id,
          name: studentData.school.name,
          address: studentData.school.city && studentData.school.state 
            ? `${studentData.school.city}, ${studentData.school.state}` 
            : null,
          phone: null, // Organizations table doesn't have phone
          email: null  // Organizations table doesn't have email
        };
        setSchool(schoolData);
      } else {
        console.error('Student has no associated school');
      }
    } catch (error) {
      console.error('Error fetching school:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = () => {
    const finalSubject = selectedSubject === 'Other' ? customSubject : selectedSubject;
    if (school && finalSubject && initialMessage.trim()) {
      onConversationCreated({
        schoolId: school.id,
        subject: finalSubject,
        initialMessage: initialMessage.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedSubject('');
    setCustomSubject('');
    setInitialMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Message School Admin</h2>
              <p className="text-sm text-gray-500">Start a conversation</p>
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !school ? (
            <div className="text-center py-12 px-6">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No school information found</p>
              <p className="text-gray-400 text-xs mt-2">Please contact support if this is an error</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* School Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{school.name}</h3>
                    <p className="text-sm text-gray-600">School Administration</p>
                    {school.address && (
                      <p className="text-xs text-gray-500 mt-1">{school.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you need help with?
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">Select a subject...</option>
                  {adminSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Subject Input */}
              {selectedSubject === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your subject..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customSubject.length}/100 characters
                  </div>
                </div>
              )}

              {/* Message Input */}
              {selectedSubject && (selectedSubject !== 'Other' || customSubject.trim()) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your message
                  </label>
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      {initialMessage.length}/1000 characters
                    </div>
                    {initialMessage.length > 1000 && (
                      <div className="text-xs text-red-600">
                        Message too long
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!school || !selectedSubject || (selectedSubject === 'Other' && !customSubject.trim()) || !initialMessage.trim() || initialMessage.length > 1000}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAdminConversationModal;