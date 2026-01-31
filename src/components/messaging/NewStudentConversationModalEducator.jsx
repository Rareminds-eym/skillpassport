import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Small Message Modal Component
const MessageModal = ({ student, isOpen, onClose, onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject('');
    }
  }, [isOpen, student]);

  const handleSend = () => {
    if (message.trim() && subject.trim()) {
      onSend(student.id, subject.trim());
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {student.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{student.name || 'Unnamed Student'}</p>
              <p className="text-xs text-blue-600">
                {student.university && `${student.university}`}
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

          {/* Subject Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's this about?
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Academic Support, Assignment Help"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{subject.length}/100 characters</p>
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
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
          </div>

          {/* Quick Suggestions */}
          {!message.trim() && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Quick starters:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Hi! I have a question about",
                  "Regarding your assignment",
                  "Can you help me understand"
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
              !subject.trim() ||
              message.length > 500 ||
              subject.length > 100 ||
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

const NewStudentConversationModalEducator = ({ isOpen, onClose, onCreateConversation, educatorId, schoolId: propSchoolId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch students from educator's school
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen || !educatorId) return;
      
      setLoading(true);
      try {
        console.log('🔍 Fetching students for educator:', educatorId);
        console.log('🔍 Prop schoolId:', propSchoolId);
        
        let schoolId = propSchoolId; // Use prop schoolId if provided
        
        // Only do complex lookup if schoolId not provided
        if (!schoolId) {
          // Get current user to access email
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('❌ No authenticated user found');
            setStudents([]);
            setLoading(false);
            return;
          }
          let educatorData = null;
          let userData = null;
          
          // Strategy 1: Try to get school from school_educators table using user_id
          const { data: educatorResult } = await supabase
            .from('school_educators')
            .select('school_id, id')
            .eq('user_id', educatorId)
            .maybeSingle();

          educatorData = educatorResult;

          if (educatorData?.school_id) {
            schoolId = educatorData.school_id;
            console.log('✅ Found school from school_educators (user_id):', schoolId);
          } else {
            console.log('⚠️ No school found in school_educators by user_id, trying by email...');
            
            // Strategy 2: Try using email (like useEducatorSchool hook)
            const { data: educatorByEmailResult } = await supabase
              .from('school_educators')
              .select('school_id, user_id, id')
              .eq('email', user.email)
              .maybeSingle();
            
            if (educatorByEmailResult?.school_id) {
              schoolId = educatorByEmailResult.school_id;
              console.log('✅ Found school from school_educators (email):', schoolId);
            } else {
              console.log('⚠️ No school found by email, trying by id...');
              
              // Strategy 3: Try using educatorId as the school_educators.id directly
              const { data: educatorByIdResult } = await supabase
                .from('school_educators')
                .select('school_id, user_id')
                .eq('id', educatorId)
                .maybeSingle();
              
              if (educatorByIdResult?.school_id) {
                schoolId = educatorByIdResult.school_id;
                console.log('✅ Found school from school_educators (id):', schoolId);
              } else {
                console.log('⚠️ No school found in school_educators by id, trying users table...');
                
                // Strategy 4: Fallback to users table if it has school_id
                const { data: userResult } = await supabase
                  .from('users')
                  .select('school_id')
                  .eq('id', educatorId)
                  .maybeSingle();
                
                userData = userResult;
                
                if (userData?.school_id) {
                  schoolId = userData.school_id;
                  console.log('✅ Found school from users table:', schoolId);
                }
              }
            }
          }
        }

        if (!schoolId) {
          console.log('❌ No school found for educator');
          toast.error('No school assignment found. Please contact your school administrator to assign you to a school.');
          
          // Show detailed error in console for debugging
          console.log('🔍 Debugging info:');
          console.log('- Educator ID:', educatorId);
          console.log('- Email:', user.email);
          console.log('- School educators query (user_id) result:', educatorData);
          console.log('- Users table fallback result:', userData);
          console.log('💡 To fix this issue, ensure the educator has a school_id in either school_educators or users table');
          
          setStudents([]);
          setLoading(false);
          return;
        }

        // Then fetch students from the same school
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            name,
            email,
            university,
            branch_field,
            school_id,
            grade,
            section,
            contact_number
          `)
          .eq('school_id', schoolId)
          .order('name');

        if (studentsError) {
          console.error('❌ Error fetching students:', studentsError);
          throw studentsError;
        }

        console.log('✅ Students data:', studentsData);
        setStudents(studentsData || []);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen, educatorId, propSchoolId]);

  const handleCreateConversation = async (studentId, subject) => {
    setSendingMessage(true);
    try {
      await onCreateConversation(studentId, subject);
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
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return student.name?.toLowerCase().includes(query) ||
           student.email?.toLowerCase().includes(query) ||
           student.university?.toLowerCase().includes(query) ||
           student.branch_field?.toLowerCase().includes(query) ||
           student.contact_number?.toLowerCase().includes(query) ||
           student.grade?.toString().toLowerCase().includes(query) ||
           student.section?.toLowerCase().includes(query);
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
                    {searchQuery ? `No students found for "${searchQuery}"` : 'No students available'}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Make sure you are assigned to a school and students are enrolled'
                    }
                  </p>
                  {!searchQuery && (
                    <div className="text-center space-y-3 mt-3">
                      <p className="text-blue-600 text-xs bg-blue-50 px-3 py-2 rounded-lg">
                        Contact your school admin if this seems incorrect
                      </p>
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Troubleshooting:</p>
                        <p>• Make sure you are assigned to a school</p>
                        <p>• Check if students are enrolled in your school</p>
                        <p>• Contact IT support if the issue persists</p>
                      </div>
                    </div>
                  )}
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
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
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


export default NewStudentConversationModalEducator;