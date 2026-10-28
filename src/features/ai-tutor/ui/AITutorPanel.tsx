import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  ClipboardList,
  LayoutGrid,
  Loader2,
  LogIn,
  Pencil,
  SquarePen,
  Plus,
  RefreshCw,
  Send,
  Square,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  FileText,
  Copy,
  Check,
  X,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { stripWorksheetMarkers } from '@/shared/utils';
import { useTutorChat, type GenerationUsage } from '@/features/ai-tutor/model/useTutorChat';
import WorksheetConfigPanel from './WorksheetConfigPanel';
import LessonPlanConfigPanel from './LessonPlanConfigPanel';
import WorksheetExportButton from './WorksheetExportButton';
import AssignWorksheetButton from './AssignWorksheetButton';
import FacilitatorHub from './FacilitatorHub';
import FacilitatorWelcome from './FacilitatorWelcome';
import TutorOrb from './TutorOrb';
import { FACILITATORS, type FacilitatorRole } from '../config/facilitators';
import { worksheetAction, type WorksheetContext } from '../api/worksheetService';
import LearnerWorksheets from './LearnerWorksheets';
import type { WorksheetConfig } from '../types/worksheet';
import { DEFAULT_WORKSHEET_CONFIG } from '../types/worksheet';
import type { LessonPlanConfig } from '../types';
import { DEFAULT_LESSON_PLAN_CONFIG } from '../types';

import { Link } from 'react-router-dom';
import { toast } from '@/shared/ui';

import { useUser, useUserRole } from '@/shared/model';
import { useAssistantVisibility } from '@/shared/model/assistantVisibility';
import { useLearnerType } from '@/features/ai-tutor/model';
import { getLogger } from '@/shared/config';
import { ssoClient } from '@/shared/api/ssoClient';

const logger = getLogger('ai-tutor-panel');

interface LessonContext {
  lessonId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
}

interface AITutorPanelProps {
  courseId: string;
  courseName?: string;
  lessonContext?: LessonContext;
  defaultExpanded?: boolean;
}

type AssistantTab = 'worksheet' | 'lesson-plan';

