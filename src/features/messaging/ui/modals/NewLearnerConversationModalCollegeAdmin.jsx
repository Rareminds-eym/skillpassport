import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/shared/api/supabaseClient';

// Small Message Modal Component
const MessageModal = ({ learner, isOpen, onClose, onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('General Discussion');
  const [customSubject, setCustomSubject] = useState('');

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

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject('General Discussion');
      setCustomSubject('');
    }
  }, [isOpen, learner]);

  const handleSend = () => {
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject.trim();
    if (message.trim() && finalSubject) {
      onSend({
        learnerId: learner.user_id,
        subject: finalSubject,
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
            <img
              src={learner.avatar}
              alt={learner.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{learner.name}</p>
              <p className="text-xs text-blue-600">
                {learner.university || 'Learner'} {learner.branch && `• ${learner.branch}`}
              </p>
            </div>
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's this about?
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (e.target.value !== 'Other') {
                  setCustomSubject('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
            
            {/* Custom Subject Input */}
            {subject === 'Other' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter your custom subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{customSubject.length}/100 characters</p>
              </div>
            )}
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
                  "Hi! I need to discuss something",
                  "Regarding your academic progress",
                  "Can we schedule a meeting?"
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
              message.length > 500 ||
              (subject === 'Other' && !customSubject.trim()) ||
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

const NewLearnerConversationModalCollegeAdmin = ({ isOpen, onClose, collegeId, onConversationCreated }) => {
  const [learners, setlearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch learners from the college
  useEffect(() => {
    if (isOpen && collegeId) {
      fetchlearners();
    }
  }, [isOpen, collegeId]);

  const fetchlearners = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching learners for college:', collegeId);
      
      // First get the college name for fallback search from organizations table
      const { data: collegeInfo, error: collegeError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', collegeId)
        .single();
      
      if (collegeError) {
        console.error('❌ Error fetching college info:', collegeError);
      }
      
      console.log('🏫 College info:', collegeInfo);
      
      // Try multiple approaches to find learners
      let learnersData = [];
      
      // Method 1: Direct college association (without users join to avoid column errors)
      const { data: directlearners, error: directError } = await supabase
        .from('learners')
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

      if (!directError && directlearners && directlearners.length > 0) {
        console.log('✅ Found learners with direct college association:', directlearners.length);
        learnersData = directlearners;
      } else if (collegeInfo) {
        console.log('⚠️ No direct association found, trying college name search...');
        
        // Method 2: Search by college name in university field or email domain
        const collegeName = collegeInfo.name.toLowerCase();
        const { data: namelearners, error: nameError } = await supabase
          .from('learners')
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
        
        if (!nameError && namelearners && namelearners.length > 0) {
          console.log('✅ Found learners using college name search:', namelearners.length);
          learnersData = namelearners;
        } else {
          console.log('❌ No learners found with any method');
          learnersData = [];
        }
      }

      if (directError && !collegeInfo) throw directError;

      const formattedlearners = learnersData.map(learner => ({
        id: learner.id,
        user_id: learner.user_id,
        name: learner.name || learner.email || 'Learner',
        email: learner.email || '',
        university: learner.university || '',
        branch: learner.branch_field || '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(learner.name || learner.email || 'Learner')}&background=3B82F6&color=fff`
      }));

      console.log('📋 Final formatted learners:', formattedlearners.length);
      setlearners(formattedlearners);
      
      if (formattedlearners.length === 0) {
        const collegeName = collegeInfo?.name || 'this college';
        console.warn('⚠️ No learners found for:', collegeName);
        toast({
          title: "No learners found",
          description: `No learners found for ${collegeName}. Learners may need to be associated with this college first.`,
        });
      } else {
        console.log('✅ Learners loaded:', formattedlearners.map(s => s.name).join(', '));
      }
    } catch (error) {
      console.error('❌ Error fetching learners:', error);
      toast.error('Failed to load learners: ' + error.message);
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

  const handlelearnerSelect = (learner) => {
    setSelectedLearner(learner);
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

  const filteredlearners = learners.filter(learner =>
    learner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (learner.university && learner.university.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (learner.branch && learner.branch.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                    {searchQuery ? `No learners found for "${searchQuery}"` : 'No learners found in this college'}
                  </p>
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
                        <img
                          src={learner.avatar}
                          alt={learner.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {learner.name}
                          </h3>
                          <p className="text-sm text-gray-500">{learner.email}</p>
                          {(learner.university || learner.branch) && (
                            <p className="text-xs text-blue-600 mt-1">
                              {learner.university} {learner.branch && `• ${learner.branch}`}
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
        learner={selectedLearner}
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        onSend={handleCreateConversation}
        isLoading={sendingMessage}
      />
    </>
  );
};

export default NewLearnerConversationModalCollegeAdmin;