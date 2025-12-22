import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  PaperClipIcon,
  FaceSmileIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon,
  ChevronLeftIcon,
  TrashIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import MessageService, { Conversation } from '../../services/messageService';
import { useEducatorMessages } from '../../hooks/useEducatorMessages.js';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';
import NewStudentConversationModalEducator from '../../components/messaging/NewStudentConversationModalEducator';

const Communication = () => {
  const location = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; conversationId: string | null; contactName: string }>({ 
    isOpen: false, 
    conversationId: null, 
    contactName: '' 
  });
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  
  // Get educator ID from auth
  const { user } = useAuth();
  const educatorId = user?.id;
  const educatorName = user?.name || 'Educator';
  const queryClient = useQueryClient();
  
  // Handle navigation from student management page
  const targetStudent = location.state as { 
    targetStudentId?: string; 
    targetStudentName?: string; 
    targetStudentEmail?: string; 
  } | null;
  
  // Fetch active conversations with students
  const { data: activeConversations = [], isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['educator-conversations', educatorId, 'active'],
    queryFn: async () => {
      if (!educatorId) return [];
      const allConversations = await MessageService.getUserConversations(educatorId, 'educator', false);
      return allConversations.filter(conv => conv.conversation_type === 'student_educator');
    },
    enabled: !!educatorId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived conversations
  const { data: archivedConversations = [], isLoading: loadingArchived, refetch: refetchArchived } = useQuery({
    queryKey: ['educator-conversations', educatorId, 'archived'],
    queryFn: async () => {
      if (!educatorId) return [];
      const allConversations = await MessageService.getUserConversations(educatorId, 'educator', true);
      return allConversations.filter(conv => 
        conv.conversation_type === 'student_educator' && conv.status === 'archived'
      );
    },
    enabled: !!educatorId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const conversations = showArchived ? archivedConversations : activeConversations;
  const loadingConversations = showArchived ? loadingArchived : loadingActive;
  
  // Fetch messages for selected conversation
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = useEducatorMessages({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
  });

  // Use shared global presence context
  const { isUserOnline: isUserOnlineGlobal } = useGlobalPresence();

  // Presence tracking for current conversation
  const { } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: educatorId || '',
      userName: educatorName,
      userType: 'educator',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined
    },
    enabled: !!selectedConversationId && !!educatorId
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: educatorId || '',
    currentUserName: educatorName,
    enabled: !!selectedConversationId && !!educatorId
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: educatorId || '',
    showToast: true,
    enabled: !!educatorId
  });

  // Handle new conversation creation
  const handleNewConversation = useCallback(async (studentId: string, subject: string) => {
    if (!educatorId) return;
    
    try {
      console.log('🆕 Creating new conversation with student:', studentId, 'subject:', subject);
      
      // Check if conversation already exists
      const existingConversation = activeConversations.find(conv => 
        conv.student_id === studentId
      );
      
      if (existingConversation) {
        console.log('✅ Found existing conversation:', existingConversation.id);
        setSelectedConversationId(existingConversation.id);
        setShowNewConversationModal(false);
        toast.success('Opened existing conversation');
        return;
      }
      
      // Create new conversation
      const conversation = await MessageService.getOrCreateStudentEducatorConversation(
        studentId,
        educatorId,
        undefined, // classId - will be determined by the system
        subject
      );
      
      console.log('✅ New conversation created:', conversation);
      
      // Refresh conversations to include the new one
      await refetchActive();
      
      // Select the new conversation
      setSelectedConversationId(conversation.id);
      setShowNewConversationModal(false);
      
      toast.success('New conversation started');
      
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  }, [educatorId, activeConversations, refetchActive]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!educatorId) return;
    
    const subscription = MessageService.subscribeToUserConversations(
      educatorId,
      'educator',
      (conversation: Conversation) => {
        // Only handle student-educator conversations
        if (conversation.conversation_type !== 'student_educator') return;
        
        console.log('🔄 [Educator] Realtime UPDATE detected:', conversation);
        
        if (conversation.deleted_by_educator) {
          console.log('❌ [Educator] Ignoring UPDATE for deleted conversation:', conversation.id);
          return;
        }
        
        queryClient.invalidateQueries({ 
          queryKey: ['educator-conversations', educatorId],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [educatorId, queryClient]);
  
  // Auto-create conversation with target student from navigation
  useEffect(() => {
    const createConversationWithStudent = async () => {
      if (!targetStudent?.targetStudentId || !educatorId || loadingConversations) {
        return;
      }

      try {
        console.log('🎯 Auto-creating conversation with student:', targetStudent);
        
        // Check if conversation already exists
        const existingConversation = activeConversations.find(conv => 
          conv.student_id === targetStudent.targetStudentId
        );
        
        if (existingConversation) {
          console.log('✅ Found existing conversation:', existingConversation.id);
          setSelectedConversationId(existingConversation.id);
          toast.success(`Opened conversation with ${targetStudent.targetStudentName}`);
          return;
        }
        
        // Create new conversation
        console.log('🆕 Creating new conversation...');
        const conversation = await MessageService.getOrCreateStudentEducatorConversation(
          targetStudent.targetStudentId,
          educatorId,
          undefined, // classId - will be determined by the system
          'General Discussion' // default subject
        );
        
        console.log('✅ Conversation created:', conversation);
        
        // Refresh conversations to include the new one
        await refetchActive();
        
        // Select the new conversation
        setSelectedConversationId(conversation.id);
        
        toast.success(`Started conversation with ${targetStudent.targetStudentName}`);
        
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        toast.error(`Failed to start conversation with ${targetStudent.targetStudentName}`);
      }
    };

    createConversationWithStudent();
  }, [targetStudent, educatorId, activeConversations, loadingConversations, refetchActive]);
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !educatorId) return;
    
    const conversation = activeConversations.find(c => c.id === selectedConversationId);
    const hasUnread = (conversation?.educator_unread_count || 0) > 0;
    
    if (!hasUnread) return;
    
    const markKey = `${selectedConversationId}-${conversation?.educator_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);
    
    // Optimistically update the UI
    queryClient.setQueryData<typeof activeConversations>(
      ['educator-conversations', educatorId, 'active'],
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === selectedConversationId 
            ? { ...conv, educator_unread_count: 0 }
            : conv
        );
      }
    );
    
    MessageService.markConversationAsRead(selectedConversationId, educatorId)
      .catch(err => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
        refetchActive();
      });
  }, [selectedConversationId, educatorId, activeConversations, queryClient, refetchActive]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, educatorId!, 'educator');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['educator-conversations', educatorId] });
      
      const previousActive = queryClient.getQueryData(['educator-conversations', educatorId, 'active']);
      const previousArchived = queryClient.getQueryData(['educator-conversations', educatorId, 'archived']);
      
      queryClient.setQueryData(['educator-conversations', educatorId, 'active'], (old: any) => {
        if (!old) return [];
        return old.map((conv: any) => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['educator-conversations', educatorId, 'active'],
        refetchType: 'none'
      });
      
      return { previousActive, previousArchived, conversationId };
    },
    onError: () => {
      toast.error('Failed to delete conversation');
      refetchActive();
      refetchArchived();
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(['educator-conversations', educatorId, 'active'], (old: any) => {
        if (!old) return [];
        return old.filter((conv: any) => conv.id !== variables.conversationId);
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['educator-conversations', educatorId, 'active'],
        refetchType: 'none'
      });
    }
  });
  
  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.restoreConversation(conversationId, educatorId!, 'educator');
      return { conversationId };
    },
    onSuccess: () => {
      toast.success('Conversation restored');
      refetchActive();
      refetchArchived();
    }
  });
  
  // Handle archive/unarchive
  const handleToggleArchive = useCallback(async (conversationId: string, isArchiving: boolean) => {
    setIsTransitioning(true);
    
    try {
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      
      await (isArchiving 
        ? MessageService.archiveConversation(conversationId)
        : MessageService.unarchiveConversation(conversationId)
      );
      
      await Promise.all([refetchActive(), refetchArchived()]);
    } catch (error) {
      console.error(`Error ${isArchiving ? 'archiving' : 'unarchiving'} conversation:`, error);
      refetchActive();
      refetchArchived();
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [selectedConversationId, refetchActive, refetchArchived]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !educatorId) return;
    
    const conversationId = deleteModal.conversationId;
    const contactName = deleteModal.contactName;
    
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
    
    setDeleteModal({ isOpen: false, conversationId: null, contactName: '' });
    
    deleteMutation.mutate({ conversationId });
    
    // Show undo toast
    toast.success(`Conversation with ${contactName} deleted`, {
      duration: 5000,
    });
    
    // Add undo button functionality (simplified)
    setTimeout(() => {
      toast('Click here to undo', {
        duration: 3000,
      });
    }, 500);
  }, [deleteModal.conversationId, deleteModal.contactName, educatorId, selectedConversationId, deleteMutation, undoMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId: string, contactName: string) => {
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);
  
  // Transform and filter conversations
  const filteredContacts = useMemo(() => {
    const activeConversations = conversations.filter((conv: any) => !conv._pendingDelete);

    const contacts = activeConversations.map((conv: any) => {
      // Use direct student fields instead of profile JSONB
      const studentName = conv.student?.name || conv.student?.email || 'Student';
      const studentUniversity = conv.student?.university || '';
      const studentBranch = conv.student?.branch_field || '';
      
      // Get class and subject info from school tables
      const className = conv.school_class?.name || 'Class';
      const grade = conv.school_class?.grade || '';
      const section = conv.school_class?.section || '';
      const subject = conv.subject || 'General Discussion';
      
      // Build role string with university and branch info
      let role = subject;
      if (className && grade) {
        role += ` • ${grade}`;
        if (section) {
          role += `-${section}`;
        }
      }
      if (studentUniversity) {
        role += ` • ${studentUniversity}`;
      }
      if (studentBranch) {
        role += ` (${studentBranch})`;
      }
      
      return {
        id: conv.id,
        name: studentName,
        role: role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=10B981&color=fff`,
        lastMessage: conv.last_message_preview || 'No messages yet',
        online: isUserOnlineGlobal(conv.student_id),
        time: conv.last_message_at 
          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
          : 'No messages',
        unread: conv.educator_unread_count || 0,
        studentId: conv.student_id,
        classId: conv.class_id,
        subject: conv.subject,
        // Additional searchable fields
        studentEmail: conv.student?.email || '',
        className: className,
        grade: grade,
        section: section,
        university: studentUniversity,
        branch: studentBranch,
      };
    });

    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      // Basic info
      c.name.toLowerCase().includes(query) || 
      c.studentEmail.toLowerCase().includes(query) ||
      // Class and subject info
      c.role.toLowerCase().includes(query) ||
      c.subject.toLowerCase().includes(query) ||
      c.className.toLowerCase().includes(query) ||
      c.grade.toLowerCase().includes(query) ||
      c.section.toLowerCase().includes(query) ||
      // University info
      c.university.toLowerCase().includes(query) ||
      c.branch.toLowerCase().includes(query) ||
      // Message content
      c.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery, isUserOnlineGlobal]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || !educatorId) return;
    
    try {
      await sendMessage({
        senderId: educatorId,
        senderType: 'educator',
        receiverId: currentChat.studentId,
        receiverType: 'student',
        messageText: messageInput,
        classId: currentChat.classId,
        subject: currentChat.subject
      });
      
      // Send notification to student
      try {
        await sendNotification(currentChat.studentId, {
          title: 'New Message from Educator',
          message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
          type: 'message',
          link: `/student/messages?tab=educators&conversation=${selectedConversationId}`
        });
      } catch (notifError) {
        // Silent fail
      }
      
      setMessageInput('');
      setTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messageInput, currentChat, educatorId, sendMessage, sendNotification, selectedConversationId, setTyping]);

  // Handle typing in input
  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);
    setTyping(value.length > 0);
  }, [setTyping]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const displayMessages = useMemo(() => 
    messages.map((msg: any) => ({
      id: msg.id,
      text: msg.message_text,
      sender: msg.sender_type === 'educator' ? 'me' : 'them',
      time: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
      status: msg.is_read ? 'read' : 'delivered'
    })),
    [messages]
  );

  const renderStatusIcon = useCallback((status: string) => (
    <div className="flex">
      <CheckIcon className={`w-3 h-3 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`} />
      {status !== 'sent' && <CheckIcon className={`w-3 h-3 -ml-1 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`} />}
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Communication & Collaboration</h1>

      {/* Student Messages Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-6">
        <div className="flex h-[600px]">
          {/* Left Panel - Contacts List */}
          <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col">
            {/* Search Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                {showArchived && (
                  <button
                    onClick={() => setShowArchived(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Back to messages"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                  </button>
                )}
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600" />
                <div className="flex flex-col flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {showArchived ? 'Archived Messages' : 'Student Messages'}
                  </h2>
                  {searchQuery && (
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredContacts.length} conversation{filteredContacts.length !== 1 ? 's' : ''} found for "{searchQuery}"
                    </p>
                  )}
                </div>
                {!showArchived && (
                  <button
                    onClick={() => setShowNewConversationModal(true)}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    title="Start new conversation"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    New
                  </button>
                )}
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, email, class, subject, or message content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                    }
                  }}
                  className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Clear search"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto relative">
              {/* Archived Button */}
              {!showArchived && !loadingArchived && archivedConversations.length > 0 && (
                <button
                  onClick={() => {
                    setShowArchived(true);
                    setIsTransitioning(true);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <ArchiveBoxIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Archived</h3>
                      <p className="text-xs text-gray-500">
                        {archivedConversations.length} conversation{archivedConversations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              )}

              {/* Loading indicator during transition */}
              {isTransitioning && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {loadingConversations ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AcademicCapIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {showArchived 
                      ? 'No archived conversations' 
                      : searchQuery 
                      ? `No conversations found for "${searchQuery}"` 
                      : 'No student messages yet'
                    }
                  </p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">
                    {showArchived 
                      ? 'Archived conversations will appear here' 
                      : searchQuery 
                      ? 'Try searching by student name, email, class, subject, or message content' 
                      : 'Students will message you about classes'
                    }
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  {!showArchived && !searchQuery && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Start New Conversation
                      </button>
                      <button
                        onClick={() => {
                          toast('Students will initiate conversations with you from their Messages page', {
                            icon: 'ℹ️',
                            duration: 4000,
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Waiting for Students
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`relative w-full flex items-center border-b border-gray-100 group transition-all duration-200 ${
                      selectedConversationId === contact.id 
                        ? 'bg-green-50 border-l-4 border-l-green-600' 
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedConversationId(contact.id)}
                      className="flex-1 px-4 py-3 flex items-center gap-3 transition-all text-left"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        {contact.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <h3 className="font-bold text-gray-900 text-sm truncate">
                            {contact.name}
                          </h3>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {contact.time}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 font-semibold mb-1 truncate">
                          {contact.role}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {contact.lastMessage}
                        </p>
                      </div>
                      {contact.unread > 0 && (
                        <div className="flex-shrink-0 min-w-[18px] h-5 px-1.5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {contact.unread > 9 ? '9+' : contact.unread}
                        </div>
                      )}
                    </button>
                    
                    {/* Quick Actions on Hover */}
                    <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Archive/Unarchive Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleArchive(contact.id, !showArchived);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded-full transition-colors"
                        title={showArchived ? 'Unarchive conversation' : 'Archive conversation'}
                      >
                        {showArchived ? (
                          <ArrowUturnLeftIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ArchiveBoxIcon className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(contact.id, contact.name);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete conversation"
                      >
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={currentChat.avatar}
                        alt={currentChat.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      {currentChat.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{currentChat.name}</h3>
                      <p className="text-sm text-green-600 font-medium">{currentChat.role}</p>
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
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Voice Call">
                      <PhoneIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Video Call">
                      <VideoCameraIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="More">
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <AcademicCapIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-2">Start the conversation with your student!</p>
                    </div>
                  ) : (
                    displayMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[70%]">
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                              message.sender === 'me'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <span
                                className={`text-xs ${
                                  message.sender === 'me' ? 'text-green-100' : 'text-gray-400'
                                }`}
                              >
                                {message.time}
                              </span>
                              {message.sender === 'me' && renderStatusIcon(message.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
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
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      title="Attach file"
                    >
                      <PaperClipIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => setTyping(true)}
                        onBlur={() => setTyping(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message..."
                        className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm bg-white transition-all"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '100px' }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 bottom-2.5 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="Emoji"
                      >
                        <FaceSmileIcon className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
                      title="Send"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <PaperAirplaneIcon className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md px-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    Choose a conversation from the list to start messaging with students
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Communication Features (Future) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Announcements</h2>
          <p className="text-sm text-gray-600 mb-4">Send announcements to entire classes</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Coming Soon
          </button>
        </div>

        {/* Feedback System */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Feedback</h2>
          <p className="text-sm text-gray-600 mb-4">Provide feedback on student activities</p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            Coming Soon
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConversationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, conversationId: null, contactName: '' })}
        onConfirm={handleDeleteConversation}
        contactName={deleteModal.contactName}
        isDeleting={deleteMutation.isPending}
      />

      {/* New Conversation Modal */}
      <NewStudentConversationModalEducator
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleNewConversation}
        educatorId={educatorId}
      />
    </div>
  );
};

export default Communication;
