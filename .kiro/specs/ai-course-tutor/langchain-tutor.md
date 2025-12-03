# LangChain AI Course Tutor - Implementation Guide

## Overview

This document provides a comprehensive guide for implementing the AI Course Tutor using LangChain.js. LangChain is a framework for building LLM-powered applications that simplifies RAG (Retrieval Augmented Generation), conversation memory, and streaming responses.

## Why LangChain for AI Tutor?

| Feature | Benefit |
|---------|---------|
| RAG | AI answers based on actual course content |
| Memory | Maintains conversation history across sessions |
| Streaming | Real-time token-by-token responses |
| Abstraction | Easy to switch between OpenAI, Anthropic, etc. |
| LangGraph | Complex stateful workflows (quiz mode, progress) |

## Required Packages

```bash
npm install @langchain/core @langchain/openai @langchain/community @langchain/langgraph
npm install @langchain/textsplitters
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ AITutorChat │  │ useTutorChat│  │ EventSource/Stream  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function + LangChain              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ ChatOpenAI   │  │ VectorStore  │  │ LangGraph Memory  │  │
│  │ (streaming)  │  │ (RAG)        │  │ (conversations)   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ courses     │  │conversations│  │ course_embeddings   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```


---

## Part 1: Course Content Indexing (RAG Setup)

### 1.1 Document Loader for Course Content

```typescript
// src/services/langchain/courseDocumentLoader.ts
import { Document } from "@langchain/core/documents";
import { supabase } from "../../lib/supabaseClient";

interface CourseContent {
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonContent: string;
  resources: string[];
}

export async function loadCourseDocuments(courseId: string): Promise<Document[]> {
  // Fetch course with modules and lessons
  const { data: course } = await supabase
    .from('courses')
    .select(`
      course_id,
      title,
      description,
      course_modules (
        module_id,
        title,
        lessons (
          lesson_id,
          title,
          content,
          description
        )
      )
    `)
    .eq('course_id', courseId)
    .single();

  if (!course) return [];

  const documents: Document[] = [];

  // Add course overview as a document
  documents.push(new Document({
    pageContent: `Course: ${course.title}\n\nDescription: ${course.description}`,
    metadata: {
      courseId: course.course_id,
      type: 'course_overview',
      title: course.title
    }
  }));

  // Add each lesson as a document
  for (const module of course.course_modules || []) {
    for (const lesson of module.lessons || []) {
      documents.push(new Document({
        pageContent: `
Module: ${module.title}
Lesson: ${lesson.title}

${lesson.content || lesson.description || ''}
        `.trim(),
        metadata: {
          courseId: course.course_id,
          moduleId: module.module_id,
          lessonId: lesson.lesson_id,
          moduleTitle: module.title,
          lessonTitle: lesson.title,
          type: 'lesson'
        }
      }));
    }
  }

  return documents;
}
```

### 1.2 Text Splitting for Large Content

```typescript
// src/services/langchain/textSplitter.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

export async function splitDocuments(documents: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,      // Characters per chunk
    chunkOverlap: 200,    // Overlap between chunks
    separators: ["\n\n", "\n", ". ", " ", ""]
  });

  const splitDocs = await splitter.splitDocuments(documents);
  return splitDocs;
}
```

### 1.3 Vector Store Setup

```typescript
// src/services/langchain/vectorStore.ts
import { MemoryVectorStore } from "@langchain/community/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// Cache for vector stores per course
const vectorStoreCache = new Map<string, MemoryVectorStore>();

export async function getVectorStore(
  courseId: string,
  documents?: Document[]
): Promise<MemoryVectorStore> {
  // Return cached if exists
  if (vectorStoreCache.has(courseId)) {
    return vectorStoreCache.get(courseId)!;
  }

  // Create embeddings instance
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
  });

  // Create vector store from documents
  if (!documents || documents.length === 0) {
    throw new Error("Documents required to create vector store");
  }

  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  // Cache it
  vectorStoreCache.set(courseId, vectorStore);

  return vectorStore;
}

export function clearVectorStoreCache(courseId?: string) {
  if (courseId) {
    vectorStoreCache.delete(courseId);
  } else {
    vectorStoreCache.clear();
  }
}
```


---

## Part 2: RAG Chain Implementation

### 2.1 Retriever Setup

```typescript
// src/services/langchain/retriever.ts
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { getVectorStore } from "./vectorStore";
import { loadCourseDocuments } from "./courseDocumentLoader";
import { splitDocuments } from "./textSplitter";

export async function getCourseRetriever(
  courseId: string,
  topK: number = 3
): Promise<VectorStoreRetriever> {
  // Load and process documents
  const rawDocs = await loadCourseDocuments(courseId);
  const splitDocs = await splitDocuments(rawDocs);
  
  // Get or create vector store
  const vectorStore = await getVectorStore(courseId, splitDocs);
  
  // Return retriever
  return vectorStore.asRetriever({
    k: topK,
    searchType: "similarity"
  });
}
```

### 2.2 RAG Chain with Course Context

```typescript
// src/services/langchain/ragChain.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { getCourseRetriever } from "./retriever";

// Format retrieved documents
function formatDocs(docs: Document[]): string {
  return docs.map((doc, i) => {
    const meta = doc.metadata;
    const location = meta.lessonTitle 
      ? `[${meta.moduleTitle} > ${meta.lessonTitle}]`
      : `[${meta.title}]`;
    return `${i + 1}. ${location}\n${doc.pageContent}`;
  }).join("\n\n---\n\n");
}

// System prompt for the tutor
const TUTOR_SYSTEM_PROMPT = `You are an AI tutor for the course: {courseTitle}

Your role is to help students understand the course material. Follow these guidelines:

1. Answer questions based ONLY on the provided course content
2. Reference specific lessons or modules when relevant
3. If the answer isn't in the course content, say "This topic isn't covered in the current course materials"
4. Be encouraging and supportive
5. Break down complex concepts into simpler explanations
6. Offer to provide examples when explaining difficult topics

Current Lesson Context: {currentLesson}

Relevant Course Content:
{context}

Conversation History:
{history}`;

const TUTOR_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", TUTOR_SYSTEM_PROMPT],
  ["human", "{question}"]
]);

export async function createRAGChain(
  courseId: string,
  courseTitle: string,
  currentLesson: string = "General"
) {
  const retriever = await getCourseRetriever(courseId);
  
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    streaming: true
  });

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
      courseTitle: () => courseTitle,
      currentLesson: () => currentLesson,
      history: (input: any) => input.history || "No previous conversation"
    },
    TUTOR_PROMPT,
    model,
    new StringOutputParser()
  ]);

  return chain;
}
```

### 2.3 Streaming RAG Response

```typescript
// src/services/langchain/streamingRAG.ts
import { createRAGChain } from "./ragChain";

export interface StreamingRAGOptions {
  courseId: string;
  courseTitle: string;
  currentLesson?: string;
  question: string;
  history?: string;
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export async function streamRAGResponse(options: StreamingRAGOptions) {
  const {
    courseId,
    courseTitle,
    currentLesson,
    question,
    history,
    onToken,
    onComplete,
    onError
  } = options;

  try {
    const chain = await createRAGChain(courseId, courseTitle, currentLesson);
    
    let fullResponse = "";
    
    const stream = await chain.stream({
      question,
      history: history || "No previous conversation"
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      onToken(chunk);
    }

    onComplete(fullResponse);
  } catch (error) {
    onError(error as Error);
  }
}
```


---

## Part 3: Conversation Memory with LangGraph

### 3.1 LangGraph Workflow for Stateful Conversations

