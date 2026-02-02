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
  ShieldCheckIcon,
  ChevronDownIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import MessageService, { Conversation } from '../../services/messageService';
import { useEducatorMessages } from '../../hooks/useEducatorMessages.js';
import { useEducatorAdminMessages } from '../../hooks/useEducatorAdminMessages.js';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';
import NewStudentConversationModalEducator from '../../components/messaging/NewStudentConversationModalEducator';
import NewEducatorAdminConversationModal from '../../components/messaging/NewEducatorAdminConversationModal';
import { supabase } from '../../lib/supabaseClient';

const Communication = () => {
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
  const [showNewAdminConversationModal, setShowNewAdminConversationModal] = useState(false);
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const tabDropdownRef = useRef<HTMLDivElement>(null);
  
  // Tab management
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => {
    if (tabFromUrl && ['students', 'admin'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'students'; // Default to students
  });
  
  // Get educator ID from auth
  const { user } = useAuth();
  console.log('🔍 Raw user object from auth:', user);
  const userId = user?.id;

  console.log('🔍 Final userId value:', userId);
  const educatorName = user?.name || 'Educator';
  const queryClient = useQueryClient();
  
  // Handle navigation from student management page
  const targetStudent = location.state as { 
    targetStudentId?: string; 
    targetStudentName?: string; 
    targetStudentEmail?: string; 
  } | null;
  
  // Get educator details and school ID
  const { data: educatorData } = useQuery({
    queryKey: ['educator-details', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      console.log('🔍 Querying educator details with email:', user.email);
      console.log('🔍 Auth user ID from session:', userId);
      
      // First try with the auth user ID
      let { data, error } = await supabase
        .from('school_educators')
        .select('id, school_id, first_name, last_name, email, user_id')
        .eq('user_id', userId)
        .single();
      
      // If not found with auth user ID, try with email
      if (error && error.code === 'PGRST116') {
        console.log('🔄 Auth user ID not found, trying with email:', user.email);
        const result = await supabase
          .from('school_educators')
          .select('id, school_id, first_name, last_name, email, user_id')
          .eq('email', user.email)
          .single();
        
        data = result.data;
        error = result.error;
        
        if (data) {
          console.log('⚠️ Found educator by email but user_id mismatch:');
          console.log('  - Auth user ID:', userId);
          console.log('  - Database user_id:', data.user_id);
        }
      }
      
      if (error) {
        console.error('❌ Error fetching educator details:', error);
        throw error;
      }
      console.log('✅ Educator details found:', data);
      return data;
    },
    enabled: !!user?.email,
  });
  
  // Define userAuthId after educatorData is available
  // CRITICAL: Always use the database user_id for presence tracking, not the auth ID
  const userAuthId = educatorData?.user_id; // Use database user_id for presence consistency
  
  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('🔍 [AUTH-DEBUG] Current user from auth:', {
        id: user.id,
        email: user.email,
        name: user.name
      });
      console.log('🔍 [AUTH-DEBUG] userId variable (from auth):', userId);
      console.log('🔍 [AUTH-DEBUG] userAuthId variable (corrected):', userAuthId);
      console.log('🔍 [AUTH-DEBUG] educatorData:', educatorData);
      
      if (educatorData) {
        console.log('🔍 [AUTH-DEBUG] Database vs Auth ID comparison:', {
          auth_user_id: userId,
          database_user_id: educatorData.user_id,
          school_educators_record_id: educatorData.id,
          using_for_presence: userAuthId
        });
      }
    }
  }, [user, userId, userAuthId, educatorData]);
  
  const schoolId = educatorData?.school_id;
  const educatorRecordId = educatorData?.id;
  
  // Use the correct IDs for different contexts
  const educatorId = educatorRecordId; // For conversation operations (needs school_educators.id)
  
  // Fetch active student conversations
  const { data: activeStudentConversations = [], isLoading: loadingActiveStudents, refetch: refetchActiveStudents } = useQuery({
    queryKey: ['educator-conversations', educatorRecordId, 'active'],
    queryFn: async () => {
      if (!educatorRecordId) return [];
      console.log('🔍 Fetching student conversations for educator record ID:', educatorRecordId);
      const allConversations = await MessageService.getUserConversations(educatorRecordId, 'educator', false);
      const studentConversations = allConversations.filter(conv => conv.conversation_type === 'student_educator');
      console.log('📚 Found student conversations:', studentConversations.length);
      return studentConversations;
    },
    enabled: !!educatorRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived student conversations
  const { data: archivedStudentConversations = [], isLoading: loadingArchivedStudents, refetch: refetchArchivedStudents } = useQuery({
    queryKey: ['educator-conversations', educatorRecordId, 'archived'],
    queryFn: async () => {
      if (!educatorRecordId) return [];
      const allConversations = await MessageService.getUserConversations(educatorRecordId, 'educator', true);
      return allConversations.filter(conv => 
        conv.conversation_type === 'student_educator' && conv.status === 'archived'
      );
    },
    enabled: !!educatorRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch active admin conversations
  const { data: activeAdminConversations = [], isLoading: loadingActiveAdmin, refetch: refetchActiveAdmin } = useQuery({
    queryKey: ['educator-admin-conversations', educatorRecordId, 'active'],
    queryFn: async () => {
      console.log('🔍 [EDUCATOR-ADMIN-CONVERSATIONS] === FETCH DEBUG START ===');
      console.log('📋 Educator Record ID:', educatorRecordId);
      
      if (!educatorRecordId) {
        console.log('❌ No educator record ID, returning empty array');
        return [];
      }
      
      console.log('📤 Executing query for active admin conversations...');
      
      // 1. Get conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('educator_id', educatorRecordId)
        .eq('conversation_type', 'educator_admin')
        .eq('deleted_by_educator', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      console.log('📥 Admin conversations query result:', { conversations, error, dataLength: conversations?.length });
      
      if (error) {
        console.error('❌ Admin conversations query error:', error);
        throw error;
      }
      
      if (!conversations || conversations.length === 0) {
        console.log('✅ No admin conversations found, returning empty array');
        console.log('🔍 [EDUCATOR-ADMIN-CONVERSATIONS] === FETCH DEBUG END ===');
        return [];
      }
      
      // 2. Get school admin user IDs for online status
      const schoolIds = conversations.map(c => c.school_id).filter(Boolean);
      console.log('📋 School IDs to fetch admin user IDs for:', schoolIds);
      
      if (schoolIds.length === 0) {
        console.log('✅ No school IDs found, returning conversations without admin user IDs');
        console.log('🔍 [EDUCATOR-ADMIN-CONVERSATIONS] === FETCH DEBUG END ===');
        return conversations;
      }
      
      const { data: schoolAdmins, error: adminError } = await supabase
        .from('school_educators')
        .select('school_id, user_id')
        .in('school_id', schoolIds)
        .eq('role', 'school_admin');
      
      console.log('📥 School admins query result:', { schoolAdmins, adminError, adminsLength: schoolAdmins?.length });
      
      if (adminError) {
        console.error('❌ School admins query error:', adminError);
        // Return conversations without admin user IDs rather than failing completely
        return conversations;
      }
      
      // 3. Merge the data
      const conversationsWithAdminIds = conversations.map(conv => ({
        ...conv,
        school_admin_user_id: schoolAdmins?.find(admin => admin.school_id === conv.school_id)?.user_id || null
      }));
      
      console.log('✅ Final admin conversations with admin user IDs:', conversationsWithAdminIds);
      console.log('🔍 [EDUCATOR-ADMIN-CONVERSATIONS] === FETCH DEBUG END ===');
      return conversationsWithAdminIds;
    },
    enabled: !!educatorRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived admin conversations
  const { data: archivedAdminConversations = [], isLoading: loadingArchivedAdmin, refetch: refetchArchivedAdmin } = useQuery({
    queryKey: ['educator-admin-conversations', educatorRecordId, 'archived'],
    queryFn: async () => {
      console.log('🔍 [EDUCATOR-ARCHIVED-ADMIN-CONVERSATIONS] === FETCH DEBUG START ===');
      console.log('📋 Educator Record ID:', educatorRecordId);
      
      if (!educatorRecordId) {
        console.log('❌ No educator record ID, returning empty array');
        return [];
      }
      
      console.log('📤 Executing query for archived admin conversations...');
      
      // 1. Get conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('educator_id', educatorRecordId)
        .eq('conversation_type', 'educator_admin')
        .eq('status', 'archived')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      console.log('📥 Archived admin conversations query result:', { conversations, error, dataLength: conversations?.length });
      
      if (error) {
        console.error('❌ Archived admin conversations query error:', error);
        throw error;
      }
      
      if (!conversations || conversations.length === 0) {
        console.log('✅ No archived admin conversations found, returning empty array');
        console.log('🔍 [EDUCATOR-ARCHIVED-ADMIN-CONVERSATIONS] === FETCH DEBUG END ===');
        return [];
      }
      
      // 2. Get school admin user IDs for online status
      const schoolIds = conversations.map(c => c.school_id).filter(Boolean);
      console.log('�  Archived school IDs to fetch admin user IDs for:', schoolIds);
      
      if (schoolIds.length === 0) {
        console.log('✅ No archived school IDs found, returning conversations without admin user IDs');
        console.log('🔍 [EDUCATOR-ARCHIVED-ADMIN-CONVERSATIONS] === FETCH DEBUG END ===');
        return conversations;
      }
      
      const { data: schoolAdmins, error: adminError } = await supabase
        .from('school_educators')
        .select('school_id, user_id')
        .in('school_id', schoolIds)
        .eq('role', 'school_admin');
      
      console.log('📥 Archived school admins query result:', { schoolAdmins, adminError, adminsLength: schoolAdmins?.length });
      
      if (adminError) {
        console.error('❌ Archived school admins query error:', adminError);
        // Return conversations without admin user IDs rather than failing completely
        return conversations;
      }
      
      // 3. Merge the data
      const conversationsWithAdminIds = conversations.map(conv => ({
        ...conv,
        school_admin_user_id: schoolAdmins?.find(admin => admin.school_id === conv.school_id)?.user_id || null
      }));
      
      console.log('✅ Final archived admin conversations with admin user IDs:', conversationsWithAdminIds);
      console.log('🔍 [EDUCATOR-ARCHIVED-ADMIN-CONVERSATIONS] === FETCH DEBUG END ===');
      return conversationsWithAdminIds;
    },
    enabled: !!educatorRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Debug logging - placed after all useQuery hooks
  useEffect(() => {
    if (educatorData) {
      console.log('👨‍🏫 Educator data:', {
        id: educatorData.id,
        school_id: educatorData.school_id,
        name: `${educatorData.first_name} ${educatorData.last_name}`,
        user_id_from_auth: userId,
        educator_record_id: educatorRecordId,
        educatorId_for_conversations: educatorId
      });
    }
  }, [educatorData, userId, educatorRecordId, educatorId]);

  useEffect(() => {
    console.log('💬 Active admin conversations:', activeAdminConversations?.length || 0);
    activeAdminConversations?.forEach(conv => {
      console.log(`  - ID: ${conv.id}, Subject: ${conv.subject}, School: ${conv.school?.name}`);
    });
  }, [activeAdminConversations]);

  // Get current conversations based on active tab and archived state
  const conversations = activeTab === 'students' 
    ? (showArchived ? archivedStudentConversations : activeStudentConversations)
    : activeTab === 'admin'
    ? (showArchived ? archivedAdminConversations : activeAdminConversations)
    : [];
    
  const loadingConversations = activeTab === 'students'
    ? (showArchived ? loadingArchivedStudents : loadingActiveStudents)
    : activeTab === 'admin'
    ? (showArchived ? loadingArchivedAdmin : loadingActiveAdmin)
    : false;
    
  const refetchConversations = activeTab === 'students'
    ? (showArchived ? refetchArchivedStudents : refetchActiveStudents)
    : activeTab === 'admin'
    ? (showArchived ? refetchArchivedAdmin : refetchActiveAdmin)
    : () => Promise.resolve();
  
  // Fetch messages for selected conversation - call all hooks unconditionally
  const studentMessages = useEducatorMessages({
    conversationId: activeTab === 'students' ? selectedConversationId : null,
    enabled: activeTab === 'students' && !!selectedConversationId,
  });

  const adminMessages = useEducatorAdminMessages({
    conversationId: activeTab === 'admin' ? selectedConversationId : null,
    enabled: activeTab === 'admin' && !!selectedConversationId,
  });

  // Select the appropriate messages based on active tab
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = 
    activeTab === 'students' ? studentMessages : 
    activeTab === 'admin' ? adminMessages :
    { messages: [], isLoading: false, sendMessage: async () => {}, isSending: false };

  // Use shared global presence context
  const { isUserOnline: isUserOnlineGlobal, onlineUsers: globalOnlineUsers } = useGlobalPresence();
// ADD THIS DEBUG LOG HERE:
console.log('🔍 [EDUCATOR] GlobalPresence Debug:', {
  isUserOnlineGlobal: typeof isUserOnlineGlobal,
  globalOnlineUsers: globalOnlineUsers,
  currentUserId: educatorId,
  currentUserName: educatorName
});
  // Presence tracking for current conversation
  const { } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: userAuthId || '',
      userName: educatorName,
      userType: 'educator',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined
    },
    enabled: !!selectedConversationId && !!userAuthId && !!educatorData
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: userAuthId || '',
    currentUserName: educatorName,
    enabled: !!selectedConversationId && !!userAuthId && !!educatorData
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: userAuthId || '',
    showToast: true,
    enabled: !!userAuthId && !!educatorData
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

  // Handle tab changes from URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const newTab = tabFromUrl === 'admin' ? 'admin' : 'students';
    
    if (newTab !== activeTab) {
      console.log('🔄 Tab switching from', activeTab, 'to', newTab);
      setIsTabSwitching(true);
      setActiveTab(newTab);
      setSelectedConversationId(null);
      
      // Force fetch data for the new tab
      if (educatorId) {
        console.log('🚀 Triggering fetch for new tab:', newTab);
        
        let fetchPromise = Promise.resolve();
        
        if (newTab === 'students' && refetchActiveStudents) {
          fetchPromise = refetchActiveStudents();
        } else if (newTab === 'admin' && refetchActiveAdmin) {
          fetchPromise = refetchActiveAdmin();
        }
        
        fetchPromise.finally(() => {
          setTimeout(() => setIsTabSwitching(false), 300);
        });
      } else {
        setIsTabSwitching(false);
      }
    }
  }, [searchParams, activeTab, educatorId, refetchActiveStudents, refetchActiveAdmin]);

  // Handle new conversation creation
  const handleNewConversation = useCallback(async (studentId: string, subject: string) => {
    if (!educatorId) {
      console.error('❌ No educatorId available for conversation creation');
      toast.error('Unable to create conversation - educator not found');
      return;
    }
    
    try {
      // Create new conversation
      console.log('🆕 Creating new conversation with student:', studentId, 'subject:', subject);
      console.log('🔍 Using educatorId for conversation:', educatorId, 'type:', typeof educatorId);
      
      // Check if conversation already exists
      const existingConversation = (activeTab === 'students' ? activeStudentConversations : activeAdminConversations).find(conv => 
        activeTab === 'students' ? conv.student_id === studentId : conv.educator_id === studentId
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
      await (activeTab === 'students' ? refetchActiveStudents() : refetchActiveAdmin());
      
      // Select the new conversation
      setSelectedConversationId(conversation.id);
      setShowNewConversationModal(false);
      
      toast.success('New conversation started');
      
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  }, [educatorId, activeStudentConversations, activeAdminConversations, refetchActiveStudents, refetchActiveAdmin, activeTab]);

  // Handle new admin conversation creation
  const handleNewAdminConversation = useCallback(async ({ schoolId, subject, initialMessage }: { schoolId: string; subject: string; initialMessage: string }) => {
    if (!educatorId || !educatorRecordId) return;
    
    try {
      console.log('🆕 Creating new conversation with school admin:', { schoolId, subject });
      
      // Check if conversation already exists
      const existingConversation = activeAdminConversations.find(conv => 
        conv.school_id === schoolId && conv.subject === subject
      );
      
      if (existingConversation) {
        console.log('✅ Found existing conversation:', existingConversation.id);
        setSelectedConversationId(existingConversation.id);
        setShowNewAdminConversationModal(false);
        toast.success('Opened existing conversation');
        return;
      }
      
      // Create new conversation
      const conversation = await MessageService.getOrCreateEducatorAdminConversation(
        educatorRecordId,
        schoolId,
        subject
      );
      
      console.log('✅ New admin conversation created:', conversation);
      
      // Send the initial message
      if (initialMessage.trim()) {
        // First, find the school admin user ID
        const { data: schoolAdmin, error: adminError } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('school_id', schoolId)
          .eq('role', 'school_admin')
          .single();
        
        if (adminError || !schoolAdmin) {
          console.warn('Could not find school admin for initial message');
        } else {
          await MessageService.sendMessage(
            conversation.id,
            userAuthId,
            'educator',
            schoolAdmin.user_id,
            'educator', // School admin is also an educator
            initialMessage
          );
        }
      }
      
      // Refresh conversations to include the new one
      await refetchActiveAdmin();
      
      // Switch to admin tab and select the new conversation
      setActiveTab('admin');
      setSearchParams({ tab: 'admin' }, { replace: true });
      setSelectedConversationId(conversation.id);
      setShowNewAdminConversationModal(false);
      
      toast.success('New conversation started with school administration');
      
    } catch (error) {
      console.error('❌ Error creating admin conversation:', error);
      toast.error('Failed to start conversation with school administration');
    }
  }, [educatorId, educatorRecordId, activeAdminConversations, refetchActiveAdmin, setSearchParams]);

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
          queryKey: ['educator-conversations', educatorRecordId, 'active'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['educator-conversations', educatorRecordId, 'archived'],
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
        const existingConversation = activeStudentConversations.find(conv => 
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
        await refetchActiveStudents();
        
        // Select the new conversation
        setSelectedConversationId(conversation.id);
        
        toast.success(`Started conversation with ${targetStudent.targetStudentName}`);
        
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        toast.error(`Failed to start conversation with ${targetStudent.targetStudentName}`);
      }
    };

    createConversationWithStudent();
  }, [targetStudent, educatorId, activeStudentConversations, loadingConversations, refetchActiveStudents]);
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !educatorId) return;
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    const hasUnread = (conversation?.educator_unread_count || 0) > 0;
    
    if (!hasUnread) return;
    
    const markKey = `${selectedConversationId}-${conversation?.educator_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);
    
    // Optimistically update the UI
    queryClient.setQueryData<typeof conversations>(
      activeTab === 'students' 
        ? ['educator-conversations', educatorRecordId, 'active']
        : ['educator-admin-conversations', educatorRecordId, 'active'],
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
      .then(() => {
        // Force cache invalidation after successful mark as read
        queryClient.invalidateQueries({ 
          queryKey: activeTab === 'students' 
            ? ['educator-conversations', educatorRecordId, 'active']
            : ['educator-admin-conversations', educatorRecordId, 'active'],
          refetchType: 'active'
        });
      })
      .catch(err => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
        refetchConversations();
      });
  }, [selectedConversationId, educatorId, conversations, queryClient, refetchConversations, activeTab, educatorRecordId]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, educatorId!, 'educator');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['educator-conversations', educatorRecordId] });
      
      const previousActive = queryClient.getQueryData(['educator-conversations', educatorRecordId, 'active']);
      const previousArchived = queryClient.getQueryData(['educator-conversations', educatorRecordId, 'archived']);
      
      queryClient.setQueryData(['educator-conversations', educatorRecordId, 'active'], (old: any) => {
        if (!old) return [];
        return old.map((conv: any) => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['educator-conversations', educatorRecordId, 'active'],
        refetchType: 'none'
      });
      
      return { previousActive, previousArchived, conversationId };
    },
    onError: () => {
      toast.error('Failed to delete conversation');
      refetchConversations();
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(['educator-conversations', educatorRecordId, 'active'], (old: any) => {
        if (!old) return [];
        return old.filter((conv: any) => conv.id !== variables.conversationId);
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['educator-conversations', educatorRecordId, 'active'],
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
      refetchConversations();
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
        activeTab === 'students' 
          ? (showArchived ? refetchArchivedStudents() : refetchActiveStudents())
          : (showArchived ? refetchArchivedAdmin() : refetchActiveAdmin())
      ]);
    } catch (error) {
      console.error(`Error ${isArchiving ? 'archiving' : 'unarchiving'} conversation:`, error);
      refetchConversations();
    } finally {
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [selectedConversationId, refetchConversations, activeTab, showArchived, refetchArchivedStudents, refetchActiveStudents, refetchArchivedAdmin, refetchActiveAdmin]);

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
      if (activeTab === 'students') {
        // Student conversations
        const studentName = conv.student?.name || conv.student?.email || 'Student';
        const studentUniversity = conv.student?.university || '';
        const studentBranch = conv.student?.branch_field || '';
        // ADD THIS DEBUG LOG HERE:
console.log('🔍 Checking online for student:', {
  student_id: conv.student_id,
  student_user_id: conv.student?.id,
  online_users: globalOnlineUsers
});
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
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=3B82F6&color=fff`,
          lastMessage: conv.last_message_preview || 'No messages yet',
          // online: isUserOnlineGlobal(conv.student_id),
          online: isUserOnlineGlobal(conv.student?.id || conv.student_id),
          time: conv.last_message_at 
            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
            : 'No messages',
          unread: conv.educator_unread_count || 0,
          studentId: conv.student_id,
          classId: conv.class_id,
          subject: conv.subject,
          type: 'student'
        };
      } else {
        // Admin conversations
        console.log('🔄 Processing admin conversation:', {
          conv_id: conv.id,
          school_id: conv.school_id,
          school_admin_user_id: conv.school_admin_user_id,
          subject: conv.subject
        });
        
        // Get school name from organizations table
        const schoolName = 'School Administration'; // Default fallback
        const subject = conv.subject || 'General Discussion';
        
        console.log('📋 Admin data extracted:', {
          schoolName,
          subject,
          school_admin_user_id: conv.school_admin_user_id,
          online_status: isUserOnlineGlobal(conv.school_admin_user_id)
        });
        
        return {
          id: conv.id,
          name: schoolName,
          role: `School Administration • ${subject}`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolName)}&background=3B82F6&color=fff`,
          lastMessage: conv.last_message_preview || 'No messages yet',
          online: isUserOnlineGlobal(conv.school_admin_user_id),
          time: conv.last_message_at 
            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
            : 'No messages',
          unread: conv.educator_unread_count || 0,
          schoolId: conv.school_id,
          subject: conv.subject,
          type: 'admin'
        };
      }
    });

    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.role.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery, isUserOnlineGlobal, globalOnlineUsers, activeTab]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || !userAuthId) return;
    
    try {
      if (activeTab === 'students') {
        // Send message to student
        await sendMessage({
          senderId: userAuthId,
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
      } else {
        // Send message to school admin
        // Find school admin user ID for the school
        const { data: schoolAdmin, error: adminError } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('school_id', currentChat.schoolId)
          .eq('role', 'school_admin')
          .single();
        
        if (adminError || !schoolAdmin) {
          toast.error('Could not find school admin');
          return;
        }

        await sendMessage({
          senderId: userAuthId,
          senderType: 'educator',
          receiverId: schoolAdmin.user_id,
          receiverType: 'educator', // School admin is also an educator
          messageText: messageInput,
          subject: currentChat.subject
        });
        
        // Send notification to school admin
        try {
          await sendNotification(schoolAdmin.user_id, {
            title: 'New Message from Educator',
            message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
            type: 'message',
            link: `/admin/school/educator-communication?conversation=${selectedConversationId}`
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
  }, [messageInput, currentChat, userAuthId, sendMessage, sendNotification, selectedConversationId, setTyping, activeTab]);

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

      {/* Messages Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-6">
        <div className="flex" style={{ height: 'calc(110vh - 205px)' }}>
          {/* Left Panel - Contacts List */}
          <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col">
            {/* Header with Tabs */}
            <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                
                <div className="flex items-center gap-3 ml-4">
                  {/* New Button - Show for Students tab */}
                  {activeTab === 'students' && !showArchived && (
                    <button
                      onClick={() => setShowNewConversationModal(true)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      title="Start new conversation with student"
                    >
                      <AcademicCapIcon className="w-4 h-4" />
                      New
                    </button>
                  )}
                  
                  {/* New Button - Show for Admin tab */}
                  {activeTab === 'admin' && !showArchived && (
                    <button
                      onClick={() => setShowNewAdminConversationModal(true)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      title="Start new conversation with school admin"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      New
                    </button>
                  )}
                  
                  {/* Tab Dropdown */}
                  <div className="relative" ref={tabDropdownRef}>
                    <button
                      onClick={() => setShowTabDropdown(!showTabDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {activeTab === 'students' && (
                          <>
                            <UserGroupIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">Students</span>
                            {activeStudentConversations.length > 0 && (
                              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                                {activeStudentConversations.length}
                              </span>
                            )}
                          </>
                        )}
                        {activeTab === 'admin' && (
                          <>
                            <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">School Admin</span>
                            {activeAdminConversations.length > 0 && (
                              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                                {activeAdminConversations.length}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showTabDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showTabDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          {/* Students Tab */}
                          <button
                            onClick={async () => {
                              console.log('🔄 Switching to students tab');
                              setIsTabSwitching(true);
                              setActiveTab('students');
                              setSelectedConversationId(null);
                              setSearchParams({ tab: 'students' }, { replace: true });
                              setShowTabDropdown(false);
                              
                              // Force refetch for students tab
                              if (educatorId && refetchActiveStudents) {
                                console.log('🚀 Refetching student conversations');
                                try {
                                  await refetchActiveStudents();
                                } finally {
                                  setTimeout(() => setIsTabSwitching(false), 300);
                                }
                              } else {
                                setIsTabSwitching(false);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <UserGroupIcon className={`w-4 h-4 ${activeTab === 'students' ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div className="flex-1">
                              <div className="font-medium">Students</div>
                              <div className="text-xs text-gray-500">Class and assignment messages</div>
                            </div>
                            {activeStudentConversations.length > 0 && (
                              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                                {activeStudentConversations.length}
                              </span>
                            )}
                          </button>
                          
                          {/* School Admin Tab */}
                          <button
                            onClick={async () => {
                              console.log('🔄 Switching to admin tab');
                              setIsTabSwitching(true);
                              setActiveTab('admin');
                              setSelectedConversationId(null);
                              setSearchParams({ tab: 'admin' }, { replace: true });
                              setShowTabDropdown(false);
                              
                              // Force refetch for admin tab
                              if (educatorRecordId && refetchActiveAdmin) {
                                console.log('🚀 Refetching admin conversations');
                                try {
                                  await refetchActiveAdmin();
                                } finally {
                                  setTimeout(() => setIsTabSwitching(false), 300);
                                }
                              } else {
                                setIsTabSwitching(false);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              activeTab === 'admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <ShieldCheckIcon className={`w-4 h-4 ${activeTab === 'admin' ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div className="flex-1">
                              <div className="font-medium">School Admin</div>
                              <div className="text-xs text-gray-500">School administration messages</div>
                            </div>
                            {activeAdminConversations.length > 0 && (
                              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                                {activeAdminConversations.length}
                              </span>
                            )}
                          </button>
                        </div>
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
                  placeholder={`Search ${activeTab === 'students' ? 'student' : 'admin'} conversations...`}
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
               !(activeTab === 'students' ? loadingArchivedStudents : loadingArchivedAdmin) && 
               (activeTab === 'students' ? archivedStudentConversations : archivedAdminConversations).length > 0 && (
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
                        {(activeTab === 'students' ? archivedStudentConversations : archivedAdminConversations).length} conversation{(activeTab === 'students' ? archivedStudentConversations : archivedAdminConversations).length !== 1 ? 's' : ''}
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
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {activeTab === 'students' ? (
                      <UserGroupIcon className="w-8 h-8 text-gray-400" />
                    ) : (
                      <ShieldCheckIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {showArchived 
                      ? 'No archived conversations' 
                      : searchQuery 
                      ? `No conversations found for "${searchQuery}"` 
                      : activeTab === 'students' 
                      ? 'No student messages yet'
                      : 'No admin messages yet'
                    }
                  </p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">
                    {showArchived 
                      ? 'Archived conversations will appear here' 
                      : searchQuery 
                      ? `Try searching by ${activeTab === 'students' ? 'student name, email, class, subject, or message content' : 'subject or message content'}` 
                      : activeTab === 'students'
                      ? 'Students will message you about classes'
                      : 'Start conversations with school administration'
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
                  {!showArchived && !searchQuery && activeTab === 'students' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
                  {!showArchived && !searchQuery && activeTab === 'admin' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowNewAdminConversationModal(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ShieldCheckIcon className="w-4 h-4" />
                        Contact School Admin
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
                  {/* <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Voice Call">
                      <PhoneIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Video Call">
                      <VideoCameraIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="More">
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                    </button>
                  </div> */}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
                    {/* <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      title="Attach file"
                    >
                      <PaperClipIcon className="w-5 h-5 text-gray-500" />
                    </button> */}
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
                        placeholder={`Type your message to ${activeTab === 'students' ? 'student' : 'school admin'}...`}
                        className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white transition-all"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '100px' }}
                      />
                      {/* <button
                        type="button"
                        className="absolute right-3 bottom-2.5 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="Emoji"
                      >
                        <FaceSmileIcon className="w-5 h-5 text-gray-400" />
                      </button> */}
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
                    Choose a conversation from the list to start messaging with {activeTab === 'students' ? 'students' : 'school administration'}
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
        {/* <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Announcements</h2>
          <p className="text-sm text-gray-600 mb-4">Send announcements to entire classes</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Coming Soon
          </button>
        </div> */}

        {/* Feedback System */}
        {/* <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Feedback</h2>
          <p className="text-sm text-gray-600 mb-4">Provide feedback on student activities</p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            Coming Soon
          </button>
        </div> */}
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
        educatorId={userAuthId} // Pass the user_id for student fetching
        schoolId={schoolId} // Pass school_id directly to avoid complex lookups
      />

      {/* New Admin Conversation Modal */}
      <NewEducatorAdminConversationModal
        isOpen={showNewAdminConversationModal}
        onClose={() => setShowNewAdminConversationModal(false)}
        onConversationCreated={handleNewAdminConversation}
        educatorId={userAuthId} // Pass the user_id for consistency
      />
    </div>
  );
};

export default Communication;
