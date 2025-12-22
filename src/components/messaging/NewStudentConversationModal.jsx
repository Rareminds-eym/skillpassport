import React, { useState, useEffect } from 'react';
import { X, Search, UserCircleIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MagnifyingGlassIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const NewStudentConversationModal = ({ isOpen, onClose, schoolId, onConversationCreated }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Predefined subjects for admin-student conversations
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

  // Fetch students from the school when modal opens or search query changes
  useEffect(() => {
    if (isOpen && schoolId) {
      fetchStudents();
    }
  }, [isOpen, schoolId, searchQuery]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select('id, name, email, contact_number, university, branch_field, grade, section')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });

      // Apply search filter if query exists
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},contact_number.ilike.${searchTerm},university.ilike.${searchTerm},branch_field.ilike.${searchTerm}`);
      }

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

  const handleCreateConversation = () => {
    if (selectedStudent && selectedSubject && initialMessage.trim()) {
      onConversationCreated({
        studentId: selectedStudent.id,
        subject: selectedSubject,
        initialMessage: initialMessage.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSelectedSubject('');
    setInitialMessage('');
    setSearchQuery('');
    setStudents([]);
    onClose();
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    // Auto-select "General Inquiry" as default subject
    if (!selectedSubject) {
      setSelectedSubject('General Inquiry');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Conversation with Student</h2>
              <p className="text-sm text-gray-500">Search and select a student to start messaging</p>
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
            {/* Step 1: Search and Select Student */}
            {!selectedStudent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    🔍 Search for a student
                  </label>
                  
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, university, or branch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Students List */}
                  <div className="border-2 border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-12">
                        <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">
                          {searchQuery ? `No students found for "${searchQuery}"` : 'No students found'}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {searchQuery ? 'Try a different search term' : 'Start typing to search for students'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {students.map((student) => (
                          <button
                            key={student.id}
                            onClick={() => handleStudentSelect(student)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                          >
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.email)}&background=3B82F6&color=fff`}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{student.name || 'Unnamed Student'}</h3>
                              <p className="text-sm text-gray-600 truncate">{student.email}</p>
                              {(student.university || student.branch_field || student.grade) && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {student.university && `${student.university}`}
                                  {student.branch_field && ` • ${student.branch_field}`}
                                  {student.grade && ` • Grade ${student.grade}${student.section ? `-${student.section}` : ''}`}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Select Subject and Write Message */
              <div className="space-y-6">
                {/* Selected Student Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.name || selectedStudent.email)}&background=3B82F6&color=fff`}
                        alt={selectedStudent.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedStudent.name || 'Unnamed Student'}</h3>
                        <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                        {(selectedStudent.university || selectedStudent.branch_field) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedStudent.university && `${selectedStudent.university}`}
                            {selectedStudent.branch_field && ` • ${selectedStudent.branch_field}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    📋 What is your message about?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {adminSubjects.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedSubject === subject
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
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
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      maxLength={100}
                    />
                  </div>
                )}

                {/* Message Input */}
                {selectedSubject && (
                  <div className="border-t-2 border-blue-200 bg-blue-50 p-6 -mx-6 -mb-6">
                    <div className="mb-4">
                      <label className="block text-lg font-semibold text-gray-800 mb-2">
                        💬 Your message to {selectedStudent.name}
                      </label>
                      <div className="text-sm text-gray-600 mb-4 p-3 bg-white rounded-md border border-blue-200 shadow-sm">
                        Subject: <span className="font-medium text-blue-700">{selectedSubject}</span>
                      </div>
                    </div>
                    
                    <textarea
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder="Type your message here... (e.g., 'Hello, I need to discuss your recent attendance records. Could you please come to my office?')"
                      rows={6}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base bg-white shadow-sm"
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
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 Tips for effective communication:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Be clear and specific about your request</li>
                        <li>• Include relevant details (dates, times, locations if applicable)</li>
                        <li>• Use polite and respectful language</li>
                        <li>• Check your message for spelling and grammar</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          {selectedStudent && (
            <button
              onClick={handleCreateConversation}
              disabled={!selectedStudent || !selectedSubject || !initialMessage.trim() || initialMessage.length > 1000}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              {initialMessage.trim() ? 'Send Message & Start Conversation' : 'Start Conversation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewStudentConversationModal;