```typescript
// src/services/langchain/tutorGraph.ts
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { getCourseRetriever } from "./retriever";

// Define the state schema
const TutorState = z.object({
  messages: z.array(z.custom<BaseMessage>()),
  courseId: z.string(),
  courseTitle: z.string(),
  currentLessonId: z.string().optional(),
  currentLessonTitle: z.string().optional(),
  retrievedContext: z.string().optional()
});

type TutorStateType = z.infer<typeof TutorState>;

// Create the model
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  streaming: true
});

// Node: Retrieve relevant course content
async function retrieveContext(state: TutorStateType): Promise<Partial<TutorStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage._getType() !== "human") {
    return {};
  }

  const retriever = await getCourseRetriever(state.courseId);
  const docs = await retriever.invoke(lastMessage.content as string);
  
  const context = docs.map((doc, i) => {
    const meta = doc.metadata;
    return `[${meta.moduleTitle || 'Course'} > ${meta.lessonTitle || 'Overview'}]\n${doc.pageContent}`;
  }).join("\n\n---\n\n");

  return { retrievedContext: context };
}

// Node: Generate AI response
async function generateResponse(state: TutorStateType): Promise<Partial<TutorStateType>> {
  const systemPrompt = `You are an AI tutor for "${state.courseTitle}".
  
Current Lesson: ${state.currentLessonTitle || 'General'}

Relevant Course Content:
${state.retrievedContext || 'No specific content retrieved'}

Guidelines:
- Answer based on course content only
- Be encouraging and helpful
- Reference specific lessons when relevant
- If unsure, say the topic isn't covered in the course`;

  const messagesWithSystem = [
    new SystemMessage(systemPrompt),
    ...state.messages
  ];

  const response = await model.invoke(messagesWithSystem);
  
  return {
    messages: [...state.messages, response]
  };
}

// Build the graph
export function createTutorGraph() {
  const checkpointer = new MemorySaver();

  const workflow = new StateGraph(TutorState)
    .addNode("retrieve", retrieveContext)
    .addNode("generate", generateResponse)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", END);

  return workflow.compile({ checkpointer });
}

// Export a singleton instance
export const tutorGraph = createTutorGraph();
```

### 3.2 Using the Graph with Thread IDs

```typescript
// src/services/langchain/tutorService.ts
import { tutorGraph } from "./tutorGraph";
import { HumanMessage } from "@langchain/core/messages";

export interface TutorChatOptions {
  conversationId: string;  // Thread ID for memory
  courseId: string;
  courseTitle: string;
  currentLessonId?: string;
  currentLessonTitle?: string;
  message: string;
}

export async function* chatWithTutor(options: TutorChatOptions) {
  const {
    conversationId,
    courseId,
    courseTitle,
    currentLessonId,
    currentLessonTitle,
    message
  } = options;

  const config = {
    configurable: { thread_id: conversationId }
  };

  const input = {
    messages: [new HumanMessage(message)],
    courseId,
    courseTitle,
    currentLessonId,
    currentLessonTitle
  };

  // Stream the response
  for await (const chunk of await tutorGraph.stream(input, {
    ...config,
    streamMode: "messages"
  })) {
    // Yield each token as it arrives
    if (chunk[0]?.content) {
      yield chunk[0].content;
    }
  }
}

// Get conversation history
export async function getConversationHistory(conversationId: string) {
  const config = { configurable: { thread_id: conversationId } };
  const state = await tutorGraph.getState(config);
  return state.values?.messages || [];
}
```


---

## Part 4: Supabase Edge Function Integration

### 4.1 Edge Function for AI Tutor Chat

```typescript
// supabase/functions/ai-tutor-chat/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatPromptTemplate } from "npm:@langchain/core/prompts";
import { StringOutputParser } from "npm:@langchain/core/output_parsers";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      conversationId, 
      courseId, 
      lessonId,
      history 
    } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch course context
    const { data: course } = await supabase
      .from("courses")
      .select("title, description")
      .eq("course_id", courseId)
      .single();

    // Fetch current lesson if provided
    let lessonContext = "";
    if (lessonId) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("title, content, description")
        .eq("lesson_id", lessonId)
        .single();
      
      if (lesson) {
        lessonContext = `Current Lesson: ${lesson.title}\n${lesson.content || lesson.description}`;
      }
    }

    // Create the model with streaming
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true,
      openAIApiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an AI tutor for the course "${course?.title || 'Unknown'}".

Course Description: ${course?.description || 'N/A'}

${lessonContext}

Previous Conversation:
${history || 'No previous messages'}

