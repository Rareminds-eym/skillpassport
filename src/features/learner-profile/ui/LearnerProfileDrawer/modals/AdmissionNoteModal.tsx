import { useAuthStore } from '@/shared/model/authStore';
import { ChatBubbleLeftRightIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import MessageService from '@/shared/api/messageService';
import type { Learner } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('admission-note-modal');

interface AdmissionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: Learner;
  onSuccess?: () => void;
  userRole?: 'school_admin' | 'college_admin' | 'university_admin' | 'educator';
}

const AdmissionNoteModal: React.FC<AdmissionNoteModalProps> = ({
  isOpen,
  onClose,
  learner,
  onSuccess,
  userRole,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendToCommunication, setSendToCommunication] = useState(true); // Auto-checked by default

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      // Save note locally (existing behavior)
      // TODO: Save to admission_notes table if needed
      
      // If "Send to Communication" is checked, send as message
      if (sendToCommunication) {
        await sendNoteAsCommunication();
      } else {
        // Just save locally with a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Note saved successfully');
      }

      onSuccess?.();
      setNote('');
      setSendToCommunication(false);
      onClose();
    } catch (error) {
      logger.error('Error saving note', error as Error);
      toast.error('Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendNoteAsCommunication = async () => {
    try {
      // Get current user
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Detect user type and get appropriate IDs
      let userType: 'school_admin' | 'college_admin' | 'college_educator' | 'school_educator' | null = null;
      let organizationId: string | null = null;
      let educatorId: string | null = null;

      if (userRole === 'school_admin') {
        try {
          const orgRes = await apiPost<{ data?: { id: string } }>('/learner-profile/actions', { action: 'fetch-organization', adminId: user.id, type: 'school' });
          if (orgRes?.data?.id) {
            userType = 'school_admin';
            organizationId = orgRes.data.id;
          }
        } catch (err) {
          logger.error('Failed to fetch school organization', err as Error);
          throw new Error('Failed to fetch school organization');
        }
      } else if (userRole === 'college_admin') {
        try {
          const orgRes = await apiPost<{ data?: { id: string } }>('/learner-profile/actions', { action: 'fetch-organization', adminId: user.id, type: 'college' });
          if (orgRes?.data?.id) {
            userType = 'college_admin';
            organizationId = orgRes.data.id;
          }
        } catch (err) {
          logger.error('Failed to fetch college organization', err as Error);
          throw new Error('Failed to fetch college organization');
        }
      } else {
        // Check if user is a school educator
        try {
          const schoolEducatorRes = await apiPost<{ data?: { id: string; school_id: string } }>('/learner-profile/actions', { action: 'fetch-school-educator-by-user', userId: user.id });
          if (schoolEducatorRes?.data) {
            userType = 'school_educator';
            educatorId = schoolEducatorRes.data.id;
            organizationId = schoolEducatorRes.data.school_id;
          }
        } catch (err) {
          logger.error('Failed to fetch school educator', err as Error);
          // don't throw — fall through to check college lecturer
        }

        if (!userType) {
          // Check if user is a college lecturer
          try {
            const lecturerRes = await apiPost<{ data?: { id: string; collegeId: string; designation: string } }>('/learner-profile/actions', { action: 'fetch-user-college-lecturer', userId: user.id });
            if (lecturerRes?.data) {
              educatorId = lecturerRes.data.id;
              organizationId = lecturerRes.data.collegeId;
              const adminDesignations = ['principal', 'dean', 'hod', 'admin', 'director'];
              const isAdmin = lecturerRes.data?.designation &&
                             adminDesignations.some((d: string) => lecturerRes.data?.designation?.toLowerCase().includes(d));
              userType = isAdmin ? 'college_admin' : 'college_educator';
            }
          } catch (err) {
            logger.error('Failed to fetch college lecturer', err as Error);
            throw new Error('Failed to fetch educator details');
          }
        }
      }

      if (!userType || !organizationId) {
        throw new Error('Could not determine user type or organization');
      }

      if ((userType === 'school_educator' || userType === 'college_educator') && !educatorId) {
        throw new Error('Could not determine educator ID');
      }

      // conversations.learner_id references learners.user_id
      const conversationLearnerId = learner.user_id;
      if (!conversationLearnerId) {
        throw new Error('Learner user_id is required for messaging');
      }

      // educatorId is guaranteed non-null here for educator types due to the guard above
      const validatedEducatorId = educatorId ?? '';

      let conversation;

      // Create or get conversation based on user type
      if (userType === 'school_admin') {
        conversation = await MessageService.getOrCreatelearnerAdminConversation(
          conversationLearnerId,
          organizationId,
          'Mentor Note'
        );
      } else if (userType === 'school_educator') {
        conversation = await MessageService.getOrCreatelearnerEducatorConversation(
          conversationLearnerId,
          validatedEducatorId,
          undefined, // classId
          'Mentor Note'
        );
      } else if (userType === 'college_educator') {
        conversation = await MessageService.getOrCreatelearnerCollegeLecturerConversation(
          conversationLearnerId,
          validatedEducatorId,
          organizationId,
          undefined, // programSectionId
          'Mentor Note'
        );
      } else {
        // college_admin
        conversation = await MessageService.getOrCreatelearnerCollegeAdminConversation(
          conversationLearnerId,
          organizationId,
          'Admission Note'
        );
      }

      // Send the note as a message
      const senderType = userType === 'school_admin' ? 'school_admin' :
                        userType === 'school_educator' ? 'educator' :
                        userType === 'college_educator' ? 'college_educator' :
                        'college_admin';

      const notePrefix = userType === 'school_admin' || userType === 'college_admin' ? 'Admission' : 'Mentor';

      const messageData = {
        conversationId: conversation.id,
        senderId: user.id,
        senderType,
        receiverId: conversationLearnerId,
        receiverType: 'learner',
        messageText: `📝 ${notePrefix} Note:\n\n${note}`,
        subject: `${notePrefix} Note`
      };

      const msgRes = await apiPost('/learner-profile/actions', { action: 'send-learner-message', ...messageData });
      if (!msgRes?.data) {
        throw new Error('Failed to send message');
      }

      toast.success(`Note sent to learner via communication`);
    } catch (error) {
      logger.error('Error sending note to communication', error as Error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <button
          type="button"
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity w-full h-full cursor-default"
          onClick={onClose}
          aria-label="Close modal"
        />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Mentor Note</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Learner: {learner.name}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter mentor feedback, observations, or recommendations..."
              />
            </div>

            {/* Send to Communication Option */}
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="sendToCommunication"
                checked={sendToCommunication}
                onChange={(e) => setSendToCommunication(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sendToCommunication" className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Send to Communication</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  This will send the note as a message to the learner in the Communication section
                </p>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !note.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {sendToCommunication ? (
                <>
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Note'}</span>
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Note'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionNoteModal;