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
  Circle,
  Loader2
} from 'lucide-react';
import { useStudentConversations, useStudentMessages } from '../../hooks/useStudentMessages';
import MessageService from '../../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';

const Messages = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const markedAsReadRef = useRef(new Set());
  
  // Get student data - same approach as Applications page
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id || user?.id;
  const studentName = studentData?.profile?.name || user?.name || 'Student';
  
  // Fetch conversations
  const { 
    conversations, 
    isLoading: loadingConversations, 
    refetch: refetchConversations,
    clearUnreadCount
  } = useStudentConversations(
    studentId,
    !!studentId
  );
  
  // Debug logging
  useEffect(() => {
    console.log('📧 Messages Debug:', {
      userEmail,
      studentId,
      studentData,
      conversationsCount: conversations?.length || 0,
      conversations
    });
  }, [userEmail, studentId, studentData, conversations]);
  
  // Fetch messages for selected conversation
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = useStudentMessages({
    studentId,
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
    enableRealtime: true
  });

  // Use shared global presence context (no duplicate subscription)
  const { isUserOnline: isUserOnlineGlobal, onlineUsers: globalOnlineUsers } = useGlobalPresence();

  // Presence tracking for current conversation (for chat header)
  const { isUserOnline, getUserStatus, onlineUsers } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: studentId || '',
      userName: studentName,
      userType: 'student',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined
    },
    enabled: !!selectedConversationId && !!studentId
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: studentId || '',
    currentUserName: studentName,
    enabled: !!selectedConversationId && !!studentId
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: studentId || '',
    showToast: true,
    enabled: !!studentId
  });
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !studentId) {
      console.log('⚠️ [Student] Skipping mark-as-read: no conversation or studentId');
      return;
    }
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    console.log('🔍 [Student] Selected conversation:', {
      id: selectedConversationId,
      found: !!conversation,
      unreadCount: conversation?.student_unread_count
    });
    
    const hasUnread = conversation?.student_unread_count > 0;
    
    // Only mark as read if there are actually unread messages
    if (!hasUnread) {
      console.log('ℹ️ [Student] No unread messages, skipping');
      return;
    }
    
    // Prevent duplicate marking
    const markKey = `${selectedConversationId}-${conversation?.student_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) {
      console.log('⚠️ [Student] Already marked this conversation state, skipping');
      return;
    }
    markedAsReadRef.current.add(markKey);
    
    console.log('📖 [Student] Marking conversation as read:', selectedConversationId);
    
    // Optimistically clear the unread count immediately in UI (instant feedback)
    if (clearUnreadCount) {
      clearUnreadCount(selectedConversationId);
    } else {
      console.error('❌ [Student] clearUnreadCount function not available!');
    }
    
    // Mark as read in database - no debounce since we already prevent duplicates
    MessageService.markConversationAsRead(selectedConversationId, studentId)
      .then(() => {
        console.log('✅ [Student] Marked as read successfully');
      })
      .catch(err => {
        console.error('❌ [Student] Failed to mark as read:', err);
        // Remove from marked set so it can be retried
        markedAsReadRef.current.delete(markKey);
        // Refetch to revert optimistic update
        refetchConversations();
      });
  }, [selectedConversationId, studentId, conversations, clearUnreadCount, refetchConversations]);

  // Helper to safely parse profile JSONB
  const parseProfile = (profile) => {
    if (!profile) return {};
    if (typeof profile === 'string') {
      try {
        return JSON.parse(profile);
      } catch (e) {
        console.error('Error parsing profile:', e);
        return {};
      }
    }
    return profile;
  };
  
  // Transform conversations for display
  // Recalculate when onlineUsers changes to update presence indicators
  const contacts = useMemo(() => conversations.map(conv => {
    const recruiter = conv.recruiter;
    const recruiterName = recruiter?.name || 'Recruiter';
    const recruiterEmail = recruiter?.email || '';
    const recruiterPhone = recruiter?.phone || '';
    
    // Build role string - use email or phone since company/position don't exist
    let role = '';
    if (recruiterEmail) {
      role = recruiterEmail;
    } else if (recruiterPhone) {
      role = recruiterPhone;
    } else {
      role = 'Recruiter';
    }
    
    // Generate avatar URL (no photo column in recruiters table)
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(recruiterName)}&background=EF4444&color=fff`;
    
    // Format time
    let timeDisplay = 'No messages';
    if (conv.last_message_at) {
      try {
        timeDisplay = formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
      } catch (e) {
        timeDisplay = conv.last_message_at;
      }
    }
    
    return {
      id: conv.id,
      name: recruiterName,
      role: role,
      avatar: avatar,
      lastMessage: conv.last_message_preview || 'No messages yet',
      time: timeDisplay,
      unread: conv.student_unread_count || 0,
      online: isUserOnlineGlobal(conv.recruiter_id),
      recruiterId: conv.recruiter_id,
      applicationId: conv.application_id,
      opportunityId: conv.opportunity_id
    };
  }), [conversations, globalOnlineUsers, isUserOnlineGlobal]);
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected conversation
  const currentChat = selectedConversationId 
    ? contacts.find(c => c.id === selectedConversationId) 
    : null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageInput.trim() && currentChat && studentId) {
      try {
        await sendMessage({
          senderId: studentId,
          senderType: 'student',
          receiverId: currentChat.recruiterId,
          receiverType: 'recruiter',
          messageText: messageInput,
          applicationId: currentChat.applicationId,
          opportunityId: currentChat.opportunityId
        });
        
        // Send notification broadcast to recruiter
        try {
          await sendNotification(currentChat.recruiterId, {
            title: 'New Message from Student',
            message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
            type: 'message',
            link: `/recruiter/messages?conversation=${selectedConversationId}`
          });
        } catch (notifError) {
          console.warn('Could not send notification:', notifError);
        }
        
        setMessageInput('');
        setTyping(false);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Handle typing in input
  const handleInputChange = useCallback((value) => {
    setMessageInput(value);
    setTyping(value.length > 0);
  }, [setTyping]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusIcon = (status) => {
    if (status === 'read') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  // Transform messages for display
  const displayMessages = messages.map(msg => ({
    id: msg.id,
    text: msg.message_text,
    sender: msg.sender_type === 'student' ? 'me' : 'them',
    time: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
    status: msg.is_read ? 'read' : 'delivered'
  }));
  
  // Show loading state
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-2">Start by applying to jobs!</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedConversationId(contact.id)}
              className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedConversationId === contact.id ? 'bg-red-50' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {contact.name}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {contact.time}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1 truncate">
                  {contact.role}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {contact.lastMessage}
                  </p>
                  {contact.unread > 0 && (
                    <span className="flex-shrink-0 ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
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
                    alt={currentChat.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {currentChat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
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
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {/* Online users indicator */}
              {onlineUsers.length > 1 && (
                <div className="text-center text-xs text-gray-500 mb-2">
                  {onlineUsers.length} users online
                </div>
              )}
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
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        message.sender === 'me' ? 'text-red-100' : 'text-gray-500'
                      }`}>
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
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                  >
                    <Smile className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="p-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
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

