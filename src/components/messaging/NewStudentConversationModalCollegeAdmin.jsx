import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const NewStudentConversationModalCollegeAdmin = ({ isOpen, onClose, collegeId, onConversationCreated }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subject, setSubject] = useState('General Discussion');

  // Predefined subjects for college admin conversations
  const subjects = [
    'General Discussion',
    'Academic Support',
    'Attendance Issue',
    'Fee Payment',
    'Document Request',
    'Course Registration',
    'Examination Query',
    'Placement Support',
    'Library Access',
    'Hostel/Accommodation',
    'Other'
  ];

  // Fetch students from the college
  useEffect(() => {
    if (isOpen && collegeId) {
      fetchStudents();
    }
  }, [isOpen, collegeId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching students for college:', collegeId);
      
      // First get the college name for fallback search
      const { data: collegeInfo, error: collegeError } = await supabase
        .from('colleges')
        .select('id, name')
        .eq('id', collegeId)
        .single();
      
      if (collegeError) {
        console.error('❌ Error fetching college info:', collegeError);
      }
      
      console.log('🏫 College info:', collegeInfo);
      
      // Try multiple approaches to find students
      let studentsData = [];
      
      // Method 1: Direct college association (without users join to avoid column errors)
      const { data: directStudents, error: directError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          name,
          email,
          university,
          branch_field,
          college_id,
          university_college_id
        `)
        .or(`college_id.eq.${collegeId},university_college_id.eq.${collegeId}`)
        .order('name');

      if (!directError && directStudents && directStudents.length > 0) {
        console.log('✅ Found students with direct college association:', directStudents.length);
        studentsData = directStudents;
      } else if (collegeInfo) {
        console.log('⚠️ No direct association found, trying college name search...');
        
        // Method 2: Search by college name in university field or email domain
        const collegeName = collegeInfo.name.toLowerCase();
        const { data: nameStudents, error: nameError } = await supabase
          .from('students')
          .select(`
            id,
            user_id,
            name,
            email,
            university,
            branch_field,
            college_id,
            university_college_id
          `)
          .or(`university.ilike.%${collegeInfo.name}%,email.ilike.%${collegeName.replace(/\s+/g, '')}%`)
          .order('name');
        
        if (!nameError && nameStudents && nameStudents.length > 0) {
          console.log('✅ Found students using college name search:', nameStudents.length);
          studentsData = nameStudents;
        } else {
          console.log('❌ No students found with any method');
          studentsData = [];
        }
      }

      if (directError && !collegeInfo) throw directError;

      const formattedStudents = studentsData.map(student => ({
        id: student.id,
        user_id: student.user_id,
        name: student.name || student.email || 'Student',
        email: student.email || '',
        university: student.university || '',
        branch: student.branch_field || '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.email || 'Student')}&background=3B82F6&color=fff`
      }));

      console.log('📋 Final formatted students:', formattedStudents.length);
      setStudents(formattedStudents);
      setFilteredStudents(formattedStudents);
      
      if (formattedStudents.length === 0) {
        const collegeName = collegeInfo?.name || 'this college';
        console.warn('⚠️ No students found for:', collegeName);
        toast.info(`No students found for ${collegeName}. Students may need to be associated with this college first.`);
      } else {
        console.log('✅ Students loaded:', formattedStudents.map(s => s.name).join(', '));
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      toast.error('Failed to load students: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.university && student.university.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.branch && student.branch.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleCreateConversation = () => {
    if (selectedStudent && subject) {
      onConversationCreated({
        studentId: selectedStudent.user_id,
        subject: subject,
        initialMessage: '' // College admin will send first message after creation
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSubject('General Discussion');
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
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
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="p-6">
            {/* Subject Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Conversation Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, email, university, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? `No students found for "${searchQuery}"` : 'No students found in this college'}
                  </p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedStudent?.id === student.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {student.name}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {student.email}
                      </p>
                      {(student.university || student.branch) && (
                        <p className="text-xs text-blue-600 truncate">
                          {student.university} {student.branch && `• ${student.branch}`}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
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
          <button
            onClick={handleCreateConversation}
            disabled={!selectedStudent}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStudentConversationModalCollegeAdmin;