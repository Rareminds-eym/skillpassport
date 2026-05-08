import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle } from 'lucide-react';
import { supabase } from '@/shared/api/supabaseClient';
import toast from 'react-hot-toast';

// Small Message Modal Component
const MessageModal = ({ learner, isOpen, onClose, onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject('');
    }
  }, [isOpen, learner]);

  const handleSend = () => {
    if (message.trim() && subject.trim()) {
      onSend({
        learnerId: learner.id,
        collegeLecturerId: learner.collegeLecturerId,
        programSectionId: learner.programSectionId,
        subject: subject.trim(),
        initialMessage: message.trim()
      });
    }
  };

  if (!isOpen || !learner) return null;

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
              <p className="text-xs text-gray-500">Message your learner</p>
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
          {/* Selected Learner */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {learner.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{learner.name}</p>
              <p className="text-xs text-blue-600">
                {learner.programCode || learner.program}
                {learner.section && ` • Section ${learner.section}`}
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
              placeholder="e.g., Assignment Discussion, Course Query"
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

const NewCollegeLecturerConversationModal = ({ 
  isOpen, 
  onClose, 
  onCreateConversation, 
  collegeLecturerId,
  collegeId 
}) => {
  const [learners, setlearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch learners from the same college and programs
  useEffect(() => {
    const fetchlearners = async () => {
      console.log('🚀 === FETCH LEARNERS DEBUG START ===');
      console.log('📋 Modal Props:', { isOpen, collegeLecturerId, collegeId });
      
      if (!isOpen || !collegeLecturerId || !collegeId) {
        console.log('❌ Missing required props, skipping fetch');
        return;
      }
      
      setLoading(true);
      try {
        console.log('🔍 Step 1: Fetching programs and sections for lecturer:', collegeLecturerId);
        
        // Get programs through departments that belong to this college
        // First get departments in this college
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('id, name, college_id')
          .eq('college_id', collegeId);
        
        console.log('🏢 Departments query result:', { 
          data: departments, 
          error: deptError,
          count: departments?.length || 0
        });
        
        if (deptError) {
          console.error('❌ Error fetching departments:', deptError);
          throw deptError;
        }
        
        if (!departments || departments.length === 0) {
          console.log('⚠️ No departments found in college:', collegeId);
          console.log('💡 Fallback: Fetching ALL learners from college');
          
          // Fallback: Get all learners from the same college
          const { data: alllearnersData, error: alllearnersError } = await supabase
            .from('learners')
            .select(`
              id,
              user_id,
              name,
              email,
              program_id,
              program_section_id,
              semester,
              college_id,
              is_deleted,
              course_name,
              branch_field
            `)
            .eq('college_id', collegeId)
            .eq('is_deleted', false)
            .order('name');
          
          console.log('📊 All college learners query result:', { 
            data: alllearnersData, 
            error: alllearnersError,
            count: alllearnersData?.length || 0
          });
          
          if (alllearnersError) {
            console.error('❌ Error fetching all college learners:', alllearnersError);
            throw alllearnersError;
          }
          
          if (alllearnersData && alllearnersData.length > 0) {
            console.log('👥 Found', alllearnersData.length, 'learners in college (fallback)');
            
            // Transform learners data
            const transformedlearners = alllearnersData.map(learner => ({
              id: learner.user_id || learner.id,
              name: learner.name || learner.email,
              email: learner.email,
              program: learner.course_name || learner.branch_field || 'Unknown Program',
              programCode: learner.course_name || '',
              section: learner.section || '',
              semester: learner.semester || '',
              academicYear: '',
              programSectionId: learner.program_section_id,
              programId: learner.program_id
            }));
            
            console.log('✅ Fallback: Transformed learners:', transformedlearners);
            
            setlearners(transformedlearners);
            return;
          }
          
          console.log('❌ No learners found in college at all');
          setlearners([]);
          return;
        }
        
        const departmentIds = departments.map(d => d.id);
        console.log('🏢 Department IDs in college:', departmentIds);
        
        // Get programs in these departments
        const { data: programs, error: programsError } = await supabase
          .from('programs')
          .select(`
            id,
            name,
            code,
            department_id
          `)
          .in('department_id', departmentIds);
        
        console.log('📚 Programs query result:', { 
          data: programs, 
          error: programsError,
          count: programs?.length || 0
        });
        
        if (programsError) {
          console.error('❌ Error fetching programs:', programsError);
          throw programsError;
        }
        
        if (!programs || programs.length === 0) {
          console.log('⚠️ No programs found in college departments');
          setlearners([]);
          return;
        }
        
        const programIds = programs.map(p => p.id);
        console.log('🎓 Program IDs in college:', programIds);
        
        console.log('🔍 Step 2: Fetching learners from programs:', programIds, 'in college:', collegeId);
        
        // Get all learners from these programs in the same college
        const { data: learnersData, error: learnersError } = await supabase
          .from('learners')
          .select(`
            id,
            user_id,
            name,
            email,
            program_id,
            program_section_id,
            semester,
            college_id,
            is_deleted,
            programs:program_id (
              id,
              name,
              code
            ),
            program_sections:program_section_id (
              id,
              section,
              semester,
              academic_year
            )
          `)
          .eq('college_id', collegeId)
          .in('program_id', programIds)  // ← Fetch by program_id, not program_section_id
          .eq('is_deleted', false)
          .order('name');
        
        console.log('📊 Learners query result:', { 
          data: learnersData, 
          error: learnersError,
          count: learnersData?.length || 0
        });
        
        if (learnersError) {
          console.error('❌ Error fetching learners:', learnersError);
          throw learnersError;
        }
        
        console.log('👥 Step 4: Found', learnersData?.length || 0, 'learners');
        
        if (learnersData && learnersData.length > 0) {
          console.log('📋 Sample learner data:', learnersData[0]);
          console.log('🎯 All learners:', learnersData.map(s => ({
            id: s.id,
            user_id: s.user_id,
            name: s.name,
            email: s.email,
            program_id: s.program_id,
            college_id: s.college_id,
            is_deleted: s.is_deleted
          })));
        }
        
        // Transform learners data
        const transformedlearners = (learnersData || []).map(learner => ({
          id: learner.user_id || learner.id,
          name: learner.name || learner.email,
          email: learner.email,
          program: learner.programs?.name || 'Unknown Program',
          programCode: learner.programs?.code || '',
          section: learner.program_sections?.section || '',
          semester: learner.program_sections?.semester || learner.semester || '',
          academicYear: learner.program_sections?.academic_year || '',
          programSectionId: learner.program_section_id,
          programId: learner.program_id
        }));
        
        console.log('✅ Step 5: Transformed learners:', transformedlearners);
        
        setlearners(transformedlearners);
        
      } catch (error) {
        console.error('❌ FETCH ERROR:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast.error('Failed to load learners: ' + error.message);
      } finally {
        setLoading(false);
        console.log('🏁 === FETCH LEARNERS DEBUG END ===');
      }
    };

    fetchlearners();
  }, [isOpen, collegeLecturerId, collegeId]);

  const handleCreateConversation = async (conversationData) => {
    setSendingMessage(true);
    try {
      await onCreateConversation(conversationData);
      setShowMessageModal(false);
      handleClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handlelearnerSelect = (learner) => {
    setSelectedLearner({
      ...learner,
      collegeLecturerId
    });
    setShowMessageModal(true);
  };

  const handleClose = () => {
    setSelectedLearner(null);
    setShowMessageModal(false);
    setSearchQuery('');
    onClose();
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    setSelectedLearner(null);
  };

  const filteredlearners = learners.filter(learner => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return learner.name.toLowerCase().includes(query) ||
           learner.email.toLowerCase().includes(query) ||
           learner.program.toLowerCase().includes(query) ||
           learner.programCode.toLowerCase().includes(query) ||
           learner.section.toLowerCase().includes(query);
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Main Learner Selection Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Learner</h2>
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
                  placeholder="Search learners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredlearners.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? `No learners found for "${searchQuery}"` : 'No learners found in your programs'}
                  </p>
                  {!searchQuery && (
                    <p className="text-gray-400 text-xs mt-2">
                      Make sure you are assigned to programs with enrolled learners.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredlearners.map((learner) => (
                    <button
                      key={learner.id}
                      onClick={() => handlelearnerSelect(learner)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {learner.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {learner.name}
                          </h3>
                          <p className="text-sm text-gray-500">{learner.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {learner.programCode || learner.program}
                            </span>
                            {learner.section && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Section {learner.section}
                              </span>
                            )}
                            {learner.semester && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Sem {learner.semester}
                              </span>
                            )}
                          </div>
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
        learner={selectedLearner}
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        onSend={handleCreateConversation}
        isLoading={sendingMessage}
      />
    </>
  );
};

export default NewCollegeLecturerConversationModal;