const AITutorPanel: React.FC<AITutorPanelProps> = ({
  courseId,
  courseName = 'Course',
  lessonContext,
  defaultExpanded = false
}) => {
  const user = useUser();
  const { isEducator: roleIsEducator } = useUserRole();
  const { isTeacher, loading: learnerTypeLoading } = useLearnerType(user?.id);
  const isEducator = isTeacher || roleIsEducator;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const setFacilitatorOpen = useAssistantVisibility(state => state.setFacilitatorOpen);
  useEffect(() => {
    setFacilitatorOpen(isExpanded);
    return () => setFacilitatorOpen(false);
  }, [isExpanded, setFacilitatorOpen]);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [configTool, setConfigTool] = useState<AssistantTab>('worksheet');
  const [showFacilitators, setShowFacilitators] = useState(false);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showWorksheets, setShowWorksheets] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 1 | -1>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isReasoningCollapsed, setIsReasoningCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const resize = () => {
      // The composer uses 20px line height and no padding: three lines = 60px.
      textarea.style.height = '0px';
      const contentHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(20, Math.min(60, contentHeight))}px`;
      textarea.style.overflowY = contentHeight > 60 ? 'auto' : 'hidden';
    };
    resize();
    if (typeof ResizeObserver === 'undefined') return;
    let lastWidth = textarea.getBoundingClientRect().width;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined && width !== lastWidth) {
        lastWidth = width;
        resize();
      }
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [input, isExpanded, showHistory, showWorksheets]);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isAuthenticated = !!user;

  const [teacherGenerationCount, setTeacherGenerationCount] = useState<number>(0);
  const [teacherGenerationLimit, setTeacherGenerationLimit] = useState<number>(2);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Worksheet & Lesson Plan configuration state
  const [worksheetConfig, setWorksheetConfig] = useState<WorksheetConfig>(DEFAULT_WORKSHEET_CONFIG);
  const [lessonPlanConfig, setLessonPlanConfig] = useState<LessonPlanConfig>(DEFAULT_LESSON_PLAN_CONFIG);
  const [assistantMode, setAssistantMode] = useState<AssistantTab>('worksheet');
  const [generationContext, setGenerationContext] = useState<WorksheetContext | null>(null);
  const [contextError, setContextError] = useState('');
  const [contextLoading, setContextLoading] = useState(false);
  const [contextRetry, setContextRetry] = useState(0);
  useEffect(() => {
    if (!isEducator || !isConfigExpanded) return;
    let active = true;
    setContextLoading(true); setContextError(''); setGenerationContext(null);
    worksheetAction<WorksheetContext>('context').then(data => {
      if (!active) return;
      if (!data.gradeLevel) throw new Error('No grade or program level is available in your active teaching mappings.');
      setGenerationContext(data);
      setWorksheetConfig(previous => ({ ...previous, gradeLevel: data.gradeLevel }));
      setLessonPlanConfig(previous => ({ ...previous, gradeLevel: data.gradeLevel }));
    }).catch(err => { if (active) setContextError(err.message); })
      .finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [isEducator, isConfigExpanded, courseId, contextRetry]);


  // Fetch generation count for teacher-learner accounts
  const fetchGenerationCount = useCallback(async () => {
    if (!user?.id || learnerTypeLoading || !isTeacher) {
      setIsLoadingCount(false);
      return;
    }

    setIsLoadingCount(true);
    try {
      const response = await ssoClient.fetch('/api/ai-tutor/generation-usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        logger.warn('Failed to fetch generation count', {
          status: response.status,
          statusText: response.statusText,
        });
        setTeacherGenerationCount(0);
        setIsLoadingCount(false);
        return;
      }

      const data = (await response.json()) as { used?: unknown; limit?: unknown };
      if (typeof data.used !== 'number' || typeof data.limit !== 'number') {
        setTeacherGenerationCount(0);
        setIsLoadingCount(false);
        return;
      }

      setTeacherGenerationCount(Math.max(0, Math.floor(data.used)));
      setTeacherGenerationLimit(Math.max(0, Math.floor(data.limit)));
      setIsLoadingCount(false);
    } catch (err) {
      logger.error('Error fetching generation count', err instanceof Error ? err : new Error(String(err)));
      setTeacherGenerationCount(0);
      setIsLoadingCount(false);
    }
  }, [user?.id, learnerTypeLoading, isTeacher]);

  useEffect(() => {
    fetchGenerationCount().catch((err) => {
      logger.error('Unhandled error in fetchGenerationCount', err instanceof Error ? err : new Error(String(err)));
    });
  }, [fetchGenerationCount]);

  const remainingTeacherGenerations = Math.max(0, teacherGenerationLimit - teacherGenerationCount);
  const isGenerationLocked = !learnerTypeLoading && isTeacher && teacherGenerationCount >= teacherGenerationLimit;
  const isCheckingGenerationUsage = isTeacher && (learnerTypeLoading || isLoadingCount);

  const handleGenerationUsageUpdate = useCallback((usage: GenerationUsage) => {
    try {
      if (typeof usage?.used === 'number') {
        setTeacherGenerationCount(usage.used);
      }
      if (typeof usage?.limit === 'number') {
        setTeacherGenerationLimit(usage.limit);
      }
      setIsLoadingCount(false);
    } catch (err) {
      logger.error('Failed to update generation usage', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const {
    messages,
    isLoading,
    isStreaming,
    isReasoning,
    currentReasoning,
    error,
    conversationId,
    conversations,
    suggestedQuestions,
    sendMessage,
    stopGeneration,
    editMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    submitFeedback,
    refreshConversations,
    refreshSuggestions
  } = useTutorChat({
    courseId,
    lessonId: lessonContext?.lessonId,
    worksheetConfig: isEducator && assistantMode === 'worksheet' ? worksheetConfig : undefined,
    lessonPlanConfig: isEducator && assistantMode === 'lesson-plan' ? lessonPlanConfig : undefined,
    onGenerationUsageUpdate: handleGenerationUsageUpdate
  });

  const isWelcome = isEducator && messages.length === 0 && !showFacilitators && !isConfigExpanded;
  const handleFacilitatorAction = (role: FacilitatorRole) => {
    setShowFacilitators(false);
    if (role.action === 'chat') {
      setInput(`${role.prompt}\n\nCourse: ${courseName}.`);
      inputRef.current?.focus();
    } else {
      const tool = role.action === 'lesson-plan' ? 'lesson-plan' : 'worksheet';
      if (role.action === 'differentiated') setWorksheetConfig(previous => ({ ...previous, difficultyLevels: ['low', 'medium', 'high'] }));
      setConfigTool(tool); setAssistantMode(tool); setIsConfigExpanded(true);
    }
  };

  // Handle generate for educators
  const handleGenerate = async () => {
    if (!generationContext?.gradeLevel || contextLoading || contextError || isStreaming || isGenerationLocked || isCheckingGenerationUsage || (assistantMode === 'worksheet' && worksheetConfig.difficultyLevels?.length === 0)) return;

    const generateMessage =
      assistantMode === 'worksheet'
        ? `Generate a ${(worksheetConfig.difficultyLevels ?? [worksheetConfig.difficulty]).join(", ")} level ${worksheetConfig.templateType} worksheet with ${worksheetConfig.questionCount} questions per selected difficulty level based on ${courseName}.`
        : `Generate a structured ${lessonPlanConfig.duration}-minute lesson plan for ${generationContext.gradeLevel} based on ${courseName}.`;

    setIsConfigExpanded(false);

    try {
      await sendMessage(generateMessage, { generate: true });
    } catch (err) {
      setIsConfigExpanded(true);
      toast.error('Generation failed. Check your settings and try again.');
      logger.error('Failed to generate content', err instanceof Error ? err : new Error(String(err)));
      return;
    }

    if (isTeacher) {
      try {
        await fetchGenerationCount();
      } catch (err) {
        logger.error('Failed to refetch generation count', err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + K to toggle panel, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
      if (e.key === 'Escape' && isExpanded) {
        if (isConfigExpanded) setIsConfigExpanded(false);
        else setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isConfigExpanded]);

  // Reveal a new message once; streaming never moves the reader away.
  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [messages.length]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && !showHistory && !isConfigExpanded) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, showHistory, isConfigExpanded]);

  // Refresh suggestions when lesson changes
  useEffect(() => {
    if (lessonContext?.lessonId) {
      refreshSuggestions();
    }
  }, [lessonContext?.lessonId, refreshSuggestions]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const message = input;
    setInput('');
    setShowFacilitators(false);
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (index: number, rating: 1 | -1) => {
    await submitFeedback(index, rating);
    setFeedbackGiven(prev => ({ ...prev, [index]: rating }));
    toast.success('Thank you for your feedback!');
  };

  const handleCopyText = (text: string, index: number) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(stripWorksheetMarkers(text));
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editedContent.trim() || isStreaming) return;
    await editMessage(editingMessageId, editedContent);
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    setIsDeleting(true);
    try {
      await deleteConversation(convId);
      setDeleteConfirmId(null);
      toast.success('Conversation deleted');
    } catch (err) {
      logger.error('Failed to delete conversation', err instanceof Error ? err : new Error(String(err)), { conversationId: convId });
      toast.error('Failed to delete conversation');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Markdown Custom Component Mapping (Calm, professional, no vibrant color)
  const markdownComponents: Components = {
    h1: ({ children }) => (
      <h1 className="!text-lg !leading-7 font-semibold text-slate-900 pb-2 mt-2 mb-4 tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="!text-sm !leading-6 font-semibold text-slate-900 mt-6 mb-2 tracking-normal">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="!text-sm !leading-6 font-semibold text-slate-800 mt-5 mb-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="!text-[13px] !leading-6 text-slate-600 mb-3 last:mb-0 break-words">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc marker:text-blue-700 pl-5 space-y-2 my-3 text-[13px] text-slate-600">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal marker:text-blue-700 pl-5 space-y-2 my-3 text-[13px] text-slate-600">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="!leading-6 !text-[13px] text-slate-600 break-words">
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-slate-900">
        {children}
      </strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-slate-300 bg-slate-50 pl-2.5 py-1.5 my-2 rounded-r-md text-xs italic text-slate-600">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs divide-y divide-slate-200">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-50 text-slate-800 font-semibold text-[11px]">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-slate-100 bg-white">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-50/60 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-2.5 py-1.5 font-semibold text-slate-800 text-[11px]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-2.5 py-1.5 text-slate-700 text-xs">
        {children}
      </td>
    ),
    code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) => {
      if (inline) {
        return (
          <code {...props} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
            {children}
          </code>
        );
      }
      return (
        <pre className="p-2.5 my-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto">
          <code {...props}>{children}</code>
        </pre>
      );
    }
  };

  // Collapsed Trigger Button - Professional Light Theme (No Black, No Vibrant Color)
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group flex flex-col items-center gap-2.5 bg-white text-slate-700 pl-3 pr-2.5 py-4 rounded-l-2xl shadow-lg hover:shadow-xl hover:bg-slate-50 border-y border-l border-slate-250 transition-all duration-200 hover:pl-3.5 cursor-pointer"
          aria-label={`Open ${isEducator ? 'AI Facilitator' : 'AI Tutor'}`}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span
            className="text-[11px] font-semibold text-slate-700 tracking-wider uppercase writing-mode-vertical rotate-180"
            style={{ writingMode: 'vertical-rl' }}
          >
            {isEducator ? 'AI Facilitator' : 'AI Tutor'}
          </span>
          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
            ⌘K
          </span>
        </button>

        {/* Hover Tooltip */}
        <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white text-slate-800 text-xs px-3 py-2 rounded-xl whitespace-nowrap shadow-xl border border-slate-200">
            <p className="font-semibold flex items-center gap-1.5 text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {isEducator ? 'AI Facilitators' : 'AI Course Tutor'}
            </p>
            <p className="text-slate-400 text-[10px] mt-0.5">Press ⌘K or click to toggle</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (showWorksheets && !isEducator) {
    return (
      <motion.section initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        aria-label="Course assignments"
        className="fixed right-0 top-0 h-dvh w-full sm:w-[500px] max-w-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
          <button type="button" onClick={() => setShowWorksheets(false)} aria-label="Back to AI tutor"
            className="p-1.5 hover:bg-slate-200/70 text-slate-600 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="font-semibold text-xs text-slate-900" title={courseName}>Course assignments</h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto"><LearnerWorksheets key={courseId} courseId={courseId} /></div>
      </motion.section>
    );
  }

  // Conversation History Drawer
  if (showHistory) {
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 h-dvh w-full sm:w-[500px] max-w-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
      >
        {/* History Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="p-1.5 hover:bg-slate-200/70 text-slate-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-xs text-slate-900">Conversation History</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              startNewConversation();
              setShowHistory(false);
              setShowFacilitators(false);
              setIsConfigExpanded(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
              <p className="text-xs font-semibold text-slate-700">No conversations recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Start generating or chatting to build history</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="relative">
                {deleteConfirmId === conv.id ? (
                  <div className="p-3 rounded-xl border border-red-200 bg-red-50/60">
                    <p className="text-xs text-red-700 font-medium mb-2">Delete this conversation permanently?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteConversation(conv.id)}
                        disabled={isDeleting}
                        className="flex-1 px-2.5 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={isDeleting}
                        className="flex-1 px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <button
                      type="button"
                      onClick={() => {
                        loadConversation(conv.id);
                        setShowHistory(false);
                      }}
                      className={`flex-1 min-w-0 p-3 text-left rounded-xl border transition-all ${
                        conversationId === conv.id
                          ? 'border-blue-500 bg-blue-50/40 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 truncate text-xs">{conv.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {new Set(conv.messages.map((m) => m.id)).size} messages · {conv.updatedAt.toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(conv.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    );
  }

  // Expanded Main Panel
  const panelWidthClass = 'w-full sm:w-[500px]';

  return (
    <motion.div
      initial={{ x: 440, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 440, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      role="region"
      aria-label={isEducator ? 'AI facilitator' : 'AI course tutor'}
      data-orb-pointer-area
      className={`fixed right-0 top-0 h-dvh ${panelWidthClass} max-w-full bg-slate-50/95 backdrop-blur-xl shadow-[-12px_0_48px_-24px_rgba(15,23,42,0.3)] z-50 flex flex-col border-l border-slate-200 text-slate-800 transition-[width] duration-200`}
    >
      {/* 1. Header (Clean, Professional, No Black, No Vibrant Color) */}
      <div className="bg-white/85 backdrop-blur-lg border-b border-blue-100 px-4 py-2.5 flex-shrink-0 z-20">
        <div className="flex items-center justify-between">
          {/* Left: Avatar + Title + Status */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <img src="/RMLogo.webp" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-base text-slate-900 tracking-tight">
                  {isEducator ? 'AI Facilitators' : 'AI Course Tutor'}
                </h3>
              </div>
              <div role="status" className="flex items-center gap-1.5 mt-1">
                {isStreaming ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    <span className="text-xs font-medium text-blue-800">Writing your response…</span>
                  </>
                ) : isReasoning ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-amber-700">Analyzing context...</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={lessonContext?.lessonTitle || courseName}>{lessonContext?.lessonTitle || courseName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls Toolbar */}
          <div className="flex items-center gap-0.5">
            {/* New Conversation / Reset */}
            <button
              type="button"
              onClick={() => {
                startNewConversation();
                setShowFacilitators(false);
                setIsConfigExpanded(false);
                toast.success('Started new chat');
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="New Chat"
              aria-label="Start new conversation"
            >
              <SquarePen className="w-3.5 h-3.5" />
            </button>

            {/* History */}
            {!isEducator && (
              <button type="button" onClick={() => setShowWorksheets(true)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Course assignments" aria-label="View course assignments">
                <ClipboardList className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                refreshConversations();
                setShowHistory(true);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
              title="History"
              aria-label="Conversation history"
            >
              <History className="w-3.5 h-3.5" />
              {conversations.length > 0 && (
                <span className="absolute 0.5 top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </button>

            {/* Collapse */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close facilitator"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              title="Collapse (⌘K or Esc)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Messages Stream Area */}
      <div aria-label="Conversation" aria-busy={isStreaming} className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${isWelcome ? 'bg-white/90' : 'bg-slate-50/80'} px-4 py-6 sm:px-5 space-y-6`}>
        {isEducator && isConfigExpanded ? (
          <section aria-label={configTool === 'worksheet' ? 'Create a worksheet' : 'Plan a lesson'} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="!m-0 !text-sm !font-semibold text-slate-900">{configTool === 'worksheet' ? 'Create a worksheet' : 'Plan a lesson'}</h3>
              <button type="button" aria-label="Close settings" onClick={() => { setIsConfigExpanded(false); inputRef.current?.focus(); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 !text-xs !leading-5 text-slate-500">Set up your material here. Your grade is filled from your teaching mappings.</p>
            {contextLoading && <p role="status" className="my-3 text-xs text-slate-500">Loading your teaching level...</p>}
            {contextError && <p role="alert" className="my-3 text-xs text-red-700">{contextError}<button type="button" className="ml-2 underline" onClick={() => setContextRetry(value => value + 1)}>Retry</button></p>}
            {generationContext && <p className="my-3 !text-xs !leading-5 text-slate-500">{generationContext.organization.name} ? {generationContext.learnerCount} mapped learners</p>}
            {configTool === 'worksheet' ? (
              <WorksheetConfigPanel config={{ ...worksheetConfig, gradeLevel: generationContext?.gradeLevel || '' }} onChange={setWorksheetConfig} automaticGrade
                onGenerate={handleGenerate} isGenerating={isStreaming}
                generationLimit={isTeacher ? teacherGenerationLimit : undefined}
                remainingGenerations={isTeacher ? remainingTeacherGenerations : undefined}
                isGenerationLimitReached={isGenerationLocked || !generationContext || !!contextError} isUsageLoading={isCheckingGenerationUsage || contextLoading} />
            ) : (
              <LessonPlanConfigPanel config={{ ...lessonPlanConfig, gradeLevel: generationContext?.gradeLevel || '' }} onChange={setLessonPlanConfig} automaticGrade
                onGenerate={handleGenerate} isGenerating={isStreaming}
                generationLimit={isTeacher ? teacherGenerationLimit : undefined}
                remainingGenerations={isTeacher ? remainingTeacherGenerations : undefined}
                isGenerationLimitReached={isGenerationLocked || !generationContext || !!contextError} isUsageLoading={isCheckingGenerationUsage || contextLoading} />
            )}
          </section>
        ) : !isAuthenticated ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-amber-100/80 rounded-2xl flex items-center justify-center mb-3">
              <LogIn className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 mb-1">Login Required</h4>
            <p className="text-xs text-slate-500 mb-4 max-w-xs">
              Please log in to use the AI Teaching Assistant and generate classroom materials.
            </p>
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-xs shadow-xs"
            >
              Log In
            </Link>
          </div>
        ) : isEducator && showFacilitators ? (
          <FacilitatorHub key={conversationId || 'new'} courseName={courseName} disabled={isStreaming}
            onBack={() => setShowFacilitators(false)}
            onAction={handleFacilitatorAction} />
        ) : isWelcome ? (
          <FacilitatorWelcome disabled={isStreaming} onSelectRole={id => {
            const role = FACILITATORS.find(item => item.id === id);
            if (role) handleFacilitatorAction(role);
          }} />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <TutorOrb className="!my-0 !max-w-[240px]" />
            <h4 className="mb-1 text-sm font-semibold text-slate-900">Welcome to AI Tutor</h4>
            <p className="mb-5 max-w-xs text-xs leading-relaxed text-slate-500">Ask questions, review definitions, or ask for clarifications about this lesson.</p>
            <div className="w-full space-y-1.5 text-left">{suggestedQuestions.slice(0, 3).map(question => (
              <button key={question} type="button" onClick={() => { setInput(question); inputRef.current?.focus(); }} className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs transition-colors hover:border-blue-400 hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-blue-500">
                <span className="font-medium text-slate-700">{question}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </button>
            ))}</div>
          </div>
        ) : (
          /* Message List */
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastAssistant = !isUser && index === messages.length - 1;
              const isEditing = editingMessageId === msg.id;

              // Inline Edit Mode for User Message
              if (isUser && isEditing) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="w-full max-w-[92%]">
                      <textarea
                        ref={editTextareaRef}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="w-full p-3 text-xs text-slate-800 bg-white border border-blue-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-xs"
                        rows={3}
                        placeholder="Edit message..."
                        disabled={isStreaming}
                      />
                      <div className="flex items-center justify-end gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isStreaming}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={!editedContent.trim() || isStreaming}
                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1"
                        >
                          {isStreaming && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save & Resend
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} ref={isLastAssistant ? latestMessageRef : undefined} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}>
                  {/* User Bubble (Professional Light Slate Bubble - No Black) */}
                  {isUser ? (
                    <div className="relative max-w-[88%]">
                      <div className="px-4 py-3 bg-blue-50 text-blue-950 rounded-2xl rounded-tr-sm border border-blue-100/70 text-[13px] leading-6">
                        <p className="whitespace-pre-wrap !text-[13px] !leading-6 !m-0">{msg.content}</p>
                      </div>

                      {/* Edit Button */}
                      {!isStreaming && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg.id, msg.content)}
                          className="absolute -left-7 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit message"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 text-right font-mono">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message Card (Pure Professional White Card with Clean Borders) */
                    <div className="w-full min-w-0">
                      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] relative">
                        {/* Message Header Bar */}
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-800">
                              <Sparkles className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-semibold text-slate-900">
                              {isEducator ? (msg.worksheetAvailable ? 'Resource Provider' : 'AI Facilitators') : 'AI Tutor'}
                            </span>
                          </div>

                          {isStreaming && isLastAssistant && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Streaming live</span>
                            </div>
                          )}
                        </div>

                        {/* Reasoning Accordion (Live or Completed) */}
                        {isReasoning && isLastAssistant && currentReasoning && (
                          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setIsReasoningCollapsed(!isReasoningCollapsed)}
                              className="w-full flex items-center justify-between text-amber-800 font-medium"
                            >
                              <div className="flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                                <span>Thinking Process</span>
                              </div>
                              {isReasoningCollapsed ? (
                                <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
                              )}
                            </button>
                            {!isReasoningCollapsed && (
                              <p className="text-[11px] text-amber-700 font-mono mt-1.5 whitespace-pre-wrap leading-relaxed">
                                {currentReasoning}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Message Content Rendered with Styled Markdown */}
                        {msg.content ? (
                          <div className="text-slate-800">
                            <ReactMarkdown components={markdownComponents}>
                              {stripWorksheetMarkers(msg.content, isLastAssistant && isStreaming)}
                            </ReactMarkdown>

                            {/* Real-time streaming pulse cursor */}
                            {isStreaming && isLastAssistant && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-600 animate-pulse rounded-xs align-middle" />
                            )}
                          </div>
                        ) : (
                          isStreaming && isLastAssistant && !isReasoning && (
                            <div className="flex items-center gap-1.5 py-2 text-slate-400">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          )
                        )}

                        {msg.status === 'stopped' && <p role="status" className="mt-3 !text-xs text-slate-500">Generation stopped. This response may be incomplete.</p>}
                        {/* Action Toolbar */}
                        {msg.content && msg.status !== 'streaming' && msg.status !== 'failed' && msg.status !== 'stopped' && !(isLastAssistant && (isStreaming || isLoading)) && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatTime(msg.timestamp)}
                            </span>

                            <div className="flex items-center gap-1">
                              {/* One-Click Copy */}
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.content, index)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                title="Copy content"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600 text-[11px] font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span className="text-[11px]">Copy</span>
                                  </>
                                )}
                              </button>

                              {/* Export Button (PDF / DOCX) */}
                              {isEducator && (
                                <WorksheetExportButton
                                  content={stripWorksheetMarkers(msg.content)}
                                  courseTitle={courseName}
                                  lessonTitle={lessonContext?.lessonTitle}
                                />
                              )}

                              {/* Thumbs Up / Down */}
                              <div className="flex items-center border-l border-slate-200 pl-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(index, 1)}
                                  className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${
                                    feedbackGiven[index] === 1 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                  title="Helpful"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(index, -1)}
                                  className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${
                                    feedbackGiven[index] === -1 ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                  title="Unhelpful"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {isEducator && msg.worksheetAvailable && conversationId && (
                              <div className="w-full"><AssignWorksheetButton conversationId={conversationId} messageId={msg.id} courseTitle={courseName} /></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 6. Real-Time Reasoning Alert Box (If thinking before first token) */}
      <AnimatePresence>
        {isReasoning && currentReasoning && messages.length === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50/80 border-t border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 text-amber-800">
              <Brain className="w-4 h-4 animate-pulse text-amber-600" />
              <span className="font-medium text-[11px]">Reasoning through lesson details...</span>
            </div>
            <span className="text-[10px] text-amber-600 font-mono">Live</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Error Banner */}
      {error && (
        <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700 text-xs flex-shrink-0">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 8. Professional Chat Input Bar (No Black, Clean Blue Action) */}
      <div className="px-3 pb-3 pt-1 flex-shrink-0">
        {isEducator && (
          <div role="group" aria-label="Facilitator tools" className="flex items-center gap-1 mb-1">
            <button type="button" aria-label="Explore six facilitators" aria-expanded={showFacilitators && !isConfigExpanded} disabled={isStreaming || !isAuthenticated}
              onClick={() => { setIsConfigExpanded(false); setShowFacilitators(value => !value); }}
              className="group flex h-8 items-center rounded-lg px-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:bg-blue-50 focus-visible:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"><LayoutGrid className="h-4 w-4 shrink-0" /><span aria-hidden="true" className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-24 group-focus-visible:opacity-100 motion-reduce:transition-none">Facilitators</span></button>
            {([
              { tool: 'worksheet', label: 'Worksheet', Icon: FileText },
              { tool: 'lesson-plan', label: 'Lesson Plan', Icon: BookOpen },
            ] as const).map(({ tool, label, Icon }) => (
              <button key={tool} type="button" aria-label={label} title={label}
                aria-expanded={isConfigExpanded && configTool === tool} disabled={isStreaming || !isAuthenticated}
                onClick={() => {
                  setShowFacilitators(false);
                  setConfigTool(tool);
                  setAssistantMode(tool);
                  setIsConfigExpanded(true);
                }}
                className="group flex h-8 items-center rounded-lg px-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:bg-blue-50 focus-visible:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40">
                <Icon className="h-4 w-4 shrink-0" />
                <span aria-hidden="true" className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-24 group-focus-visible:opacity-100 motion-reduce:transition-none">{label}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`relative flex items-end gap-2 bg-white border border-slate-300 rounded-[26px] pl-4 pr-1.5 ${isWelcome ? 'py-2.5' : 'py-1.5'} focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xs transition-all`}>
          {isWelcome && <Sparkles aria-hidden="true" className="mr-1 h-5 w-5 shrink-0 self-center text-primary" />}
          <textarea
            ref={inputRef}
            aria-label="Message the AI facilitator"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isAuthenticated
                ? 'Please log in to chat...'
                : isWelcome
                ? 'Ask anything about this lesson...'
                : isEducator
                ? 'Ask a question or refine your material...'
                : 'Ask anything about this lesson...'
            }
            disabled={isStreaming || !isAuthenticated}
            rows={1}
            className="flex-1 min-w-0 self-center !m-0 !border-0 !rounded-none !p-0 text-[13px] leading-5 text-slate-800 placeholder:text-slate-400 !bg-transparent resize-none !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 disabled:opacity-50 h-5 min-h-5 max-h-[60px] overflow-y-hidden"
          />

          <button
            type="button"
            onClick={isStreaming ? stopGeneration : handleSend}
            disabled={!isStreaming && (!input.trim() || !isAuthenticated)}
            aria-label={isStreaming ? 'Stop generation' : 'Send message'}
            className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-xs disabled:shadow-none"
            title={isStreaming ? 'Stop generation' : 'Send (Enter)'}
          >
            {isStreaming ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isWelcome ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>


      </div>

    </motion.div>
  );
};

export default AITutorPanel;
