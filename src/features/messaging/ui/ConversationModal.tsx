import React, { useState, useEffect } from 'react';
import { X, Search, GraduationCap, Building2, MessageCircle } from 'lucide-react';
import { supabase } from '@/shared/api';
import { ConversationType, getConversationConfig } from '../lib/conversationConfig';

interface Recipient {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  type?: string;
  department?: string;
  specialization?: string;
  university?: string;
  branch_field?: string;
  grade?: string;
  section?: string;
  role?: string;
  userId?: string;
}

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationType: ConversationType;
  contextId?: string; // schoolId, collegeId, studentId, etc.
  onConversationCreated: (data: any) => void;
}

// Icon mapping
const iconMap = {
  GraduationCap,
  Building2,
  MessageCircle
};

// Message Modal Component
const MessageModal: React.FC<{
  recipient: Recipient | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: any) => void;
  isLoading: boolean;
  conversationType: ConversationType;
}> = ({ recipient, isOpen, onClose, onSend, isLoading, conversationType }) => {
  const config = getConversationConfig(conversationType);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState(config.defaultSubject || '');
  const [customSubject, setCustomSubject] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject(config.defaultSubject || '');
      setCustomSubject('');
    }
  }, [isOpen, recipient, config.defaultSubject]);

  const handleSend = () => {
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject.trim();
    if (message.trim() && (!config.showSubjectSelection || finalSubject)) {
      onSend({
        recipientId: recipient?.id,
        recipientUserId: recipient?.userId,
        recipientType: recipient?.type,
        subject: finalSubject || config.defaultSubject,
        initialMessage: message.trim()
      });
    }
  };

  if (!isOpen || !recipient) return null;

  const Icon = iconMap[config.icon];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${config.iconBgColor} rounded-full flex items-center justify-center`}>
              <MessageCircle className={`w-4 h-4 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">New Conversation</h3>
              <p className="text-xs text-gray-500">Message your {config.recipientLabel.toLowerCase()}</p>
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
          {/* Selected Recipient */}
          <div className={`flex items-center gap-3 p-3 bg-${config.primaryColor}-50 rounded-lg border border-${config.primaryColor}-200`}>
            <img
              src={recipient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.name)}&background=${config.primaryColor === 'blue' ? '3B82F6' : '9333EA'}&color=fff`}
              alt={recipient.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{recipient.name}</p>
              <p className={`text-xs text-${config.primaryColor}-600`}>
                {recipient.type === 'school_educator' ? 'School Educator' : 
                 recipient.type === 'college_lecturer' ? 'College Lecturer' :
                 recipient.university || recipient.department || config.recipientLabel}
                {recipient.branch_field && ` • ${recipient.branch_field}`}
                {recipient.grade && ` • Grade ${recipient.grade}${recipient.section ? `-${recipient.section}` : ''}`}
                {recipient.specialization && ` • ${recipient.specialization}`}
              </p>
            </div>
            <div className={`w-5 h-5 bg-${config.primaryColor}-500 rounded-full flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Subject Selection */}
          {config.showSubjectSelection && config.subjects && config.subjects.length > 0 && (
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
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${config.primaryColor}-500 focus:border-transparent text-sm`}
              >
                {!subject && <option value="">Select a subject...</option>}
                {config.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
              
              {/* Custom Subject Input */}
              {subject === 'Other' && config.allowCustomSubject && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter your custom subject..."
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${config.primaryColor}-500 focus:border-transparent text-sm`}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{customSubject.length}/100 characters</p>
                </div>
              )}
            </div>
          )}

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
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${config.primaryColor}-500 focus:border-transparent resize-none text-sm`}
              maxLength={config.maxMessageLength}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/{config.maxMessageLength} characters</p>
          </div>

          {/* Quick Suggestions */}
          {!message.trim() && config.quickStarters && config.quickStarters.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Quick starters:</p>
              <div className="flex flex-wrap gap-2">
                {config.quickStarters.map((suggestion, idx) => (
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
              message.length > config.maxMessageLength ||
              (config.showSubjectSelection && !subject) ||
              (subject === 'Other' && config.allowCustomSubject && !customSubject.trim()) ||
              isLoading
            }
            className={`px-6 py-2 bg-${config.primaryColor}-600 hover:bg-${config.primaryColor}-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Conversation Modal Component
