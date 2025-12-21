import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const NewStudentConversationModalEducator = ({ isOpen, onClose, onCreateConversation, educatorId }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch students from educator's school
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen || !educatorId) return;
      
      setLoading(true);
      try {
        console.log('🔍 Fetching students for educator:', educatorId);
        
        // Get current user to access email
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No authenticated user found');
          setStudents([]);
          setFilteredStudents([]);
          setLoading(false);
          return;
        }
        
        let schoolId = null;
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
          setFilteredStudents([]);
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
        setFilteredStudents(studentsData || []);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen, educatorId]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(student => 
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.university?.toLowerCase().includes(query) ||
      student.branch_field?.toLowerCase().includes(query) ||
      student.contact_number?.toLowerCase().includes(query) ||
      student.grade?.toString().toLowerCase().includes(query) ||
      student.section?.toLowerCase().includes(query)
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
      await onCreateConversation(selectedStudent.id, subject.trim());
      handleClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSubject('');
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Start New Conversation</h2>
              <p className="text-sm text-gray-500">Select a student to message</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, email, university, branch, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Students List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Student</h3>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">Loading students...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserIcon className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? 'No students found' : 'No students available'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Make sure you are assigned to a school and students are enrolled'
                    }
                  </p>
                  {!searchQuery && (
                    <div className="text-center space-y-3 mt-3">
                      <p className="text-green-600 text-xs bg-green-50 px-3 py-2 rounded-lg">
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
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedStudent?.id === student.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">{student.name || 'Unnamed Student'}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      {(student.university || student.branch_field || student.grade) && (
                        <p className="text-xs text-green-600 mt-1">
                          {student.university && `${student.university}`}
                          {student.branch_field && ` • ${student.branch_field}`}
                          {student.grade && ` • Grade ${student.grade}${student.section ? `-${student.section}` : ''}`}
                        </p>
                      )}
                    </div>
                    {selectedStudent?.id === student.id && (
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Subject Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter conversation subject (e.g., Academic Support, Assignment Help)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              {subject.length}/100 characters
            </p>
          </div>

          {/* Selected Student Preview */}
          {selectedStudent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-2">Selected Student</h4>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {selectedStudent.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="font-medium text-green-900">{selectedStudent.name}</p>
                  <p className="text-sm text-green-700">{selectedStudent.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Always Visible */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!selectedStudent || !subject.trim() || creating}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Start Conversation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStudentConversationModalEducator;