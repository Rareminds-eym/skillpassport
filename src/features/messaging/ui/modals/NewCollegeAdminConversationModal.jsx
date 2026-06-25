import { Building2, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiPost } from '@/shared/api/apiClient';

const NewCollegeAdminConversationModal = ({ isOpen, onClose, learnerId, collegeId, onConversationCreated }) => {
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Predefined subjects for college admin conversations
  const collegeAdminSubjects = [
    'General Inquiry',
    'Academic Support',
    'Attendance Issue',
    'Fee Payment',
    'Document Request',
    'Complaint/Feedback',
    'Technical Support',
    'Admission Query',
    'Course Registration',
    'Examination Query',
    'Placement Support',
    'Library Access',
    'Hostel/Accommodation',
    'Other'
  ];

  // Fetch learner's college information
  useEffect(() => {
    if (isOpen && learnerId) {
      fetchlearnerCollege();
    }
  }, [isOpen, learnerId, collegeId]);

  const fetchlearnerCollege = async () => {
    setLoading(true);
    try {
      // If collegeId is provided, use it; otherwise fetch it
      let collegeIdToUse = collegeId;

      if (!collegeIdToUse) {
        const { data: learnerData } = await apiPost('/messaging/actions', { action: 'fetch-learner-college', learnerId });
        collegeIdToUse = learnerData?.college_id;
      }

      if (collegeIdToUse) {
        // Fetch college organization data
        const { data: collegeOrgData } = await apiPost('/messaging/actions', { action: 'fetch-organization', id: collegeIdToUse });

        if (collegeOrgData) {
          const collegeData = {
            id: collegeOrgData.id,
            name: collegeOrgData.name,
            address: collegeOrgData.city && collegeOrgData.state
              ? `${collegeOrgData.city}, ${collegeOrgData.state}`
              : null,
            phone: null,
            email: null
          };
          setCollege(collegeData);
        } else {
          console.error('College not found');
        }
      } else {
        console.error('Learner has no associated college');
      }
    } catch (error) {
      console.error('Error fetching college:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = () => {
    const finalSubject = selectedSubject === 'Other' ? customSubject : selectedSubject;
    if (college && finalSubject) {
      onConversationCreated({
        collegeId: college.id,
        subject: finalSubject,
        initialMessage: initialMessage.trim() || '' // Allow empty initial message for direct chat
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Message College Admin</h2>
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !college ? (
            <div className="text-center py-12 px-6">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm font-medium">No college linked to your account</p>
              <p className="text-gray-400 text-xs mt-2 mb-4">To message your college administrator, please ensure your college is linked to your profile.</p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-left">
                <p className="text-xs text-purple-800 font-medium mb-2">To fix this:</p>
                <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
                  <li>Go to your Profile settings</li>
                  <li>Add or update your college information</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* College Card */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{college.name}</h3>
                    <p className="text-sm text-gray-600">College Administration</p>
                    {college.address && (
                      <p className="text-xs text-gray-500 mt-1">{college.address}</p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                >
                  <option value="">Select a subject...</option>
                  {collegeAdminSubjects.map((subject) => (
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customSubject.length}/100 characters
                  </div>
                </div>
              )}

              {/* Message Input - Optional */}
              {selectedSubject && (selectedSubject !== 'Other' || customSubject.trim()) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your message <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="You can type your message here, or start chatting directly..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!college || !selectedSubject || (selectedSubject === 'Other' && !customSubject.trim()) || initialMessage.length > 1000}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {initialMessage.trim() ? 'Send Message' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCollegeAdminConversationModal;