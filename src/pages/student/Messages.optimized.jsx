import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { useStudentConversations, useStudentMessages } from '../../hooks/useStudentMessages';
import MessageService from '../../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';

// Constants
const AVATAR_BG_COLOR = 'EF4444';
const MESSAGE_PREVIEW_LENGTH = 50;

// Helper functions outside component to prevent recreation
const safeFormatTime = (timestamp) => {
  if (!timestamp) return 'No messages';
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return timestamp;
  }
};

const Messages = () => {
  // State
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const markedAsReadRef = useRef(new Set());

  // Auth & User Data
  const { user } = useAuth();
  const userEmail = useMemo(() => localStorage.getItem('userEmail') || user?.email, [user?.email]);
  const { studentData } = useStudentDataByEmail(userEmail);
  const studentId = useMemo(() => studentData?.id || user?.id, [studentData?.id, user?.id]);
  const studentName = useMemo(
    () => studentData?.profile?.name || user?.name || 'Student',
    [studentData?.profile?.name, user?.name]
  );

  // Data Fetching
  const {
    conversations,
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useStudentConversations(studentId, !!studentId);

  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    isSending,
  } = useStudentMessages({
    studentId,
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
    enableRealtime: true,
  });

  // Realtime Features - Use shared global presence context
  const { isUserOnline: isUserOnlineGlobal } = useGlobalPresence();

  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: studentId || '',
    currentUserName: studentName,
    enabled: !!selectedConversationId && !!studentId,
  });

  const { sendNotification } = useNotificationBroadcast({
    userId: studentId || '',
    showToast: true,
    enabled: !!studentId,
  });

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !studentId) return;

    const conversation = conversations.find((c) => c.id === selectedConversationId);
    const hasUnread = conversation?.student_unread_count > 0;

    if (!hasUnread) return;

    const markKey = `${selectedConversationId}-${conversation?.student_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);

    MessageService.markConversationAsRead(selectedConversationId, studentId)
      .then(() => refetchConversations())
      .catch((err) => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
      });
  }, [selectedConversationId, studentId, conversations, refetchConversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Transform conversations with memoization
  const contacts = useMemo(() => {
    return conversations.map((conv) => {
      const recruiter = conv.recruiter || {};
      const recruiterName = recruiter.name || 'Recruiter';
      const recruiterEmail = recruiter.email || '';
      const recruiterPhone = recruiter.phone || '';

      const role = recruiterEmail || recruiterPhone || 'Recruiter';
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(recruiterName)}&background=${AVATAR_BG_COLOR}&color=fff`;

      return {
        id: conv.id,
        name: recruiterName,
        role,
        avatar,
        lastMessage: conv.last_message_preview || 'No messages yet',
        time: safeFormatTime(conv.last_message_at),
        unread: conv.student_unread_count || 0,
        online: isUserOnlineGlobal(conv.recruiter_id),
        recruiterId: conv.recruiter_id,
        applicationId: conv.application_id,
        opportunityId: conv.opportunity_id,
      };
    });
  }, [conversations, isUserOnlineGlobal]);

  // Filter contacts based on search with memoization
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) || contact.role.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  // Get current chat
  const currentChat = useMemo(
    () => (selectedConversationId ? contacts.find((c) => c.id === selectedConversationId) : null),
    [selectedConversationId, contacts]
  );

  // Transform messages for display
  const displayMessages = useMemo(
    () =>
      messages.map((msg) => ({
        id: msg.id,
        text: msg.message_text,
        sender: msg.sender_type === 'student' ? 'me' : 'them',
        time: safeFormatTime(msg.created_at),
        status: msg.is_read ? 'read' : 'delivered',
      })),
    [messages]
  );

  // Status icon renderer
  const getStatusIcon = useCallback((status) => {
    const iconClass = status === 'read' ? 'text-blue-500' : 'text-gray-400';
    return status === 'read' ? (
      <CheckCheck className={`w-4 h-4 ${iconClass}`} />
    ) : status === 'delivered' ? (
      <CheckCheck className={`w-4 h-4 ${iconClass}`} />
    ) : (
      <Check className={`w-4 h-4 ${iconClass}`} />
    );
  }, []);

  // Handle message send
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      const trimmedInput = messageInput.trim();
      if (!trimmedInput || !currentChat || !studentId || isSending) return;

      try {
        await sendMessage({
          senderId: studentId,
          senderType: 'student',
          receiverId: currentChat.recruiterId,
          receiverType: 'recruiter',
          messageText: trimmedInput,
          applicationId: currentChat.applicationId,
          opportunityId: currentChat.opportunityId,
        });

        // Send notification (non-blocking)
        sendNotification(currentChat.recruiterId, {
          title: 'New Message from Student',
          message:
            trimmedInput.length > MESSAGE_PREVIEW_LENGTH
              ? `${trimmedInput.substring(0, MESSAGE_PREVIEW_LENGTH)}...`
              : trimmedInput,
          type: 'message',
          link: `/recruiter/messages?conversation=${selectedConversationId}`,
        });

        setMessageInput('');
        setTyping(false);
        inputRef.current?.focus();
      } catch (error) {
        console.error('Failed to send message:', error);
        // TODO: Show error toast to user
      }
    },
    [
      messageInput,
      currentChat,
      studentId,
      isSending,
      sendMessage,
      sendNotification,
      selectedConversationId,
      setTyping,
    ]
  );

  // Handle typing indicator
  const handleInputChange = useCallback(
    (value) => {
      setMessageInput(value);
      setTyping(value.length > 0);
    },
    [setTyping]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    },
    [handleSendMessage]
  );

  // Loading state
  if (loadingConversations || !studentId) {
    return (
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">
            {!studentId ? 'Loading user data...' : 'Loading conversations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Left Panel - Contacts List */}
      <div className="w-full md:w-96 border-r border-gray-200 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {searchQuery ? 'Try a different search' : 'Start by applying to jobs!'}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedConversationId(contact.id)}
                className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                  selectedConversationId === contact.id ? 'bg-red-50' : ''
                }`}
                aria-label={`Open conversation with ${contact.name}`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={contact.avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                  />
                  {contact.online && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                      aria-label="Online"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{contact.name}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{contact.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1 truncate">{contact.role}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="flex-shrink-0 ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentChat.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {currentChat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
                  <p className="text-xs text-gray-500">
                    {currentChat.online ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Online
                      </span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Voice call"
                >
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Video call"
                >
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
              ) : displayMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          message.sender === 'me'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">{message.text}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs ${
                            message.sender === 'me' ? 'text-red-100' : 'text-gray-500'
                          }`}
                        >
                          <span>{message.time}</span>
                          {message.sender === 'me' && getStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isAnyoneTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            />
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 italic">{getTypingText()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    disabled={isSending}
                    aria-label="Message input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                    aria-label="Add emoji"
                  >
                    <Smile className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="p-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 text-sm">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
