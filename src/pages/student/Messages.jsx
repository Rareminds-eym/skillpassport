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
  Users,
  GraduationCap
} from 'lucide-react';
import { useStudentConversations, useStudentMessages } from '../../hooks/useStudentMessages';
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
import NewEducatorConversationModal from '../../components/messaging/NewEducatorConversationModal';

const Messages = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');
  
  const [selectedConversationId, setSelectedConversationId] = useState(conversationIdFromUrl);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(null);
  // Read tab from URL parameter, default to recruiters
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'educators' ? 'educators' : 'recruiters');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, conversationId: null, contactName: '' });
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const messagesEndRef = useRef(null);
  const markedAsReadRef = useRef(new Set());
  const menuRef = useRef(null);
  
  // Get student data - same approach as Applications page
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: loadingStudentData } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id || user?.id;
  const studentName = studentData?.profile?.name || user?.name || 'Student';
  
  // Fetch recruiter conversations
  const { 
    conversations: recruiterConversations, 
    isLoading: loadingRecruiterConversations, 
    refetch: refetchRecruiterConversations,
    clearUnreadCount: clearRecruiterUnreadCount
  } = useStudentConversations(
    studentId,
    !!studentId && !loadingStudentData // Wait for studentData to load
  );

  // Fetch educator conversations
  const { 
    conversations: educatorConversations, 
    isLoading: loadingEducatorConversations, 
    refetch: refetchEducatorConversations,
    clearUnreadCount: clearEducatorUnreadCount
  } = useStudentEducatorConversations(
    studentId,
    !!studentId && !loadingStudentData
  );

  // Get current conversations and loading state based on active tab
  const conversations = activeTab === 'recruiters' ? recruiterConversations : educatorConversations;
  const loadingConversations = activeTab === 'recruiters' ? loadingRecruiterConversations : loadingEducatorConversations;
  const refetchConversations = activeTab === 'recruiters' ? refetchRecruiterConversations : refetchEducatorConversations;
  const clearUnreadCount = activeTab === 'recruiters' ? clearRecruiterUnreadCount : clearEducatorUnreadCount;
  
  // Force refetch on mount if we have a conversation ID in URL
  // This ensures we have fresh data when navigating from Applications page
  useEffect(() => {
    if (conversationIdFromUrl && studentId && !loadingStudentData) {
      console.log('🔄 URL has conversation ID, forcing fresh fetch...');
      refetchConversations();
    }
  }, []); // Empty deps - only run once on mount
  
  // Track if we've already handled this conversation URL to prevent loops
  const hasHandledConversationUrl = useRef(false);
  const retryAttempts = useRef(0);
  const MAX_RETRIES = 3;
  
  // Auto-select conversation from URL parameter with improved retry logic
  useEffect(() => {
    // Early exit conditions
    if (!conversationIdFromUrl || !studentId || loadingStudentData) {
      return;
    }
    
    // Prevent redundant processing of the same URL after successful selection
    if (hasHandledConversationUrl.current) {
      return;
    }
    
    // Check if conversation exists in current list
    const conversationExists = conversations.find(c => c.id === conversationIdFromUrl);
    
    if (conversationExists) {
      // Success! Conversation found
      console.log('✅ Conversation found in list:', conversationIdFromUrl);
      hasHandledConversationUrl.current = true;
      setSelectedConversationId(conversationIdFromUrl);
      retryAttempts.current = 0; // Reset retry counter
      
      // Clear URL parameter after selecting
      const timeoutId = setTimeout(() => {
        setSearchParams({});
      }, 100);
      return () => clearTimeout(timeoutId);
    } else if (!loadingConversations && retryAttempts.current < MAX_RETRIES) {
      // Conversation not found - try refetching with faster backoff
      // (Cache should be pre-populated from Applications page, so this is just a safety net)
      retryAttempts.current += 1;
      console.log(`⌛ Conversation not in list yet, retry attempt ${retryAttempts.current}/${MAX_RETRIES}...`);
      
      const delay = retryAttempts.current * 200; // 200ms, 400ms, 600ms (faster since cache is optimistic)
      const timeoutId = setTimeout(() => {
        refetchConversations();
      }, delay);
      
      return () => clearTimeout(timeoutId);
    } else if (retryAttempts.current >= MAX_RETRIES) {
      // Max retries reached - select anyway and let user see empty state
      console.warn('⚠️ Max retries reached, selecting conversation anyway:', conversationIdFromUrl);
      hasHandledConversationUrl.current = true;
      setSelectedConversationId(conversationIdFromUrl);
      retryAttempts.current = 0;
      
      const timeoutId = setTimeout(() => {
        setSearchParams({});
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [conversationIdFromUrl, conversations, studentId, loadingConversations, loadingStudentData, refetchConversations, setSearchParams]);
  
  // Reset handler when URL changes
  useEffect(() => {
    hasHandledConversationUrl.current = false;
    retryAttempts.current = 0; // Also reset retry counter for new URLs
  }, [conversationIdFromUrl]);

  // Handle tab changes from URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'educators' && activeTab !== 'educators') {
      setActiveTab('educators');
      setSelectedConversationId(null); // Clear selection when switching tabs
    } else if (tabFromUrl !== 'educators' && activeTab !== 'recruiters') {
      setActiveTab('recruiters');
      setSelectedConversationId(null); // Clear selection when switching tabs
    }
  }, [searchParams, activeTab]);
  
  // Debug logging - only when there's an issue
  useEffect(() => {
    if (!studentId && !loadingStudentData && userEmail) {
      console.warn("⚠️ No studentId found for email:", userEmail);
    }
  }, [studentId, loadingStudentData, userEmail]);
  
  // Fetch messages for selected conversation (works for both recruiter and educator)
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = activeTab === 'recruiters' 
    ? useStudentMessages({
        studentId,
        conversationId: selectedConversationId,
        enabled: !!selectedConversationId,
        enableRealtime: true
      })
    : useStudentEducatorMessages({
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
  
  // Delete mutation with proper optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      await MessageService.deleteConversationForUser(conversationId, studentId, 'student');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['student-conversations', studentId] });
      
      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(['student-conversations', studentId]);
      
      // Optimistically update: mark as deleted
      queryClient.setQueryData(['student-conversations', studentId], (old) => {
        if (!old) return [];
        return old.map(conv => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      // CRITICAL: Invalidate to trigger immediate re-render
      queryClient.invalidateQueries({ 
        queryKey: ['student-conversations', studentId],
        refetchType: 'none' // Don't refetch, just notify subscribers
      });
      
      console.log('🗑️ Marked conversation as deleted:', conversationId);
      
      return { previousConversations, conversationId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(['student-conversations', studentId], context.previousConversations);
      }
      toast.error('Failed to delete conversation');
    },
    onSuccess: (data, variables, context) => {
      // Immediately remove from cache - no need to wait
      // The _pendingDelete flag already hides it from UI
      // Just remove it from cache so it doesn't come back
      queryClient.setQueryData(['student-conversations', studentId], (old) => {
        if (!old) return [];
        return old.filter(conv => conv.id !== variables.conversationId);
      });
      
      // CRITICAL: Invalidate to ensure the query doesn't refetch from realtime updates
      // This prevents the deleted conversation from coming back
      queryClient.invalidateQueries({ 
        queryKey: ['student-conversations', studentId],
        refetchType: 'none' // Don't refetch, just notify
      });
      
      console.log('✅ Conversation permanently removed from cache:', variables.conversationId);
    }
  });
  
  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      await MessageService.restoreConversation(conversationId, studentId, 'student');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['student-conversations', studentId] });
      
      // Snapshot
      const previousConversations = queryClient.getQueryData(['student-conversations', studentId]);
      
      console.log('↩️ Attempting to restore conversation:', conversationId);
      
      return { previousConversations, conversationId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(['student-conversations', studentId], context.previousConversations);
      }
      toast.error('Failed to restore conversation');
    },
    onSuccess: () => {
      toast.success('Conversation restored');
      refetchConversations(); // Sync with DB
    }
  });
  
  // Mark messages as read when conversation is selected
  const markConversationAsRead = useCallback(async (conversationId, unreadCount) => {
    if (!studentId || !clearUnreadCount) return;
    
    const markKey = `${conversationId}-${unreadCount}`;
    
    // Prevent duplicate marking
    if (markedAsReadRef.current.has(markKey)) {
      return;
    }
    markedAsReadRef.current.add(markKey);
    
    // Optimistically clear the unread count immediately in UI (instant feedback)
    clearUnreadCount(conversationId);
    
    // Mark as read in database
    try {
      await MessageService.markConversationAsRead(conversationId, studentId);
    } catch (err) {
      console.error('❌ [Student] Failed to mark as read:', err);
      // Remove from marked set so it can be retried
      markedAsReadRef.current.delete(markKey);
      // Refetch to revert optimistic update
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
  
  // Transform conversations for display based on active tab
  const contacts = useMemo(() => {
    console.log('🔄 Recalculating contacts memo, conversations:', conversations.length, 'tab:', activeTab);
    
    // First filter out conversations marked for deletion
    const activeConversations = conversations.filter(conv => !conv._pendingDelete);
    
    // Debug logging
    const pendingCount = conversations.filter(c => c._pendingDelete).length;
    console.log(`📊 Conversations: ${conversations.length} total, ${pendingCount} pending delete, ${activeConversations.length} active`);
    
    if (pendingCount > 0) {
      const pendingIds = conversations.filter(c => c._pendingDelete).map(c => c.id);
      console.log('❌ Pending delete IDs:', pendingIds);
    }
    
    // Transform based on tab
    if (activeTab === 'recruiters') {
      // Recruiter conversations
      return activeConversations.map(conv => {
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
          opportunityId: conv.opportunity_id,
          type: 'recruiter'
        };
      });
    } else {
      // Educator conversations
      return activeConversations.map(conv => {
        const educator = conv.educator;
        const educatorName = educator?.first_name && educator?.last_name 
          ? `${educator.first_name} ${educator.last_name}`
          : educator?.email || 'Educator';
        
        // Get class and subject info
        const className = conv.school_class?.name || 'Class';
        const grade = conv.school_class?.grade || '';
        const section = conv.school_class?.section || '';
        const subject = conv.subject || 'General';
        
        // Build role string
        let role = subject;
        if (className && grade) {
          role += ` • ${grade}`;
          if (section) {
            role += `-${section}`;
          }
        }
        
        // Generate avatar URL
        const avatar = educator?.photo_url || 
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
          classId: conv.class_id,
          subject: conv.subject,
          type: 'educator'
        };
      });
    }
  }, [conversations, globalOnlineUsers, isUserOnlineGlobal, activeTab]);
  
  // Filter contacts based on search only (pending deletes already filtered)
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts; // No search, return all
    
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
        if (activeTab === 'recruiters') {
          // Send message to recruiter
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
            // Silent fail
          }
        } else {
          // Send message to educator
          await sendMessage({
            senderId: studentId,
            senderType: 'student',
            receiverId: currentChat.educatorId,
            receiverType: 'educator',
            messageText: messageInput,
            classId: currentChat.classId,
            subject: currentChat.subject
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

  // Auto-scroll to bottom when new messages arrive (with debounce for performance)
  useEffect(() => {
    if (!messages.length) return;
    
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Use requestAnimationFrame for better performance
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

  // Close menu when clicking outside (memoized handler)
  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(null);
    }
  }, []);
  
  useEffect(() => {
    // Only add listener when menu is open for better performance
    if (showMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, handleClickOutside]);

  // Handle delete conversation using mutation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !studentId) return;
    
    const conversationId = deleteModal.conversationId;
    const contactName = deleteModal.contactName;
    
    // Clear selection if deleting current conversation
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
    
    // Close modal immediately for snappy UX
    setDeleteModal({ isOpen: false, conversationId: null, contactName: '' });
    
    // Trigger the mutation (handles optimistic update, API call, and timeout)
    deleteMutation.mutate({ conversationId });
    
    // Show undo toast
    const UndoToastComponent = ({ t, conversationId, contactName }) => {
      const [displayTime, setDisplayTime] = React.useState(5);
      const startTimeRef = React.useRef(Date.now());
      const rafIdRef = React.useRef(null);
      const progressRef = React.useRef(null);

      React.useEffect(() => {
        let lastUpdate = 0;
        let isMounted = true;
        const THROTTLE_MS = 50;

        const animate = (timestamp) => {
          if (!isMounted) return;

          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          
          if (timestamp - lastUpdate >= THROTTLE_MS) {
            const remaining = Math.max(0, 5 - elapsed);
            const currentProgress = (remaining / 5) * 100;

            if (isMounted) {
              setDisplayTime(remaining);
            }

            if (progressRef.current) {
              const offset = (1 - currentProgress / 100) * 97.4;
              progressRef.current.style.strokeDashoffset = String(offset);
            }

            lastUpdate = timestamp;
          }

          if (isMounted && elapsed < 5) {
            rafIdRef.current = requestAnimationFrame(animate);
          }
        };

        rafIdRef.current = requestAnimationFrame(animate);

        return () => {
          isMounted = false;
          if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
        };
      }, []);

      const handleUndo = () => {
        toast.dismiss(t.id);
        // Trigger undo mutation
        undoMutation.mutate({ conversationId });
      };

      return (
        <div className="flex items-center gap-4 min-w-[380px] max-w-[420px]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0 w-11 h-11">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-gray-200" strokeWidth="2.5" />
                <circle
                  ref={progressRef}
                  cx="18" cy="18" r="15.5" fill="none"
                  className="stroke-green-500"
                  strokeWidth="2.5"
                  strokeDasharray="97.4"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold text-green-600 tabular-nums w-3 text-center">
                  {Math.ceil(displayTime)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <p className="font-semibold text-[15px] text-gray-900 leading-tight">Conversation deleted</p>
              <p className="text-[13px] text-gray-500 mt-1 truncate">with {contactName}</p>
            </div>
          </div>
          <button
            onClick={handleUndo}
            className="flex-shrink-0 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-[15px] font-semibold rounded-xl shadow-sm hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            Undo
          </button>
        </div>
      );
    };
    
    toast.success(
      (t) => (
        <UndoToastComponent
          t={t}
          conversationId={conversationId}
          contactName={contactName}
        />
      ),
      {
        duration: 5000,
        position: 'bottom-center',
        style: {
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
        icon: null,
      }
    );
  }, [deleteModal.conversationId, deleteModal.contactName, studentId, selectedConversationId, deleteMutation, undoMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId, contactName, e) => {
    e?.stopPropagation(); // Prevent triggering conversation selection
    setShowMenu(null);
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);
  
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
        {/* Header with Tabs */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => {
                setActiveTab('recruiters');
                setSelectedConversationId(null);
                setSearchParams({}); // Clear tab parameter for recruiters (default)
                setSearchParams(prev => ({ ...prev, tab: 'recruiters' }));
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'recruiters'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Recruiters
              {recruiterConversations.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {recruiterConversations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('educators');
                setSelectedConversationId(null);
                setSearchParams({ tab: 'educators' });
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'educators'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Educators
              {educatorConversations.length > 0 && (
                <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                  {educatorConversations.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'recruiters' ? 'recruiter' : 'educator'} conversations...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${
                activeTab === 'recruiters' ? 'focus:ring-red-500' : 'focus:ring-green-500'
              } focus:border-transparent text-sm`}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              {activeTab === 'recruiters' ? (
                <>
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No recruiter conversations yet</p>
                  <p className="text-gray-400 text-xs mt-2">Start by applying to jobs!</p>
                </>
              ) : (
                <>
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No educator conversations yet</p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">Message your teachers about classes!</p>
                  <button
                    onClick={() => setShowNewConversationModal(true)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Start New Conversation
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`relative group flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 ${
                selectedConversationId === contact.id 
                  ? (activeTab === 'recruiters' ? 'bg-red-50' : 'bg-green-50')
                  : ''
              }`}
              style={{
                animation: 'fadeInSlide 0.2s ease-out'
              }}
            >
              <div 
                className="flex items-start gap-3 flex-1"
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
                  <p className={`text-xs mb-1 truncate font-medium ${
                    activeTab === 'recruiters' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {contact.role}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && (
                      <span className={`flex-shrink-0 ml-2 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        activeTab === 'recruiters' ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions on Hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Delete Button - Direct action */}
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
                
                {/* Archive Button - Can add if needed */}
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Archive action
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  title="Archive conversation"
                >
                  <Archive className="w-4 h-4 text-gray-600" />
                </button> */}
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
                          ? (activeTab === 'recruiters' ? 'bg-red-500 text-white' : 'bg-green-500 text-white')
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        message.sender === 'me' 
                          ? (activeTab === 'recruiters' ? 'text-red-100' : 'text-green-100')
                          : 'text-gray-500'
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
                  className={`p-2.5 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors ${
                    activeTab === 'recruiters' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
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
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                activeTab === 'recruiters' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {activeTab === 'recruiters' ? (
                  <Send className="w-12 h-12 text-red-500" />
                ) : (
                  <GraduationCap className="w-12 h-12 text-green-500" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 text-sm">
                {activeTab === 'recruiters' 
                  ? 'Choose from your recruiter conversations or start a new one'
                  : 'Choose from your educator conversations or start a new one'
                }
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

      {/* New Educator Conversation Modal */}
      <NewEducatorConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        studentId={studentId}
        onConversationCreated={async ({ educatorId, classId, subject, initialMessage }) => {
          try {
            console.log('🚀 Creating conversation with:', { educatorId, classId, subject, initialMessage });
            const conversation = await MessageService.getOrCreateStudentEducatorConversation(
              studentId,
              educatorId,
              classId,
              subject
            );
            console.log('✅ Conversation created:', conversation);
            
            // Send the initial message
            if (initialMessage && initialMessage.trim()) {
              await MessageService.sendStudentEducatorMessage(
                conversation.id,
                studentId,
                initialMessage.trim()
              );
              console.log('✅ Initial message sent');
            }
            
            // First refetch conversations to get the new conversation in the list
            await refetchConversations();
            
            // Then set the conversation ID (this ensures currentChat will be found)
            setSelectedConversationId(conversation.id);
            
            // Force a small delay to ensure UI updates
            setTimeout(() => {
              console.log('📝 Conversation should now be selected:', conversation.id);
            }, 100);
            
            toast.success('Conversation started and message sent!');
          } catch (error) {
            console.error('❌ Error creating conversation:', error);
            
            // More specific error messages
            let errorMessage = 'Failed to start conversation';
            if (error.message) {
              if (error.message.includes('conversation')) {
                errorMessage = 'Could not create conversation with educator';
              } else if (error.message.includes('message')) {
                errorMessage = 'Conversation created but message failed to send';
              } else if (error.message.includes('permission') || error.message.includes('auth')) {
                errorMessage = 'You do not have permission to message this educator';
              } else {
                errorMessage = `Error: ${error.message}`;
              }
            }
            
            toast.error(errorMessage);
          }
        }}
      />
    </div>
  );
};

export default Messages;

