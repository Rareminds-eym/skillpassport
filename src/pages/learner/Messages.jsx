import { useAuthStore } from '@/shared/model/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  GraduationCap,
  Loader2,
  Search,
  Send,
  Trash2,
  Users
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { DeleteConversationModal } from '@/features/messaging';
import { NewEducatorConversationModal } from '@/features/messaging';
import { NewAdminConversationModal } from '@/features/messaging';
import { NewCollegeAdminConversationModal } from '@/features/college-admin';

import { useGlobalPresence } from '@/shared/model/globalPresenceStore';
import { useNotificationBroadcast } from '@/features/broadcast';
import { useRealtimePresence } from '@/shared/lib/hooks';
import { useLearnerMessages } from '@/features/learner-profile';
import { useLearnerDataByEmail } from '@/entities/learner';
import { useLearnerConversations } from '@/entities/learner';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('Messages');
import { useLearnerEducatorConversations, useLearnerEducatorMessages } from '@/entities/learner';
import { useLearnerAdminConversations, useLearnerAdminMessages } from '@/entities/learner';
import { useLearnerCollegeAdminConversations, useLearnerCollegeAdminMessages } from '@/entities/learner';
import { useTypingIndicator } from '@/features/messaging';
import { apiPost } from '@/shared/api/apiClient';
import MessageService from '@/shared/api/messageService';

