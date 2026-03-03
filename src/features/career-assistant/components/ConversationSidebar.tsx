import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { Conversation } from '../hooks/useCareerConversations';
import { VirtualMessage } from '../hooks/useVirtualMessage';
import { useCareerAssistantContext } from '../context/CareerAssistantContext';
import { formatConversationDate, getConversationGroup } from '../utils/dateUtils';
import { LoadingSpinner } from './LoadingSpinner';
import {
  INITIAL_VISIBLE_CONVERSATIONS,
  CONVERSATION_PRELOAD_MARGIN,
  CONVERSATION_ITEM_HEIGHT,
} from '../constants';

export const ConversationSidebar: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    sidebarCollapsed,
    onToggleSidebar,
    conversationsLoading,
    hasMore,
    onLoadMore,
  } = useCareerAssistantContext();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Memoize formatDate callback to avoid recreating on every render
  const formatDate = useCallback(formatConversationDate, []);

  // Group conversations by date with memoization
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': [],
    };

    conversations.forEach(conv => {
      const group = getConversationGroup(conv.updated_at);
      groups[group].push(conv);
    });

    return groups;
  }, [conversations]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      onDeleteConversation(id);
    }
    setMenuOpenId(null);
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-[60px] flex-shrink-0 h-full bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={onNewConversation}
          className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          title="New chat"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[280px] flex-shrink-0 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/RMLogo.webp" alt="RareMinds Logo" className="w-5 h-5" />
            <span className="font-semibold text-gray-900">Career AI</span>
          </div>
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNewConversation}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </motion.button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          Object.entries(groupedConversations).map(([group, convs]) => {
            if (convs.length === 0) return null;

            return (
              <div key={group} className="mb-4">
                <div className="px-4 py-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {group}
                  </span>
                </div>

                <AnimatePresence>
                  {convs.map((conv, convIndex) => {
                    // Virtual scrolling: Always show first 10 conversations
                    // Virtualize the rest for performance with large lists
                    const isInitialVisible = convIndex < INITIAL_VISIBLE_CONVERSATIONS;
                    
                    return (
                      <VirtualMessage
                        key={conv.id}
                        initialVisible={isInitialVisible}
                        rootMargin={CONVERSATION_PRELOAD_MARGIN}
                        defaultHeight={CONVERSATION_ITEM_HEIGHT}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          onMouseEnter={() => setHoveredId(conv.id)}
                          onMouseLeave={() => {
                            setHoveredId(null);
                            if (menuOpenId === conv.id) setMenuOpenId(null);
                          }}
                          onClick={() => onSelectConversation(conv.id)}
                          className={`mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all relative group ${
                            currentConversationId === conv.id
                              ? 'bg-gray-200'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              currentConversationId === conv.id ? 'text-gray-900' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${
                                currentConversationId === conv.id ? 'font-medium text-gray-900' : 'text-gray-700'
                              }`}>
                                {conv.title || 'New conversation'}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {formatDate(conv.updated_at)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            {(hoveredId === conv.id || menuOpenId === conv.id) && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                                  }}
                                  className="p-1 hover:bg-gray-300 rounded transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                          </motion.div>
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      {menuOpenId === conv.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute right-2 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                        >
                          <button
                            onClick={(e) => handleDelete(e, conv.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  </VirtualMessage>
                    );
                  })}
                </AnimatePresence>
              </div>
            );
          })
        )}
        
        {/* Load More Button */}
        {hasMore && !conversationsLoading && onLoadMore && (
          <div className="px-4 py-2">
            <button
              onClick={onLoadMore}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Load more conversations
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ConversationSidebar;
