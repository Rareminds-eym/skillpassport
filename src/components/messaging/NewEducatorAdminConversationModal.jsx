import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewEducatorAdminConversationModal = ({ isOpen, onClose, educatorId, onConversationCreated }) => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Predefined subjects for educator-admin conversations
  const adminSubjects = [
    'General Inquiry',
    'Resource Request',
    'Student Issue',
    'Curriculum Support',
    'Technical Support',
    'Policy Question',
    'Training Request',
    'Facility Issue',
    'Schedule Conflict',
    'Other'
  ];

  // Fetch educator's school information
  useEffect(() => {
    if (isOpen && educatorId) {
      console.log('🔍 Modal opened for educator ID:', educatorId);
      fetchEducatorSchool();
    } else if (isOpen && !educatorId) {
      console.warn('⚠️ Modal opened but no educator ID provided');
      setLoading(false);
    }
  }, [isOpen, educatorId]);

  const fetchEducatorSchool = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching school for educator ID:', educatorId);
      
      // First try: Get educator's school information by user_id
      let { data: educatorData, error } = await supabase
        .from('school_educators')
        .select(`
          school_id,
          schools (
            id,
            name,
            address,
            phone,
            email
          )
        `)
        .eq('user_id', educatorId)
        .single();

      console.log('📋 First attempt - Educator query result:', { educatorData, error });

      // If first attempt fails, try by email (in case user_id doesn't match)
      if (error && error.code === 'PGRST116') {
        console.log('🔄 First attempt failed, trying by email...');
        
        // Get current user email from auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user?.email) {
          console.log('📧 Trying with email:', user.email);
          
          const { data: educatorByEmail, error: emailError } = await supabase
            .from('school_educators')
            .select(`
              school_id,
              user_id,
              schools (
                id,
                name,
                address,
                phone,
                email
              )
            `)
            .eq('email', user.email)
            .single();
          
          console.log('📋 Email attempt result:', { educatorByEmail, emailError });
          
          if (!emailError && educatorByEmail) {
            educatorData = educatorByEmail;
            error = null;
            
            // Update the user_id in the auth system if it doesn't match
            if (educatorByEmail.user_id !== educatorId) {
              console.log('⚠️ User ID mismatch detected:', {
                authUserId: educatorId,
                dbUserId: educatorByEmail.user_id
              });
            }
          } else {
            error = emailError;
          }
        }
      }

      if (error) {
        console.error('❌ Database error:', error);
        
        if (error.code === 'PGRST116') {
          console.log('🔄 No educator record found for this user');
          setSchool(null);
          return;
        }
        
        throw error;
      }

      if (educatorData?.schools) {
        console.log('✅ School found:', educatorData.schools);
        setSchool(educatorData.schools);
      } else {
        console.warn('⚠️ Educator has no associated school');
        setSchool(null);
      }
    } catch (error) {
      console.error('❌ Error fetching school:', error);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = () => {
    if (school && selectedSubject && initialMessage.trim()) {
      onConversationCreated({
        schoolId: school.id,
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
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Contact School Administration</h2>
              <p className="text-sm text-gray-500">Send a message to your school admin</p>
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
            {!educatorId ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Authentication required</p>
                <p className="text-gray-400 text-xs mt-2">
                  Please make sure you're logged in as an educator to use this feature.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !school ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Unable to load school information</p>
                <p className="text-gray-400 text-xs mt-2">
                  This might happen if you're not registered as an educator or there's a connection issue.
                </p>
                <button
                  onClick={fetchEducatorSchool}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* School Information */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{school.name}</h3>
                      <p className="text-sm text-gray-600">School Administration</p>
                    </div>
                  </div>
                  
                  {school.address && (
                    <p className="text-sm text-gray-600 mb-2">📍 {school.address}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {school.phone && (
                      <span>📞 {school.phone}</span>
                    )}
                    {school.email && (
                      <span>✉️ {school.email}</span>
                    )}
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
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 text-gray-700'
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
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Input Section */}
          {school && selectedSubject && (
            <div className="border-t-2 border-green-200 bg-green-50 p-6">
              <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                  💬 Your message to {school.name} Administration
                </label>
                <div className="text-sm text-gray-600 mb-4 p-3 bg-white rounded-md border border-green-200 shadow-sm">
                  Subject: <span className="font-medium text-green-700">{selectedSubject}</span>
                </div>
              </div>
              
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message here... (e.g., 'Hello, I need assistance with classroom resources for my upcoming lesson. Could you please help me?')"
                rows={6}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-base bg-white shadow-sm"
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
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 Tips for effective communication:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Be clear and specific about your request</li>
                  <li>• Include relevant details (class, subject, student names if applicable)</li>
                  <li>• Use professional and respectful language</li>
                  <li>• Provide context for your request</li>
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
            disabled={!school || !selectedSubject || !initialMessage.trim() || initialMessage.length > 1000}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {initialMessage.trim() ? 'Send Message to Administration' : 'Start Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewEducatorAdminConversationModal;