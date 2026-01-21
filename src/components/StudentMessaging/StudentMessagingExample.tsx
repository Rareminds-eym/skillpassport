import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import {
  useStudentMessages,
  useStudentUnreadCount,
  useStudentConversations,
} from '../../hooks/useStudentMessages';
import { useStudentMessageNotifications } from '../../hooks/useStudentMessageNotifications';
import { useMessageStore } from '../../stores/useMessageStore';

interface StudentMessagingExampleProps {
  studentId: string;
  recruiterId?: string;
  applicationId?: number;
}

/**
 * Complete example of student messaging with:
 * - Zustand state management
 * - React Query for non-blocking data fetching
 * - Supabase realtime for instant updates
 * - Hot-toast notifications with smooth animations
 */
export const StudentMessagingExample: React.FC<StudentMessagingExampleProps> = ({
  studentId,
  recruiterId = 'rec_001',
  applicationId,
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Get unread count with realtime updates
  const { unreadCount } = useStudentUnreadCount(studentId);

  // Get all conversations
  const { conversations, isLoading: loadingConversations } = useStudentConversations(studentId);

  // Get messages for selected conversation
  const {
    messages,
    sendMessage,
    isSending,
    isLoading: loadingMessages,
  } = useStudentMessages({
    studentId,
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
    enableRealtime: true,
  });

  // Setup hot-toast notifications (exclude current conversation)
  useStudentMessageNotifications({
    studentId,
    enabled: true,
    playSound: true,
    excludeConversationId: selectedConversationId,
    onMessageReceived: (message) => {},
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId) return;

    const currentConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!currentConversation) return;

    sendMessage({
      senderId: studentId,
      senderType: 'student',
      receiverId: currentConversation.recruiter_id,
      receiverType: 'recruiter',
      messageText: messageText.trim(),
      applicationId: currentConversation.application_id,
    });

    setMessageText('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toaster for notifications */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          </div>

          {unreadCount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Conversations
            </h2>

            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversationId === conv.id
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {conv.recruiter?.name || 'Recruiter'}
                      </p>
                      {conv.student_unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.student_unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {conv.recruiter?.company || 'Company'}
                    </p>
                    {conv.last_message_preview && (
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {conv.last_message_preview}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversationId ? (
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === studentId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.message_text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-indigo-200' : 'text-gray-400'
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSending}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMessagingExample;
