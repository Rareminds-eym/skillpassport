import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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
  TrashIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ChevronDownIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import MessageService, { Conversation } from '../../services/messageService';
// import { useStudentCollegeLecturerMessages } from '../../hooks/useStudentCollegeLecturerMessages.js';
import { useCollegeLecturerMessages } from '../../hooks/useCollegeLecturerMessages.js';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';
import NewCollegeLecturerConversationModal from '../../components/messaging/NewCollegeLecturerConversationModal';
import { supabase } from '../../lib/supabaseClient';

const CollegeLecturerMessages = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const tabDropdownRef = useRef<HTMLDivElement>(null);
  
  // Tab management - only college students for now
  const [activeTab] = useState('college_students');
  
  // Get college lecturer ID from auth
  const { user } = useAuth();
  console.log('🔍 Raw user object from auth:', user);
  // Use the real user ID from auth
  const userId = user?.id;
  console.log('🔍 Final userId value:', userId);
  const lecturerName = user?.name || 'College Lecturer';
  const queryClient = useQueryClient();
  
  // Define userAuthId early for use in useEffect  
  const userAuthId = userId; // For auth/user operations (needs auth user ID)
  
  // Handle navigation from student management page
  const targetStudent = location.state as { 
    targetStudentId?: string; 
    targetStudentName?: string; 
    targetStudentEmail?: string; 
  } | null;
  
  // Get college lecturer details
  const { data: collegeLecturerData } = useQuery({
    queryKey: ['college-lecturer-details', userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('🔍 Querying college lecturer details with user_id:', userId);
      const { data, error } = await supabase
        .from('college_lecturers')
        .select('id, collegeId, first_name, last_name, email, department, specialization')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching college lecturer details:', error);
        throw error;
      }
      console.log('✅ College lecturer details found:', data);
      return data;
    },
    enabled: !!userId,
  });
  
  const collegeId = collegeLecturerData?.collegeId;
  const collegeLecturerRecordId = collegeLecturerData?.id;
  
  // Fetch active college student conversations
  const { data: activeCollegeStudentConversations = [], isLoading: loadingActiveCollegeStudents, refetch: refetchActiveCollegeStudents } = useQuery({
    queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'active'],
    queryFn: async () => {
      if (!collegeLecturerRecordId) return [];
      console.log('🔍 Fetching college student conversations for lecturer record ID:', collegeLecturerRecordId);
      const allConversations = await MessageService.getUserConversations(collegeLecturerRecordId, 'college_educator', false);
      const collegeStudentConversations = allConversations.filter(conv => conv.conversation_type === 'student_college_educator');
      console.log('📚 Found college student conversations:', collegeStudentConversations.length);
      return collegeStudentConversations;
    },
    enabled: !!collegeLecturerRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived college student conversations
  const { data: archivedCollegeStudentConversations = [], isLoading: loadingArchivedCollegeStudents, refetch: refetchArchivedCollegeStudents } = useQuery({
    queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'archived'],
    queryFn: async () => {
      if (!collegeLecturerRecordId) return [];
      const allConversations = await MessageService.getUserConversations(collegeLecturerRecordId, 'college_educator', true);
      return allConversations.filter(conv => 
        conv.conversation_type === 'student_college_educator' && conv.status === 'archived'
      );
    },
    enabled: !!collegeLecturerRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 [College-Messages-Page] === USER & LECTURER DEBUG ===');
    console.log('� Aut h User:', {
      id: user?.id,
      email: user?.email,
      name: user?.name
    });
    console.log('🎓 College Lecturer Data:', collegeLecturerData);
    console.log('🆔 IDs:', {
      userId,
      userAuthId,
      collegeLecturerRecordId,
      collegeId
    });
    console.log('🏁 [College-Messages-Page] === USER & LECTURER DEBUG END ===');
  }, [user, userId, userAuthId, collegeLecturerData, collegeLecturerRecordId, collegeId]);

  useEffect(() => {
    if (collegeLecturerData) {
      console.log('👨‍🏫 College Lecturer data:', {
        id: collegeLecturerData.id,
        collegeId: collegeLecturerData.collegeId,
        name: `${collegeLecturerData.first_name} ${collegeLecturerData.last_name}`,
        department: collegeLecturerData.department,
        user_id_from_auth: userId,
        lecturer_record_id: collegeLecturerRecordId
      });
    }
  }, [collegeLecturerData, userId, collegeLecturerRecordId]);

  // Get current conversations based on archived state
  const conversations = showArchived ? archivedCollegeStudentConversations : activeCollegeStudentConversations;
  const loadingConversations = showArchived ? loadingArchivedCollegeStudents : loadingActiveCollegeStudents;
  const refetchConversations = showArchived ? refetchArchivedCollegeStudents : refetchActiveCollegeStudents;
  
  // Debug conversations loading
  useEffect(() => {
    console.log('🔍 [College-Messages-Page] === CONVERSATIONS DEBUG ===');
    console.log('📋 Conversations state:', {
      activeCount: activeCollegeStudentConversations?.length || 0,
      archivedCount: archivedCollegeStudentConversations?.length || 0,
      showArchived,
      currentConversations: conversations?.length || 0,
      loadingConversations
    });
    
    if (conversations && conversations.length > 0) {
      console.log('📋 [College-Messages-Page] Sample conversation:', conversations[0]);
      console.log('📋 [College-Messages-Page] All conversation IDs:', 
        conversations.map(c => ({ id: c.id, student_name: c.student?.name }))
      );
    }
    console.log('🏁 [College-Messages-Page] === CONVERSATIONS DEBUG END ===');
  }, [activeCollegeStudentConversations, archivedCollegeStudentConversations, conversations, showArchived, loadingConversations]);
  
  // Fetch messages for selected conversation
  // const { messages, isLoading: loadingMessages, sendMessage, isSending } = useStudentCollegeLecturerMessages({
  //   conversationId: selectedConversationId,
  //   enabled: !!selectedConversationId,
  // });

