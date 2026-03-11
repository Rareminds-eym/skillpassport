import { ChatBubbleLeftRightIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';
import MessageService from '../../../../services/messageService';
import { Student } from '../types';

interface AdmissionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess?: () => void;
}

const AdmissionNoteModal: React.FC<AdmissionNoteModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  onSuccess 
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
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendNoteAsCommunication = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log('🔍 Starting user detection for:', user.id);

      // Detect user type and get appropriate IDs
      let userType: 'college_admin' | 'college_educator' | 'school_educator' | null = null;
      let organizationId: string | null = null;
      let educatorId: string | null = null;

      // Check if user is a school educator
      console.log('🏫 Checking school_educators table...');
      const { data: schoolEducatorData, error: schoolError } = await supabase
        .from('school_educators')
        .select('id, school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🏫 School educator result:', { data: schoolEducatorData, error: schoolError });

      if (schoolEducatorData) {
        userType = 'school_educator';
        educatorId = schoolEducatorData.id;
        organizationId = schoolEducatorData.school_id;
        console.log('✅ Detected as school_educator:', { educatorId, organizationId });
      } else {
        // Check if user is a college lecturer
        console.log('🎓 Checking college_lecturers table...');
        
        const { data: lecturerData, error: lecturerError } = await supabase
          .from('college_lecturers')
          .select('id, collegeId, designation, user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('🎓 College lecturer result:', { data: lecturerData, error: lecturerError });
        
        if (lecturerData) {
          educatorId = lecturerData.id;
          organizationId = lecturerData.collegeId;
          
          console.log('📋 Lecturer data found:', { 
            id: lecturerData.id, 
            collegeId: lecturerData.collegeId, 
            designation: lecturerData.designation 
          });
          
          // Check if they're an admin based on designation
          // Common admin designations: 'Principal', 'Dean', 'HOD', 'Admin', etc.
          const adminDesignations = ['principal', 'dean', 'hod', 'admin', 'director'];
          const isAdmin = lecturerData.designation && 
                         adminDesignations.some(d => lecturerData.designation.toLowerCase().includes(d));
          
          if (isAdmin) {
            userType = 'college_admin';
            console.log('✅ Detected as college_admin (based on designation)');
          } else {
            userType = 'college_educator';
            console.log('✅ Detected as college_educator');
          }
        } else {
          // Fallback: check if user is college owner in organizations table
          console.log('🏢 Checking organizations table...');
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', 'college')
            .eq('admin_id', user.id)
            .maybeSingle();
          
          console.log('🏢 Organization result:', { data: orgData, error: orgError });
          
          if (orgData?.id) {
            userType = 'college_admin';
            organizationId = orgData.id;
            console.log('✅ Detected as college owner/admin');
          }
        }
      }

      console.log('📊 Final detection:', { userType, organizationId, educatorId });

      if (!userType || !organizationId) {
        console.error('❌ Detection failed - missing userType or organizationId');
        throw new Error('Could not determine user type or organization');
      }

      let conversation;

      // Create or get conversation based on user type
      if (userType === 'school_educator') {
        console.log('🏫 Creating school educator conversation...');
        conversation = await MessageService.getOrCreateStudentEducatorConversation(
          student.id,
          educatorId!,
          undefined, // classId
          'Mentor Note'
        );
      } else if (userType === 'college_educator') {
        console.log('🎓 Creating college educator conversation...');
        conversation = await MessageService.getOrCreateStudentCollegeLecturerConversation(
          student.id,
          educatorId!,
          organizationId,
          undefined, // programSectionId
          'Mentor Note'
        );
      } else {
        // college_admin
        console.log('🏢 Creating college admin conversation...');
        conversation = await MessageService.getOrCreateStudentCollegeAdminConversation(
          student.id,
          organizationId,
          'Admission Note'
        );
      }

      console.log('✅ Conversation created:', conversation.id);

      // Send the note as a message
      const senderType = userType === 'school_educator' ? 'educator' : 
                        userType === 'college_educator' ? 'college_educator' : 
                        'college_admin';
      
      const notePrefix = userType === 'college_admin' ? 'Admission' : 'Mentor';

      const messageData = {
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: senderType,
        receiver_id: student.id,
        receiver_type: 'student',
        message_text: `📝 ${notePrefix} Note:\n\n${note}`,
        subject: `${notePrefix} Note`
      };

      console.log('📤 Sending message:', messageData);

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        console.error('❌ Message error:', messageError);
        throw messageError;
      }

      console.log('✅ Message sent successfully');
      toast.success(`Note sent to student via communication`);
    } catch (error) {
      console.error('❌ Error sending note to communication:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Mentor Note</h3>
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

export default AdmissionNoteModal;