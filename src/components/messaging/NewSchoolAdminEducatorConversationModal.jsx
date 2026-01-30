import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewSchoolAdminEducatorConversationModal = ({ isOpen, onClose, schoolId, onConversationCreated }) => {
  const [educators, setEducators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Predefined subjects for admin-educator conversations
  const educatorSubjects = [
    'General Communication',
    'Resource Allocation',
    'Student Performance',
    'Curriculum Discussion',
    'Policy Update',
    'Training Information',
    'Schedule Coordination',
    'Facility Management',
    'Performance Review',
    'Other'
  ];

  // Fetch school's educators
  useEffect(() => {
    if (isOpen && schoolId) {
      console.log('🔍 Modal opened for school ID:', schoolId);
      fetchSchoolEducators();
    } else if (isOpen && !schoolId) {
      console.warn('⚠️ Modal opened but no school ID provided');
      setLoading(false);
    }
  }, [isOpen, schoolId]);

  const fetchSchoolEducators = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching educators for school ID:', schoolId);
      
      // Get all educators for this school
      const { data: educatorData, error } = await supabase
        .from('school_educators')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          email,
          phone_number,
          photo_url,
          role,
          subject_expertise
        `)
        .eq('school_id', schoolId)
        .neq('role', 'school_admin') // Exclude school admins
        .order('first_name');

      console.log('📋 Educators query result:', { educatorData, error, schoolId });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      // Transform the data
      const transformedEducators = educatorData?.map(educator => ({
        id: educator.id,
        userId: educator.user_id,
        name: `${educator.first_name} ${educator.last_name}`.trim(),
        email: educator.email,
        phone: educator.phone_number,
        photo_url: educator.photo_url,
        role: educator.role,
        specialization: educator.subject_expertise ? 
          (Array.isArray(educator.subject_expertise) ? 
            educator.subject_expertise.map(s => s.subject || s).join(', ') : 
            educator.subject_expertise) : 
          null
      })) || [];

      console.log('✅ Transformed educators:', transformedEducators);
      setEducators(transformedEducators);
    } catch (error) {
      console.error('❌ Error fetching educators:', error);
      setEducators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = () => {
    const finalSubject = selectedSubject === 'Other' ? customSubject : selectedSubject;
    if (selectedEducator && finalSubject && initialMessage.trim()) {
      onConversationCreated({
        educatorId: selectedEducator.id,
        educatorUserId: selectedEducator.userId,
        subject: finalSubject,
        initialMessage: initialMessage.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedEducator(null);
    setSelectedSubject('');
    setCustomSubject('');
    setInitialMessage('');
    setSearchQuery('');
    setShowSubjectDropdown(false);
    onClose();
  };

  const filteredEducators = educators.filter(educator =>
    educator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    educator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (educator.specialization && educator.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">New Message</h2>
              <p className="text-sm text-gray-500">Send a message to an educator</p>
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
                placeholder="Search educators by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredEducators.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? `No educators found for "${searchQuery}"` : 'No educators found'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Select an educator to message:
                </h3>
                {filteredEducators.map((educator) => (
                  <button
                    key={educator.id}
                    onClick={() => setSelectedEducator(educator)}
                    className={`w-full text-left border border-gray-200 rounded-lg p-4 transition-all ${
                      selectedEducator?.id === educator.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={educator.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name)}&background=10B981&color=fff`}
                        alt={educator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{educator.name}</h3>
                          {selectedEducator?.id === educator.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{educator.email}</p>
                        {educator.specialization && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            {educator.specialization}
                          </p>
                        )}
                        {educator.role && educator.role !== 'teacher' && (
                          <p className="text-xs text-gray-500 capitalize">
                            {educator.role.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Subject Selection */}
            {selectedEducator && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your message about?
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                  >
                    <span className={selectedSubject ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedSubject || 'Select a subject...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSubjectDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {educatorSubjects.map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(subject);
                            setShowSubjectDropdown(false);
                            if (subject !== 'Other') {
                              setCustomSubject('');
                            }
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Subject Input */}
                {selectedSubject === 'Other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Please specify your subject..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Input Section */}
          {selectedEducator && (selectedSubject && selectedSubject !== 'Other' || customSubject) && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to {selectedEducator.name}
                </label>
                <div className="text-sm text-gray-600 mb-3 p-3 bg-white rounded-lg border border-gray-200">
                  <span className="font-medium">Subject:</span> {selectedSubject === 'Other' ? customSubject : selectedSubject}
                </div>
              </div>
              
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                maxLength={1000}
              />
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-500">
                  {initialMessage.length}/1000 characters
                </div>
                {initialMessage.length > 1000 && (
                  <div className="text-sm text-red-600">
                    Message too long
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!selectedEducator || (!selectedSubject || (selectedSubject === 'Other' && !customSubject)) || !initialMessage.trim() || initialMessage.length > 1000}
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

export default NewSchoolAdminEducatorConversationModal;