Guidelines:
- Help students understand course concepts
- Be encouraging and patient
- Provide examples when helpful
- If asked about topics not in the course, politely redirect`],
      ["human", "{question}"]
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Create streaming response
    const stream = await chain.stream({ question: message });

    // Return as Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        
        for await (const chunk of stream) {
          fullResponse += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`)
          );
        }

        // Save conversation to database
        await saveConversation(supabase, conversationId, courseId, lessonId, message, fullResponse);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function saveConversation(
  supabase: any,
  conversationId: string | null,
  courseId: string,
  lessonId: string | null,
  userMessage: string,
  aiResponse: string
) {
  const timestamp = new Date().toISOString();
  
  if (conversationId) {
    // Append to existing conversation
    const { data: existing } = await supabase
      .from("tutor_conversations")
      .select("messages")
      .eq("id", conversationId)
      .single();

    const messages = existing?.messages || [];
    messages.push(
      { role: "user", content: userMessage, timestamp },
      { role: "assistant", content: aiResponse, timestamp }
    );

    await supabase
      .from("tutor_conversations")
      .update({ messages, updated_at: timestamp })
      .eq("id", conversationId);
  } else {
    // Create new conversation
    await supabase
      .from("tutor_conversations")
      .insert({
        course_id: courseId,
        lesson_id: lessonId,
        messages: [
          { role: "user", content: userMessage, timestamp },
          { role: "assistant", content: aiResponse, timestamp }
        ]
      });
  }
}
```


---

## Part 5: Frontend React Components

### 5.1 Custom Hook for Tutor Chat

```typescript
// src/hooks/useTutorChat.ts
import { useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseTutorChatOptions {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
}

export function useTutorChat(options: UseTutorChatOptions) {
  const { courseId, courseTitle, lessonId } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    // Prepare assistant message placeholder
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      // Build history string
      const history = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            message: content,
            conversationId,
            courseId,
            lessonId,
            history
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.token) {
              // Update assistant message with new token
              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content += data.token;
                }
                return updated;
              });
            }
            
            if (data.done && data.conversationId) {
              setConversationId(data.conversationId);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        // Remove empty assistant message on error
        setMessages(prev => prev.filter(m => m.content !== ''));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [courseId, lessonId, conversationId, messages, isStreaming]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    stopStreaming,
    clearChat
  };
}
```

### 5.2 AI Tutor Chat Component

```tsx
// src/components/student/AITutorChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Sparkles, StopCircle, Trash2, 
  BookOpen, Loader2 
} from 'lucide-react';
import { useTutorChat } from '../../hooks/useTutorChat';

