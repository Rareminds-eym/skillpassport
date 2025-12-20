import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  Loader2,
  Trash2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { useStudentEducatorConversations, useStudentEducatorMessages } from '../../hooks/useStudentEducatorMessages';
import MessageService from '../../services/messageService';
import { useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';

const EducatorMessages = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');
  
  const [selectedConversationId, setSelectedConversationId] = useState(conversationIdFromUrl);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, conversationId: null, contactName: '' });
  const messagesEndRef = useRef(null);
  const markedAsReadRef = useRef(new Set());
  const menuRef = useRef(null);
  
  // Get student data
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: loadingStudentData } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id || user?.id;
  const studentName = studentData?.profile?.name || user?.name || 'Student';
  
  // Fetch conversations with educators
  const { 
    conversations, 
    isLoading: loadingConversations, 
    refetch: refetchConversations,
    clearUnreadCount
  } = useStudentEducatorConversations(
    studentId,
    !!studentId && !loadingStudentData
  );
  
  // Fetch messages for selected conversation
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = useStudentEducatorMessages({
    studentId,
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
    enableRealtime: true
  });

  // Use shared global presence context
  const { isUserOnline: isUserOnlineGlobal, onlineUsers: globalOnlineUsers } = useGlobalPresence();

  // Presence tracking for current conversation
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
  
  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const conversationExists = conversations.find(c => c.id === conversationIdFromUrl);
      if (conversationExists) {
        setSelectedConversationId(conversationIdFromUrl);
        // Clear URL parameter after selecting
        setTimeout(() => setSearchParams({}), 100);
      }
    }
  }, [conversationIdFromUrl, conversations, setSearchParams]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      await MessageService.deleteConversationForUser(conversationId, studentId, 'student');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['student-educator-conversations', studentId] });
      
      const previousConversations = queryClient.getQueryData(['student-educator-conversations', studentId]);
      
      queryClient.setQueryData(['student-educator-conversations', studentId], (old) => {
        if (!old) return [];
        return old.map(conv => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['student-educator-conversations', studentId],
        refetchType: 'none'
      });
      
      return { previousConversations, conversationId };
    },
    onError: (err, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(['student-educator-conversations', studentId], context.previousConversations);
      }
      toast.error('Failed to delete conversation');
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['student-educator-conversations', studentId], (old) => {
        if (!old) return [];
        return old.filter(conv => conv.id !== variables.conversationId);
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['student-educator-conversations', studentId],
        refetchType: 'none'
      });
    }
  });
  
  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      await MessageService.restoreConversation(conversationId, studentId, 'student');
      return { conversationId };
    },
    onSuccess: () => {
      toast.success('Conversation restored');
      refetchConversations();
    }
  });
  
  // Mark messages as read when conversation is selected
  const markConversationAsRead = useCallback(async (conversationId, unreadCount) => {
    if (!studentId || !clearUnreadCount) return;
    
    const markKey = `${conversationId}-${unreadCount}`;
    
    if (markedAsReadRef.current.has(markKey)) {
      return;
    }
    markedAsReadRef.current.add(markKey);
    
    clearUnreadCount(conversationId);
    
    try {
      await MessageService.markConversationAsRead(conversationId, studentId);
    } catch (err) {
      console.error('❌ Failed to mark as read:', err);
      markedAsReadRef.current.delete(markKey);
      refetchConversations();
    }
  }, [studentId, clearUnreadCount, refetchConversations]);
  
  // Trigger mark as read when conversation changes
  useEffect(() => {
    if (!selectedConversationId || !studentId) {
      return;
    }
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    const hasUnread = conversation?.student_unread_count > 0;
    
    if (hasUnread) {
      markConversationAsRead(selectedConversationId, conversation.student_unread_count);
    }
  }, [selectedConversationId, studentId, conversations, markConversationAsRead]);

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
  const contacts = useMemo(() => {
    const activeConversations = conversations.filter(conv => !conv._pendingDelete);
    
    return activeConversations.map(conv => {
      const educator = conv.educator;
      const educatorProfile = parseProfile(educator?.profile);
      const educatorName = educator?.name || educatorProfile?.name || 'Educator';
      const courseName = conv.course?.title || 'General Discussion';
      const className = conv.class?.name || '';
      
      // Build role string
      let role = courseName;
      if (className) {
        role += ` • ${className}`;
      }
      
      // Generate avatar URL
      const avatar = educatorProfile?.profilePicture || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(educatorName)}&background=10B981&color=fff`;
      
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
        name: educatorName,
        role: role,
        avatar: avatar,
        lastMessage: conv.last_message_preview || 'No messages yet',
        time: timeDisplay,
        unread: conv.student_unread_count || 0,
        online: isUserOnlineGlobal(conv.educator_id),
        educatorId: conv.educator_id,
        courseId: conv.course_id,
        classId: conv.class_id
      };
    });
  }, [conversations, globalOnlineUsers, isUserOnlineGlobal]);
  
  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

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
          receiverId: currentChat.educatorId,
          receiverType: 'educator',
          messageText: messageInput,
          courseId: currentChat.courseId,
          classId: currentChat.classId
        });
        
        // Send notification broadcast to educator
        try {
          await sendNotification(currentChat.educatorId, {
            title: 'New Message from Student',
            message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
            type: 'message',
            link: `/educator/messages?conversation=${selectedConversationId}`
          });
        } catch (notifError) {
          // Silent fail
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
    if (!messages.length) return;
    
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const rafId = requestAnimationFrame(scrollToBottom);
    
    return () => cancelAnimationFrame(rafId);
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

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !studentId) return;
    
    const conversationId = deleteModal.conversationId;
    const contactName = deleteModal.contactName;
    
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
    
    setDeleteModal({ isOpen: false, conversationId: null, contactName: '' });
    
    deleteMutation.mutate({ conversationId });
    
    // Show undo toast (similar to the recruiter implementation)
    toast.success(`Conversation with ${contactName} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => undoMutation.mutate({ conversationId })
      }
    });
  }, [deleteModal.conversationId, deleteModal.contactName, studentId, selectedConversationId, deleteMutation, undoMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId, contactName, e) => {
    e?.stopPropagation();
    setShowMenu(null);
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);
  
  // Show loading state
  if (loadingConversations || !studentId) {
    return (
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
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
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-6 h-6 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Educator Messages</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No conversations with educators yet</p>
              <p className="text-gray-400 text-xs mt-2">Start by enrolling in courses!</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`relative group flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 ${
                  selectedConversationId === contact.id ? 'bg-green-50' : ''
                }`}
                onClick={() => setSelectedConversationId(contact.id)}
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
                  <p className="text-xs text-green-600 font-medium mb-1 truncate">
                    {contact.role}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && (
                      <span className="flex-shrink-0 ml-2 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions on Hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(contact.id, contact.name, e);
                    }}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
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
                  <p className="text-xs text-green-600 font-medium">{currentChat.role}</p>
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
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : displayMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                  </div>
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
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          message.sender === 'me' ? 'text-green-100' : 'text-gray-500'
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
                  className="p-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
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
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 text-sm">
                Choose from your conversations with educators
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConversationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, conversationId: null, contactName: '' })}
        onConfirm={handleDeleteConversation}
        contactName={deleteModal.contactName}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default EducatorMessages;