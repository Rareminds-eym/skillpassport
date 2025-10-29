import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, User, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConversation, useMessages } from '../../hooks/useMessages';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  recruiterId: string;
  studentName: string;
  applicationId?: number;
  opportunityId?: number;
  jobTitle?: string;
  currentUserId: string; // ID of the current user (whoever is logged in)
  currentUserType: 'student' | 'recruiter'; // Type of current user
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  studentId,
  recruiterId,
  studentName,
  applicationId,
  opportunityId,
  jobTitle,
  currentUserId,
  currentUserType
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use React Query hooks for conversation and messages
  const { 
    conversation, 
    isLoading: loadingConversation,
    markAsRead 
  } = useConversation(
    studentId,
    recruiterId,
    applicationId,
    opportunityId,
    jobTitle || 'General Inquiry'
  );
  
  const { 
    messages, 
    isLoading: loadingMessages,
    sendMessage,
    isSending 
  } = useMessages({
    conversationId: conversation?.id || null,
    enabled: isOpen && !!conversation
  });
  
  const loading = loadingConversation || loadingMessages;

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversation && isOpen) {
      markAsRead(currentUserId);
    }
  }, [conversation, isOpen, currentUserId, markAsRead]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversation || isSending) return;

    try {
      // Determine receiver based on current user type
      const receiverId = currentUserType === 'student' ? recruiterId : studentId;
      const receiverType = currentUserType === 'student' ? 'recruiter' : 'student';
      
      sendMessage({
        senderId: currentUserId,
        senderType: currentUserType,
        receiverId: receiverId,
        receiverType: receiverType,
        messageText: newMessage.trim(),
        applicationId,
        opportunityId
      });
      
      setNewMessage('');
      // Auto-scroll will happen via useEffect
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                {studentName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{studentName}</h3>
                {jobTitle && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {jobTitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <User className="w-16 h-16 mb-4 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.sender_id === currentUserId;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message_text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSending || loading}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending || loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
