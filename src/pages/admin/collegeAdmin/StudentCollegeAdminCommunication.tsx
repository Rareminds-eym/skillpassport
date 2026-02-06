import {
    AcademicCapIcon,
    ArchiveBoxIcon,
    ArrowUturnLeftIcon,
    ChatBubbleLeftRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    EllipsisVerticalIcon,
    FaceSmileIcon,
    MagnifyingGlassIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    PhoneIcon,
    TrashIcon,
    UserGroupIcon,
    UserIcon,
    VideoCameraIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import DeleteConversationModal from '../../../components/messaging/DeleteConversationModal';
import NewStudentConversationModalCollegeAdmin from '../../../components/messaging/NewStudentConversationModalCollegeAdmin';
import NewCollegeAdminEducatorConversationModal from '../../../components/messaging/NewCollegeAdminEducatorConversationModal';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useGlobalPresence } from '../../../context/GlobalPresenceContext';
import { useCollegeAdminMessages } from '../../../hooks/useCollegeAdminMessages.js';
import { useCollegeEducatorAdminConversationsForAdmin } from '../../../hooks/useCollegeEducatorAdminConversations.js';
import { useCollegeEducatorAdminMessagesForAdmin } from '../../../hooks/useCollegeEducatorAdminMessages.js';
import { useNotificationBroadcast } from '../../../hooks/useNotificationBroadcast';
import { useRealtimePresence } from '../../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../../hooks/useTypingIndicator';
import { supabase } from '../../../lib/supabaseClient';
import MessageService, { Conversation } from '../../../services/messageService';

