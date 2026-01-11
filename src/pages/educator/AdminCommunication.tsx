import {
    ArchiveBoxIcon,
    ChatBubbleLeftRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
    FaceSmileIcon,
    MagnifyingGlassIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    PhoneIcon,
    ShieldCheckIcon,
    VideoCameraIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import DeleteConversationModal from '../../components/messaging/DeleteConversationModal';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGlobalPresence } from '../../context/GlobalPresenceContext';
import { useEducatorAdminMessages } from '../../hooks/useEducatorAdminMessages.js';
import { useNotificationBroadcast } from '../../hooks/useNotificationBroadcast';
import { useRealtimePresence } from '../../hooks/useRealtimePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { supabase } from '../../lib/supabaseClient';
import MessageService, { Conversation } from '../../services/messageService';

const AdminCommunication = () => {
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
  
  // Get educator details and school ID
  const { data: educatorData } = useQuery({
    queryKey: ['educator-details', educatorId],
    queryFn: async () => {
      if (!educatorId) return null;
      const { data, error } = await supabase
        .from('school_educators')
        .select('id, school_id, first_name, last_name, email')
        .eq('user_id', educatorId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!educatorId,
  });
  
  const schoolId = educatorData?.school_id;
  const educatorRecordId = educatorData?.id;
  
  // Fetch active conversations with school admins
  const { data: activeConversations = [], isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['educator-admin-conversations', educatorRecordId, 'active'],
    queryFn: async () => {
      if (!educatorRecordId) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          educator:school_educators(id, first_name, last_name, email, phone_number, photo_url)
        `)
        .eq('educator_id', educatorRecordId)
        .eq('conversation_type', 'educator_admin')
        .eq('deleted_by_educator', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!educatorRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived conversations
  const { data: archivedConversations = [], isLoading: loadingArchived, refetch: refetchArchived } = useQuery({
    queryKey: ['educator-admin-conversations', educatorRecordId, 'archived'],
    queryFn: async () => {
      if (!educatorRecordId) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          educator:school_educators(id, first_name, last_name, email, phone_number, photo_url)
        `)
        .eq('educator_id', educatorRecordId)
        .eq('conversation_type', 'educator_admin')
        .eq('status', 'archived')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!educatorRecordId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const conversations = showArchived ? archivedConversations : activeConversations;
  const loadingConversations = showArchived ? loadingArchived : loadingActive;
  
  // Fetch messages for selected conversation
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = useEducatorAdminMessages({
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
  const handleNewConversation = useCallback(async (subject: string) => {
    if (!educatorRecordId || !schoolId) return;
    
    try {
      console.log('🆕 Creating new conversation with school admin:', { educatorRecordId, schoolId, subject });
      
      // Check if conversation already exists
      const existingConversation = activeConversations.find(conv => 
        conv.subject === subject
      );
      
      if (existingConversation) {
        console.log('✅ Found existing conversation:', existingConversation.id);
        setSelectedConversationId(existingConversation.id);
        setShowNewConversationModal(false);
        toast.success('Opened existing conversation');
        return;
      }
      
      // Create new conversation
      const conversation = await MessageService.getOrCreateEducatorAdminConversation(
        educatorRecordId,
        schoolId,
        subject
      );
      
      console.log('✅ New conversation created:', conversation);
      
      // Refresh conversations to include the new one
      await refetchActive();
      
      // Select the new conversation
      setSelectedConversationId(conversation.id);
      setShowNewConversationModal(false);
      
      toast.success('New conversation started with school admin');
      
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  }, [educatorRecordId, schoolId, activeConversations, refetchActive]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!educatorRecordId) return;
    
    const subscription = MessageService.subscribeToUserConversations(
      educatorRecordId,
      'educator',
      (conversation: Conversation) => {
        // Only handle educator-admin conversations
        if (conversation.conversation_type !== 'educator_admin') return;
        
        console.log('🔄 [Educator] Realtime UPDATE detected:', conversation);
        
        if (conversation.deleted_by_educator) {
          console.log('❌ [Educator] Ignoring UPDATE for deleted conversation:', conversation.id);
          return;
        }
        
        queryClient.invalidateQueries({ 
          queryKey: ['educator-admin-conversations', educatorRecordId, 'active'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['educator-admin-conversations', educatorRecordId, 'archived'],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [educatorRecordId, queryClient]);
  
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
      ['educator-admin-conversations', educatorRecordId, 'active'],
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
          queryKey: ['educator-admin-conversations', educatorRecordId, 'active'],
          refetchType: 'active'
        });
      })
      .catch(err => {
        console.error('Failed to mark as read:', err);
        markedAsReadRef.current.delete(markKey);
        refetchActive();
      });
  }, [selectedConversationId, educatorId, activeConversations, queryClient, refetchActive, educatorRecordId]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      await MessageService.deleteConversationForUser(conversationId, educatorId!, 'educator');
      return { conversationId };
    },
    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['educator-admin-conversations', educatorRecordId] });
      
      const previousActive = queryClient.getQueryData(['educator-admin-conversations', educatorRecordId, 'active']);
      const previousArchived = queryClient.getQueryData(['educator-admin-conversations', educatorRecordId, 'archived']);
      
      queryClient.setQueryData(['educator-admin-conversations', educatorRecordId, 'active'], (old: any) => {
        if (!old) return [];
        return old.map((conv: any) => 
          conv.id === conversationId ? { ...conv, _pendingDelete: true } : conv
        );
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['educator-admin-conversations', educatorRecordId, 'active'],
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
      queryClient.setQueryData(['educator-admin-conversations', educatorRecordId, 'active'], (old: any) => {
        if (!old) return [];
        return old.filter((conv: any) => conv.id !== variables.conversationId);
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['educator-admin-conversations', educatorRecordId, 'active'],
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
  }, [deleteModal.conversationId, deleteModal.contactName, educatorId, selectedConversationId, deleteMutation]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((conversationId: string, contactName: string) => {
    setDeleteModal({ isOpen: true, conversationId, contactName });
  }, []);
  
  // Transform and filter conversations
  const filteredContacts = useMemo(() => {
    const activeConversations = conversations.filter((conv: any) => !conv._pendingDelete);

    const contacts = activeConversations.map((conv: any) => {
      const schoolName = conv.school?.name || 'School Admin';
      const subject = conv.subject || 'General Discussion';
      
      return {
        id: conv.id,
        name: schoolName,
        role: `School Administration • ${subject}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolName)}&background=059669&color=fff`,
        lastMessage: conv.last_message_preview || 'No messages yet',
        online: false, // School admins don't have online status in this context
        time: conv.last_message_at 
          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
          : 'No messages',
        unread: conv.educator_unread_count || 0,
        schoolId: conv.school_id,
        subject: conv.subject,
        // Additional searchable fields
        schoolName: schoolName,
      };
    });

    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      // Basic info
      c.name.toLowerCase().includes(query) || 
      c.schoolName.toLowerCase().includes(query) ||
      // Subject info
      c.role.toLowerCase().includes(query) ||
      c.subject.toLowerCase().includes(query) ||
      // Message content
      c.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || !educatorId) return;
    
    try {
      // Find school admin user ID for the school
      const { data: schoolAdmin, error: adminError } = await supabase
        .from('school_educators')
        .select('user_id')
        .eq('school_id', currentChat.schoolId)
        .eq('role', 'school_admin')
        .maybeSingle();
      
      if (adminError || !schoolAdmin) {
        toast.error('Could not find school admin');
        return;
      }

      await sendMessage({
        senderId: educatorId,
        senderType: 'educator',
        receiverId: schoolAdmin.user_id,
        receiverType: 'school_admin',
        messageText: messageInput,
        subject: currentChat.subject
      });
      
      // Send notification to school admin
      try {
        await sendNotification(schoolAdmin.user_id, {
          title: 'New Message from Educator',
          message: messageInput.length > 50 ? messageInput.substring(0, 50) + '...' : messageInput,
          type: 'message',
          link: `/admin/school/communication?conversation=${selectedConversationId}`
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
      <h1 className="text-2xl font-bold mb-6">School Administration Communication</h1>

      {/* Admin Messages Section */}
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
                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                <div className="flex flex-col flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {showArchived ? 'Archived Messages' : 'Admin Messages'}
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
                  placeholder="Search by subject or message content..."
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
                    <ShieldCheckIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {showArchived 
                      ? 'No archived conversations' 
                      : searchQuery 
                      ? `No conversations found for "${searchQuery}"` 
                      : 'No admin messages yet'
                    }
                  </p>
                  <p className="text-gray-400 text-xs mt-2 mb-4">
                    {showArchived 
                      ? 'Archived conversations will appear here' 
                      : searchQuery 
                      ? 'Try searching by subject or message content' 
                      : 'Start a conversation with school administration'
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
                      className="flex-1 flex items-center px-6 py-4 text-left"
                    >
                      <div className="relative">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {contact.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {contact.name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {contact.time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 mb-1 truncate">
                              {contact.role}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {contact.lastMessage}
                            </p>
                          </div>
                          {contact.unread > 0 && (
                            <div className="ml-2 flex-shrink-0">
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
                                {contact.unread > 99 ? '99+' : contact.unread}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Action Menu */}
                    <div className="px-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add menu logic here
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full transition-all"
                        title="More options"
                      >
                        <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
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
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={currentChat.avatar}
                        alt={currentChat.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
                        <p className="text-sm text-gray-600">{currentChat.role}</p>
                        {isAnyoneTyping() && (
                          <p className="text-xs text-green-600 italic">
                            {getTypingText()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <PhoneIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <VideoCameraIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : displayMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium">No messages yet</p>
                        <p className="text-gray-400 text-sm">Start the conversation with school administration</p>
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
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender === 'me'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              message.sender === 'me' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{message.time}</span>
                              {message.sender === 'me' && renderStatusIcon(message.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <textarea
                          value={messageInput}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder="Type your message to school administration..."
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          rows={1}
                          style={{ minHeight: '44px', maxHeight: '120px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <PaperClipIcon className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FaceSmileIcon className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">School Administration</h3>
                  <p className="text-gray-600 mb-6">Select a conversation to start messaging with school administration</p>
                  <button
                    onClick={() => setShowNewConversationModal(true)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Start New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Start New Conversation</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const subject = formData.get('subject') as string;
              if (subject.trim()) {
                handleNewConversation(subject.trim());
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  placeholder="e.g., Class Schedule, Student Issues, Resources..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewConversationModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Start Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConversationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, conversationId: null, contactName: '' })}
        onConfirm={handleDeleteConversation}
        contactName={deleteModal.contactName}
      />
    </div>
  );
};

export default AdminCommunication;