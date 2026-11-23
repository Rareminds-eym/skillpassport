import React, { useState } from 'react';
import { MessageSquarePlus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatConversationDate, getConversationGroup } from '../lib/dateUtils';
import type { Conversation } from '../hooks/useCareerConversations';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void | Promise<void>;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  conversationsLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}
export const ConversationSidebar: React.FC<ConversationSidebarProps> = props => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const remove = async (conversation: Conversation) => {
    if (!window.confirm('Delete this conversation?')) return;
    setDeleting(conversation.id);
    try { await props.onDeleteConversation(conversation.id); }
    finally { setDeleting(null); }
  };
  return <aside aria-label="Conversation history" className={`${props.sidebarCollapsed ? 'w-[60px]' : 'w-[280px]'} max-w-full shrink-0 h-full bg-gray-50 border-r border-gray-200 flex flex-col`}>
    <div className="p-3 border-b border-gray-200">
      {!props.sidebarCollapsed && <p className="font-semibold text-gray-900 mb-2">Career AI</p>}
      <button aria-label={props.sidebarCollapsed ? 'Expand conversation history' : 'Close conversation history'}
        aria-expanded={!props.sidebarCollapsed} onClick={props.onToggleSidebar} className="p-2 rounded-lg hover:bg-gray-200">
        {props.sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <button onClick={props.onNewConversation} aria-label="New chat" className="p-2 rounded-lg bg-gray-900 text-white flex items-center gap-2">
        <MessageSquarePlus size={20} />{!props.sidebarCollapsed && 'New Chat'}
      </button>
    </div>
    {!props.sidebarCollapsed && <div className="flex-1 overflow-y-auto p-2">
      {props.conversationsLoading && <p role="status" className="p-3 text-sm">Loading history…</p>}
      {!props.conversationsLoading && props.conversations.length === 0 && <p className="p-3 text-sm text-gray-500">No conversations loaded.</p>}
      <ul>{props.conversations.map((conversation, index) => <li key={conversation.id} className="mb-1">
        {(index === 0 || getConversationGroup(conversation.updated_at) !== getConversationGroup(props.conversations[index - 1].updated_at)) &&
          <h3 className="px-3 pt-4 pb-2 text-xs text-gray-500 uppercase">{getConversationGroup(conversation.updated_at)}</h3>}
        <div className="flex min-w-0 rounded-lg hover:bg-gray-100">
        <button onClick={() => props.onSelectConversation(conversation.id)} aria-current={props.currentConversationId === conversation.id ? 'true' : undefined}
          className={`flex-1 min-w-0 p-3 text-left text-sm rounded-lg ${props.currentConversationId === conversation.id ? 'bg-gray-200 font-medium' : ''}`}>
          <span className="block truncate">{conversation.title || 'New conversation'}</span>
          <time dateTime={conversation.updated_at} className="text-xs text-gray-500">{formatConversationDate(conversation.updated_at)}</time>
        </button>
        <button onClick={() => void remove(conversation)} disabled={deleting !== null}
          aria-label={`Delete ${conversation.title || 'conversation'}`} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"><Trash2 size={16} /></button>
        </div>
      </li>)}</ul>
      {props.hasMore && <button disabled={props.conversationsLoading} onClick={props.onLoadMore} className="w-full p-3 text-sm hover:bg-gray-100 disabled:opacity-50">Load more conversations</button>}
    </div>}
  </aside>;
};
export default ConversationSidebar;
