import { type FC, type FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MessageService, { type Message } from '@/shared/api/messageService';
import { useUser } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('AdminMessageModal');

interface Learner {
  id: string;
  name: string;
  email?: string;
  school_id?: string;
  college_id?: string;
  user_id?: string;
}

interface AdminMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: Learner;
  userRole: 'school_admin' | 'college_admin' | 'educator' | 'college_educator';
}

const AdminMessageModal: FC<AdminMessageModalProps> = ({
  isOpen,
  onClose,
  learner,
  userRole,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasShownErrorRef = useRef(false);
  const queryClient = useQueryClient();
  const currentUser = useUser();

  // Get or create the conversation based on role
  const {
    data: conversation,
    isLoading: loadingConversation,
    error: conversationError,
  } = useQuery({
    queryKey: ['admin-conversation', userRole, currentUser?.id, learner?.id],
    queryFn: async () => {
      if (!learner?.id) throw new Error('Learner not available');
      const learnerId = learner.id;

      if (userRole === 'college_admin') {
        const collegeId = learner.college_id;
        if (!collegeId) throw new Error('Learner has no associated college');
        return MessageService.getOrCreatelearnerCollegeAdminConversation(learnerId, collegeId, 'General Inquiry');
      }

      if (userRole === 'school_admin') {
        const schoolId = learner.school_id;
        if (!schoolId) throw new Error('Learner has no associated school');
        return MessageService.getOrCreatelearnerAdminConversation(learnerId, schoolId, 'General Inquiry');
      }

      // educator / college_educator — need to resolve educator record id first
      const { data: educatorData } = await apiPost<{ data: { id: string; collegeId?: string } }>('/messaging/actions', {
        action: 'resolve-user-context',
        userId: currentUser?.id,
        type: userRole === 'college_educator' ? 'college_educator' : 'educator',
      });
      if (!educatorData?.id) throw new Error('Could not resolve educator record');

      if (userRole === 'college_educator') {
        const collegeId = educatorData.collegeId || learner.college_id;
        if (!collegeId) throw new Error('No college ID found');
        return MessageService.getOrCreatelearnerCollegeLecturerConversation(
          learnerId,
          educatorData.id,
          collegeId,
          undefined,
          'General Inquiry'
        );
      }

      // school educator
      return MessageService.getOrCreatelearnerEducatorConversation(
        learnerId,
        educatorData.id,
        undefined,
        'General Inquiry'
      );
    },
    enabled: isOpen && !!learner?.id && !!currentUser?.id,
    retry: false,
  });

  // Fetch messages for the conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['admin-conversation-messages', conversation?.id],
    queryFn: () => {
    if (!conversation?.id) throw new Error('Conversation not available');
    return MessageService.getConversationMessages(conversation.id);
    },
    enabled: !!conversation?.id,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!conversation) throw new Error('No conversation');
      if (!currentUser?.id) throw new Error('User not authenticated');
      const senderType = userRole;
      const receiverId = learner.id;
      if (!receiverId) throw new Error('Learner ID is required');

      return MessageService.sendMessage(
        conversation.id,
        currentUser.id,
        senderType,
        receiverId,
        'learner',
        text
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-conversation-messages', conversation?.id] });
    },
    onError: (error) => {
      logger.error('Failed to send message', error instanceof Error ? error : new Error(String(error)));
      toast.error('Failed to send message');
    },
  });

  // Show error toast once
  useEffect(() => {
    if (conversationError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      toast.error('Unable to start conversation. Please try again.');
    }
    if (!isOpen) hasShownErrorRef.current = false;
  }, [conversationError, isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || sendMutation.isPending) return;
      await sendMutation.mutateAsync(newMessage.trim());
      setNewMessage('');
    },
    [newMessage, sendMutation]
  );

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const diffH = (Date.now() - date.getTime()) / 3600000;
    return diffH < 24
      ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  const loading = loadingConversation || loadingMessages;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                {learner.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{learner.name}</h3>
                {learner.email && <p className="text-sm text-gray-500">{learner.email}</p>}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close dialog" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {conversationError ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-600">
                <X className="w-16 h-16 mb-4 text-red-400" />
                <p className="text-sm text-gray-600 text-center">Unable to load conversation. Please try again later.</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <User className="w-16 h-16 mb-4 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg: Message) => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-4 py-2 ${isMe ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-white border border-gray-200 text-gray-900'}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-600' : 'text-gray-500'}`}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={conversationError ? 'Unable to send messages' : 'Type your message...'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={sendMutation.isPending || loading || !!conversationError}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendMutation.isPending || loading || !!conversationError}
                aria-label={sendMutation.isPending ? 'Sending message' : 'Send message'}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {sendMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminMessageModal;