export const ConversationModal: React.FC<ConversationModalProps> = ({
  isOpen,
  onClose,
  conversationType,
  contextId,
  onConversationCreated
}) => {
  const config = getConversationConfig(conversationType);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (isOpen && config.fetchRecipients && contextId) {
      fetchRecipients();
    } else if (isOpen && !config.fetchRecipients) {
      // For non-fetching types, fetch organization info
      fetchOrganizationInfo();
    }
  }, [isOpen, conversationType, contextId]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      // Fetch based on conversation type
      if (conversationType === 'student-educator' || conversationType === 'admin-educator') {
        // Fetch educators
        const { data: educatorData, error } = await supabase
          .from('school_educators')
          .select('id, user_id, first_name, last_name, email, photo_url, role, subject_expertise')
          .eq('school_id', contextId)
          .order('first_name');
        
        if (!error && educatorData) {
          data = educatorData.map(e => ({
            id: e.id,
            userId: e.user_id,
            name: `${e.first_name} ${e.last_name}`,
            email: e.email,
            photo_url: e.photo_url,
            type: 'school_educator',
            role: e.role,
            specialization: Array.isArray(e.subject_expertise) ? 
              e.subject_expertise.map((s: any) => s.subject || s).join(', ') : 
              e.subject_expertise
          }));
        }
      } else if (conversationType === 'admin-student' || conversationType === 'college-admin-student') {
        // Fetch students
        const { data: studentData, error } = await supabase
          .from('students')
          .select('id, name, email, university, branch_field, grade, section')
          .eq(conversationType === 'admin-student' ? 'school_id' : 'university_college_id', contextId)
          .order('name');
        
        if (!error && studentData) {
          data = studentData.map(s => ({
            id: s.id,
            name: s.name || 'Unnamed Student',
            email: s.email,
            university: s.university,
            branch_field: s.branch_field,
            grade: s.grade,
            section: s.section
          }));
        }
      } else if (conversationType === 'college-lecturer') {
        // Fetch college lecturers
        const { data: lecturerData, error } = await supabase
          .from('college_lecturers')
          .select('id, first_name, last_name, email, department, specialization, user_id')
          .eq('collegeId', contextId)
          .order('first_name');
        
        if (!error && lecturerData) {
          data = lecturerData.map(l => ({
            id: l.id,
            userId: l.user_id,
            name: `${l.first_name} ${l.last_name}`,
            email: l.email,
            type: 'college_lecturer',
            department: l.department,
            specialization: l.specialization
          }));
        }
      }
      
      setRecipients(data);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationInfo = async () => {
    setLoading(true);
    try {
      // Fetch organization/school/college info for display
      // This is used when we don't need to select a recipient
      setLoading(false);
    } catch (error) {
      console.error('Error fetching organization info:', error);
      setLoading(false);
    }
  };

  const handleCreateConversation = async (conversationData: any) => {
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

  const handleRecipientSelect = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setShowMessageModal(true);
  };

  const handleClose = () => {
    setSelectedRecipient(null);
    setShowMessageModal(false);
    setSearchQuery('');
    onClose();
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    setSelectedRecipient(null);
  };

  const filteredRecipients = recipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (recipient.specialization && recipient.specialization.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (recipient.department && recipient.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  const Icon = iconMap[config.icon];

  return (
    <>
      {/* Main Recipient Selection Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${config.iconBgColor} rounded-full flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
                <p className="text-sm text-gray-500">{config.subtitle}</p>
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
              {config.fetchRecipients && (
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${config.recipientLabel.toLowerCase()}s...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={`w-8 h-8 border-4 border-${config.primaryColor}-600 border-t-transparent rounded-full animate-spin`} />
                </div>
              ) : filteredRecipients.length === 0 && config.fetchRecipients ? (
                <div className="text-center py-12">
                  <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? `No ${config.recipientLabel.toLowerCase()}s found for "${searchQuery}"` : `No ${config.recipientLabel.toLowerCase()}s found`}
                  </p>
                </div>
              ) : config.fetchRecipients ? (
                <div className="space-y-3">
                  {filteredRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => handleRecipientSelect(recipient)}
                      className={`w-full text-left p-4 border border-gray-200 rounded-lg hover:border-${config.primaryColor}-300 hover:bg-${config.primaryColor}-50 transition-all group`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={recipient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.name)}&background=${config.primaryColor === 'blue' ? '3B82F6' : '9333EA'}&color=fff`}
                          alt={recipient.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className={`font-semibold text-gray-900 group-hover:text-${config.primaryColor}-700`}>
                            {recipient.name}
                          </h3>
                          <p className="text-sm text-gray-500">{recipient.email}</p>
                          {(recipient.university || recipient.department || recipient.grade) && (
                            <p className={`text-xs text-${config.primaryColor}-600 mt-1`}>
                              {recipient.university && `${recipient.university}`}
                              {recipient.department && `${recipient.department}`}
                              {recipient.branch_field && ` • ${recipient.branch_field}`}
                              {recipient.grade && ` • Grade ${recipient.grade}${recipient.section ? `-${recipient.section}` : ''}`}
                            </p>
                          )}
                        </div>
                        <div className={`text-${config.primaryColor}-600 group-hover:text-${config.primaryColor}-700`}>
                          <MessageCircle className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
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
        recipient={selectedRecipient}
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        onSend={handleCreateConversation}
        isLoading={sendingMessage}
        conversationType={conversationType}
      />
    </>
  );
};

export default ConversationModal;