const StudentCollegeAdminCommunication = () => {
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
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const tabDropdownRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false); // Local ref to prevent duplicate sends
  
  // Tab management - students and college educators
  const [activeTab, setActiveTab] = useState<'students' | 'college_educators'>('students');
  
  // Get college admin ID from auth
  const { user } = useAuth();
  const collegeAdminId = user?.id;
  const collegeAdminName = user?.name || 'College Admin';
  const queryClient = useQueryClient();
  
  // Handle navigation from student management page
  const targetStudent = location.state as { 
    targetStudentId?: string; 
    targetStudentName?: string; 
    targetStudentEmail?: string; 
  } | null;
  
  // Get college ID for the current admin
  const { data: collegeData } = useQuery({
    queryKey: ['college-admin-college', collegeAdminId],
    queryFn: async () => {
      if (!collegeAdminId) return null;
      
      // Try college_lecturers table first
      // Note: colleges table doesn't exist - fetch college name from organizations separately
      const { data: lecturerData, error: lecturerError } = await supabase
        .from('college_lecturers')
        .select('collegeId')
        .or(`user_id.eq.${collegeAdminId},userId.eq.${collegeAdminId}`)
        .single();
      
      if (!lecturerError && lecturerData?.collegeId) {
        // Fetch college name from organizations table
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', lecturerData.collegeId)
          .maybeSingle();
        
        return {
          college_id: lecturerData.collegeId,
          colleges: orgData
        };
      }
      
      // Fallback: check organizations table for college owner
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('organization_type', 'college')
        .eq('admin_id', collegeAdminId)
        .maybeSingle();
      
      if (orgError) throw orgError;
      
      return {
        college_id: orgData?.id,
        colleges: orgData
      };
    },
    enabled: !!collegeAdminId,
  });
  
  const collegeId = collegeData?.college_id;
  
  // Fetch active conversations with students
  const { data: activeConversations = [], isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['college-admin-conversations', collegeId, 'active'],
    queryFn: async () => {
      if (!collegeId) return [];
      // Note: colleges table doesn't exist - college info already available from collegeData
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          student:students(id, name, email, university, branch_field)
        `)
        .eq('college_id', collegeId)
        .eq('conversation_type', 'student_college_admin')
        .eq('deleted_by_college_admin', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      
      // Add college info from collegeData
      return (data || []).map(conv => ({
        ...conv,
        college: collegeData?.colleges || null
      }));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived conversations
  const { data: archivedConversations = [], isLoading: loadingArchived, refetch: refetchArchived } = useQuery({
    queryKey: ['college-admin-conversations', collegeId, 'archived'],
    queryFn: async () => {
      if (!collegeId) return [];
      // Note: colleges table doesn't exist - college info already available from collegeData
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          student:students(id, name, email, university, branch_field)
        `)
        .eq('college_id', collegeId)
        .eq('conversation_type', 'student_college_admin')
        .eq('status', 'archived')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      
      // Add college info from collegeData
      return (data || []).map(conv => ({
        ...conv,
        college: collegeData?.colleges || null
      }));
    },
    enabled: !!collegeId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch active college educator conversations
  const { conversations: activeEducatorConversations = [], isLoading: loadingActiveEducators, refetch: refetchActiveEducators } = useCollegeEducatorAdminConversationsForAdmin({
    adminId: collegeAdminId,
    collegeId: collegeId,
    includeArchived: false,
    enabled: !!collegeAdminId && !!collegeId,
  });

  // Fetch archived college educator conversations
  const { conversations: archivedEducatorConversations = [], isLoading: loadingArchivedEducators, refetch: refetchArchivedEducators } = useCollegeEducatorAdminConversationsForAdmin({
    adminId: collegeAdminId,
    collegeId: collegeId,
    includeArchived: true,
    enabled: !!collegeAdminId && !!collegeId,
  });

  // Get current conversations based on active tab and archived state
  const conversations = useMemo(() => {
    if (activeTab === 'students') {
      return showArchived ? archivedConversations : activeConversations;
    } else {
      return showArchived ? archivedEducatorConversations : activeEducatorConversations;
    }
  }, [activeTab, showArchived, archivedConversations, activeConversations, archivedEducatorConversations, activeEducatorConversations]);

  const loadingConversations = useMemo(() => {
    if (activeTab === 'students') {
      return showArchived ? loadingArchived : loadingActive;
    } else {
      return showArchived ? loadingArchivedEducators : loadingActiveEducators;
    }
  }, [activeTab, showArchived, loadingArchived, loadingActive, loadingArchivedEducators, loadingActiveEducators]);
  
  // Fetch messages for selected conversation - use appropriate hook based on tab
  const studentMessages = useCollegeAdminMessages({
    conversationId: activeTab === 'students' ? selectedConversationId : null,
    enabled: !!selectedConversationId && activeTab === 'students',
  });

  const educatorMessages = useCollegeEducatorAdminMessagesForAdmin({
    conversationId: activeTab === 'college_educators' ? selectedConversationId : null,
    adminId: collegeAdminId,
    enabled: !!selectedConversationId && activeTab === 'college_educators' && !!collegeAdminId,
  });

  // Use the appropriate messages based on active tab
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = activeTab === 'students' ? studentMessages : educatorMessages;

  // Use shared global presence context
  const { isUserOnline: isUserOnlineGlobal } = useGlobalPresence();
  
  // Debug presence system
  useEffect(() => {
    console.log('🔍 [CollegeAdmin] Global presence system loaded');
    console.log('🔍 [CollegeAdmin] isUserOnlineGlobal function:', typeof isUserOnlineGlobal);
  }, [isUserOnlineGlobal]);

  // Presence tracking for current conversation
  const { } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: collegeAdminId || '',
      userName: collegeAdminName,
      userType: 'college_admin',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined
    },
    enabled: !!selectedConversationId && !!collegeAdminId
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: collegeAdminId || '',
    currentUserName: collegeAdminName,
    enabled: !!selectedConversationId && !!collegeAdminId
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: collegeAdminId || '',
    showToast: true,
    enabled: !!collegeAdminId
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
    if (!collegeId) return;
    
    const subscription = MessageService.subscribeToUserConversations(
      collegeId,
      'college_admin',
      (conversation: Conversation) => {
        // Handle both student and educator conversations
        if (conversation.conversation_type === 'student_college_admin') {
          console.log('🔄 [College Admin] Student conversation UPDATE:', conversation);
          
          if (conversation.deleted_by_college_admin) {
            console.log('❌ [College Admin] Ignoring deleted student conversation:', conversation.id);
            return;
          }
          
          queryClient.invalidateQueries({ 
            queryKey: ['college-admin-conversations', collegeId, 'active'],
            refetchType: 'active'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['college-admin-conversations', collegeId, 'archived'],
            refetchType: 'active'
          });
        } else if (conversation.conversation_type === 'college_educator_admin') {
          console.log('🔄 [College Admin] Educator conversation UPDATE:', conversation);
          
          if (conversation.deleted_by_college_admin) {
            console.log('❌ [College Admin] Ignoring deleted educator conversation:', conversation.id);
            return;
          }
          
          queryClient.invalidateQueries({ 
            queryKey: ['college-educator-admin-conversations', collegeAdminId, 'college_admin', collegeId],
            refetchType: 'active'
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [collegeId, queryClient, collegeAdminId]);
  
  // Auto-create conversation with target student from navigation
  useEffect(() => {
    const createConversationWithStudent = async () => {
      if (!targetStudent?.targetStudentId || !collegeId || loadingConversations) {
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
        const conversation = await MessageService.getOrCreateStudentCollegeAdminConversation(
          targetStudent.targetStudentId,
          collegeId,
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
  }, [targetStudent, collegeId, activeConversations, loadingConversations, refetchActive]);
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !collegeAdminId) return;
    
    const conversation = activeConversations.find(c => c.id === selectedConversationId);
    const hasUnread = (conversation?.college_admin_unread_count || 0) > 0;
    
    if (!hasUnread) return;
    
    const markKey = `${selectedConversationId}-${conversation?.college_admin_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);
    
    // Optimistically update the UI
    queryClient.setQueryData<typeof activeConversations>(
      ['college-admin-conversations', collegeId, 'active'],
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === selectedConversationId 
            ? { ...conv, college_admin_unread_count: 0 }
            : conv
        );
      }
    );
    
    MessageService.markConversationAsRead(selectedConversationId, collegeAdminId)
      .then(() => {
        // Force cache invalidation after successful mark as read
        queryClient.invalidateQueries({ 
          queryKey: ['college-admin-conversations', collegeId, 'active'],
          refetchType: 'active'
        });
      })
      .catch(err => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
        refetchActive();
      });
  }, [selectedConversationId, collegeAdminId, activeConversations, queryClient, refetchActive, collegeId]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, collegeAdminId!, 'college_admin');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['college-admin-conversations', collegeId] });
      
      const previousActive = queryClient.getQueryData(['college-admin-conversations', collegeId, 'active']);
      const previousArchived = queryClient.getQueryData(['college-admin-conversations', collegeId, 'archived']);
      
      queryClient.setQueryData(['college-admin-conversations', collegeId, 'active'], (old: any) => {
        if (!old) return [];
        return old.map((conv: any) => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['college-admin-conversations', collegeId, 'active'],
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
      queryClient.setQueryData(['college-admin-conversations', collegeId, 'active'], (old: any) => {
        if (!old) return [];
        return old.filter((conv: any) => conv.id !== variables.conversationId);
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['college-admin-conversations', collegeId, 'active'],
        refetchType: 'none'
      });
    }
  });
  
  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.restoreConversation(conversationId, collegeAdminId!, 'college_admin');
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

  // Handle new conversation creation
  const handleNewConversation = useCallback(async (studentId: string, subject: string, initialMessage?: string) => {
    if (!collegeId) return;
    
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
      const conversation = await MessageService.getOrCreateStudentCollegeAdminConversation(
        studentId,
        collegeId,
        subject
      );
      
      console.log('✅ New conversation created:', conversation);
      
      // Send initial message if provided
      if (initialMessage && initialMessage.trim()) {
        await MessageService.sendMessage(
          conversation.id,
          collegeAdminId!,
          'college_admin',
          studentId,
          'student',
          initialMessage.trim(),
          null, // applicationId
          null, // opportunityId
          null, // classId
          subject
        );
        console.log('✅ Initial message sent to student');
      }
      
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
  }, [collegeId, activeConversations, refetchActive, collegeAdminId]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !collegeAdminId) return;
    
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
  }, [deleteModal.conversationId, deleteModal.contactName, collegeAdminId, selectedConversationId, deleteMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId: string, contactName: string) => {
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);
  
  // Transform and filter conversations
  const filteredContacts = useMemo(() => {
    console.log('🔍 [CollegeAdmin] Processing conversations for activeTab:', activeTab);
    console.log('🔍 [CollegeAdmin] Raw conversations:', conversations);
    
    const activeConversations = conversations.filter((conv: any) => !conv._pendingDelete);
    console.log('🔍 [CollegeAdmin] Active conversations after filtering:', activeConversations);

    const contacts = activeConversations.map((conv: any) => {
      if (activeTab === 'students') {
        // Student conversations
        const studentName = conv.student?.name || conv.student?.email || 'Student';
        const studentEmail = conv.student?.email || '';
        const studentUniversity = conv.student?.university || '';
        const studentBranch = conv.student?.branch_field || '';
        const subject = conv.subject || 'General Discussion';
        const collegeName = conv.college?.name || '';
        
        // Build simplified role string with just subject and college name
        let role = subject;
        if (collegeName) {
          role += ` • ${collegeName}`;
        }
        
        const isOnline = isUserOnlineGlobal(conv.student_id);
        console.log('🔍 [CollegeAdmin] Student online check:', {
          studentId: conv.student_id,
          studentName,
          isOnline,
          checkedWith: 'isUserOnlineGlobal'
        });
        
        return {
          id: conv.id,
          name: studentName,
          role: role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=3B82F6&color=fff`,
          lastMessage: conv.last_message_preview || 'No messages yet',
          online: isOnline,
          time: conv.last_message_at 
            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
            : 'No messages',
          unread: conv.college_admin_unread_count || 0,
          studentId: conv.student_id,
          subject: conv.subject,
          type: 'student',
          // Additional searchable fields (for search functionality)
          studentEmail: studentEmail,
          university: studentUniversity,
          branch: studentBranch,
          collegeName: collegeName,
        };
      } else {
        // College educator conversations
        console.log('🔍 [CollegeAdmin] Processing college educator conversation:', conv);
        
        const educatorName = conv.college_educator?.first_name && conv.college_educator?.last_name 
          ? `${conv.college_educator.first_name} ${conv.college_educator.last_name}`
          : conv.college_educator?.email || 'College Educator';
        const educatorEmail = conv.college_educator?.email || '';
        const department = conv.college_educator?.department || '';
        const specialization = conv.college_educator?.specialization || '';
        const subject = conv.subject || 'General Discussion';
        
        // Build role string with department and specialization
        let role = subject;
        if (department) {
          role += ` • ${department}`;
        }
        if (specialization) {
          role += ` (${specialization})`;
        }
        
        const isOnline = isUserOnlineGlobal(conv.college_educator?.user_id);
        console.log('🔍 [CollegeAdmin] Educator online check:', {
          educatorId: conv.educator_id,
          educatorUserId: conv.college_educator?.user_id,
          educatorName,
          isOnline,
          checkedWith: 'isUserOnlineGlobal(college_educator.user_id)',
          note: 'Fixed: Using user_id instead of educator_id for presence check',
          conversationData: conv.college_educator
        });
        
        return {
          id: conv.id,
          name: educatorName,
          role: role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(educatorName)}&background=3B82F6&color=fff`,
          lastMessage: conv.last_message_preview || 'No messages yet',
          online: isOnline,
          time: conv.last_message_at 
            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
            : 'No messages',
          unread: conv.college_admin_unread_count || 0,
          educatorId: conv.educator_id,
          subject: conv.subject,
          type: 'college_educator',
          // Additional searchable fields
          educatorEmail: educatorEmail,
          department: department,
          specialization: specialization,
        };
      }
    });

    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      // Basic info
      c.name.toLowerCase().includes(query) || 
      // Subject info
      c.role.toLowerCase().includes(query) ||
      c.subject.toLowerCase().includes(query) ||
      // Message content
      c.lastMessage.toLowerCase().includes(query) ||
      // Type-specific fields
      (c.type === 'student' && (
        c.studentEmail.toLowerCase().includes(query) ||
        c.university.toLowerCase().includes(query) ||
        c.branch.toLowerCase().includes(query) ||
        c.collegeName.toLowerCase().includes(query)
      )) ||
      (c.type === 'college_educator' && (
        c.educatorEmail.toLowerCase().includes(query) ||
        c.department.toLowerCase().includes(query) ||
        c.specialization.toLowerCase().includes(query)
      ))
    );
  }, [conversations, searchQuery, isUserOnlineGlobal, activeTab]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!messageInput.trim() || !currentChat || !collegeAdminId) {
      return;
    }
    
    // Check if already sending
    if (isSending || isSendingRef.current) {
      console.log('⚠️ Already sending message, ignoring duplicate call');
      return;
    }
    
    // Set ref to prevent duplicate calls
    isSendingRef.current = true;
    
    // Store the message text before clearing
    const messageToSend = messageInput.trim();
    
    // Clear input immediately
    setMessageInput('');
    
    try {
      if (activeTab === 'students') {
        // Send message to student
        await sendMessage({
          senderId: collegeAdminId,
          senderType: 'college_admin',
          receiverId: currentChat.studentId,
          receiverType: 'student',
          messageText: messageToSend,
          subject: currentChat.subject
        });
        
        // Send notification to student
        try {
          await sendNotification(currentChat.studentId, {
            title: 'New Message from College Admin',
            message: messageToSend.length > 50 ? messageToSend.substring(0, 50) + '...' : messageToSend,
            type: 'message',
            link: `/student/messages?tab=college_admin&conversation=${selectedConversationId}`
          });
        } catch (notifError) {
          // Silent fail
        }
      } else {
        // Send message to college educator
        await sendMessage({
          senderId: collegeAdminId,
          senderType: 'college_admin',
          receiverId: currentChat.educatorId,
          receiverType: 'college_educator',
          messageText: messageToSend,
          subject: currentChat.subject
        });
        
        // Send notification to educator
        try {
          await sendNotification(currentChat.educatorId, {
            title: 'New Message from College Admin',
            message: messageToSend.length > 50 ? messageToSend.substring(0, 50) + '...' : messageToSend,
            type: 'message',
            link: `/educator/messages?tab=college_admin&conversation=${selectedConversationId}`
          });
        } catch (notifError) {
          // Silent fail
        }
      }
      
      setTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error (unless it was a duplicate)
      if (error.message !== 'DUPLICATE_MESSAGE') {
        setMessageInput(messageToSend);
      }
    } finally {
      // Reset ref after a delay
      setTimeout(() => {
        isSendingRef.current = false;
      }, 500);
    }
  }, [messageInput, currentChat, collegeAdminId, sendMessage, sendNotification, selectedConversationId, setTyping, activeTab, isSending]);

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
      sender: msg.sender_type === 'college_admin' ? 'me' : 'them',
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
      <h1 className="text-2xl font-bold mb-0">Messages</h1>

      {/* Student Messages Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-6">
        <div className="flex h-[calc(100vh-200px)] min-h-[600px]">
          {/* Left Panel - Contacts List */}
          <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col">
            {/* Search Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                
                <div className="flex items-center gap-3 ml-4">
                  {/* New Button */}
                  {!showArchived && (
                    <button
                      onClick={() => setShowNewConversationModal(true)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      title={`Start new conversation with ${activeTab === 'students' ? 'student' : 'college educator'}`}
                    >
                      {activeTab === 'students' ? (
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
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      {activeTab === 'students' ? (
                        <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm font-medium text-blue-900">
                        {activeTab === 'students' ? 'Students' : 'College Educators'}
                      </span>
                      {(activeTab === 'students' ? activeConversations : activeEducatorConversations).length > 0 && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {(activeTab === 'students' ? activeConversations : activeEducatorConversations).length}
                        </span>
                      )}
                      <ChevronDownIcon className="w-4 h-4 text-blue-600" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showTabDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setActiveTab('students');
                            setShowTabDropdown(false);
                            setSelectedConversationId(null);
                            setShowArchived(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            activeTab === 'students' ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                          }`}
                        >
                          <AcademicCapIcon className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="font-medium">Students</div>
                            <div className="text-xs text-gray-500">Student communications</div>
                          </div>
                          {activeConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                              {activeConversations.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('college_educators');
                            setShowTabDropdown(false);
                            setSelectedConversationId(null);
                            setShowArchived(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-100 ${
                            activeTab === 'college_educators' ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                          }`}
                        >
                          <UserIcon className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="font-medium">College Educators</div>
                            <div className="text-xs text-gray-500">Faculty communications</div>
                          </div>
                          {activeEducatorConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                              {activeEducatorConversations.length}
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
                  placeholder={`Search ${activeTab === 'students' ? 'student' : 'college educator'} conversations...`}
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
               (activeTab === 'students' ? archivedConversations : archivedEducatorConversations).length > 0 && (
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
                        {(activeTab === 'students' ? archivedConversations : archivedEducatorConversations).length} conversation{(activeTab === 'students' ? archivedConversations : archivedEducatorConversations).length !== 1 ? 's' : ''}
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
                      ? 'Try searching by student name, email, subject, or university' 
                      : 'Students will message you about college matters'
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
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
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
                <div className="px-6 py-4 border-t border-gray-200 bg-white">
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
                            e.stopPropagation(); // Stop event from bubbling to form
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message..."
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
                      disabled={!messageInput.trim() || isSending || isSendingRef.current}
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
                      title="Send"
                    >
                      {(isSending || isSendingRef.current) ? (
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
                    Choose a conversation from the list to start messaging with students
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

      {/* New Student Conversation Modal */}
      {activeTab === 'students' && (
        <NewStudentConversationModalCollegeAdmin
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={({ studentId, subject, initialMessage }) => {
            handleNewConversation(studentId, subject, initialMessage);
          }}
          collegeId={collegeId}
        />
      )}

      {/* New College Educator Conversation Modal */}
      {activeTab === 'college_educators' && (
        <NewCollegeAdminEducatorConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          adminId={collegeAdminId}
          collegeId={collegeId}
          onCreateConversation={async ({ adminId, educatorId, collegeId: cId, subject, initialMessage }) => {
            try {
              console.log('🚀 Creating college admin-educator conversation:', { adminId, educatorId, collegeId: cId, subject, initialMessage });
              
              const conversation = await MessageService.getOrCreateCollegeEducatorAdminConversation(
                educatorId,
                cId,
                subject
              );
              console.log('✅ College admin-educator conversation created:', conversation);

              // Send the initial message if provided
              if (initialMessage && initialMessage.trim()) {
                await MessageService.sendMessage(
                  conversation.id,
                  adminId,
                  'college_admin',
                  educatorId,
                  'college_educator',
                  initialMessage.trim(),
                  null, // applicationId
                  null, // opportunityId
                  null, // classId
                  subject
                );
                console.log('✅ Initial message sent to college educator');
              }

              // Refetch conversations and select the new one
              await refetchActiveEducators();
              setSelectedConversationId(conversation.id);
              
              toast.success('Conversation started with college educator!');
            } catch (error) {
              console.error('❌ Error creating college admin-educator conversation:', error);
              toast.error('Failed to start conversation with college educator');
            }
          }}
        />
      )}
    </div>
  );
};

export default StudentCollegeAdminCommunication;
