import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import MessageService, { Conversation } from '../../services/messageService';
import { useMessages } from '../../hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';

const Messages = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    contactName: string;
  }>({
    isOpen: false,
    conversationId: null,
    contactName: '',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Get recruiter ID from auth
  const { user } = useAuth();
  const recruiterId = user?.id;
  const recruiterName = user?.name || 'Recruiter';
  const queryClient = useQueryClient();

  // Fetch active conversations
  const {
    data: activeConversations = [],
    isLoading: loadingActive,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['recruiter-conversations', recruiterId, 'active'],
    queryFn: async () => {
      if (!recruiterId) return [];
      return await MessageService.getUserConversations(recruiterId, 'recruiter', false);
    },
    enabled: !!recruiterId,
    staleTime: 60000, // Cache valid for 60 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Disable polling - rely on real-time updates
    refetchOnWindowFocus: true, // Refetch on window focus only
    refetchOnMount: 'always', // Always refetch on mount to get fresh data
  });

  // Fetch archived conversations count - always fetch for the badge
  const {
    data: archivedConversations = [],
    isLoading: loadingArchived,
    refetch: refetchArchived,
  } = useQuery({
    queryKey: ['recruiter-conversations', recruiterId, 'archived'],
    queryFn: async () => {
      if (!recruiterId) return [];
      const allConversations = await MessageService.getUserConversations(
        recruiterId,
        'recruiter',
        true
      );
      return allConversations.filter((conv) => conv.status === 'archived');
    },
    enabled: !!recruiterId,
    staleTime: 60000, // Cache valid for 60 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Disable polling - rely on real-time updates
    refetchOnWindowFocus: true, // Refetch on window focus only
    refetchOnMount: 'always', // Always refetch on mount to get fresh data
  });

  const conversations = showArchived ? archivedConversations : activeConversations;
  const loadingConversations = showArchived ? loadingArchived : loadingActive;

  // Fetch messages for selected conversation
  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    isSending,
  } = useMessages({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
  });

  // Use shared global presence context (no duplicate subscription)
  const { isUserOnline: isUserOnlineGlobal, onlineUsers: globalOnlineUsers } = useGlobalPresence();

  // Presence tracking for current conversation (for chat header)
  const { isUserOnline, getUserStatus, onlineUsers } = useRealtimePresence({
    channelName: selectedConversationId ? `conversation:${selectedConversationId}` : 'none',
    userPresence: {
      userId: recruiterId || '',
      userName: recruiterName,
      userType: 'recruiter',
      status: 'online',
      lastSeen: new Date().toISOString(),
      conversationId: selectedConversationId || undefined,
    },
    enabled: !!selectedConversationId && !!recruiterId,
  });

  // Typing indicators
  const { setTyping, getTypingText, isAnyoneTyping } = useTypingIndicator({
    conversationId: selectedConversationId || '',
    currentUserId: recruiterId || '',
    currentUserName: recruiterName,
    enabled: !!selectedConversationId && !!recruiterId,
  });

  // Notification broadcasts
  const { sendNotification } = useNotificationBroadcast({
    userId: recruiterId || '',
    showToast: true,
    enabled: !!recruiterId,
  });

  // Subscribe to conversation updates for real-time unread count changes
  useEffect(() => {
    if (!recruiterId) return;

    const subscription = MessageService.subscribeToUserConversations(
      recruiterId,
      'recruiter',
      (conversation: Conversation) => {
        console.log('🔄 [Recruiter] Realtime UPDATE detected:', conversation);

        // CRITICAL: Ignore updates for conversations that were deleted
        // This prevents re-fetching deleted conversations back into the cache
        if (conversation.deleted_by_recruiter) {
          console.log('❌ [Recruiter] Ignoring UPDATE for deleted conversation:', conversation.id);
          return; // Don't refetch
        }

        // Invalidate conversation queries and unread count for sidebar badge
        queryClient.invalidateQueries({
          queryKey: ['recruiter-conversations', recruiterId],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['recruiter-unread-count', recruiterId],
          refetchType: 'active',
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [recruiterId, queryClient]);

  // Mark messages as read when conversation is selected (with debounce)
  useEffect(() => {
    if (!selectedConversationId || !recruiterId) return;

    // Get current conversations
    const conversation = activeConversations.find((c) => c.id === selectedConversationId);
    const hasUnread = conversation?.recruiter_unread_count > 0;

    if (!hasUnread) return;

    const markKey = `${selectedConversationId}-${conversation?.recruiter_unread_count}`;
    if (markedAsReadRef.current.has(markKey)) return;
    markedAsReadRef.current.add(markKey);

    // Optimistically update the UI immediately
    queryClient.setQueryData<typeof activeConversations>(
      ['recruiter-conversations', recruiterId, 'active'],
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((conv) =>
          conv.id === selectedConversationId ? { ...conv, recruiter_unread_count: 0 } : conv
        );
      }
    );

    // Mark the database update
    MessageService.markConversationAsRead(selectedConversationId, recruiterId).catch((err) => {
      console.error('Failed to mark as read:', err);
      markedAsReadRef.current.delete(markKey);
      // Revert optimistic update on error
      refetchActive();
    });
  }, [selectedConversationId, recruiterId, activeConversations, queryClient, refetchActive]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Delete mutation with proper optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, recruiterId!, 'recruiter');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiter-conversations', recruiterId] });

      // Snapshot previous value
      const previousActive = queryClient.getQueryData([
        'recruiter-conversations',
        recruiterId,
        'active',
      ]);
      const previousArchived = queryClient.getQueryData([
        'recruiter-conversations',
        recruiterId,
        'archived',
      ]);

      // Optimistically update: mark as deleted
      queryClient.setQueryData(['recruiter-conversations', recruiterId, 'active'], (old: any) => {
        if (!old) return [];
        return old.map((conv: any) =>
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });

      // CRITICAL: Invalidate to trigger immediate re-render
      queryClient.invalidateQueries({
        queryKey: ['recruiter-conversations', recruiterId, 'active'],
        refetchType: 'none', // Don't refetch, just notify subscribers
      });

      console.log('🗑️ [Recruiter] Marked conversation as deleted:', conversationId);

      return { previousActive, previousArchived, conversationId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousActive) {
        queryClient.setQueryData(
          ['recruiter-conversations', recruiterId, 'active'],
          context.previousActive
        );
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(
          ['recruiter-conversations', recruiterId, 'archived'],
          context.previousArchived
        );
      }
      toast.error('Failed to delete conversation');
    },
    onSuccess: (data, variables, context) => {
      // Immediately remove from cache
      queryClient.setQueryData(['recruiter-conversations', recruiterId, 'active'], (old: any) => {
        if (!old) return [];
        return old.filter((conv: any) => conv.id !== variables.conversationId);
      });

      // CRITICAL: Invalidate to ensure the query doesn't refetch from realtime updates
      queryClient.invalidateQueries({
        queryKey: ['recruiter-conversations', recruiterId, 'active'],
        refetchType: 'none', // Don't refetch, just notify
      });

      console.log(
        '✅ [Recruiter] Conversation permanently removed from cache:',
        variables.conversationId
      );
    },
  });

  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.restoreConversation(conversationId, recruiterId!, 'recruiter');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiter-conversations', recruiterId] });

      // Snapshot
      const previousActive = queryClient.getQueryData([
        'recruiter-conversations',
        recruiterId,
        'active',
      ]);
      const previousArchived = queryClient.getQueryData([
        'recruiter-conversations',
        recruiterId,
        'archived',
      ]);

      console.log('↩️ [Recruiter] Attempting to restore conversation:', conversationId);

      return { previousActive, previousArchived, conversationId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousActive) {
        queryClient.setQueryData(
          ['recruiter-conversations', recruiterId, 'active'],
          context.previousActive
        );
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(
          ['recruiter-conversations', recruiterId, 'archived'],
          context.previousArchived
        );
      }
      toast.error('Failed to restore conversation');
    },
    onSuccess: () => {
      toast.success('Conversation restored');
      refetchActive(); // Sync with DB
      refetchArchived();
    },
  });

  // Handle archive/unarchive with optimistic updates
  const handleToggleArchive = useCallback(
    async (conversationId: string, isArchiving: boolean) => {
      setShowMenu(null);
      setIsTransitioning(true);

      try {
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
        }

        await (isArchiving
          ? MessageService.archiveConversation(conversationId)
          : MessageService.unarchiveConversation(conversationId));

        await Promise.all([refetchActive(), refetchArchived()]);
      } catch (error) {
        console.error(`Error ${isArchiving ? 'archiving' : 'unarchiving'} conversation:`, error);
        refetchActive();
        refetchArchived();
      } finally {
        setTimeout(() => setIsTransitioning(false), 300);
      }
    },
    [selectedConversationId, refetchActive, refetchArchived]
  );

  // Handle delete conversation using mutation
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModal.conversationId || !recruiterId) return;

    const conversationId = deleteModal.conversationId;
    const contactName = deleteModal.contactName;

    // Clear selection if deleting current conversation
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }

    // Close modal immediately for snappy UX
    setDeleteModal({ isOpen: false, conversationId: null, contactName: '' });

    // Trigger the mutation (handles optimistic update, API call, and cache removal)
    deleteMutation.mutate({ conversationId });

    // Show success toast with undo option (5 seconds with timer)
    const UndoToastComponent = ({
      t,
      conversationId,
      recruiterId,
      contactName,
      onRestore,
    }: {
      t: any;
      conversationId: string;
      recruiterId: string;
      contactName: string;
      onRestore: () => Promise<void>;
    }) => {
      const [displayTime, setDisplayTime] = React.useState(5);
      const startTimeRef = React.useRef(Date.now());
      const rafIdRef = React.useRef<number | null>(null);
      const progressRef = React.useRef<SVGCircleElement | null>(null);

      React.useEffect(() => {
        let lastUpdate = 0;
        let isMounted = true;
        const THROTTLE_MS = 50;

        const animate = (timestamp: number) => {
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
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-gray-200"
                  strokeWidth="2.5"
                />
                <circle
                  ref={progressRef}
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
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
              <p className="font-semibold text-[15px] text-gray-900 leading-tight">
                Conversation deleted
              </p>
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

    // Show undo toast
    toast.success(
      (t: any) => (
        <UndoToastComponent
          t={t}
          conversationId={conversationId}
          recruiterId={recruiterId!}
          contactName={contactName}
          onRestore={async () => {}} // No longer needed, mutation handles it
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
  }, [
    deleteModal.conversationId,
    deleteModal.contactName,
    recruiterId,
    selectedConversationId,
    deleteMutation,
    undoMutation,
  ]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId: string, contactName: string) => {
    setShowMenu(null);
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);

  // Transform and filter conversations - memoized for performance
  // Include onlineUsers as dependency so contacts update when presence changes
  const filteredContacts = useMemo(() => {
    console.log('🔄 [Recruiter] Recalculating contacts memo, conversations:', conversations.length);

    // First filter out conversations marked for deletion
    const activeConversations = conversations.filter((conv: any) => !conv._pendingDelete);

    // Debug logging
    const pendingCount = conversations.filter((c: any) => c._pendingDelete).length;
    console.log(
      `📊 [Recruiter] Conversations: ${conversations.length} total, ${pendingCount} pending delete, ${activeConversations.length} active`
    );

    if (pendingCount > 0) {
      const pendingIds = conversations.filter((c: any) => c._pendingDelete).map((c: any) => c.id);
      console.log('❌ [Recruiter] Pending delete IDs:', pendingIds);
    }

    const parseProfile = (profile: any) => {
      if (!profile || typeof profile === 'object') return profile || {};
      try {
        return JSON.parse(profile);
      } catch {
        return {};
      }
    };

    const contacts = activeConversations.map((conv: any) => {
      const profile = parseProfile(conv.student?.profile);
      const studentName = profile?.name || conv.student?.email || 'Student';
      const opportunityTitle = conv.opportunity?.title || 'No job specified';
      const opportunityDetails = conv.opportunity?.company_name
        ? `${opportunityTitle} • ${conv.opportunity.company_name}`
        : opportunityTitle;

      return {
        id: conv.id,
        name: studentName,
        role: opportunityDetails,
        avatar:
          profile?.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=3B82F6&color=fff`,
        lastMessage: conv.last_message_preview || 'No messages yet',
        online: isUserOnlineGlobal(conv.student_id),
        time: conv.last_message_at
          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
          : 'No messages',
        unread: conv.recruiter_unread_count || 0,
        studentId: conv.student_id,
        applicationId: conv.application_id,
        opportunityId: conv.opportunity_id,
      };
    });

    if (!searchQuery) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery, globalOnlineUsers, isUserOnlineGlobal]);

  const currentChat = useMemo(
    () => filteredContacts.find((c) => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || !currentChat || !recruiterId) return;

      try {
        await sendMessage({
          senderId: recruiterId,
          senderType: 'recruiter',
          receiverId: currentChat.studentId,
          receiverType: 'student',
          messageText: messageInput,
          applicationId: currentChat.applicationId,
          opportunityId: currentChat.opportunityId,
        });

        // Send notification broadcast to student
        try {
          await sendNotification(currentChat.studentId, {
            title: 'New Message from Recruiter',
            message:
              messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
            type: 'message',
            link: `/student/messages?conversation=${selectedConversationId}`,
          });
        } catch (notifError) {}

        setMessageInput('');
        setTyping(false);
        // Don't refetch - real-time updates will handle it
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [
      messageInput,
      currentChat,
      recruiterId,
      sendMessage,
      sendNotification,
      selectedConversationId,
      setTyping,
      refetchActive,
    ]
  );

  // Handle typing in input
  const handleInputChange = useCallback(
    (value: string) => {
      setMessageInput(value);
      setTyping(value.length > 0);
    },
    [setTyping]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const displayMessages = useMemo(
    () =>
      messages.map((msg) => ({
        id: msg.id,
        text: msg.message_text,
        sender: msg.sender_type === 'recruiter' ? 'me' : 'them',
        time: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
        status: msg.is_read ? 'read' : 'delivered',
      })),
    [messages]
  );

  const renderStatusIcon = useCallback(
    (status: string) => (
      <div className="flex">
        <CheckIcon className={`w-3 h-3 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`} />
        {status !== 'sent' && (
          <CheckIcon
            className={`w-3 h-3 -ml-1 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}
          />
        )}
      </div>
    ),
    []
  );

  // Show loading state
  if (loadingConversations || !recruiterId) {
    return (
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">
            {!recruiterId ? 'Loading user data...' : 'Loading conversations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] mx-4 my-4">
      <div className="flex h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
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
              <h1 className="text-2xl font-bold text-gray-900">
                {showArchived ? 'Archived' : 'Messages'}
              </h1>
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Archived Button - WhatsApp Style */}
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
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                    <ArchiveBoxIcon className="w-7 h-7 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-base">Archived</h3>
                    <p className="text-sm text-gray-500">
                      {archivedConversations.length} conversation
                      {archivedConversations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            )}

            {/* Loading indicator during transition */}
            {isTransitioning && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  {showArchived ? (
                    <ArchiveBoxIcon className="w-10 h-10 text-gray-400" />
                  ) : (
                    <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  {showArchived
                    ? 'No archived conversations'
                    : searchQuery
                      ? 'No conversations found'
                      : 'No conversations yet'}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {showArchived
                    ? 'Archived conversations will appear here'
                    : searchQuery
                      ? 'Try a different search term'
                      : 'Start messaging candidates'}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`relative w-full flex items-center border-b border-gray-100 group transition-all duration-200 ${
                    selectedConversationId === contact.id
                      ? 'bg-primary-50 border-l-4 border-l-primary-600'
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                  style={{
                    animation: 'fadeInSlide 0.2s ease-out',
                  }}
                >
                  <button
                    onClick={() => setSelectedConversationId(contact.id)}
                    className="flex-1 px-6 py-4 flex items-center gap-4 transition-all text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {contact.name}
                        </h3>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {contact.time}
                        </span>
                      </div>
                      <p className="text-xs text-primary-600 font-semibold mb-1.5 truncate">
                        {contact.role}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                    </div>
                    {contact.unread > 0 && (
                      <div className="flex-shrink-0 min-w-[22px] h-6 px-2 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                      title={showArchived ? 'Unarchive conversation' : 'Archive conversation'}
                    >
                      {showArchived ? (
                        <ArrowUturnLeftIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ArchiveBoxIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(contact.id, contact.name);
                      }}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors"
                      title="Delete conversation"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
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
              <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={currentChat.avatar}
                      alt={currentChat.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    {currentChat.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{currentChat.name}</h2>
                    <p className="text-sm text-primary-600 font-medium">
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
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                    title="Voice Call"
                  >
                    <PhoneIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                    title="Video Call"
                  >
                    <VideoCameraIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                    title="More"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50 space-y-4">
                {/* Online users indicator */}
                {onlineUsers.length > 1 && (
                  <div className="text-center text-xs text-gray-500 mb-2">
                    {onlineUsers.length} users online in this conversation
                  </div>
                )}
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-semibold">No messages yet</p>
                    <p className="text-gray-400 text-sm mt-2">Start the conversation!</p>
                  </div>
                ) : (
                  displayMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[70%]">
                        <div
                          className={`rounded-2xl px-5 py-3 shadow-sm ${
                            message.sender === 'me'
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <span
                              className={`text-xs ${
                                message.sender === 'me' ? 'text-primary-100' : 'text-gray-400'
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
                    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
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

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-8 py-5 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <button
                    type="button"
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    title="Attach file"
                  >
                    <PaperClipIcon className="w-6 h-6 text-gray-500" />
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
                      className="w-full pl-5 pr-14 py-4 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm bg-white transition-all"
                      rows={1}
                      style={{ minHeight: '52px', maxHeight: '120px' }}
                    />
                    <button
                      type="button"
                      className="absolute right-4 bottom-3.5 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Emoji"
                    >
                      <FaceSmileIcon className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="p-4 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
                    title="Send"
                  >
                    {isSending ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-6 h-6" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-8">
                <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-16 h-16 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Select a conversation</h3>
                <p className="text-gray-500 leading-relaxed">
                  Choose a conversation from the list to start messaging with candidates
                </p>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default Messages;