interface AITutorChatProps {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AITutorChat: React.FC<AITutorChatProps> = ({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  isOpen,
  onClose
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearChat
  } = useTutorChat({ courseId, courseTitle, lessonId });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  // Suggested questions based on lesson
  const suggestedQuestions = [
    `Explain the main concepts in ${lessonTitle || 'this lesson'}`,
    "Can you give me an example?",
    "What should I focus on?",
    "Quiz me on this topic"
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">AI Course Tutor</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="p-1 hover:bg-white/20 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {courseTitle} {lessonTitle && `• ${lessonTitle}`}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
              <p className="font-medium">Hi! I'm your AI tutor</p>
              <p className="text-sm">Ask me anything about this course</p>
              
              {/* Suggested Questions */}
              <div className="mt-4 space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && isStreaming && msg.content === '' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
            </div>
          ))}
          
          {error && (
            <div className="text-center text-red-500 text-sm py-2">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isStreaming}
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default AITutorChat;
```


### 5.3 Floating AI Tutor Button

```tsx
// src/components/student/AITutorButton.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import AITutorChat from './AITutorChat';

interface AITutorButtonProps {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
}

const AITutorButton: React.FC<AITutorButtonProps> = ({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-40"
      >
        <Sparkles className="w-6 h-6" />
        
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-purple-400"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.button>

      {/* Chat Panel */}
      <AITutorChat
        courseId={courseId}
        courseTitle={courseTitle}
        lessonId={lessonId}
        lessonTitle={lessonTitle}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default AITutorButton;
```

---

## Part 6: Database Schema

### 6.1 Migration for Tutor Tables

```sql
-- supabase/migrations/ai_tutor_schema.sql

-- Tutor conversations table
CREATE TABLE tutor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(lesson_id) ON DELETE SET NULL,
  title VARCHAR(255),
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tutor_conv_student ON tutor_conversations(student_id);
CREATE INDEX idx_tutor_conv_course ON tutor_conversations(course_id);
CREATE INDEX idx_tutor_conv_lesson ON tutor_conversations(lesson_id);

-- RLS Policies
ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own conversations"
  ON tutor_conversations FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create conversations"
  ON tutor_conversations FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own conversations"
  ON tutor_conversations FOR UPDATE
  USING (student_id = auth.uid());

-- Course embeddings for RAG (optional - for production)
CREATE TABLE course_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(lesson_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Index for similarity search
CREATE INDEX idx_course_embeddings_vector 
  ON course_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_course_content(
  query_embedding vector(1536),
  match_course_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.content,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM course_embeddings ce
  WHERE ce.course_id = match_course_id
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Part 7: Advanced Features

### 7.1 Quiz Mode with LangChain

```typescript
// src/services/langchain/quizGenerator.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string()
  }))
});

const QUIZ_PROMPT = ChatPromptTemplate.fromTemplate(`
Based on the following lesson content, generate {count} multiple choice questions.

Lesson: {lessonTitle}
Content: {lessonContent}

Generate questions that test understanding of key concepts.
Each question should have 4 options with one correct answer.
Include a brief explanation for the correct answer.

Return as JSON matching this schema:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "..."
    }}
  ]
}}
`);

export async function generateQuiz(
  lessonTitle: string,
  lessonContent: string,
  questionCount: number = 5
) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7
  }).withStructuredOutput(QuizSchema);

  const chain = QUIZ_PROMPT.pipe(model);

  const result = await chain.invoke({
    lessonTitle,
    lessonContent,
    count: questionCount
  });

  return result.questions;
}
```

### 7.2 Suggested Questions Generator

```typescript
// src/services/langchain/suggestedQuestions.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const SuggestionsSchema = z.object({
  questions: z.array(z.string()).min(3).max(5)
});

const SUGGESTIONS_PROMPT = ChatPromptTemplate.fromTemplate(`
Based on this lesson content, suggest 3-5 questions a student might ask.

Lesson: {lessonTitle}
Content: {lessonContent}

Generate questions that:
1. Help clarify key concepts
2. Explore practical applications
3. Connect to related topics

Return as JSON: {{ "questions": ["...", "...", "..."] }}
`);

export async function generateSuggestedQuestions(
  lessonTitle: string,
  lessonContent: string
): Promise<string[]> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.8
  }).withStructuredOutput(SuggestionsSchema);

  const chain = SUGGESTIONS_PROMPT.pipe(model);

  const result = await chain.invoke({
    lessonTitle,
    lessonContent
  });

  return result.questions;
}
```

---

## Summary

This LangChain implementation provides:

| Component | Technology | Purpose |
|-----------|------------|---------|
| RAG | VectorStore + Retriever | Course-specific answers |
| Memory | LangGraph MemorySaver | Conversation persistence |
| Streaming | ChatOpenAI streaming | Real-time responses |
| Edge Function | Supabase + LangChain | Serverless AI backend |
| Frontend | React + useTutorChat | Interactive chat UI |
| Quiz Mode | Structured Output | Learning assessment |

### Key Files to Create

1. `src/services/langchain/` - All LangChain services
2. `src/hooks/useTutorChat.ts` - React hook for chat
3. `src/components/student/AITutorChat.tsx` - Chat UI
4. `src/components/student/AITutorButton.tsx` - Floating button
5. `supabase/functions/ai-tutor-chat/` - Edge function
6. `supabase/migrations/ai_tutor_schema.sql` - Database schema

### Environment Variables Needed

```env
OPENAI_API_KEY=sk-...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```


---

## Part 8: Complete AI Agent (Not Just a Chatbot!)

The previous sections describe a **RAG Chatbot**. Here's how to make it a **Complete AI Agent** that can:
- ✅ **Reason** about what to do
- ✅ **Use tools** to take actions
- ✅ **Loop** until task is complete
- ✅ **Remember** context

### 8.1 RAG Chatbot vs AI Agent

| Feature | RAG Chatbot | AI Agent |
|---------|-------------|----------|
| Retrieves info | ✅ | ✅ |
| Answers questions | ✅ | ✅ |
| **Takes actions** | ❌ | ✅ |
| **Uses tools** | ❌ | ✅ |
| **Multi-step reasoning** | ❌ | ✅ |
| **Decides next step** | ❌ | ✅ |

### 8.2 Define Agent Tools

```typescript
// src/services/langchain/agentTools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabaseClient";

// Tool 1: Search Course Content
const searchCourseContent = tool(
  async ({ query, courseId }) => {
    // Use vector similarity search
    const { data } = await supabase.rpc('search_course_content', {
      query_text: query,
      match_course_id: courseId,
      match_count: 3
    });
    
    if (!data || data.length === 0) {
      return "No relevant content found in the course.";
    }
    
    return data.map((d: any) => 
      `[${d.metadata.lessonTitle}]: ${d.content}`
    ).join("\n\n");
  },
  {
    name: "search_course_content",
    description: "Search for specific information in the course materials. Use this when the student asks about course topics.",
    schema: z.object({
      query: z.string().describe("The search query"),
      courseId: z.string().describe("The course ID to search in")
    })
  }
);

// Tool 2: Get Student Progress
const getStudentProgress = tool(
  async ({ studentId, courseId }) => {
    const { data } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status, completed_at')
      .eq('student_id', studentId)
      .eq('course_id', courseId);
    
    if (!data || data.length === 0) {
      return "Student has not started this course yet.";
    }
    
    const completed = data.filter(d => d.status === 'completed').length;
    const total = data.length;
    
    return `Progress: ${completed}/${total} lessons completed (${Math.round(completed/total*100)}%)`;
  },
  {
    name: "get_student_progress",
    description: "Get the student's progress in the course. Use this when asked about progress or what to study next.",
    schema: z.object({
      studentId: z.string().describe("The student's user ID"),
      courseId: z.string().describe("The course ID")
    })
  }
);

// Tool 3: Generate Quiz
const generateQuiz = tool(
  async ({ lessonId, questionCount }) => {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title, content')
      .eq('lesson_id', lessonId)
      .single();
    
    if (!lesson) return "Lesson not found.";
    
    // Return quiz generation prompt (actual generation happens in LLM)
    return `Generate ${questionCount} quiz questions about: ${lesson.title}\n\nContent: ${lesson.content?.substring(0, 1000)}`;
  },
  {
    name: "generate_quiz",
    description: "Generate a quiz to test the student's understanding. Use when student wants to be tested.",
    schema: z.object({
      lessonId: z.string().describe("The lesson ID to quiz on"),
      questionCount: z.number().default(3).describe("Number of questions")
    })
  }
);

// Tool 4: Mark Lesson Complete
const markLessonComplete = tool(
  async ({ studentId, courseId, lessonId }) => {
    const { error } = await supabase
      .from('student_course_progress')
      .upsert({
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    
    if (error) return `Error: ${error.message}`;
    return "Lesson marked as complete! Great job! 🎉";
  },
  {
    name: "mark_lesson_complete",
    description: "Mark a lesson as completed for the student. Use when student says they finished a lesson.",
    schema: z.object({
      studentId: z.string().describe("The student's user ID"),
      courseId: z.string().describe("The course ID"),
      lessonId: z.string().describe("The lesson ID to mark complete")
    })
  }
);

// Tool 5: Get Next Recommended Lesson
const getNextLesson = tool(
  async ({ studentId, courseId }) => {
    // Get completed lessons
    const { data: progress } = await supabase
      .from('student_course_progress')
      .select('lesson_id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'completed');
    
    const completedIds = progress?.map(p => p.lesson_id) || [];
    
    // Get all lessons in order
    const { data: lessons } = await supabase
      .from('lessons')
      .select(`
        lesson_id,
        title,
        course_modules!inner(course_id, order_index)
      `)
      .eq('course_modules.course_id', courseId)
      .order('order_index');
    
    // Find first incomplete lesson
    const nextLesson = lessons?.find(l => !completedIds.includes(l.lesson_id));
    
    if (!nextLesson) {
      return "Congratulations! You've completed all lessons in this course! 🎓";
    }
    
    return `Next recommended lesson: "${nextLesson.title}" (ID: ${nextLesson.lesson_id})`;
  },
  {
    name: "get_next_lesson",
    description: "Get the next recommended lesson for the student based on their progress.",
    schema: z.object({
      studentId: z.string().describe("The student's user ID"),
      courseId: z.string().describe("The course ID")
    })
  }
);

// Export all tools
export const tutorTools = [
  searchCourseContent,
  getStudentProgress,
  generateQuiz,
  markLessonComplete,
  getNextLesson
];

export const toolsByName = {
  search_course_content: searchCourseContent,
  get_student_progress: getStudentProgress,
  generate_quiz: generateQuiz,
  mark_lesson_complete: markLessonComplete,
  get_next_lesson: getNextLesson
};
```

