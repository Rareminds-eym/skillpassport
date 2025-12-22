import React, { useState, useEffect } from 'react';
import { X, Search, Building2, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewCollegeAdminConversationModal = ({ isOpen, onClose, studentId, onConversationCreated }) => {
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Predefined subjects for college admin conversations
  const collegeAdminSubjects = [
    'General Inquiry',
    'Academic Support',
    'Attendance Issue',
    'Fee Payment',
    'Document Request',
    'Complaint/Feedback',
    'Technical Support',
    'Admission Query',
    'Course Registration',
    'Examination Query',
    'Placement Support',
    'Library Access',
    'Hostel/Accommodation',
    'Other'
  ];

  // Fetch student's college information
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentCollege();
    }
  }, [isOpen, studentId]);

  const fetchStudentCollege = async () => {
    setLoading(true);
    try {
      // Get student's college information
      const { data: studentData, error } = await supabase
        .from('students')
        .select(`
          college_id,
          university_college_id,
          colleges (
            id,
            name,
            address,
            phone,
            email
          )
        `)
        .eq('user_id', studentId)
        .single();

      if (error) throw error;

      // Handle both college_id and university_college_id fields
      const collegeId = studentData?.college_id || studentData?.university_college_id;
      
      if (studentData?.colleges) {
        setCollege(studentData.colleges);
      } else if (collegeId) {
        // Fetch college details separately if not joined
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('id, name, address, phone, email')
          .eq('id', collegeId)
          .single();
        
        if (collegeError) throw collegeError;
        setCollege(collegeData);
      } else {
        console.error('Student has no associated college');
      }
    } catch (error) {
      console.error('Error fetching college:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = () => {
    if (college && selectedSubject && initialMessage.trim()) {
      onConversationCreated({
        collegeId: college.id,
        subject: selectedSubject,
        initialMessage: initialMessage.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedSubject('');
    setInitialMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Contact College Administration</h2>
              <p className="text-sm text-gray-500">Send a message to your college admin</p>
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
        <div className="overflow-y-auto max-h-[calc(95vh-160px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !college ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No college information found</p>
                <p className="text-gray-400 text-xs mt-2">Please contact support if this is an error</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* College Information */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{college.name}</h3>
                      <p className="text-sm text-gray-600">College Administration</p>
                    </div>
                  </div>
                  
                  {college.address && (
                    <p className="text-sm text-gray-600 mb-2">📍 {college.address}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {college.phone && (
                      <span>📞 {college.phone}</span>
                    )}
                    {college.email && (
                      <span>✉️ {college.email}</span>
                    )}
                  </div>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    📋 What is your message about?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {collegeAdminSubjects.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedSubject === subject
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-medium text-sm">{subject}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Subject Input */}
                {selectedSubject === 'Other' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Please specify your subject:
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your subject..."
                      value={selectedSubject === 'Other' ? '' : selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Input Section */}
          {college && selectedSubject && (
            <div className="border-t-2 border-purple-200 bg-purple-50 p-6">
              <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                  💬 Your message to {college.name}
                </label>
                <div className="text-sm text-gray-600 mb-4 p-3 bg-white rounded-md border border-purple-200 shadow-sm">
                  Subject: <span className="font-medium text-purple-700">{selectedSubject}</span>
                </div>
              </div>
              
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message here... (e.g., 'Hello, I need help with my course registration. Could you please assist me?')"
                rows={6}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-base bg-white shadow-sm"
                maxLength={1000}
              />
              
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-600 font-medium">
                  {initialMessage.length}/1000 characters
                </div>
                {initialMessage.length > 1000 && (
                  <div className="text-sm text-red-600 font-medium">
                    ⚠️ Message too long
                  </div>
                )}
              </div>

              {/* Message Guidelines */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 Tips for effective communication:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Be clear and specific about your request</li>
                  <li>• Include relevant details (student ID, course, semester if applicable)</li>
                  <li>• Use polite and respectful language</li>
                  <li>• Check your message for spelling and grammar</li>
                </ul>
              </div>
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
            disabled={!college || !selectedSubject || !initialMessage.trim() || initialMessage.length > 1000}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {initialMessage.trim() ? 'Send Message to Administration' : 'Start Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCollegeAdminConversationModal;