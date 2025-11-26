/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { CheckCheck, Send } from "lucide-react";

/* ==============================
   TYPES & INTERFACES
   ============================== */
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "jpg" | "png" | "doc";
}

interface Conversation {
  id: string;
  parentName: string;
  parentAvatar?: string;
  studentName: string;
  studentClass: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: "active" | "archived";
  messages: Message[];
}

/* ==============================
   CONVERSATION LIST ITEM
   ============================== */
const ConversationItem = ({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${
        isActive 
          ? "bg-indigo-50 border-l-4 border-l-indigo-600" 
          : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {conversation.parentName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md">
              {conversation.unreadCount}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3
              className={`text-sm font-semibold truncate ${
                conversation.unreadCount > 0 ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {conversation.parentName}
            </h3>
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {conversation.lastMessageTime}
            </span>
          </div>

          <p className="text-xs text-gray-600 mb-1.5">
            {conversation.studentName} • {conversation.studentClass}
          </p>

          <p
            className={`text-xs truncate ${
              conversation.unreadCount > 0
                ? "text-gray-900 font-medium"
                : "text-gray-600"
            }`}
          >
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   MESSAGE BUBBLE
   ============================== */
const MessageBubble = ({
  message,
  isSent,
}: {
  message: Message;
  isSent: boolean;
}) => {
  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] ${
          isSent
            ? "bg-indigo-600 text-white rounded-2xl rounded-br-md"
            : "bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-200"
        } px-4 py-2.5 shadow-sm`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  isSent ? "bg-indigo-700/50" : "bg-gray-50"
                }`}
              >
                <PaperClipIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs opacity-75">{attachment.size}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <span className={`text-[11px] ${isSent ? "text-indigo-200" : "text-gray-500"}`}>
            {message.timestamp}
          </span>
          {isSent && (
            <>
              {message.isRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-indigo-200" />
              ) : (
                <CheckIcon className="h-3.5 w-3.5 text-indigo-300" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==============================
   MAIN MESSAGE CENTER COMPONENT
   ============================== */
const MessageCenter: React.FC = () => {
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      parentName: "Rajesh Kumar",
      studentName: "Ananya Kumar",
      studentClass: "10-A",
      lastMessage: "Thank you for the update on Ananya's performance.",
      lastMessageTime: "2m ago",
      unreadCount: 0,
      status: "active",
      messages: [
        {
          id: "1",
          senderId: "parent",
          text: "Hello, I wanted to ask about Ananya's recent test results.",
          timestamp: "10:30 AM",
          isRead: true,
        },
        {
          id: "2",
          senderId: "teacher",
          text: "Hello Mr. Kumar, Ananya has performed exceptionally well in the recent Math test. She scored 95/100.",
          timestamp: "10:45 AM",
          isRead: true,
        },
        {
          id: "3",
          senderId: "parent",
          text: "Thank you for the update on Ananya's performance.",
          timestamp: "11:00 AM",
          isRead: true,
        },
      ],
    },
    {
      id: "2",
      parentName: "Priya Sharma",
      studentName: "Rohan Sharma",
      studentClass: "9-B",
      lastMessage: "Is there a parent-teacher meeting scheduled?",
      lastMessageTime: "1h ago",
      unreadCount: 2,
      status: "active",
      messages: [
        {
          id: "1",
          senderId: "parent",
          text: "I need to discuss Rohan's attendance issues urgently.",
          timestamp: "Yesterday",
          isRead: true,
        },
        {
          id: "2",
          senderId: "parent",
          text: "Is there a parent-teacher meeting scheduled?",
          timestamp: "1h ago",
          isRead: false,
        },
      ],
    },
    {
      id: "3",
      parentName: "Amit Patel",
      studentName: "Diya Patel",
      studentClass: "11-C",
      lastMessage: "Acknowledged. Will ensure she completes the assignment.",
      lastMessageTime: "2h ago",
      unreadCount: 0,
      status: "active",
      messages: [
        {
          id: "1",
          senderId: "teacher",
          text: "Diya has missed submitting her English assignment. Please ensure she submits it by Friday.",
          timestamp: "3h ago",
          isRead: true,
        },
        {
          id: "2",
          senderId: "parent",
          text: "Acknowledged. Will ensure she completes the assignment.",
          timestamp: "2h ago",
          isRead: true,
        },
      ],
    },
  ]);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(conversations[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation]);

  // Filtered conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleSendMessage = () => {
    if (!messageText.trim() && attachments.length === 0) return;

    // Here you would send the message to your backend
    console.log("Sending message:", {
      text: messageText,
      attachments,
    });

    // Clear form
    setMessageText("");
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate file size (max 5MB)
      const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
      setAttachments((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 bg-indigo-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Message Center
              </h1>
              <p className="text-xs text-gray-600">
                {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  No conversations found
                </h3>
                <p className="text-xs text-gray-500">
                  Try adjusting your search
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={selectedConversation?.id === conv.id}
                  onClick={() => setSelectedConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {selectedConversation.parentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {selectedConversation.parentName}
                    </h2>
                    <p className="text-xs text-gray-600">
                      {selectedConversation.studentName} • {selectedConversation.studentClass}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Voice Call"
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Video Call"
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More Options"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {selectedConversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={message.senderId === "teacher"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-100 bg-white p-4 flex-shrink-0">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm"
                    >
                      <PaperClipIcon className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="text-indigo-900 text-xs font-medium">{file.name}</span>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-indigo-600 hover:text-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Attach file (max 5MB, PDF/JPG only)"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    maxLength={500}
                    rows={1}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                    {messageText.length}/500
                  </div>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && attachments.length === 0}
                  className="flex-shrink-0 p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