### 8.3 Create the AI Agent with LangGraph

```typescript
// src/services/langchain/tutorAgent.ts
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { 
  BaseMessage, 
  HumanMessage, 
  AIMessage, 
  SystemMessage,
  isAIMessage,
  ToolMessage 
} from "@langchain/core/messages";
import { z } from "zod";
import { tutorTools, toolsByName } from "./agentTools";

// Define state schema
const AgentState = z.object({
  messages: z.array(z.custom<BaseMessage>()),
  courseId: z.string(),
  courseTitle: z.string(),
  studentId: z.string(),
  currentLessonId: z.string().optional(),
  currentLessonTitle: z.string().optional()
});

type AgentStateType = z.infer<typeof AgentState>;

// Create model with tools
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  streaming: true
});

const modelWithTools = model.bindTools(tutorTools);

// System prompt for the agent
const AGENT_SYSTEM_PROMPT = `You are an AI Course Tutor Agent for "{courseTitle}".

You have access to these tools:
1. search_course_content - Search course materials for information
2. get_student_progress - Check student's progress
3. generate_quiz - Create quizzes to test understanding
4. mark_lesson_complete - Mark lessons as done
5. get_next_lesson - Recommend what to study next

Current Context:
- Course: {courseTitle}
- Current Lesson: {currentLessonTitle}
- Student ID: {studentId}
- Course ID: {courseId}

Guidelines:
1. ALWAYS use search_course_content before answering course questions
2. Be encouraging and supportive
3. Offer to quiz students after explanations
4. Track progress and suggest next steps
5. If asked about topics not in the course, politely redirect

Think step by step about what tools to use.`;

// Node: Call the LLM
async function callModel(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const systemPrompt = AGENT_SYSTEM_PROMPT
    .replace('{courseTitle}', state.courseTitle)
    .replace('{currentLessonTitle}', state.currentLessonTitle || 'General')
    .replace('{studentId}', state.studentId)
    .replace('{courseId}', state.courseId);

  const response = await modelWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages
  ]);

  return { messages: [...state.messages, response] };
}

// Node: Execute tools
async function executeTools(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
    return { messages: state.messages };
  }

  const toolResults: ToolMessage[] = [];
  
  for (const toolCall of lastMessage.tool_calls) {
    const tool = toolsByName[toolCall.name as keyof typeof toolsByName];
    
    if (tool) {
      // Inject context into tool args
      const args = {
        ...toolCall.args,
        courseId: toolCall.args.courseId || state.courseId,
        studentId: toolCall.args.studentId || state.studentId
      };
      
      const result = await tool.invoke(args);
      
      toolResults.push(new ToolMessage({
        content: typeof result === 'string' ? result : JSON.stringify(result),
        tool_call_id: toolCall.id!
      }));
    }
  }

  return { messages: [...state.messages, ...toolResults] };
}

// Conditional: Should continue or end?
function shouldContinue(state: AgentStateType): "tools" | "end" {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  
  return "end";
}

// Build the agent graph
export function createTutorAgent() {
  const checkpointer = new MemorySaver();

  const workflow = new StateGraph(AgentState)
    .addNode("agent", callModel)
    .addNode("tools", executeTools)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      end: END
    })
    .addEdge("tools", "agent");  // Loop back after tool execution

  return workflow.compile({ checkpointer });
}

// Export singleton
export const tutorAgent = createTutorAgent();
```

