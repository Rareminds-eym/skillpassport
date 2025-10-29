import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import MessageService, { Conversation } from '../../services/messageService';
import { useMessages } from '../../hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const Messages = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get recruiter ID from auth
  const { user } = useAuth();
  const recruiterId = user?.id;
  
  // Fetch active conversations
  const { data: activeConversations = [], isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['recruiter-conversations', recruiterId, 'active'],
    queryFn: async () => {
      if (!recruiterId) return [];
      console.log('🔄 Fetching active conversations');
      return await MessageService.getUserConversations(recruiterId, 'recruiter', false);
    },
    enabled: !!recruiterId,
    staleTime: 30000, // Cache valid for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 10000, // Poll every 10 seconds (reduced from 5s)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
  });

  // Fetch archived conversations count - always fetch for the badge
  const { data: archivedConversations = [], isLoading: loadingArchived, refetch: refetchArchived } = useQuery({
    queryKey: ['recruiter-conversations', recruiterId, 'archived'],
    queryFn: async () => {
      if (!recruiterId) return [];
      console.log('🔄 Fetching archived conversations');
      const allConversations = await MessageService.getUserConversations(recruiterId, 'recruiter', true);
      return allConversations.filter(conv => conv.status === 'archived');
    },
    enabled: !!recruiterId,
    staleTime: 30000, // Cache valid for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 15000, // Poll every 15 seconds (reduced from 5s)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
  });

  const conversations = showArchived ? archivedConversations : activeConversations;
  const loadingConversations = showArchived ? loadingArchived : loadingActive;
  
  // Fetch messages for selected conversation
  const { messages, isLoading: loadingMessages, sendMessage, isSending } = useMessages({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
  });
  
  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId && recruiterId) {
      MessageService.markConversationAsRead(selectedConversationId, recruiterId);
    }
  }, [selectedConversationId, recruiterId]);

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

  // Handle archive/unarchive with optimistic updates
  const handleToggleArchive = useCallback(async (conversationId: string, isArchiving: boolean) => {
    setShowMenu(null);
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
  
  // Transform and filter conversations - memoized for performance
  const filteredContacts = useMemo(() => {
    const parseProfile = (profile: any) => {
      if (!profile || typeof profile === 'object') return profile || {};
      try {
        return JSON.parse(profile);
      } catch {
        return {};
      }
    };

    const contacts = conversations.map(conv => {
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
        avatar: profile?.profilePicture || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=3B82F6&color=fff`,
        lastMessage: conv.last_message_preview || 'No messages yet',
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
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const currentChat = useMemo(() => 
    filteredContacts.find(c => c.id === selectedConversationId),
    [filteredContacts, selectedConversationId]
  );

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
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
        opportunityId: currentChat.opportunityId
      });
      setMessageInput('');
      refetchActive();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messageInput, currentChat, recruiterId, sendMessage, refetchActive]);

  const displayMessages = useMemo(() => 
    messages.map(msg => ({
      id: msg.id,
      text: msg.message_text,
      sender: msg.sender_type === 'recruiter' ? 'me' : 'them',
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
                      {archivedConversations.length} conversation{archivedConversations.length !== 1 ? 's' : ''}
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
                    : 'No conversations yet'
                  }
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {showArchived 
                    ? 'Archived conversations will appear here' 
                    : searchQuery 
                    ? 'Try a different search term' 
                    : 'Start messaging candidates'
                  }
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`relative w-full flex items-center border-b border-gray-100 group ${
                    selectedConversationId === contact.id 
                      ? 'bg-primary-50 border-l-4 border-l-primary-600' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
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
                      <p className="text-sm text-gray-600 truncate">
                        {contact.lastMessage}
                      </p>
                    </div>
                    {contact.unread > 0 && (
                      <div className="flex-shrink-0 min-w-[22px] h-6 px-2 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {contact.unread > 9 ? '9+' : contact.unread}
                      </div>
                    )}
                  </button>
                  
                  {/* Archive Menu Button */}
                  <div className="relative pr-2" ref={showMenu === contact.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === contact.id ? null : contact.id);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="More options"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMenu === contact.id && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={() => handleToggleArchive(contact.id, !showArchived)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          {showArchived ? (
                            <>
                              <ArrowUturnLeftIcon className="w-5 h-5 text-gray-500" />
                              <span>Unarchive Conversation</span>
                            </>
                          ) : (
                            <>
                              <ArchiveBoxIcon className="w-5 h-5 text-gray-500" />
                              <span>Archive Conversation</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
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
                    <p className="text-sm text-primary-600 font-medium">{currentChat.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 hover:bg-gray-100 rounded-full transition-colors" title="Voice Call">
                    <PhoneIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="p-3 hover:bg-gray-100 rounded-full transition-colors" title="Video Call">
                    <VideoCameraIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="p-3 hover:bg-gray-100 rounded-full transition-colors" title="More">
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
                      <div
                        className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
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
                  ))
                )}
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
                      onChange={(e) => setMessageInput(e.target.value)}
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Select a conversation
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Choose a conversation from the list to start messaging with candidates
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

