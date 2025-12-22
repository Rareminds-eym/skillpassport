import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewEducatorConversationModal = ({ isOpen, onClose, studentId, onConversationCreated }) => {
  const [educators, setEducators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Fetch student's educators (from their classes)
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentEducators();
    }
  }, [isOpen, studentId]);

  const fetchStudentEducators = async () => {
    setLoading(true);
    try {
      // Get student's school_id first
      const { data: studentData } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', studentId)
        .single();

      if (!studentData?.school_id) {
        console.error('Student has no school_id');
        setLoading(false);
        return;
      }

      // Get all educators and their class assignments for this school
      const { data: assignments, error } = await supabase
        .from('school_educator_class_assignments')
        .select(`
          id,
          subject,
          class_id,
          school_classes!inner (
            id,
            name,
            grade,
            section,
            school_id
          ),
          school_educators!inner (
            id,
            first_name,
            last_name,
            email,
            photo_url
          )
        `)
        .eq('school_classes.school_id', studentData.school_id);

      if (error) throw error;

      // Group by educator
      const educatorMap = new Map();
      assignments?.forEach(assignment => {
        const educator = assignment.school_educators;
        const educatorId = educator.id;
        
        if (!educatorMap.has(educatorId)) {
          educatorMap.set(educatorId, {
            id: educatorId,
            name: `${educator.first_name} ${educator.last_name}`,
            email: educator.email,
            photo_url: educator.photo_url,
            classes: []
          });
        }
        
        educatorMap.get(educatorId).classes.push({
          classId: assignment.school_classes.id,
          className: assignment.school_classes.name,
          grade: assignment.school_classes.grade,
          section: assignment.school_classes.section,
          subject: assignment.subject
        });
      });

      setEducators(Array.from(educatorMap.values()));
    } catch (error) {
      console.error('Error fetching educators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = () => {
    if (selectedEducator && selectedClass && selectedSubject && initialMessage.trim()) {
      onConversationCreated({
        educatorId: selectedEducator.id,
        classId: selectedClass.classId,
        subject: selectedSubject,
        initialMessage: initialMessage.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedEducator(null);
    setSelectedClass(null);
    setSelectedSubject('');
    setInitialMessage('');
    setSearchQuery('');
    onClose();
  };

  const filteredEducators = educators.filter(educator =>
    educator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    educator.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
              <p className="text-sm text-gray-500">Message your teacher about a class</p>
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
              <div className="space-y-4">
                {filteredEducators.map((educator) => (
                  <div key={educator.id} className="border border-gray-200 rounded-lg p-4">
                    {/* Educator Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={educator.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name)}&background=3B82F6&color=fff`}
                        alt={educator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{educator.name}</h3>
                        <p className="text-sm text-gray-500">{educator.email}</p>
                      </div>
                    </div>

                    {/* Classes & Subjects */}
                    <div className="space-y-2">
                      {educator.classes.map((classInfo, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedEducator(educator);
                            setSelectedClass(classInfo);
                            setSelectedSubject(classInfo.subject);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                            selectedEducator?.id === educator.id && 
                            selectedClass?.classId === classInfo.classId &&
                            selectedSubject === classInfo.subject
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{classInfo.subject}</p>
                              <p className="text-xs text-gray-500">
                                {classInfo.grade}{classInfo.section ? `-${classInfo.section}` : ''} • {classInfo.className}
                              </p>
                            </div>
                            {selectedEducator?.id === educator.id && 
                             selectedClass?.classId === classInfo.classId &&
                             selectedSubject === classInfo.subject && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input Section - Now inside scrollable area */}
          {selectedEducator && selectedClass && selectedSubject && (
            <div className="border-t-2 border-blue-200 bg-blue-50 p-6">
              <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                  📝 Your message to {selectedEducator.name}
                </label>
                <div className="text-sm text-gray-600 mb-4 p-3 bg-white rounded-md border border-blue-200 shadow-sm">
                  Subject: <span className="font-medium text-blue-700">{selectedSubject}</span> • Class: <span className="font-medium text-blue-700">{selectedClass.grade}{selectedClass.section ? `-${selectedClass.section}` : ''}</span>
                </div>
              </div>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message here... (e.g., 'Hello, I have a question about today's homework assignment...')"
                rows={6}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base bg-white shadow-sm"
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-600 font-medium">
                  {initialMessage.length}/500 characters
                </div>
                {initialMessage.length > 500 && (
                  <div className="text-sm text-red-600 font-medium">
                    ⚠️ Message too long
                  </div>
                )}
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
            disabled={!selectedEducator || !selectedClass || !selectedSubject || !initialMessage.trim() || initialMessage.length > 500}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {initialMessage.trim() ? 'Send Message & Start Conversation' : 'Start Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewEducatorConversationModal;