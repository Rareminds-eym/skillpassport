import React, { useState } from 'react';
import {
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Student } from '../types';
import { supabase } from '../../../../lib/supabaseClient';
import MessageService from '../../../../services/messageService';
import toast from 'react-hot-toast';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  userRole?: 'school_admin' | 'college_admin' | 'educator';
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  student,
  userRole = 'school_admin',
}) => {
  const [showInternalMessage, setShowInternalMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = (
      student.contact_number ||
      student.contactNumber ||
      student.phone ||
      ''
    ).replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi ${student.name}, I wanted to reach out regarding your admission application...`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    onClose();
  };

  const handleSMS = () => {
    const phone = (
      student.contact_number ||
      student.contactNumber ||
      student.phone ||
      ''
    ).replace(/[^0-9]/g, '');
    window.location.href = `sms:${phone}`;
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Your Admission Application Update');
    const body = encodeURIComponent(
      `Dear ${student.name},\n\nI wanted to reach out regarding your admission application.\n\nBest regards`
    );
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
    onClose();
  };

  const handleInternalMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      let conversation;

      if (userRole === 'school_admin') {
        // Get school ID
        let schoolId: string | null = null;

        const { data: educatorData } = await supabase
          .from('school_educators')
          .select('school_id')
          .eq('user_id', user.id)
          .single();

        if (educatorData?.school_id) {
          schoolId = educatorData.school_id;
        } else {
          const { data: schoolData } = await supabase
            .from('schools')
            .select('id')
            .eq('created_by', user.id)
            .single();

          if (schoolData?.id) {
            schoolId = schoolData.id;
          }
        }

        if (!schoolId && (student as any).school_id) {
          schoolId = (student as any).school_id;
        }

        if (!schoolId) {
          throw new Error('Could not determine school ID');
        }

        conversation =
          await MessageService.getOrCreateStudentAdminConversation(
            student.id,
            schoolId,
            'General Discussion'
          );

        // Send message
        const { error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'school_admin',
          receiver_id: student.id,
          receiver_type: 'student',
          message_text: messageText,
        });

        if (messageError) throw messageError;
      } else if (userRole === 'college_admin') {
        // Get college ID
        let collegeId: string | null = null;

        const { data: lecturerData } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .or(`user_id.eq.${user.id},userId.eq.${user.id}`)
          .single();

        if (lecturerData?.collegeId) {
          collegeId = lecturerData.collegeId;
        } else {
          const { data: ownerData } = await supabase
            .from('colleges')
            .select('id')
            .eq('created_by', user.id)
            .single();

          if (ownerData?.id) {
            collegeId = ownerData.id;
          }
        }

        if (!collegeId) {
          throw new Error('Could not determine college ID');
        }

        conversation =
          await MessageService.getOrCreateStudentCollegeAdminConversation(
            student.id,
            collegeId,
            'General Discussion'
          );

        // Send message
        const { error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'college_admin',
          receiver_id: student.id,
          receiver_type: 'student',
          message_text: messageText,
        });

        if (messageError) throw messageError;
      } else if (userRole === 'educator') {
        // Get educator's class/school info
        const { data: educatorData } = await supabase
          .from('school_educators')
          .select('school_id')
          .eq('user_id', user.id)
          .single();

        if (!educatorData?.school_id) {
          throw new Error('Could not determine educator school');
        }

        conversation =
          await MessageService.getOrCreateStudentEducatorConversation(
            student.id,
            user.id,
            undefined,
            'General Discussion'
          );

        // Send message
        const { error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'educator',
          receiver_id: student.id,
          receiver_type: 'student',
          message_text: messageText,
        });

        if (messageError) throw messageError;
      }

      // Update conversation
      if (conversation) {
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview:
              messageText.substring(0, 50) +
              (messageText.length > 50 ? '...' : ''),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversation.id);
      }

      toast.success('Message sent successfully!');
      setMessageText('');
      setShowInternalMessage(false);
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Internal message view
  if (showInternalMessage) {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={() => setShowInternalMessage(false)}
          ></div>

          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Message {student.name}
              </h3>
              <button
                onClick={() => setShowInternalMessage(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Type your message here..."
                />
              </div>

              <p className="text-xs text-gray-500">
                This message will be sent to the student and will appear in the
                Communication section.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowInternalMessage(false)}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInternalMessage}
                disabled={isSending || !messageText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>{isSending ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main contact options view
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Contact {student.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Internal Message - Primary option */}
            <button
              onClick={() => setShowInternalMessage(true)}
              className="w-full flex items-center justify-center px-4 py-3 border border-primary-300 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3 text-primary-600" />
              Message
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">
                  External Options
                </span>
              </div>
            </div>

            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <svg
                className="h-5 w-5 mr-3 text-green-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleSMS}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <DevicePhoneMobileIcon className="h-5 w-5 mr-3 text-blue-600" />
              SMS
            </button>

            <button
              onClick={handleEmail}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <EnvelopeIcon className="h-5 w-5 mr-3 text-red-600" />
              Email
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span>
                  {student.contact_number ||
                    student.contactNumber ||
                    student.phone ||
                    'Not available'}
                </span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span>{student.email || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
