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
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import MessageService, { Conversation } from '../../services/messageService';
// import { useStudentCollegeLecturerMessages } from '../../hooks/useStudentCollegeLecturerMessages.js';
import { useCollegeLecturerMessages } from '../../hooks/useCollegeLecturerMessages.js';
import { useCollegeEducatorAdminConversationsForEducator } from '../../hooks/useCollegeEducatorAdminConversations.js';
import { useCollegeEducatorAdminMessagesForEducator } from '../../hooks/useCollegeEducatorAdminMessages.js';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';
import NewCollegeLecturerConversationModal from '../../components/messaging/NewCollegeLecturerConversationModal';
import NewCollegeEducatorAdminConversationModal from '../../components/messaging/NewCollegeEducatorAdminConversationModal';
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
  
  // Tab management - college students and college admin
  const [activeTab, setActiveTab] = useState<'college_students' | 'college_admin'>('college_students');
  
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
  
  // Get college admin ID
  const { data: collegeAdminData } = useQuery({
    queryKey: ['college-admin-id', collegeId],
    queryFn: async () => {
      if (!collegeId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, admin_id')
        .eq('id', collegeId)
        .eq('organization_type', 'college')
        .single();
      
      if (error) {
        console.error('❌ Error fetching college admin ID:', error);
        return null;
      }
      
      console.log('✅ College admin data:', data);
      return data;
    },
    enabled: !!collegeId,
  });
  
  const collegeAdminId = collegeAdminData?.admin_id;
  
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

  // Fetch active college admin conversations
  const { conversations: activeCollegeAdminConversations = [], isLoading: loadingActiveCollegeAdmin, refetch: refetchActiveCollegeAdmin } = useCollegeEducatorAdminConversationsForEducator({
    educatorId: collegeLecturerRecordId,
    collegeId: collegeId,
    includeArchived: false,
    enabled: !!collegeLecturerRecordId && !!collegeId,
  });

  // Fetch archived college admin conversations
  const { conversations: archivedCollegeAdminConversations = [], isLoading: loadingArchivedCollegeAdmin, refetch: refetchArchivedCollegeAdmin } = useCollegeEducatorAdminConversationsForEducator({
    educatorId: collegeLecturerRecordId,
    collegeId: collegeId,
    includeArchived: true,
    enabled: !!collegeLecturerRecordId && !!collegeId,
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

  // Get current conversations based on archived state and active tab
  const conversations = useMemo(() => {
    if (activeTab === 'college_students') {
      return showArchived ? archivedCollegeStudentConversations : activeCollegeStudentConversations;
    } else {
      return showArchived ? archivedCollegeAdminConversations : activeCollegeAdminConversations;
    }
  }, [activeTab, showArchived, archivedCollegeStudentConversations, activeCollegeStudentConversations, archivedCollegeAdminConversations, activeCollegeAdminConversations]);

  const loadingConversations = useMemo(() => {
    if (activeTab === 'college_students') {
      return showArchived ? loadingArchivedCollegeStudents : loadingActiveCollegeStudents;
    } else {
      return showArchived ? loadingArchivedCollegeAdmin : loadingActiveCollegeAdmin;
    }
  }, [activeTab, showArchived, loadingArchivedCollegeStudents, loadingActiveCollegeStudents, loadingArchivedCollegeAdmin, loadingActiveCollegeAdmin]);

  const refetchConversations = useMemo(() => {
    if (activeTab === 'college_students') {
      return showArchived ? refetchArchivedCollegeStudents : refetchActiveCollegeStudents;
    } else {
      return showArchived ? refetchArchivedCollegeAdmin : refetchActiveCollegeAdmin;
    }
  }, [activeTab, showArchived, refetchArchivedCollegeStudents, refetchActiveCollegeStudents, refetchArchivedCollegeAdmin, refetchActiveCollegeAdmin]);
  
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
  
  // Fetch messages for selected conversation - use appropriate hook based on tab
  const studentMessages = useCollegeLecturerMessages({
    conversationId: activeTab === 'college_students' ? selectedConversationId : null,
    enabled: !!selectedConversationId && activeTab === 'college_students',
  });

  const adminMessages = useCollegeEducatorAdminMessagesForEducator({
    conversationId: activeTab === 'college_admin' ? selectedConversationId : null,
    educatorId: collegeLecturerRecordId,
    enabled: !!selectedConversationId && activeTab === 'college_admin' && !!collegeLecturerRecordId,
  });

  // Use the appropriate messages based on active tab
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = activeTab === 'college_students' ? studentMessages : adminMessages;
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
  
  // Debug presence system
  useEffect(() => {
    console.log('🔍 [Messages] Global presence system loaded');
    console.log('🔍 [Messages] isUserOnlineGlobal function:', typeof isUserOnlineGlobal);
  }, [isUserOnlineGlobal]);

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
        // Handle both student and admin conversations
        if (conversation.conversation_type === 'student_college_educator') {
          console.log('🔄 [College Lecturer] Student conversation UPDATE:', conversation);
          
          if (conversation.deleted_by_college_educator) {
            console.log('❌ [College Lecturer] Ignoring deleted student conversation:', conversation.id);
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
        } else if (conversation.conversation_type === 'college_educator_admin') {
          console.log('🔄 [College Lecturer] Admin conversation UPDATE:', conversation);
          
          if (conversation.deleted_by_educator) {
            console.log('❌ [College Lecturer] Ignoring deleted admin conversation:', conversation.id);
            return;
          }
          
          queryClient.invalidateQueries({ 
            queryKey: ['college-educator-admin-conversations', collegeLecturerRecordId, 'college_educator', collegeId],
            refetchType: 'active'
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [collegeLecturerRecordId, queryClient, collegeId]);
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !collegeLecturerRecordId) return;
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    const hasUnread = activeTab === 'college_students' 
      ? (conversation?.college_educator_unread_count || 0) > 0
      : (conversation?.educator_unread_count || 0) > 0;
    
    if (!hasUnread) return;
    
    const unreadCount = activeTab === 'college_students' 
      ? conversation?.college_educator_unread_count 
      : conversation?.educator_unread_count;
    const markKey = `${selectedConversationId}-${unreadCount}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);
    
    // Optimistically update the UI
    const queryKey = activeTab === 'college_students'
      ? ['college-lecturer-conversations', collegeLecturerRecordId, 'active']
      : ['college-educator-admin-conversations', collegeLecturerRecordId, 'college_educator', collegeId, 'active'];
    
    queryClient.setQueryData<typeof conversations>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(conv => 
        conv.id === selectedConversationId 
          ? { 
              ...conv, 
              ...(activeTab === 'college_students' 
                ? { college_educator_unread_count: 0 }
                : { educator_unread_count: 0 }
              )
            }
          : conv
      );
    });
    
    MessageService.markConversationAsRead(selectedConversationId, collegeLecturerRecordId)
      .then(() => {
        // Force cache invalidation after successful mark as read
        queryClient.invalidateQueries({ 
          queryKey: queryKey,
          refetchType: 'active'
        });
      })
      .catch(err => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
        refetchConversations();
      });
  }, [selectedConversationId, collegeLecturerRecordId, conversations, queryClient, refetchConversations, activeTab, collegeId]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, collegeLecturerRecordId!, 'college_educator');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      const queryKey = activeTab === 'college_students'
        ? ['college-lecturer-conversations', collegeLecturerRecordId]
        : ['college-educator-admin-conversations', collegeLecturerRecordId, 'college_educator', collegeId];
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData(queryKey);
      
      // Update the appropriate query data
      if (activeTab === 'college_students') {
        queryClient.setQueryData(['college-lecturer-conversations', collegeLecturerRecordId, 'active'], (old: any) => {
          if (!old) return [];
          return old.map((conv: any) => 
            conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
          );
        });
      } else {
        queryClient.setQueryData(['college-educator-admin-conversations', collegeLecturerRecordId, 'college_educator', collegeId, 'active'], (old: any) => {
          if (!old) return [];
          return old.map((conv: any) => 
            conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
          );
        });
      }
      
      return { previousData, conversationId };
    },
    onError: () => {
      toast.error('Failed to delete conversation');
      refetchConversations();
    },
    onSuccess: (_data, variables) => {
      if (activeTab === 'college_students') {
        queryClient.setQueryData(['college-lecturer-conversations', collegeLecturerRecordId, 'active'], (old: any) => {
          if (!old) return [];
          return old.filter((conv: any) => conv.id !== variables.conversationId);
        });
      } else {
        queryClient.setQueryData(['college-educator-admin-conversations', collegeLecturerRecordId, 'college_educator', collegeId, 'active'], (old: any) => {
          if (!old) return [];
          return old.filter((conv: any) => conv.id !== variables.conversationId);
        });
      }
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
      
      // Refetch appropriate conversations based on active tab
      if (activeTab === 'college_students') {
        await Promise.all([
          showArchived ? refetchArchivedCollegeStudents() : refetchActiveCollegeStudents()
        ]);
      } else {
        await Promise.all([
          showArchived ? refetchArchivedCollegeAdmin() : refetchActiveCollegeAdmin()
        ]);
      }
    } catch (error) {
      console.error(`Error ${isArchiving ? 'archiving' : 'unarchiving'} conversation:`, error);
      refetchConversations();
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [selectedConversationId, refetchConversations, showArchived, activeTab, refetchArchivedCollegeStudents, refetchActiveCollegeStudents, refetchArchivedCollegeAdmin, refetchActiveCollegeAdmin]);

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
    console.log('🔍 [Messages] Processing conversations for activeTab:', activeTab);
    console.log('🔍 [Messages] Raw conversations:', conversations);
    
    const activeConversations = conversations.filter((conv: any) => !conv._pendingDelete);
    console.log('🔍 [Messages] Active conversations after filtering:', activeConversations);

    const contacts = activeConversations.map((conv: any) => {
      if (activeTab === 'college_students') {
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
        
        const isOnline = isUserOnlineGlobal(conv.student_id);
        console.log('🔍 [Messages] Student online check:', {
          studentId: conv.student_id,
          studentName,
          isOnline,
          checkedWith: 'isUserOnlineGlobal'
        });
        
        return {
          id: conv.id,
          name: studentName,
          role: role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=7C3AED&color=fff`,
          lastMessage: conv.last_message_preview || 'No messages yet',
          online: isOnline,
          time: conv.last_message_at 
            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
            : 'No messages',
          unread: conv.college_educator_unread_count || 0,
          studentId: conv.student_id,
          subject: conv.subject,
          type: 'college_student'
        };
      } else {
        // College admin conversations
        console.log('🔍 [Messages] Processing college admin conversation:', conv);
        const adminName = conv.college?.name ? `${conv.college.name} Admin` : 'College Admin';
        const subject = conv.subject || 'General Discussion';
        
        // Use admin ID from conversation data or fallback to directly fetched admin ID
        const adminId = conv.college?.admin_id || collegeAdminId;
        const isOnline = isUserOnlineGlobal(adminId);
        
        console.log('🔍 [Messages] Admin online check:', {
          adminId,
          adminName,
          isOnline,
          checkedWith: 'isUserOnlineGlobal',
          conversationAdminId: conv.college?.admin_id,
          fallbackAdminId: collegeAdminId
        });
        
        const contact = {
          id: conv.id,
          name: adminName,
          role: subject,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=3B82F6&color=fff`,
          lastMessage: conv.last_message_preview || 'No messages yet',
          online: isOnline,
          time: conv.last_message_at 
            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
            : 'No messages',
          unread: conv.educator_unread_count || 0,
          adminId: adminId,
          subject: conv.subject,
          type: 'college_admin'
        };
        
        console.log('🔍 [Messages] Mapped college admin contact:', contact);
        return contact;
      }
    });

    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.role.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery, isUserOnlineGlobal, activeTab, collegeAdminId]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || !userAuthId) return;
    
    try {
      if (activeTab === 'college_students') {
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
      } else {
        // Send message to college admin
        await sendMessage({
          senderId: collegeLecturerRecordId,
          senderType: 'college_educator',
          receiverId: currentChat.adminId,
          receiverType: 'college_admin',
          messageText: messageInput,
          subject: currentChat.subject
        });
        
        // Send notification to admin
        try {
          await sendNotification(currentChat.adminId, {
            title: 'New Message from College Educator',
            message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
            type: 'message',
            link: `/college-admin/communication?tab=educators&conversation=${selectedConversationId}`
          });
        } catch (notifError) {
          // Silent fail
        }
      }
      
      setMessageInput('');
      setTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messageInput, currentChat, userAuthId, collegeLecturerRecordId, sendMessage, sendNotification, selectedConversationId, setTyping, activeTab]);

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
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {/* Messages Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-6">
        <div className="flex" style={{ height: 'calc(100vh - 180px)', minHeight: '650px' }}>
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
                      title={`Start new conversation with ${activeTab === 'college_students' ? 'college student' : 'college admin'}`}
                    >
                      {activeTab === 'college_students' ? (
                        <AcademicCapIcon className="w-4 h-4" />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                      New
                    </button>
                  )}
                  
                  {/* Tab Dropdown */}
                  <div className="relative" ref={tabDropdownRef}>
                    <button
                      onClick={() => setShowTabDropdown(!showTabDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors min-w-0"
                    >
                      {activeTab === 'college_students' ? (
                        <AcademicCapIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-blue-900 truncate">
                        {activeTab === 'college_students' ? 'Students' : 'Admin'}
                      </span>
                      {(activeTab === 'college_students' ? activeCollegeStudentConversations : activeCollegeAdminConversations).length > 0 && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {(activeTab === 'college_students' ? activeCollegeStudentConversations : activeCollegeAdminConversations).length}
                        </span>
                      )}
                      <ChevronDownIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showTabDropdown && (
                      <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            setActiveTab('college_students');
                            setShowTabDropdown(false);
                            setSelectedConversationId(null);
                            setShowArchived(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            activeTab === 'college_students' ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                          }`}
                        >
                          <AcademicCapIcon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">College Students</div>
                            <div className="text-xs text-gray-500 truncate">Course discussions</div>
                          </div>
                          {activeCollegeStudentConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {activeCollegeStudentConversations.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('college_admin');
                            setShowTabDropdown(false);
                            setSelectedConversationId(null);
                            setShowArchived(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-100 ${
                            activeTab === 'college_admin' ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                          }`}
                        >
                          <UserIcon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">College Admin</div>
                            <div className="text-xs text-gray-500 truncate">Administrative matters</div>
                          </div>
                          {activeCollegeAdminConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {activeCollegeAdminConversations.length}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'college_students' ? 'college student' : 'college admin'} conversations...`}
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
               !loadingConversations && 
               (activeTab === 'college_students' ? archivedCollegeStudentConversations : archivedCollegeAdminConversations).length > 0 && (
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
                        {(activeTab === 'college_students' ? archivedCollegeStudentConversations : archivedCollegeAdminConversations).length} conversation{(activeTab === 'college_students' ? archivedCollegeStudentConversations : archivedCollegeAdminConversations).length !== 1 ? 's' : ''}
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
                    {activeTab === 'college_students' ? (
                      <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {showArchived 
                      ? 'No archived conversations' 
                      : searchQuery 
                      ? `No conversations found for "${searchQuery}"` 
                      : activeTab === 'college_students'
                      ? 'No college student messages yet'
                      : 'No college admin messages yet'
                    }
                  </p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">
                    {showArchived 
                      ? 'Archived conversations will appear here' 
                      : searchQuery 
                      ? 'Try searching by name, subject, or message content' 
                      : activeTab === 'college_students'
                      ? 'College students will message you about courses and assignments'
                      : 'Start conversations with college administration'
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
                        {activeTab === 'college_students' ? 'Message College Student' : 'Message College Admin'}
                      </button>
                      <button
                        onClick={() => {
                          toast(activeTab === 'college_students' 
                            ? 'College students will initiate conversations with you from their Messages page'
                            : 'You can start conversations with college administration for academic matters', {
                            icon: 'ℹ️',
                            duration: 4000,
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        {activeTab === 'college_students' ? 'Waiting for College Students' : 'About Admin Communication'}
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
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 space-y-3" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        {activeTab === 'college_students' ? (
                          <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                        ) : (
                          <UserIcon className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      <p className="text-gray-600 font-semibold">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {activeTab === 'college_students' 
                          ? 'Start the conversation with your college student!'
                          : 'Start the conversation with college administration!'
                        }
                      </p>
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
                <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
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
                        placeholder={`Type your message to ${activeTab === 'college_students' ? 'college student' : 'college admin'}...`}
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
      {activeTab === 'college_students' && (
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
      )}

      {/* New College Educator Admin Conversation Modal */}
      {activeTab === 'college_admin' && (
        <NewCollegeEducatorAdminConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          educatorId={collegeLecturerRecordId}
          collegeId={collegeId}
          onCreateConversation={async ({ educatorId, collegeId: cId, adminId, subject, initialMessage }) => {
            try {
              console.log('🚀 Creating college educator-admin conversation:', { educatorId, collegeId: cId, adminId, subject, initialMessage });
              
              const conversation = await MessageService.getOrCreateCollegeEducatorAdminConversation(
                educatorId,
                cId,
                subject
              );
              console.log('✅ College educator-admin conversation created:', conversation);

              // Send the initial message if provided
              if (initialMessage && initialMessage.trim()) {
                await MessageService.sendMessage(
                  conversation.id,
                  educatorId,
                  'college_educator',
                  adminId,
                  'college_admin',
                  initialMessage.trim(),
                  null, // applicationId
                  null, // opportunityId
                  null, // classId
                  subject
                );
                console.log('✅ Initial message sent to college admin');
              }

              // Refetch conversations and select the new one
              await refetchActiveCollegeAdmin();
              setSelectedConversationId(conversation.id);
              
              toast.success('Conversation started with college admin!');
            } catch (error) {
              console.error('❌ Error creating college educator-admin conversation:', error);
              toast.error('Failed to start conversation with college admin');
            }
          }}
        />
      )}
    </div>
  );
};

export default CollegeLecturerMessages;