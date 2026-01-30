import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const NewCollegeLecturerConversationModal = ({ 
  isOpen, 
  onClose, 
  onCreateConversation, 
  collegeLecturerId,
  collegeId 
}) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch students from the same college and programs
  useEffect(() => {
    const fetchStudents = async () => {
      console.log('🚀 === FETCH STUDENTS DEBUG START ===');
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
          console.log('💡 Fallback: Fetching ALL students from college');
          
          // Fallback: Get all students from the same college
          const { data: allStudentsData, error: allStudentsError } = await supabase
            .from('students')
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
          
          console.log('📊 All college students query result:', { 
            data: allStudentsData, 
            error: allStudentsError,
            count: allStudentsData?.length || 0
          });
          
          if (allStudentsError) {
            console.error('❌ Error fetching all college students:', allStudentsError);
            throw allStudentsError;
          }
          
          if (allStudentsData && allStudentsData.length > 0) {
            console.log('👥 Found', allStudentsData.length, 'students in college (fallback)');
            
            // Transform students data
            const transformedStudents = allStudentsData.map(student => ({
              id: student.user_id || student.id,
              name: student.name || student.email,
              email: student.email,
              program: student.course_name || student.branch_field || 'Unknown Program',
              programCode: student.course_name || '',
              section: student.section || '',
              semester: student.semester || '',
              academicYear: '',
              programSectionId: student.program_section_id,
              programId: student.program_id
            }));
            
            console.log('✅ Fallback: Transformed students:', transformedStudents);
            
            setStudents(transformedStudents);
            setFilteredStudents(transformedStudents);
            return;
          }
          
          console.log('❌ No students found in college at all');
          setStudents([]);
          setFilteredStudents([]);
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
          setStudents([]);
          setFilteredStudents([]);
          return;
        }
        
        const programIds = programs.map(p => p.id);
        console.log('🎓 Program IDs in college:', programIds);
        
        console.log('🔍 Step 2: Fetching students from programs:', programIds, 'in college:', collegeId);
        
        // Get all students from these programs in the same college
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
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
        
        console.log('📊 Students query result:', { 
          data: studentsData, 
          error: studentsError,
          count: studentsData?.length || 0
        });
        
        if (studentsError) {
          console.error('❌ Error fetching students:', studentsError);
          throw studentsError;
        }
        
        console.log('👥 Step 4: Found', studentsData?.length || 0, 'students');
        
        if (studentsData && studentsData.length > 0) {
          console.log('📋 Sample student data:', studentsData[0]);
          console.log('🎯 All students:', studentsData.map(s => ({
            id: s.id,
            user_id: s.user_id,
            name: s.name,
            email: s.email,
            program_id: s.program_id,
            college_id: s.college_id,
            is_deleted: s.is_deleted
          })));
        }
        
        // Transform students data
        const transformedStudents = (studentsData || []).map(student => ({
          id: student.user_id || student.id,
          name: student.name || student.email,
          email: student.email,
          program: student.programs?.name || 'Unknown Program',
          programCode: student.programs?.code || '',
          section: student.program_sections?.section || '',
          semester: student.program_sections?.semester || student.semester || '',
          academicYear: student.program_sections?.academic_year || '',
          programSectionId: student.program_section_id,
          programId: student.program_id
        }));
        
        console.log('✅ Step 5: Transformed students:', transformedStudents);
        
        setStudents(transformedStudents);
        setFilteredStudents(transformedStudents);
        
      } catch (error) {
        console.error('❌ FETCH ERROR:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast.error('Failed to load students: ' + error.message);
      } finally {
        setLoading(false);
        console.log('🏁 === FETCH STUDENTS DEBUG END ===');
      }
    };

    fetchStudents();
  }, [isOpen, collegeLecturerId, collegeId]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.program.toLowerCase().includes(query) ||
      student.programCode.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );
    
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const handleCreateConversation = async () => {
    if (!selectedStudent || !subject.trim()) {
      toast.error('Please select a student and enter a subject');
      return;
    }

    setCreating(true);
    try {
      console.log('🆕 Creating college lecturer conversation:', {
        studentId: selectedStudent.id,
        collegeLecturerId,
        programSectionId: selectedStudent.programSectionId,
        subject
      });

      await onCreateConversation({
        studentId: selectedStudent.id,
        collegeLecturerId,
        programSectionId: selectedStudent.programSectionId,
        subject,
        initialMessage: initialMessage.trim()
      });

      // Reset form
      setSelectedStudent(null);
      setSubject('');
      setInitialMessage('');
      setSearchQuery('');
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast.error('Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSubject('');
    setInitialMessage('');
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Student Conversation</h2>
              <p className="text-sm text-gray-500">Start a conversation with a college student</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Student
            </label>
            
            {/* Search */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, program, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Students List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No students found matching your search' : 'No students found in your programs'}
                  </p>
                  {!searchQuery && (
                    <p className="text-gray-400 text-xs mt-2">
                      Check console for debugging info. Make sure you are assigned to programs with enrolled students.
                    </p>
                  )}
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        selectedStudent?.id === student.id ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{student.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {student.programCode || student.program}
                          </span>
                          {student.section && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Section {student.section}
                            </span>
                          )}
                          {student.semester && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Sem {student.semester}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedStudent?.id === student.id && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="e.g., Assignment Discussion, Course Query, General Help"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{subject.length}/100 characters</p>
          </div>

          {/* Initial Message (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Message (Optional)
            </label>
            <textarea
              placeholder="Type your first message to the student..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{initialMessage.length}/500 characters</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!selectedStudent || !subject.trim() || creating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                {initialMessage.trim() ? 'Send Message & Start Conversation' : 'Start Conversation'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCollegeLecturerConversationModal;