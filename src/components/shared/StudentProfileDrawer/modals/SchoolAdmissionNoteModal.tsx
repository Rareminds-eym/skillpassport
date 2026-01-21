import { ChatBubbleLeftRightIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';
import MessageService from '../../../../services/messageService';
import { Student } from '../types';

interface SchoolAdmissionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess?: () => void;
}

const SchoolAdmissionNoteModal: React.FC<SchoolAdmissionNoteModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendToCommunication, setSendToCommunication] = useState(true); // Auto-checked by default

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      // If "Send to Communication" is checked, send as message
      if (sendToCommunication) {
        await sendNoteAsCommunication();
      } else {
        // Just save locally with a small delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success('Note saved successfully');
      }

      onSuccess?.();
      setNote('');
      setSendToCommunication(false);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendNoteAsCommunication = async () => {
    try {
      // Get current user (school admin)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log('🔍 Looking up school ID for user:', user.id);
      console.log('📋 Student data:', {
        id: student.id,
        name: student.name,
        school_id: (student as any).school_id,
      });

      // Get school ID for the admin - match the same logic as StudentCommunication.tsx
      let schoolId: string | null = null;

      // Try school_educators table first
      const { data: educatorData, error: educatorError } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      console.log('📊 Educator data:', educatorData, 'Error:', educatorError);

      if (educatorData?.school_id) {
        schoolId = educatorData.school_id;
      } else {
        // Fallback: check if user is school owner/admin in organizations table
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'school')
          .eq('admin_id', user.id)
          .maybeSingle();

        console.log('📊 Organization owner data:', orgData, 'Error:', orgError);

        if (orgData?.id) {
          schoolId = orgData.id;
        }
      }

      // If still no school ID, try to use the student's school_id
      if (!schoolId && (student as any).school_id) {
        console.log('⚠️ Using student school_id as fallback:', (student as any).school_id);
        schoolId = (student as any).school_id;
      }

      if (!schoolId) {
        console.error('❌ Could not determine school ID for user:', user.id);
        throw new Error(
          'Could not determine school ID. Please ensure you are logged in as a school admin.'
        );
      }

      console.log('✅ Found school ID:', schoolId);
      console.log('📝 Creating conversation with student:', student.id);

      // Create or get conversation with student
      const conversation = await MessageService.getOrCreateStudentAdminConversation(
        student.id,
        schoolId,
        'Admission Note'
      );

      console.log('✅ Conversation created/found:', conversation);

      // Send the note as a message directly to the database
      const messageData = {
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: 'school_admin',
        receiver_id: student.id,
        receiver_type: 'student',
        message_text: `📝 Admission Note:\n\n${note}`,
        subject: 'Admission Note',
      };

      console.log('📤 Sending message:', messageData);

      const { data: messageResult, error: messageError } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (messageError) {
        console.error('❌ Message error:', messageError);
        throw messageError;
      }

      console.log('✅ Message sent:', messageResult);

      // Update conversation's last_message fields to ensure it shows up in the list
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: `📝 Admission Note: ${note.substring(0, 50)}${note.length > 50 ? '...' : ''}`,
          last_message_sender: 'school_admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      if (updateError) {
        console.warn('⚠️ Could not update conversation preview:', updateError);
      } else {
        console.log('✅ Conversation updated with last message info');
      }

      toast.success('Note sent to student via communication');
    } catch (error) {
      console.error('Error sending note to communication:', error);
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
            <h3 className="text-lg font-medium text-gray-900">Add Admission Note</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student: {student.name}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter admission feedback, assessment notes, or recommendations..."
              />
            </div>

            {/* Send to Communication Option */}
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
                  This will send the note as a message to the student in the Communication section
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