import { useUser } from '@/shared/model/authStore';
const Messages = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');

  const [selectedConversationId, setSelectedConversationId] = useState(conversationIdFromUrl);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUserIds, setAdminUserIds] = useState({});
  const [showMenu, setShowMenu] = useState(null);
  // Read tab from URL parameter, default based on available tabs
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => {
    // If tab is specified in URL, use it (will be validated later)
    if (tabFromUrl && ['recruiters', 'educators', 'admin', 'college_admin'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    // Default to recruiters (always available)
    return 'recruiters';
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, conversationId: null, contactName: '' });
  const [showNewEducatorConversationModal, setShowNewEducatorConversationModal] = useState(false);
  const [showNewAdminConversationModal, setShowNewAdminConversationModal] = useState(false);
  const [showNewCollegeAdminConversationModal, setShowNewCollegeAdminConversationModal] = useState(false);
  const [showNewEducatorDropdown, setShowNewEducatorDropdown] = useState(false);
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const newEducatorDropdownRef = useRef(null);
  const messagesEndRef = useRef(null);
  const markedAsReadRef = useRef(new Set());
  const menuRef = useRef(null);
  const tabDropdownRef = useRef(null);

  // Get learner data - same approach as Applications page
  const user = useUser();
  const userEmail = (useAuthStore.getState().user?.email || localStorage.getItem("userEmail")) || user?.email;
  const { learnerData, loading: loadinglearnerData } = useLearnerDataByEmail(userEmail);
  // Use learner's user_id for creating conversations (references learners.user_id in FK)
  const learnerIdForConversations = learnerData?.users?.id || user?.id;
  // Default learnerId for backward compatibility with existing code
  const learnerId = learnerIdForConversations;
  const learnerName = learnerData?.profile?.name || user?.name || 'Learner';

  // Determine available tabs based on learner's school_id and university_college_id
  const hasSchoolId = !!learnerData?.school_id;
  const hasCollegeId = !!learnerData?.university_college_id;

  // Available tabs logic:
  // - Recruiters: Always available
  // - Educators: Available for school/college learners
  // - School Admin: Only if learner has school_id
  // - College Admin: Only if learner has university_college_id
  const availableTabs = useMemo(() => {
    const tabs = ['recruiters'];

    if (hasSchoolId || hasCollegeId) {
      tabs.push('educators');
    }

    if (hasSchoolId) {
      tabs.push('admin'); // school admin
    }

    if (hasCollegeId) {
      tabs.push('college_admin');
    }

    return tabs;
  }, [hasSchoolId, hasCollegeId]);

  // Ensure activeTab is valid for current learner
  useEffect(() => {
    if (!loadinglearnerData && availableTabs.length > 0) {
      // If current activeTab is not available, switch to first available tab
      if (!availableTabs.includes(activeTab)) {
        logger.info('Current tab not available, switching to first available', { newTab: availableTabs[0] });
        setActiveTab(availableTabs[0]);
        setSearchParams({ tab: availableTabs[0] }, { replace: true });
      }
    }
  }, [activeTab, availableTabs, loadinglearnerData, setSearchParams]);

  // Fetch recruiter conversations
  const {
    conversations: recruiterConversations,
    isLoading: loadingRecruiterConversations,
    refetch: refetchRecruiterConversations,
    clearUnreadCount: clearRecruiterUnreadCount
  } = useLearnerConversations(
    learnerId,
    !!learnerId && !loadinglearnerData // Wait for learnerData to load
  );

  // Fetch educator conversations
  const {
    conversations: educatorConversations,
    isLoading: loadingEducatorConversations,
    refetch: refetchEducatorConversations,
    clearUnreadCount: clearEducatorUnreadCount
  } = useLearnerEducatorConversations(
    learnerId,
    !!learnerId && !loadinglearnerData
  );

  // Fetch admin conversations
  const {
    conversations: adminConversations,
    isLoading: loadingAdminConversations,
    refetch: refetchAdminConversations,
    clearUnreadCount: clearAdminUnreadCount
  } = useLearnerAdminConversations(
    learnerId,
    !!learnerId && !loadinglearnerData
  );

  // Fetch college admin conversations
  const {
    conversations: collegeAdminConversations,
    isLoading: loadingCollegeAdminConversations,
    refetch: refetchCollegeAdminConversations,
    clearUnreadCount: clearCollegeAdminUnreadCount
  } = useLearnerCollegeAdminConversations(
    learnerId,
    !!learnerId && !loadinglearnerData
  );

  // Get current conversations and loading state based on active tab
  const conversations = activeTab === 'recruiters' ? (recruiterConversations || []) :
    activeTab === 'educators' ? (educatorConversations || []) :
      activeTab === 'admin' ? (adminConversations || []) :
        activeTab === 'college_admin' ? (collegeAdminConversations || []) :
          [];
  const loadingConversations = activeTab === 'recruiters' ? loadingRecruiterConversations :
    activeTab === 'educators' ? loadingEducatorConversations :
      activeTab === 'admin' ? loadingAdminConversations :
        activeTab === 'college_admin' ? loadingCollegeAdminConversations :
          false;
  const refetchConversations = activeTab === 'recruiters' ? refetchRecruiterConversations :
    activeTab === 'educators' ? refetchEducatorConversations :
      activeTab === 'admin' ? refetchAdminConversations :
        activeTab === 'college_admin' ? refetchCollegeAdminConversations :
          () => { };
  const clearUnreadCount = activeTab === 'recruiters' ? clearRecruiterUnreadCount :
    activeTab === 'educators' ? clearEducatorUnreadCount :
      activeTab === 'admin' ? clearAdminUnreadCount :
        activeTab === 'college_admin' ? clearCollegeAdminUnreadCount :
          () => { };

  // Force refetch on mount if we have a conversation ID in URL
  // This ensures we have fresh data when navigating from Applications page
  useEffect(() => {
    if (conversationIdFromUrl && learnerId && !loadinglearnerData) {
      logger.debug('URL has conversation ID, forcing fresh fetch', { conversationId: conversationIdFromUrl });
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
    if (!conversationIdFromUrl || !learnerId || loadinglearnerData) {
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
      logger.info('Conversation found in list', { conversationId: conversationIdFromUrl });
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
      logger.debug('Conversation not in list yet, retrying', { attempt: retryAttempts.current, max: MAX_RETRIES });

      const delay = retryAttempts.current * 200; // 200ms, 400ms, 600ms (faster since cache is optimistic)
      const timeoutId = setTimeout(() => {
        refetchConversations();
      }, delay);

      return () => clearTimeout(timeoutId);
    } else if (retryAttempts.current >= MAX_RETRIES) {
      // Max retries reached - select anyway and let user see empty state
      logger.warn('Max retries reached, selecting conversation anyway', { conversationId: conversationIdFromUrl });
      hasHandledConversationUrl.current = true;
      setSelectedConversationId(conversationIdFromUrl);
      retryAttempts.current = 0;

      const timeoutId = setTimeout(() => {
        setSearchParams({});
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [conversationIdFromUrl, conversations, learnerId, loadingConversations, loadinglearnerData, refetchConversations, setSearchParams]);

  // Reset handler when URL changes
  useEffect(() => {
    hasHandledConversationUrl.current = false;
    retryAttempts.current = 0; // Also reset retry counter for new URLs
  }, [conversationIdFromUrl]);

  // Handle tab changes from URL parameter and trigger data fetch
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const newTab = tabFromUrl === 'educators' ? 'educators' :
      tabFromUrl === 'admin' ? 'admin' :
        tabFromUrl === 'college_admin' ? 'college_admin' :
          'recruiters';

    if (newTab !== activeTab) {
      logger.debug('Tab switching', { from: activeTab, to: newTab });
      setIsTabSwitching(true);
      setActiveTab(newTab);
      setSelectedConversationId(null); // Clear selection when switching tabs

      // Force fetch data for the new tab if we have learnerId
      if (learnerId && !loadinglearnerData) {
        logger.debug('Triggering fetch for new tab', { tab: newTab });

        // Trigger appropriate refetch based on new tab - with safety checks
        let fetchPromise = Promise.resolve();

        if (newTab === 'recruiters' && refetchRecruiterConversations) {
          fetchPromise = refetchRecruiterConversations();
        } else if (newTab === 'educators' && refetchEducatorConversations) {
          fetchPromise = refetchEducatorConversations();
        } else if (newTab === 'admin' && refetchAdminConversations) {
          fetchPromise = refetchAdminConversations();
        } else if (newTab === 'college_admin' && refetchCollegeAdminConversations) {
          fetchPromise = refetchCollegeAdminConversations();
        }

        // Clear tab switching state after fetch completes
        let timer;
        fetchPromise.finally(() => {
          timer = setTimeout(() => setIsTabSwitching(false), 300); // Small delay for smooth UX
        });
        return () => clearTimeout(timer);
      } else {
        setIsTabSwitching(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeTab, learnerId, loadinglearnerData]);

  // Debug logging - only when there's an issue
  useEffect(() => {
    if (!learnerId && !loadinglearnerData && userEmail) {
      logger.warn('No learnerId found for email', { email: userEmail });
    }
  }, [learnerId, loadinglearnerData, userEmail]);

  // Helper functions for admin online status - MOVED UP to fix initialization order
  const getSchoolAdminUserId = useCallback(async (conversation) => {
    logger.debug('Checking admin fields', {
      school_organization: conversation.school_organization,
      college_organization: conversation.college_organization,
      conversation_type: conversation.conversation_type,
      school_id: conversation.school_id,
      college_id: conversation.college_id
    });

    // Try JOIN data first (if it works)
    if (conversation.conversation_type === 'learner_admin' && conversation.school_organization?.admin_id) {
      return conversation.school_organization.admin_id;
    }
    if (conversation.conversation_type === 'learner_college_admin' && conversation.college_organization?.admin_id) {
      return conversation.college_organization.admin_id;
    }

    // Dynamic lookup for school admin
    if (conversation.conversation_type === 'learner_admin' && conversation.school_id) {
      try {
        const schoolOrg = await apiPost('/learner-pages/actions', {
          action: 'fetch-school-org-admin',
          schoolId: conversation.school_id,
        });

        if (schoolOrg?.data?.admin_id) {
          logger.info('Found school admin dynamically', { adminId: schoolOrg.data.admin_id });
          return schoolOrg.data.admin_id;
        }
      } catch (error) {
        logger.error('Error fetching school admin', error);
      }
    }

    // Dynamic lookup for college admin
    if (conversation.conversation_type === 'learner_college_admin' && conversation.college_id) {
      try {
        const collegeOrg = await apiPost('/learner-pages/actions', {
          action: 'fetch-college-org-admin',
          collegeId: conversation.college_id,
        });

        if (collegeOrg?.data?.admin_id) {
          logger.info('Found college admin dynamically', { adminId: collegeOrg.data.admin_id });
          return collegeOrg.data.admin_id;
        }
      } catch (error) {
        logger.error('Error fetching college admin', error);
      }
    }

    return null;
  }, []);

  // Fetch admin user IDs dynamically
  useEffect(() => {
    const fetchAdminUserIds = async () => {
      if (!conversations || conversations.length === 0) return;

      const adminConversations = conversations.filter(conv =>
        (conv.conversation_type === 'learner_admin' || conv.conversation_type === 'learner_college_admin') &&
        !adminUserIds[conv.id] // Only fetch if we don't have it yet
      );

      if (adminConversations.length === 0) return;

      logger.debug('Fetching admin user IDs for conversations', { count: adminConversations.length });

      const newAdminUserIds = { ...adminUserIds };

      for (const conv of adminConversations) {
        try {
          const adminUserId = await getSchoolAdminUserId(conv);
          if (adminUserId) {
            newAdminUserIds[conv.id] = adminUserId;
            logger.info('Found admin ID for conversation', { conversationId: conv.id, adminUserId });
          }
        } catch (error) {
          logger.error('Error fetching admin ID for conversation', error, { conversationId: conv.id });
        }
      }

      setAdminUserIds(newAdminUserIds);
    };

    fetchAdminUserIds();
  }, [conversations, adminUserIds, getSchoolAdminUserId]);

  // Fetch messages for selected conversation - call all hooks unconditionally
  const recruiterMessages = useLearnerMessages({
    learnerId,
    conversationId: activeTab === 'recruiters' ? selectedConversationId : null,
    enabled: activeTab === 'recruiters' && !!selectedConversationId,
    enableRealtime: true
  });

  const educatorMessages = useLearnerEducatorMessages({
    learnerId,
    conversationId: activeTab === 'educators' ? selectedConversationId : null,
    enabled: activeTab === 'educators' && !!selectedConversationId,
    enableRealtime: true
  });

  const adminMessages = useLearnerAdminMessages({
    learnerId,
    conversationId: activeTab === 'admin' ? selectedConversationId : null,
    enabled: activeTab === 'admin' && !!selectedConversationId,
    enableRealtime: true
  });

  const collegeAdminMessages = useLearnerCollegeAdminMessages({
    learnerId,
    conversationId: activeTab === 'college_admin' ? selectedConversationId : null,
    enabled: activeTab === 'college_admin' && !!selectedConversationId,
    enableRealtime: true
  });

  // Select the appropriate messages based on active tab
  const { messages, isLoading: loadingMessages, sendMessage, isSending } =
    activeTab === 'recruiters' ? recruiterMessages :
      activeTab === 'educators' ? educatorMessages :
        activeTab === 'admin' ? adminMessages :
          activeTab === 'college_admin' ? collegeAdminMessages :
            { messages: [], isLoading: false, sendMessage: () => { }, isSending: false };

  // Use shared global presence context (no duplicate subscription)
  const { isUserOnline: isUserOnlineGlobal, onlineUsers: globalOnlineUsers } = useGlobalPresence();

  const getAdminOnlineStatus = useCallback((conversation) => {
    logger.debug('Full conversation object', { conversationId: conversation.id });

    if (conversation.conversation_type === 'learner_admin' || conversation.conversation_type === 'learner_college_admin') {
      const adminUserId = adminUserIds[conversation.id];
      // Fix: Check user.userId since globalOnlineUsers contains objects
      const isOnline = adminUserId ? globalOnlineUsers.some(user => user.userId === adminUserId) : false;

      logger.debug('Admin online status', {
        conversationId: conversation.id,
        conversationType: conversation.conversation_type,
        adminUserId,
        isOnline
      });

      return isOnline;
    }
    return false;
  }, [globalOnlineUsers, adminUserIds]);

  // Presence tracking for current conversation (for chat header)
  const { onlineUsers } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: learnerId || '',
      userName: learnerName,
      userType: 'learner',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined
    },
    enabled: !!selectedConversationId && !!learnerId
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: learnerId || '',
    currentUserName: learnerName,
    enabled: !!selectedConversationId && !!learnerId
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: learnerId || '',
    showToast: true,
    enabled: !!learnerId
  });

  // Delete mutation with proper optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      await MessageService.deleteConversationForUser(conversationId, learnerId, 'learner');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['learner-conversations', learnerId] });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(['learner-conversations', learnerId]);

      // Optimistically update: mark as deleted
      queryClient.setQueryData(['learner-conversations', learnerId], (old) => {
        if (!old) return [];
        return old.map(conv =>
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });

      // CRITICAL: Invalidate to trigger immediate re-render
      queryClient.invalidateQueries({
        queryKey: ['learner-conversations', learnerId],
        refetchType: 'none' // Don't refetch, just notify subscribers
      });

      logger.debug('Marked conversation as deleted', { conversationId });

      return { previousConversations, conversationId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(['learner-conversations', learnerId], context.previousConversations);
      }
      toast.error('Failed to delete conversation');
    },
    onSuccess: (_data, variables) => {
      // Immediately remove from cache - no need to wait
      // The _pendingDelete flag already hides it from UI
      // Just remove it from cache so it doesn't come back
      queryClient.setQueryData(['learner-conversations', learnerId], (old) => {
        if (!old) return [];
        return old.filter(conv => conv.id !== variables.conversationId);
      });

      // CRITICAL: Invalidate to ensure the query doesn't refetch from realtime updates
      // This prevents the deleted conversation from coming back
      queryClient.invalidateQueries({
        queryKey: ['learner-conversations', learnerId],
        refetchType: 'none' // Don't refetch, just notify
      });

      logger.info('Conversation permanently removed from cache', { conversationId: variables.conversationId });
    }
  });

  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      await MessageService.restoreConversation(conversationId, learnerId, 'learner');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['learner-conversations', learnerId] });

      // Snapshot
      const previousConversations = queryClient.getQueryData(['learner-conversations', learnerId]);

      logger.debug('Attempting to restore conversation', { conversationId });

      return { previousConversations, conversationId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(['learner-conversations', learnerId], context.previousConversations);
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
    if (!learnerId || !clearUnreadCount) return;

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
      await MessageService.markConversationAsRead(conversationId, learnerId);
    } catch (err) {
      logger.error('Failed to mark conversation as read', err, { conversationId });
      // Remove from marked set so it can be retried
      markedAsReadRef.current.delete(markKey);
      // Refetch to revert optimistic update
      refetchConversations();
    }
  }, [learnerId, clearUnreadCount, refetchConversations]);

  // Trigger mark as read when conversation changes
  useEffect(() => {
    if (!selectedConversationId || !learnerId) {
      return;
    }

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const hasUnread = conversation?.learner_unread_count > 0;

    if (hasUnread) {
      markConversationAsRead(selectedConversationId, conversation.learner_unread_count);
    }
  }, [selectedConversationId, learnerId, conversations, markConversationAsRead]);

  // Transform conversations for display based on active tab
  const contacts = useMemo(() => {
    logger.debug('Recalculating contacts memo', { count: (conversations || []).length, tab: activeTab });

    // Ensure conversations is always an array
    const safeConversations = conversations || [];

    // First filter out conversations marked for deletion
    const activeConversations = safeConversations.filter(conv => !conv._pendingDelete);

    // Debug logging
    const pendingCount = safeConversations.filter(c => c._pendingDelete).length;
    logger.debug('Conversations summary', {
      total: safeConversations.length,
      pendingDelete: pendingCount,
      active: activeConversations.length
    });

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
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(recruiterName)}&background=3B82F6&color=fff`;

        // Format time
        let timeDisplay = 'No messages';
        if (conv.last_message_at) {
          try {
            timeDisplay = formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
          } catch {
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
          unread: conv.learner_unread_count || 0,
          online: isUserOnlineGlobal(conv.recruiter_id),
          recruiterId: conv.recruiter_id,
          applicationId: conv.application_id,
          opportunityId: conv.opportunity_id,
          type: 'recruiter'
        };
      });
    } else if (activeTab === 'educators') {
      // Educator conversations (both school educators and college lecturers)
      return activeConversations.map(conv => {
        const educator = conv.educator;

        // Handle college lecturer conversations differently
        if (conv.conversation_type === 'learner_college_educator') {
          // College lecturer conversation
          const educatorName = educator?.first_name && educator?.last_name
            ? `${educator.first_name} ${educator.last_name}`
            : educator?.email || 'College Lecturer';
          // ADD THIS DEBUG LOG HERE:
          logger.debug('Checking online for college educator', {
            educator_id: conv.educator_id,
            educator_user_id: conv.educator?.user_id
          });

          const subject = conv.subject || 'General Discussion';

          // For college lecturers, show subject and department/specialization if available
          let role = subject;
          if (educator?.department) {
            role += ` • ${educator.department}`;
          }

          // Generate avatar URL (no photo_url field in college_lecturers)
          const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(educatorName)}&background=9333EA&color=fff`;

          // Format time
          let timeDisplay = 'No messages';
          if (conv.last_message_at) {
            try {
              timeDisplay = formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
            } catch {
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
            unread: conv.learner_unread_count || 0,
            // online: isUserOnlineGlobal(conv.educator_id),
            online: isUserOnlineGlobal(conv.educator?.user_id),
            educatorId: conv.educator_id,
            programSectionId: conv.program_section_id,
            subject: conv.subject,
            type: 'college_lecturer',
            conversationType: 'learner_college_educator'
          };
        } else {
          // School educator conversation (existing logic unchanged)
          const educatorName = educator?.first_name && educator?.last_name
            ? `${educator.first_name} ${educator.last_name}`
            : educator?.email || 'Educator';
          logger.debug('Checking online for school educator', {
            educator_id: conv.educator_id,
            educator_user_id: conv.educator?.user_id
          });
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
            `https://ui-avatars.com/api/?name=${encodeURIComponent(educatorName)}&background=3B82F6&color=fff`;

          // Format time
          let timeDisplay = 'No messages';
          if (conv.last_message_at) {
            try {
              timeDisplay = formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
            } catch {
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
            unread: conv.learner_unread_count || 0,
            online: isUserOnlineGlobal(conv.educator_id),
            // online: isUserOnlineGlobal(conv.educator?.user_id),
            educatorId: conv.educator_id,
            classId: conv.class_id,
            subject: conv.subject,
            type: 'educator',
            conversationType: 'learner_educator'
          };
        }
      });
    } else if (activeTab === 'admin') {
      // School admin conversations
      return activeConversations.map(conv => {
        const school = conv.school;
        const schoolName = school?.name || 'School Administration';
        const subject = conv.subject || 'General Discussion';

        // Generate avatar URL for school
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolName)}&background=3B82F6&color=fff`;

        // Format time
        let timeDisplay = 'No messages';
        if (conv.last_message_at) {
          try {
            timeDisplay = formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
          } catch {
            timeDisplay = conv.last_message_at;
          }
        }

        return {
          id: conv.id,
          name: schoolName,
          role: subject,
          avatar: avatar,
          lastMessage: conv.last_message_preview || 'No messages yet',
          time: timeDisplay,
          unread: conv.learner_unread_count || 0,
          online: getAdminOnlineStatus(conv), // Use dynamic admin online status
          schoolId: conv.school_id,
          subject: conv.subject,
          type: 'admin'
        };
      });
    } else {
      // College admin conversations
      return activeConversations.map(conv => {
        const college = conv.college;
        const collegeName = college?.name || 'College Administration';
        const subject = conv.subject || 'General Discussion';

        // Generate avatar URL for college
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(collegeName)}&background=3B82F6&color=fff`;

        // Format time
        let timeDisplay = 'No messages';
        if (conv.last_message_at) {
          try {
            timeDisplay = formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
          } catch {
            timeDisplay = conv.last_message_at;
          }
        }

        return {
          id: conv.id,
          name: collegeName,
          role: subject,
          avatar: avatar,
          lastMessage: conv.last_message_preview || 'No messages yet',
          time: timeDisplay,
          unread: conv.learner_unread_count || 0,
          online: getAdminOnlineStatus(conv), // Use dynamic admin online status
          collegeId: conv.college_id,
          subject: conv.subject,
          type: 'college_admin'
        };
      });
    }
  }, [conversations, globalOnlineUsers, isUserOnlineGlobal, activeTab, getAdminOnlineStatus]);

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
    if (messageInput.trim() && currentChat && learnerId) {
      try {
        if (activeTab === 'recruiters') {
          // Send message to recruiter
          await sendMessage({
            senderId: learnerId,
            senderType: 'learner',
            receiverId: currentChat.recruiterId,
            receiverType: 'recruiter',
            messageText: messageInput,
            applicationId: currentChat.applicationId,
            opportunityId: currentChat.opportunityId
          });

          // Send notification broadcast to recruiter
          try {
            await sendNotification(currentChat.recruiterId, {
              title: 'New Message from Learner',
              message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
              type: 'message',
              link: `/recruiter/messages?conversation=${selectedConversationId}`
            });
          } catch (notifyError) {
            logger.error('Failed to send recruiter notification', {
              recruiterId: currentChat.recruiterId,
              error: notifyError instanceof Error ? notifyError.message : String(notifyError)
            });
          }
        } else if (activeTab === 'educators') {
          // Send message to educator
          // await sendMessage({
          //   senderId: learnerId,
          //   senderType: 'learner',
          //   receiverId: currentChat.educatorId,
          //   receiverType: 'educator',
          //   messageText: messageInput,
          //   classId: currentChat.classId,
          //   subject: currentChat.subject
          // });

          // Check if it's a college lecturer conversation
          const receiverType = currentChat.conversationType === 'learner_college_educator'
            ? 'college_educator'  // ✅ For college lecturers
            : 'educator';         // ✅ For school educators (unchanged)

          await sendMessage({
            senderId: learnerId,
            senderType: 'learner',
            receiverId: currentChat.educatorId,
            receiverType: receiverType,  // ✅ Use dynamic type
            messageText: messageInput,
            classId: currentChat.classId,
            subject: currentChat.subject
          });


          // Send notification broadcast to educator
          try {
            await sendNotification(currentChat.educatorId, {
              title: 'New Message from Learner',
              message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
              type: 'message',
              link: `/educator/messages?conversation=${selectedConversationId}`
            });
          } catch (notifyError) {
            logger.error('Failed to send educator notification', {
              educatorId: currentChat.educatorId,
              error: notifyError instanceof Error ? notifyError.message : String(notifyError)
            });
          }
        } else if (activeTab === 'admin') {
          // Send message to school admin
          // Get a school admin from the school to send the message to
          const schoolAdminRes = await apiPost('/learner-pages/actions', {
            action: 'fetch-school-admin-educator',
            schoolId: currentChat.schoolId,
          });

          const schoolAdmin = schoolAdminRes?.data;
          if (schoolAdmin) {
            await sendMessage({
              senderId: learnerId,
              senderType: 'learner',
              receiverId: schoolAdmin.user_id,
              receiverType: 'school_admin',
              messageText: messageInput,
              subject: currentChat.subject
            });
          } else {
            logger.warn('No school admin found for school', { schoolId: currentChat.schoolId });
            throw new Error('No school admin available to receive message');
          }

          // Note: School admin notifications are handled differently since multiple admins can see the message
          // The notification will be sent to all school admins via the RLS policies
        } else if (activeTab === 'college_admin') {
          // Send message to college admin
          // Get a college admin from the college to send the message to
          const collegeAdminRes = await apiPost('/learner-pages/actions', {
            action: 'fetch-college-admin',
            collegeId: currentChat.collegeId,
          });

          let adminUserId = null;
          const collegeAdmin = collegeAdminRes?.data;
          if (collegeAdmin) {
            adminUserId = collegeAdmin.user_id || collegeAdmin.userId;
          } else {
            // Fallback: check if user is college owner in organizations table
            const ownerRes = await apiPost('/learner-pages/actions', {
              action: 'fetch-college-org-admin',
              collegeId: currentChat.collegeId,
            });

            const ownerData = ownerRes?.data;
            if (ownerData) {
              adminUserId = ownerData.admin_id;
            }
          }

          if (adminUserId) {
            await sendMessage({
              senderId: learnerId,
              senderType: 'learner',
              receiverId: adminUserId,
              receiverType: 'college_admin',
              messageText: messageInput,
              subject: currentChat.subject
            });
          } else {
            logger.warn('No college admin found for college', { collegeId: currentChat.collegeId });
            throw new Error('No college admin available to receive message');
          }

          // Note: College admin notifications are handled differently since multiple admins can see the message
          // The notification will be sent to all college admins via the RLS policies
        }

        setMessageInput('');
        setTyping(false);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Error sending message', {
          tab: activeTab,
          error: errorMsg,
          currentChat: {
            id: currentChat?.id,
            type: currentChat?.conversationType
          }
        });
        throw error;
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
    if (!messages || !messages.length) return;

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
  const displayMessages = (messages || []).map(msg => ({
    id: msg.id,
    text: msg.message_text,
    sender: msg.sender_type === 'learner' ? 'me' : 'them',
    time: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
    status: msg.is_read ? 'read' : 'delivered'
  }));

  // Close menu when clicking outside (memoized handler)
  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(null);
    }
    if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target)) {
      setShowTabDropdown(false);
    }
  }, []);

  useEffect(() => {
    // Only add listener when menu is open for better performance
    if (showMenu !== null || showTabDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, showTabDropdown, handleClickOutside]);

  // Handle delete conversation using mutation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !learnerId) return;

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
      const [displayTime, setDisplayTime] = useState(5);
      const startTimeRef = useRef(Date.now());
      const rafIdRef = useRef(null);
      const progressRef = useRef(null);

      useEffect(() => {
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
                  className="stroke-blue-500"
                  strokeWidth="2.5"
                  strokeDasharray="97.4"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold text-blue-600 tabular-nums w-3 text-center">
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
            className="flex-shrink-0 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-[15px] font-semibold rounded-xl shadow-sm hover:shadow-lg active:scale-95 transition-all duration-200"
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
  }, [deleteModal.conversationId, deleteModal.contactName, learnerId, selectedConversationId, deleteMutation, undoMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId, contactName, e) => {
    e?.stopPropagation(); // Prevent triggering conversation selection
    setShowMenu(null);
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);

  // Show loading state
  if (loadingConversations || !learnerId || isTabSwitching) {
    return (
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">
            {!learnerId ? 'Loading user data...' :
              isTabSwitching ? 'Switching tabs...' :
                'Loading conversations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    // Main container: Adjusted height, removed overflow-hidden for dropdowns, added relative
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border border-gray-200 relative">
      {/* Left Panel - Contacts List */}
      <div className="w-full md:w-96 border-r border-gray-200 flex flex-col rounded-l-xl overflow-hidden">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>

            <div className="flex items-center gap-3 ml-4">
              {/* New Button - Show for Educators tab */}
              {activeTab === 'educators' && (
                <button
                  onClick={() => setShowNewEducatorConversationModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title="Start new conversation with educator"
                >
                  <GraduationCap className="w-4 h-4" />
                  New
                </button>
              )}

              {/* New Button - Show for School Admin tab */}
              {activeTab === 'admin' && (
                <button
                  onClick={() => setShowNewAdminConversationModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title="Start new conversation with school admin"
                >
                  <Building2 className="w-4 h-4" />
                  New
                </button>
              )}

              {/* New Button - Show for College Admin tab */}
              {activeTab === 'college_admin' && (
                <button
                  onClick={() => setShowNewCollegeAdminConversationModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title="Start new conversation with college admin"
                >
                  <Building2 className="w-4 h-4" />
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
                    {activeTab === 'recruiters' && (
                      <>
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Recruiters</span>
                        {recruiterConversations.length > 0 && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            {recruiterConversations.length}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'educators' && (
                      <>
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Educators</span>
                        {educatorConversations.length > 0 && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            {educatorConversations.length}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'admin' && (
                      <>
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">School Admin</span>
                        {adminConversations.length > 0 && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            {adminConversations.length}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'college_admin' && (
                      <>
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">College Admin</span>
                        {collegeAdminConversations.length > 0 && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            {collegeAdminConversations.length}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showTabDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showTabDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {/* Recruiters Tab - Always available */}
                      <button
                        onClick={async () => {
                          logger.debug('Switching to recruiters tab');
                          setIsTabSwitching(true);
                          setActiveTab('recruiters');
                          setSelectedConversationId(null);
                          setSearchParams({ tab: 'recruiters' }, { replace: true });
                          setShowTabDropdown(false);

                          // Force refetch for recruiters tab
                          if (learnerId && !loadinglearnerData && refetchRecruiterConversations) {
                            logger.debug('Refetching recruiter conversations');
                            try {
                              await refetchRecruiterConversations();
                            } finally {
                              setTimeout(() => setIsTabSwitching(false), 300);
                            }
                          } else {
                            setIsTabSwitching(false);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${activeTab === 'recruiters' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                      >
                        <Users className={`w-4 h-4 ${activeTab === 'recruiters' ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div className="flex-1">
                          <div className="font-medium">Recruiters</div>
                          <div className="text-xs text-gray-500">Job application messages</div>
                        </div>
                        {recruiterConversations.length > 0 && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            {recruiterConversations.length}
                          </span>
                        )}
                      </button>

                      {/* Educators Tab */}
                      {(hasSchoolId || hasCollegeId) && (
                        <button
                          onClick={async () => {
                            logger.debug('Switching to educators tab');
                            setIsTabSwitching(true);
                            setActiveTab('educators');
                            setSelectedConversationId(null);
                            setSearchParams({ tab: 'educators' }, { replace: true });
                            setShowTabDropdown(false);

                            // Force refetch for educators tab
                            if (learnerId && !loadinglearnerData && refetchEducatorConversations) {
                              logger.debug('Refetching educator conversations');
                              try {
                                await refetchEducatorConversations();
                              } finally {
                                setTimeout(() => setIsTabSwitching(false), 300);
                              }
                            } else {
                              setIsTabSwitching(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${activeTab === 'educators' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                          <GraduationCap className={`w-4 h-4 ${activeTab === 'educators' ? 'text-blue-600' : 'text-gray-500'}`} />
                          <div className="flex-1">
                            <div className="font-medium">Educators</div>
                            <div className="text-xs text-gray-500">Teacher and class messages</div>
                          </div>
                          {educatorConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                              {educatorConversations.length}
                            </span>
                          )}
                        </button>
                      )}

                      {/* School Admin Tab - Only if learner has school_id */}
                      {hasSchoolId && (
                        <button
                          onClick={async () => {
                            logger.debug('Switching to admin tab');
                            setIsTabSwitching(true);
                            setActiveTab('admin');
                            setSelectedConversationId(null);
                            setSearchParams({ tab: 'admin' }, { replace: true });
                            setShowTabDropdown(false);

                            // Force refetch for admin tab
                            if (learnerId && !loadinglearnerData && refetchAdminConversations) {
                              logger.debug('Refetching admin conversations');
                              try {
                                await refetchAdminConversations();
                              } finally {
                                setTimeout(() => setIsTabSwitching(false), 300);
                              }
                            } else {
                              setIsTabSwitching(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${activeTab === 'admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                          <Building2 className={`w-4 h-4 ${activeTab === 'admin' ? 'text-blue-600' : 'text-gray-500'}`} />
                          <div className="flex-1">
                            <div className="font-medium">School Admin</div>
                            <div className="text-xs text-gray-500">School administration messages</div>
                          </div>
                          {adminConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                              {adminConversations.length}
                            </span>
                          )}
                        </button>
                      )}

                      {/* College Admin Tab - Only if learner has university_college_id */}
                      {hasCollegeId && (
                        <button
                          onClick={async () => {
                            logger.debug('Switching to college_admin tab');
                            setIsTabSwitching(true);
                            setActiveTab('college_admin');
                            setSelectedConversationId(null);
                            setSearchParams({ tab: 'college_admin' });
                            setShowTabDropdown(false);

                            // Force refetch for college admin tab
                            if (learnerId && !loadinglearnerData && refetchCollegeAdminConversations) {
                              logger.debug('Refetching college admin conversations');
                              try {
                                await refetchCollegeAdminConversations();
                              } finally {
                                setTimeout(() => setIsTabSwitching(false), 300);
                              }
                            } else {
                              setIsTabSwitching(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${activeTab === 'college_admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                          <Building2 className={`w-4 h-4 ${activeTab === 'college_admin' ? 'text-blue-600' : 'text-gray-500'}`} />
                          <div className="flex-1">
                            <div className="font-medium">College Admin</div>
                            <div className="text-xs text-gray-500">College administration messages</div>
                          </div>
                          {collegeAdminConversations.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                              {collegeAdminConversations.length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'recruiters' ? 'recruiter' : activeTab === 'educators' ? 'educator' : activeTab === 'admin' ? 'school admin' : 'college admin'} conversations...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {isTabSwitching ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading {activeTab} conversations...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              {activeTab === 'recruiters' ? (
                <>
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No recruiter conversations yet</p>
                  <p className="text-gray-400 text-xs mt-2">Start by applying to jobs!</p>
                </>
              ) : activeTab === 'educators' ? (
                <>
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No educator conversations yet</p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">Start a conversation with your teachers</p>
                  <button
                    onClick={() => setShowNewEducatorConversationModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Message Educator
                  </button>
                </>
              ) : activeTab === 'admin' ? (
                <>
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No school admin conversations yet</p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">Start a conversation with school administration</p>
                  <button
                    onClick={() => setShowNewAdminConversationModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Building2 className="w-4 h-4" />
                    Message School Admin
                  </button>
                </>
              ) : (
                <>
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No college admin conversations yet</p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">Start a conversation with college administration</p>
                  <button
                    onClick={() => setShowNewCollegeAdminConversationModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Building2 className="w-4 h-4" />
                    Message College Admin
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`relative group flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 ${selectedConversationId === contact.id
                  ? 'bg-blue-50'
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
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
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
                    <p className="text-xs mb-1 truncate font-medium text-blue-600">
                      {contact.role}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {contact.lastMessage}
                      </p>
                      {contact.unread > 0 && (
                        <span className="flex-shrink-0 ml-2 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center bg-blue-500">
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
      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col rounded-r-xl overflow-hidden">
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
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
                  <p className="text-xs text-gray-500">
                    {currentChat.online ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        Online
                      </span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
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
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${message.sender === 'me'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${message.sender === 'me'
                          ? 'text-blue-100'
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
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="p-2.5 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors bg-blue-500 hover:bg-blue-600"
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
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100`}>
                {activeTab === 'recruiters' ? (
                  <Send className="w-12 h-12 text-blue-500" />
                ) : activeTab === 'educators' ? (
                  <GraduationCap className="w-12 h-12 text-blue-500" />
                ) : (
                  <Building2 className="w-12 h-12 text-blue-500" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 text-sm">
                {activeTab === 'recruiters'
                  ? 'Choose from your recruiter conversations'
                  : activeTab === 'educators'
                    ? 'Choose from your educator conversations'
                    : 'Choose from your school admin conversations'
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
        isOpen={showNewEducatorConversationModal}
        onClose={() => setShowNewEducatorConversationModal(false)}
        learnerId={learnerId}
        onConversationCreated={async ({ educatorId, educatorType, classId, subject, initialMessage }) => {
          try {
            logger.info('Creating conversation with educator', { educatorId, educatorType, classId, subject });

            let conversation;
            if (educatorType === 'college_lecturer') {
              // Create college lecturer conversation
              conversation = await MessageService.getOrCreatelearnerCollegeLecturerConversation(
                learnerId,
                educatorId,
                learnerData?.university_college_id, // collegeId
                null, // programSectionId - will be set by backend if available
                subject
              );
              logger.info('College lecturer conversation created', { conversationId: conversation.id });
            } else {
              // Create school educator conversation
              conversation = await MessageService.getOrCreatelearnerEducatorConversation(
                learnerId,
                educatorId,
                classId,
                subject
              );
              logger.info('School educator conversation created', { conversationId: conversation.id });
            }

            // Send the initial message if provided
            if (initialMessage && initialMessage.trim()) {
              if (educatorType === 'college_lecturer') {
                await MessageService.sendMessage(
                  conversation.id,
                  learnerId,
                  'learner',
                  educatorId,
                  'college_educator',
                  initialMessage.trim(),
                  null, // applicationId
                  null, // opportunityId
                  null, // classId
                  subject
                );
                logger.info('Initial message sent to college lecturer');
              } else {
                await MessageService.sendlearnerEducatorMessage(
                  conversation.id,
                  learnerId,
                  initialMessage.trim()
                );
                logger.info('Initial message sent to school educator');
              }
            }

            // First refetch conversations to get the new conversation in the list
            await refetchConversations();

            // Then set the conversation ID (this ensures currentChat will be found)
            setSelectedConversationId(conversation.id);

            // Force a small delay to ensure UI updates
            setTimeout(() => {
              logger.debug('Conversation should now be selected', { conversationId: conversation.id });
            }, 100);

            const educatorTypeText = educatorType === 'college_lecturer' ? 'college lecturer' : 'school teacher';
            toast.success(`Conversation started with ${educatorTypeText}!`);
          } catch (error) {
            logger.error('Error creating educator conversation', error);

            // More specific error messages
            let errorMessage = 'Failed to start conversation';
            if (error.message?.includes('not found')) {
              errorMessage = 'Educator not found. Please try again.';
            } else if (error.message?.includes('permission')) {
              errorMessage = 'You don\'t have permission to message this educator.';
            }

            toast.error(errorMessage);
          }
        }}
      />

      {/* New Admin Conversation Modal */}
      <NewAdminConversationModal
        isOpen={showNewAdminConversationModal}
        onClose={() => setShowNewAdminConversationModal(false)}
        learnerId={learnerId}
        schoolId={learnerData?.school_id}
        onConversationCreated={async (conversationData) => {
          try {
            logger.info('Creating conversation with school admin', conversationData);
            
            const conversation = await MessageService.getOrCreatelearnerAdminConversation(
              learnerId,
              learnerData?.school_id,
              conversationData.subject || 'General Inquiry'
            );

            // Send initial message if provided
            if (conversationData.initialMessage && conversationData.initialMessage.trim()) {
              await MessageService.sendlearnerAdminMessage(
                conversation.id,
                learnerId,
                conversationData.initialMessage.trim()
              );
            }

            await refetchConversations();
            setSelectedConversationId(conversation.id);
            toast.success('Conversation started with school admin!');
          } catch (error) {
            logger.error('Error creating admin conversation', error);
            toast.error('Failed to start conversation with school admin');
          }
        }}
      />

      {/* New College Admin Conversation Modal */}
      <NewCollegeAdminConversationModal
        isOpen={showNewCollegeAdminConversationModal}
        onClose={() => setShowNewCollegeAdminConversationModal(false)}
        learnerId={learnerId}
        collegeId={learnerData?.university_college_id}
        onConversationCreated={async (conversationData) => {
          try {
            logger.info('Creating conversation with college admin', conversationData);
            
            const conversation = await MessageService.getOrCreatelearnerCollegeAdminConversation(
              learnerId,
              learnerData?.university_college_id,
              conversationData.subject || 'General Inquiry'
            );

            // Send initial message if provided
            if (conversationData.initialMessage && conversationData.initialMessage.trim()) {
              await MessageService.sendlearnerCollegeAdminMessage(
                conversation.id,
                learnerId,
                conversationData.initialMessage.trim()
              );
            }

            await refetchConversations();
            setSelectedConversationId(conversation.id);
            toast.success('Conversation started with college admin!');
          } catch (error) {
            logger.error('Error creating college admin conversation', error);
            toast.error('Failed to start conversation with college admin');
          }
        }}
      />
    </div>
  );
};

export default Messages;

