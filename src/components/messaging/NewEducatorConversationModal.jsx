import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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

const NewEducatorConversationModal = ({ isOpen, onClose, studentId, onConversationCreated }) => {
  const [educators, setEducators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch student's educators (from their classes)
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentEducators();
    }
  }, [isOpen, studentId]);

  const fetchStudentEducators = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting fetchStudentEducators for studentId:', studentId);
      
      // Get student data to check both school_id and university_college_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('school_id, university_college_id, program_section_id, program_id, id, user_id')
        .eq('id', studentId)
        .single();

      console.log('📊 Student data:', studentData);
      console.log('❌ Student error:', studentError);

      if (studentError) {
        console.error('❌ Error fetching student data:', studentError);
        // Try with user_id instead
        const { data: studentDataByUserId, error: userIdError } = await supabase
          .from('students')
          .select('school_id, university_college_id, program_section_id, program_id, id, user_id')
          .eq('user_id', studentId)
          .single();
        
        console.log('📊 Student data by user_id:', studentDataByUserId);
        
        if (userIdError) {
          console.error('❌ Error fetching student by user_id:', userIdError);
          setLoading(false);
          return;
        }
        
        // Use the data found by user_id
        studentData = studentDataByUserId;
      }

      const allEducators = [];

      // Fetch ALL school educators if student has school_id
      if (studentData?.school_id) {
        console.log('🏫 Fetching ALL school educators for school_id:', studentData.school_id);
        
        const { data: schoolEducators, error: schoolError } = await supabase
          .from('school_educators')
          .select(`
            id,
            first_name,
            last_name,
            email,
            photo_url
          `)
          .eq('school_id', studentData.school_id);

        console.log('🏫 School educators:', schoolEducators);
        console.log('❌ School error:', schoolError);

        if (!schoolError && schoolEducators) {
          const educatorList = schoolEducators.map(educator => ({
            id: educator.id,
            name: `${educator.first_name} ${educator.last_name}`,
            email: educator.email,
            photo_url: educator.photo_url,
            type: 'school_educator',
            classes: [] // No class info needed
          }));

          allEducators.push(...educatorList);
          console.log('✅ Added ALL school educators:', educatorList.length);
        }
      }

      // Fetch college lecturers if student has university_college_id
      if (studentData?.university_college_id) {
        console.log('🎓 Fetching college lecturers for college_id:', studentData.university_college_id);
        console.log('📚 Student program_section_id:', studentData.program_section_id);
        
        if (studentData.program_section_id) {
          // Step 2: Get program section details and assigned faculty
          const { data: programSectionData, error: sectionError } = await supabase
            .from('program_sections')
            .select(`
              id,
              faculty_id,
              program_id,
              semester,
              section,
              academic_year,
              programs:program_id (
                id,
                name,
                code
              )
            `)
            .eq('id', studentData.program_section_id)
            .single();

          console.log('📚 Program section data:', programSectionData);
          console.log('❌ Program section error:', sectionError);

          if (!sectionError && programSectionData?.faculty_id) {
            console.log('👨‍🏫 Program section faculty ID:', programSectionData.faculty_id);
            
            // Step 3: Get the college lecturer assigned to this program section
            const { data: collegeLecturers, error: collegeError } = await supabase
              .from('college_lecturers')
              .select(`
                id,
                first_name,
                last_name,
                email,
                department,
                specialization,
                collegeId,
                user_id
              `)
              .eq('user_id', programSectionData.faculty_id)
              .eq('collegeId', studentData.university_college_id);

            console.log('🎓 College lecturers:', collegeLecturers);
            console.log('❌ College error:', collegeError);

            if (!collegeError && collegeLecturers && collegeLecturers.length > 0) {
              console.log('✅ Found assigned college lecturers:', collegeLecturers.length);
              
              const collegeEducators = collegeLecturers.map(lecturer => ({
                id: lecturer.id,
                name: `${lecturer.first_name} ${lecturer.last_name}`,
                email: lecturer.email,
                photo_url: null,
                type: 'college_lecturer',
                department: lecturer.department,
                specialization: lecturer.specialization,
                programSection: {
                  id: programSectionData.id,
                  semester: programSectionData.semester,
                  section: programSectionData.section,
                  academicYear: programSectionData.academic_year,
                  programName: programSectionData.programs?.name,
                  programCode: programSectionData.programs?.code
                },
                classes: []
              }));

              allEducators.push(...collegeEducators);
              console.log('✅ Added college lecturers to educator list');
            } else {
              console.log('ℹ️ No college lecturers found for this program section');
              
              // Fallback: Get all lecturers from the college if no specific assignment
              console.log('🔄 Trying fallback: all lecturers in college');
              const { data: allCollegeLecturers, error: fallbackError } = await supabase
                .from('college_lecturers')
                .select(`
                  id,
                  first_name,
                  last_name,
                  email,
                  department,
                  specialization,
                  collegeId,
                  user_id
                `)
                .eq('collegeId', studentData.university_college_id);

              console.log('🔄 Fallback college lecturers:', allCollegeLecturers);
              
              if (!fallbackError && allCollegeLecturers && allCollegeLecturers.length > 0) {
                const fallbackEducators = allCollegeLecturers.map(lecturer => ({
                  id: lecturer.id,
                  name: `${lecturer.first_name} ${lecturer.last_name}`,
                  email: lecturer.email,
                  photo_url: null,
                  type: 'college_lecturer',
                  department: lecturer.department,
                  specialization: lecturer.specialization,
                  classes: []
                }));

                allEducators.push(...fallbackEducators);
                console.log('✅ Added fallback college lecturers:', fallbackEducators.length);
              }
            }
          } else {
            console.log('ℹ️ No faculty assigned to student\'s program section or section not found');
          }
        } else {
          console.log('ℹ️ Student has no program section assigned, trying fallback');
          
          // Fallback: Get all lecturers from the college
          const { data: allCollegeLecturers, error: fallbackError } = await supabase
            .from('college_lecturers')
            .select(`
              id,
              first_name,
              last_name,
              email,
              department,
              specialization,
              collegeId,
              user_id
            `)
            .eq('collegeId', studentData.university_college_id);

          console.log('🔄 Fallback college lecturers (no program section):', allCollegeLecturers);
          
          if (!fallbackError && allCollegeLecturers && allCollegeLecturers.length > 0) {
            const fallbackEducators = allCollegeLecturers.map(lecturer => ({
              id: lecturer.id,
              name: `${lecturer.first_name} ${lecturer.last_name}`,
              email: lecturer.email,
              photo_url: null,
              type: 'college_lecturer',
              department: lecturer.department,
              specialization: lecturer.specialization,
              classes: []
            }));

            allEducators.push(...fallbackEducators);
            console.log('✅ Added fallback college lecturers (no program section):', fallbackEducators.length);
          }
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