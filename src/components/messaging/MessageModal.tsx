import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  
  // Only fetch conversation when modal is open
  const { 
    conversation, 
    isLoading: loadingConversation,
    error: conversationError,
    markAsRead 
  } = useConversation(
    studentId,
    recruiterId,
    applicationId,
    opportunityId,
    jobTitle || 'General Inquiry',
    isOpen // Pass isOpen to enable/disable the query
  );
  
  // Show error toast if conversation creation fails (only once)
  const hasShownErrorRef = useRef(false);
  
  useEffect(() => {
    if (conversationError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      const errorMessage = conversationError?.message || 'Failed to create conversation';
      if (errorMessage.includes('does not exist')) {
        toast.error('This recruiter account is not available. Please contact support.');
      } else {
        toast.error('Unable to start conversation. Please try again later.');
      }
    }
    // Reset when modal closes
    if (!isOpen) {
      hasShownErrorRef.current = false;
    }
  }, [conversationError, isOpen]);
  
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

  // Mark messages as read when conversation is opened (only once)
  const hasMarkedReadRef = useRef(false);
  
  useEffect(() => {
    if (conversation && isOpen && !hasMarkedReadRef.current) {
      hasMarkedReadRef.current = true;
      markAsRead(currentUserId);
    }
    // Reset when modal closes
    if (!isOpen) {
      hasMarkedReadRef.current = false;
    }
  }, [conversation, isOpen, currentUserId, markAsRead]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversation || isSending) {
      return;
    }

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
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [newMessage, conversation, isSending, currentUserType, recruiterId, studentId, currentUserId, sendMessage, applicationId, opportunityId]);

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
            {conversationError ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-600">
                <X className="w-16 h-16 mb-4 text-red-400" />
                <p className="text-lg font-semibold mb-2">Unable to Load Conversation</p>
                <p className="text-sm text-gray-600 text-center max-w-md">
                  {conversationError?.message?.includes('does not exist')
                    ? 'This recruiter account is not available. Please contact support.'
                    : 'There was an error loading this conversation. Please try again later.'}
                </p>
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
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message_text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-blue-600' : 'text-gray-500'
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
                placeholder={conversationError ? "Unable to send messages" : "Type your message..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSending || loading || !!conversationError}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending || loading || !!conversationError}
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