### 8.4 Agent Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Student Question                          │
│            "What is polymorphism in this course?"           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent (LLM Call)                          │
│  Thinks: "I should search the course content first"         │
│  Decision: Call search_course_content tool                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tool Execution                            │
│  search_course_content("polymorphism", courseId)            │
│  Returns: "[OOP Module > Lesson 3]: Polymorphism is..."     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent (LLM Call)                          │
│  Now has context from course                                │
│  Decision: Generate helpful response                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Final Response                            │
│  "Based on Lesson 3 of the OOP Module, polymorphism is..."  │
│  "Would you like me to quiz you on this topic?"             │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 Using the Agent

```typescript
// src/services/langchain/useAgent.ts
import { tutorAgent } from "./tutorAgent";
import { HumanMessage } from "@langchain/core/messages";

export interface AgentChatOptions {
  conversationId: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  currentLessonId?: string;
  currentLessonTitle?: string;
  message: string;
}

export async function* chatWithAgent(options: AgentChatOptions) {
  const config = {
    configurable: { thread_id: options.conversationId }
  };

  const input = {
    messages: [new HumanMessage(options.message)],
    courseId: options.courseId,
    courseTitle: options.courseTitle,
    studentId: options.studentId,
    currentLessonId: options.currentLessonId,
    currentLessonTitle: options.currentLessonTitle
  };

  // Stream the agent's response
  for await (const event of await tutorAgent.streamEvents(input, {
    ...config,
    version: "v2"
  })) {
    if (event.event === "on_chat_model_stream") {
      const chunk = event.data.chunk;
      if (chunk.content) {
        yield { type: "token", content: chunk.content };
      }
    }
    
    if (event.event === "on_tool_start") {
      yield { type: "tool_start", tool: event.name };
    }
    
    if (event.event === "on_tool_end") {
      yield { type: "tool_end", tool: event.name, result: event.data.output };
    }
  }
}
```

### 8.6 Example Agent Interactions

**Example 1: Course Question**
```
Student: "What is polymorphism?"

Agent thinks: "I need to search the course content"
→ Calls: search_course_content("polymorphism", courseId)
→ Gets: Course content about polymorphism
→ Responds: "Based on Module 3, Lesson 2 of your course..."
```

**Example 2: Progress Check**
```
Student: "How am I doing in this course?"

Agent thinks: "I should check their progress"
→ Calls: get_student_progress(studentId, courseId)
→ Gets: "5/10 lessons completed (50%)"
→ Calls: get_next_lesson(studentId, courseId)
→ Gets: "Next: Introduction to Inheritance"
→ Responds: "You're halfway through! Next up is Inheritance..."
```

**Example 3: Quiz Request**
```
Student: "Quiz me on what I just learned"

Agent thinks: "Generate a quiz for the current lesson"
→ Calls: generate_quiz(lessonId, 3)
→ Gets: Quiz content
→ Responds: "Here's a quick quiz! Question 1: ..."
```

**Example 4: Lesson Completion**
```
Student: "I finished this lesson"

Agent thinks: "Mark the lesson as complete and suggest next"
→ Calls: mark_lesson_complete(studentId, courseId, lessonId)
→ Gets: "Lesson marked complete! 🎉"
→ Calls: get_next_lesson(studentId, courseId)
→ Gets: "Next: Advanced Topics"
→ Responds: "Great job! You've completed this lesson. Ready for Advanced Topics?"
```

---

## Summary: Chatbot vs Agent

| What We Built | Type | Capabilities |
|---------------|------|--------------|
| Parts 1-7 | RAG Chatbot | Retrieves & answers |
| Part 8 | AI Agent | Reasons, uses tools, takes actions |

The **AI Agent** is the complete solution because it can:
1. **Search** course content intelligently
2. **Track** student progress
3. **Generate** quizzes
4. **Update** completion status
5. **Recommend** next steps
6. **Loop** until the task is done

This is what makes it a true AI tutor, not just a Q&A bot!