// To:
const { messages, isLoading: loadingMessages, sendMessage, isSending } = useCollegeLecturerMessages({
  conversationId: selectedConversationId,
  enabled: !!selectedConversationId,
})
  // Debug messages loading
  useEffect(() => {
    console.log('🔍 [College-Messages-Page] === MESSAGES DEBUG ===');
    console.log('📋 Selected Conversation ID:', selectedConversationId);
    console.log('📨 Messages loaded:', {
      count: messages?.length || 0,
      isLoading: loadingMessages,
      hasMessages: !!messages && messages.length > 0
    });
    
    if (messages && messages.length > 0) {
      console.log('📨 [College-Messages-Page] First message:', messages[0]);
      console.log('📨 [College-Messages-Page] Last message:', messages[messages.length - 1]);
    } else if (selectedConversationId && !loadingMessages) {
      console.log('⚠️ [College-Messages-Page] No messages found for selected conversation');
    }
    console.log('🏁 [College-Messages-Page] === MESSAGES DEBUG END ===');
  }, [selectedConversationId, messages, loadingMessages]);

  // Use shared global presence context
  const { isUserOnline: isUserOnlineGlobal } = useGlobalPresence();

  // Presence tracking for current conversation
  const { } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: collegeLecturerRecordId || '',
      userName: lecturerName,
      userType: 'college_educator',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined
    },
    enabled: !!selectedConversationId && !!collegeLecturerRecordId
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: collegeLecturerRecordId || '',
    currentUserName: lecturerName,
    enabled: !!selectedConversationId && !!collegeLecturerRecordId
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: collegeLecturerRecordId || '',
    showToast: true,
    enabled: !!collegeLecturerRecordId
  });

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target as Node)) {
      setShowTabDropdown(false);
    }
  }, []);
  
  useEffect(() => {
    if (showTabDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTabDropdown, handleClickOutside]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!collegeLecturerRecordId) return;
    
    const subscription = MessageService.subscribeToUserConversations(
      collegeLecturerRecordId,
      'college_educator',
      (conversation: Conversation) => {
        // Only handle student-college_educator conversations
        if (conversation.conversation_type !== 'student_college_educator') return;
        
        console.log('🔄 [College Lecturer] Realtime UPDATE detected:', conversation);
        
        if (conversation.deleted_by_college_educator) {
          console.log('❌ [College Lecturer] Ignoring UPDATE for deleted conversation:', conversation.id);
          return;
        }
        
        queryClient.invalidateQueries({ 
          queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'active'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'archived'],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [collegeLecturerRecordId, queryClient]);
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !collegeLecturerRecordId) return;
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    const hasUnread = (conversation?.college_educator_unread_count || 0) > 0;
    
    if (!hasUnread) return;
    
    const markKey = `${selectedConversationId}-${conversation?.college_educator_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);
    
    // Optimistically update the UI
    queryClient.setQueryData<typeof conversations>(
      ['college-lecturer-conversations', collegeLecturerRecordId, 'active'],
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === selectedConversationId 
            ? { ...conv, college_educator_unread_count: 0 }
            : conv
        );
      }
    );
    
    MessageService.markConversationAsRead(selectedConversationId, collegeLecturerRecordId)
      .then(() => {
        // Force cache invalidation after successful mark as read
        queryClient.invalidateQueries({ 
          queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'active'],
          refetchType: 'active'
        });
      })
      .catch(err => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
        refetchConversations();
      });
  }, [selectedConversationId, collegeLecturerRecordId, conversations, queryClient, refetchConversations]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, collegeLecturerRecordId!, 'college_educator');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['college-lecturer-conversations', collegeLecturerRecordId] });
      
      const previousActive = queryClient.getQueryData(['college-lecturer-conversations', collegeLecturerRecordId, 'active']);
      const previousArchived = queryClient.getQueryData(['college-lecturer-conversations', collegeLecturerRecordId, 'archived']);
      
      queryClient.setQueryData(['college-lecturer-conversations', collegeLecturerRecordId, 'active'], (old: any) => {
        if (!old) return [];
        return old.map((conv: any) => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'active'],
        refetchType: 'none'
      });
      
      return { previousActive, previousArchived, conversationId };
    },
    onError: () => {
      toast.error('Failed to delete conversation');
      refetchConversations();
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(['college-lecturer-conversations', collegeLecturerRecordId, 'active'], (old: any) => {
        if (!old) return [];
        return old.filter((conv: any) => conv.id !== variables.conversationId);
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['college-lecturer-conversations', collegeLecturerRecordId, 'active'],
        refetchType: 'none'
      });
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
      
      await Promise.all([
        showArchived ? refetchArchivedCollegeStudents() : refetchActiveCollegeStudents()
      ]);
    } catch (error) {
      console.error(`Error ${isArchiving ? 'archiving' : 'unarchiving'} conversation:`, error);
      refetchConversations();
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [selectedConversationId, refetchConversations, showArchived, refetchArchivedCollegeStudents, refetchActiveCollegeStudents]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !collegeLecturerRecordId) return;
    
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
  }, [deleteModal.conversationId, deleteModal.contactName, collegeLecturerRecordId, selectedConversationId, deleteMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId: string, contactName: string) => {
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);
  
  // Transform and filter conversations
  const filteredContacts = useMemo(() => {
    const activeConversations = conversations.filter((conv: any) => !conv._pendingDelete);

    const contacts = activeConversations.map((conv: any) => {
      // College student conversations
      const studentName = conv.student?.name || conv.student?.email || 'College Student';
      const studentUniversity = conv.student?.university || '';
      const studentBranch = conv.student?.branch_field || '';
      const subject = conv.subject || 'General Discussion';
      
      // Build role string with university and branch info
      let role = subject;
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
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=7C3AED&color=fff`,
        lastMessage: conv.last_message_preview || 'No messages yet',
        online: isUserOnlineGlobal(conv.student_id),
        time: conv.last_message_at 
          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
          : 'No messages',
        unread: conv.college_educator_unread_count || 0,
        studentId: conv.student_id,
        subject: conv.subject,
        type: 'college_student'
      };
    });

    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.role.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery, isUserOnlineGlobal]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || !userAuthId) return;
    
    try {
      // Send message to college student
      await sendMessage({
        senderId: userAuthId,
        senderType: 'college_educator',
        receiverId: currentChat.studentId,
        receiverType: 'student',
        messageText: messageInput,
        subject: currentChat.subject
      });
      
      // Send notification to student
      try {
        await sendNotification(currentChat.studentId, {
          title: 'New Message from College Lecturer',
          message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
          type: 'message',
          link: `/student/messages?tab=college_lecturers&conversation=${selectedConversationId}`
        });
      } catch (notifError) {
        // Silent fail
      }
      
      setMessageInput('');
      setTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messageInput, currentChat, userAuthId, sendMessage, sendNotification, selectedConversationId, setTyping]);

  // Handle typing in input
  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);
    setTyping(value.length > 0);
  }, [setTyping]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const displayMessages = useMemo(() => {
    console.log('🔍 [College-Messages-Page] === DISPLAY MESSAGES DEBUG ===');
    console.log('📨 Raw messages:', messages);
    console.log('📊 Messages count:', messages?.length || 0);
    
    const processed = messages.map((msg: any) => {
      console.log('🔄 [College-Messages-Page] Processing message:', {
        id: msg.id,
        sender_type: msg.sender_type,
        receiver_type: msg.receiver_type,
        text: msg.message_text?.substring(0, 50) + '...',
        created_at: msg.created_at
      });
      
      return {
        id: msg.id,
        text: msg.message_text,
        sender: msg.sender_type === 'college_educator' ? 'me' : 'them',
        time: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
        status: msg.is_read ? 'read' : 'delivered'
      };
    });
    
    console.log('✅ [College-Messages-Page] Processed messages:', processed);
    console.log('🏁 [College-Messages-Page] === DISPLAY MESSAGES DEBUG END ===');
    
    return processed;
  }, [messages]);

  const renderStatusIcon = useCallback((status: string) => (
    <div className="flex">
      <CheckIcon className={`w-3 h-3 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`} />
      {status !== 'sent' && <CheckIcon className={`w-3 h-3 -ml-1 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`} />}
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">College Student Messages</h1>

      {/* Messages Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-6">
        <div className="flex h-[600px]">
          {/* Left Panel - Contacts List */}
          <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                
                <div className="flex items-center gap-3 ml-4">
                  {/* New Button */}
                  {!showArchived && (
                    <button
                      onClick={() => setShowNewConversationModal(true)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      title="Start new conversation with college student"
                    >
                      <AcademicCapIcon className="w-4 h-4" />
                      New
                    </button>
                  )}
                  
                  {/* Tab Display */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">College Students</span>
                    {activeCollegeStudentConversations.length > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        {activeCollegeStudentConversations.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search college student conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                    }
                  }}
                  className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-sm"
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
              {!showArchived && 
               !loadingArchivedCollegeStudents && 
               archivedCollegeStudentConversations.length > 0 && (
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
                        {archivedCollegeStudentConversations.length} conversation{archivedCollegeStudentConversations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              )}

              {/* Loading indicator during transition */}
              {isTransitioning && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {loadingConversations ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {showArchived 
                      ? 'No archived conversations' 
                      : searchQuery 
                      ? `No conversations found for "${searchQuery}"` 
                      : 'No college student messages yet'
                    }
                  </p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">
                    {showArchived 
                      ? 'Archived conversations will appear here' 
                      : searchQuery 
                      ? 'Try searching by student name, university, subject, or message content' 
                      : 'College students will message you about courses and assignments'
                    }
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  {!showArchived && !searchQuery && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Message College Student
                      </button>
                      <button
                        onClick={() => {
                          toast('College students will initiate conversations with you from their Messages page', {
                            icon: 'ℹ️',
                            duration: 4000,
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Waiting for College Students
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
                        ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <button
                      onClick={() => {
                        console.log('🔍 [College-Messages-Page] === CONVERSATION SELECTION ===');
                        console.log('📋 Selecting conversation:', {
                          id: contact.id,
                          name: contact.name,
                          studentId: contact.studentId,
                          previousSelection: selectedConversationId
                        });
                        setSelectedConversationId(contact.id);
                        console.log('✅ [College-Messages-Page] Conversation selected, should trigger message fetch');
                      }}
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
                        <p className="text-xs text-blue-600 font-semibold mb-1 truncate">
                          {contact.role}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {contact.lastMessage}
                        </p>
                      </div>
                      {contact.unread > 0 && (
                        <div className="flex-shrink-0 min-w-[18px] h-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
                      <p className="text-sm text-blue-600 font-medium">{currentChat.role}</p>
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
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 font-semibold">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-2">Start the conversation with your college student!</p>
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
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <span
                                className={`text-xs ${
                                  message.sender === 'me' ? 'text-blue-100' : 'text-gray-400'
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
                        placeholder="Type your message to college student..."
                        className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white transition-all"
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
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
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
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    Choose a conversation from the list to start messaging with college students
                  </p>
                </div>
              </div>
            )}
          </div>
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

      {/* New College Lecturer Conversation Modal */}
      <NewCollegeLecturerConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        collegeLecturerId={collegeLecturerRecordId}
        collegeId={collegeId}
        onCreateConversation={async ({ studentId, collegeLecturerId: lecturerId, programSectionId, subject, initialMessage }) => {
          try {
            console.log('🚀 Creating college lecturer conversation:', { studentId, lecturerId, collegeId, programSectionId, subject, initialMessage });
            
            const conversation = await MessageService.getOrCreateStudentCollegeLecturerConversation(
              studentId,
              lecturerId,
              collegeId,
              programSectionId,
              subject
            );
            console.log('✅ College lecturer conversation created:', conversation);

            // Send the initial message if provided
            if (initialMessage && initialMessage.trim()) {
              await MessageService.sendMessage(
                conversation.id,
                lecturerId,
                'college_educator',
                studentId,
                'student',
                initialMessage.trim(),
                null, // applicationId
                null, // opportunityId
                null, // classId
                subject
              );
              console.log('✅ Initial message sent to college student');
            }

            // Refetch conversations and select the new one
            await refetchActiveCollegeStudents();
            setSelectedConversationId(conversation.id);
            
            toast.success('Conversation started with college student!');
          } catch (error) {
            console.error('❌ Error creating college lecturer conversation:', error);
            toast.error('Failed to start conversation with college student');
          }
        }}
      />
    </div>
  );
};

export default CollegeLecturerMessages;