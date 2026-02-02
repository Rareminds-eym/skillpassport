import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewEducatorAdminConversationModal = ({ isOpen, onClose, educatorId, onConversationCreated }) => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
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
      
      // Get educator's school information from organizations table
      let { data: educatorData, error } = await supabase
        .from('school_educators')
        .select(`
          school_id,
          school:organizations!school_educators_school_id_fkey (
            id,
            name,
            city,
            state,
            organization_type
          )
        `)
        .eq('user_id', educatorId)
        .single();

      console.log('📋 Educator query result:', { educatorData, error });

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
              school:organizations!school_educators_school_id_fkey (
                id,
                name,
                city,
                state,
                organization_type
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

      if (educatorData?.school) {
        // Map the organization data to match expected school structure
        const schoolData = {
          id: educatorData.school.id,
          name: educatorData.school.name,
          address: educatorData.school.city && educatorData.school.state 
            ? `${educatorData.school.city}, ${educatorData.school.state}` 
            : null,
          phone: null, // Organizations table doesn't have phone
          email: null  // Organizations table doesn't have email
        };
        console.log('✅ School found:', schoolData);
        setSchool(schoolData);
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
    const finalSubject = selectedSubject === 'Other' ? customSubject : selectedSubject;
    if (school && finalSubject && initialMessage.trim()) {
      onConversationCreated({
        schoolId: school.id,
        subject: finalSubject,
        initialMessage: initialMessage.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedSubject('');
    setCustomSubject('');
    setInitialMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Message School Admin</h2>
              <p className="text-sm text-gray-500">Start a conversation</p>
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
        <div className="flex-1 overflow-y-auto">
          {!educatorId ? (
            <div className="text-center py-12 px-6">
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
            <div className="text-center py-12 px-6">
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
            <div className="p-6 space-y-6">
              {/* School Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{school.name}</h3>
                    <p className="text-sm text-gray-600">School Administration</p>
                    {school.address && (
                      <p className="text-xs text-gray-500 mt-1">{school.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you need help with?
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                >
                  <option value="">Select a subject...</option>
                  {adminSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Subject Input */}
              {selectedSubject === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your subject..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customSubject.length}/100 characters
                  </div>
                </div>
              )}

              {/* Message Input */}
              {selectedSubject && (selectedSubject !== 'Other' || customSubject.trim()) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your message
                  </label>
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      {initialMessage.length}/1000 characters
                    </div>
                    {initialMessage.length > 1000 && (
                      <div className="text-xs text-red-600">
                        Message too long
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!school || !selectedSubject || (selectedSubject === 'Other' && !customSubject.trim()) || !initialMessage.trim() || initialMessage.length > 1000}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewEducatorAdminConversationModal;