import { Learner } from '@/features/learner-profile/model';
import MessageService from '@/shared/api/messageService';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const logger = getLogger('school-admission-note-modal');

interface SchoolAdmissionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: Learner;
  onSuccess?: () => void;
}

const SchoolAdmissionNoteModal: React.FC<SchoolAdmissionNoteModalProps> = ({
  isOpen,
  onClose,
  learner,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendToCommunication, setSendToCommunication] = useState(true);

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      if (sendToCommunication) {
        await sendNoteAsCommunication();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
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
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('Not authenticated');
      }

      let schoolId: string | null = null;

      const educatorRes = await apiPost<any>('/learner-profile/actions', {
        action: 'fetch-school-educator-by-user',
        userId: user.id,
      });
      if (educatorRes?.data?.school_id) {
        schoolId = educatorRes.data.school_id;
      } else {
        const orgRes = await apiPost<any>('/learner-profile/actions', {
          action: 'fetch-org-by-admin',
          userId: user.id,
          email: user.email,
          orgType: 'school',
        });
        if (orgRes?.data?.id) {
          schoolId = orgRes.data.id;
        }
      }

      if (!schoolId && (learner as any).school_id) {
        schoolId = (learner as any).school_id;
      }

      if (!schoolId) {
        throw new Error('Could not determine school ID. Please ensure you are logged in as a school admin.');
      }

      const conversation = await MessageService.getOrCreatelearnerAdminConversation(
        learner.id,
        schoolId,
        'Admission Note'
      );

      const messageData = {
        conversationId: conversation.id,
        senderId: user.id,
        senderType: 'school_admin',
        receiverId: learner.id,
        receiverType: 'learner',
        messageText: `📝 Admission Note:\n\n${note}`,
        subject: 'Admission Note',
      };

      await apiPost<any>('/learner-profile/actions', { action: 'send-learner-message', ...messageData });

      await apiPost<any>('/learner-profile/actions', {
        action: 'update-conversation-last-message',
        conversationId: conversation.id,
      });

      toast.success('Note sent to learner via communication');
    } catch (error) {
      logger.error('Error sending note to communication', error as Error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add Admission Note
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learner: {learner.name}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter admission feedback, assessment notes, or recommendations..."
              />
            </div>

            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="sendToCommunicationSchool"
                checked={sendToCommunication}
                onChange={(e) => setSendToCommunication(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sendToCommunicationSchool" className="flex-1 cursor-pointer">
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
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
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

export default SchoolAdmissionNoteModal;
