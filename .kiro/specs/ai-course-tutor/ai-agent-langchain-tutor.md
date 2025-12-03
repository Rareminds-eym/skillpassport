# Complete AI Agent - Course Tutor with LangChain & LangGraph

## Overview

This document describes a **complete AI Agent** (not just a chatbot) for course tutoring. An AI Agent can:

- ✅ **Reason** about what to do next
- ✅ **Use tools** to take actions
- ✅ **Loop** until the task is complete
- ✅ **Remember** context across interactions
- ✅ **Make decisions** autonomously

## RAG Chatbot vs AI Agent

| Feature | RAG Chatbot | AI Agent |
|---------|-------------|----------|
| Retrieves info | ✅ | ✅ |
| Answers questions | ✅ | ✅ |
| **Takes actions** | ❌ | ✅ |
| **Uses tools** | ❌ | ✅ |
| **Multi-step reasoning** | ❌ | ✅ |
| **Updates database** | ❌ | ✅ |
| **Generates quizzes** | ❌ | ✅ |
| **Tracks progress** | ❌ | ✅ |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI AGENT                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    REASONING LOOP                        │    │
│  │  User Query → Think → Decide → Act → Observe → Repeat   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       TOOLS                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Search   │ │ Quiz     │ │ Progress │ │ Resource │   │    │
│  │  │ Course   │ │ Generator│ │ Tracker  │ │ Finder   │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MEMORY (LangGraph)                    │    │
│  │  Conversation History + Student Progress + Course State  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Required Packages

```bash
npm install @langchain/core @langchain/openai @langchain/langgraph
npm install @langchain/community zod
```


---

## Part 1: Define Agent Tools

The agent needs tools to take actions. Here are the tools for our Course Tutor Agent:

### 1.1 Tool Definitions

```typescript
// src/services/agent/tools/index.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "../../../lib/supabaseClient";

// ============================================
// TOOL 1: Search Course Content
// ============================================
export const searchCourseContent = tool(
  async ({ query, courseId }) => {
    // Search lessons and modules for relevant content
    const { data: lessons } = await supabase
      .from("lessons")
      .select(`
        lesson_id,
        title,
        content,
        description,
        course_modules!inner (
          title,
          course_id
        )
      `)
      .eq("course_modules.course_id", courseId)
      .textSearch("content", query, { type: "websearch" });

    if (!lessons || lessons.length === 0) {
      return "No relevant content found for this query in the course.";
    }

    return lessons.map(l => 
      `**${l.course_modules.title} > ${l.title}**\n${l.content || l.description}`
    ).join("\n\n---\n\n");
  },
  {
    name: "search_course_content",
    description: "Search the course materials for information related to a student's question. Use this to find relevant lessons, concepts, and explanations.",
    schema: z.object({
      query: z.string().describe("The search query based on student's question"),
      courseId: z.string().describe("The course ID to search within")
    })
  }
);

// ============================================
// TOOL 2: Get Student Progress
// ============================================
export const getStudentProgress = tool(
  async ({ studentId, courseId }) => {
    const { data: progress } = await supabase
      .from("student_course_progress")
      .select(`
        status,
        completed_at,
        lessons!inner (
          title,
          course_modules!inner (
            title
          )
        )
      `)
      .eq("student_id", studentId)
      .eq("course_id", courseId);

    if (!progress || progress.length === 0) {
      return "Student has not started any lessons in this course yet.";
    }

    const completed = progress.filter(p => p.status === "completed");
    const inProgress = progress.filter(p => p.status === "in_progress");

    return `
**Student Progress Summary:**
- Completed: ${completed.length} lessons
- In Progress: ${inProgress.length} lessons

**Completed Lessons:**
${completed.map(p => `✅ ${p.lessons.course_modules.title} > ${p.lessons.title}`).join("\n")}

**Currently Working On:**
${inProgress.map(p => `📖 ${p.lessons.course_modules.title} > ${p.lessons.title}`).join("\n")}
    `.trim();
  },
  {
    name: "get_student_progress",
    description: "Get the student's learning progress in the course. Shows completed lessons and current status.",
    schema: z.object({
      studentId: z.string().describe("The student's user ID"),
      courseId: z.string().describe("The course ID")
    })
  }
);

// ============================================
// TOOL 3: Generate Quiz
// ============================================
export const generateQuiz = tool(
  async ({ lessonId, questionCount }) => {
    // Fetch lesson content
    const { data: lesson } = await supabase
      .from("lessons")
      .select("title, content, description")
      .eq("lesson_id", lessonId)
      .single();

    if (!lesson) {
      return "Could not find the lesson to generate a quiz.";
    }

    // Return a structured quiz request (the LLM will generate actual questions)
    return JSON.stringify({
      action: "generate_quiz",
      lessonTitle: lesson.title,
      lessonContent: lesson.content || lesson.description,
      questionCount: questionCount
    });
  },
  {
    name: "generate_quiz",
    description: "Generate a quiz to test the student's understanding of a lesson. Use when student asks to be tested or wants to check their knowledge.",
    schema: z.object({
      lessonId: z.string().describe("The lesson ID to generate quiz for"),
      questionCount: z.number().default(3).describe("Number of questions (1-5)")
    })
  }
);

// ============================================
// TOOL 4: Mark Lesson Complete
// ============================================
export const markLessonComplete = tool(
  async ({ studentId, courseId, lessonId }) => {
    const { error } = await supabase
      .from("student_course_progress")
      .upsert({
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        status: "completed",
        completed_at: new Date().toISOString()
      }, {
        onConflict: "student_id,course_id,lesson_id"
      });

    if (error) {
      return `Failed to mark lesson as complete: ${error.message}`;
    }

    return "✅ Lesson marked as complete! Great job on finishing this lesson.";
  },
  {
    name: "mark_lesson_complete",
    description: "Mark a lesson as completed for the student. Use when student indicates they've finished a lesson or passed a quiz.",
    schema: z.object({
      studentId: z.string().describe("The student's user ID"),
      courseId: z.string().describe("The course ID"),
      lessonId: z.string().describe("The lesson ID to mark complete")
    })
  }
);

// ============================================
// TOOL 5: Get Next Recommended Lesson
// ============================================
export const getNextLesson = tool(
  async ({ studentId, courseId }) => {
    // Get all lessons in order
    const { data: allLessons } = await supabase
      .from("lessons")
      .select(`
        lesson_id,
        title,
        order_index,
        course_modules!inner (
          module_id,
          title,
          order_index,
          course_id
        )
      `)
      .eq("course_modules.course_id", courseId)
      .order("order_index", { ascending: true });

    // Get completed lessons
    const { data: completed } = await supabase
      .from("student_course_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .eq("status", "completed");

    const completedIds = new Set(completed?.map(c => c.lesson_id) || []);

    // Find first incomplete lesson
    const nextLesson = allLessons?.find(l => !completedIds.has(l.lesson_id));

    if (!nextLesson) {
      return "🎉 Congratulations! You've completed all lessons in this course!";
    }

    return `
**Next Recommended Lesson:**
📚 Module: ${nextLesson.course_modules.title}
📖 Lesson: ${nextLesson.title}
🆔 Lesson ID: ${nextLesson.lesson_id}

Would you like me to explain this lesson or do you have questions about it?
    `.trim();
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

// ============================================
// TOOL 6: Get Lesson Resources
// ============================================
export const getLessonResources = tool(
  async ({ lessonId }) => {
    const { data: resources } = await supabase
      .from("lesson_resources")
      .select("name, type, url")
      .eq("lesson_id", lessonId);

    if (!resources || resources.length === 0) {
      return "No additional resources available for this lesson.";
    }

    return `
**Available Resources:**
${resources.map(r => `- ${r.type.toUpperCase()}: [${r.name}](${r.url})`).join("\n")}
    `.trim();
  },
  {
    name: "get_lesson_resources",
    description: "Get additional learning resources (videos, PDFs, links) for a specific lesson.",
    schema: z.object({
      lessonId: z.string().describe("The lesson ID to get resources for")
    })
  }
);

// Export all tools
export const tutorTools = [
  searchCourseContent,
  getStudentProgress,
  generateQuiz,
  markLessonComplete,
  getNextLesson,
  getLessonResources
];
```


---

## Part 2: Create the AI Agent with LangGraph

### 2.1 Agent State Definition

```typescript
// src/services/agent/state.ts
import { z } from "zod";
import { BaseMessage } from "@langchain/core/messages";

export const AgentState = z.object({
  // Conversation messages
  messages: z.array(z.custom<BaseMessage>()),
  
  // Context
  courseId: z.string(),
  courseTitle: z.string(),
  studentId: z.string(),
  currentLessonId: z.string().optional(),
  currentLessonTitle: z.string().optional(),
  
  // Agent state
  toolResults: z.array(z.any()).optional(),
  shouldContinue: z.boolean().default(true)
});

export type AgentStateType = z.infer<typeof AgentState>;
```

### 2.2 The Complete AI Agent

```typescript
// src/services/agent/tutorAgent.ts
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { 
  BaseMessage, 
  HumanMessage, 
  AIMessage, 
  SystemMessage,
  ToolMessage,
  isAIMessage 
} from "@langchain/core/messages";
import { tutorTools } from "./tools";
import { AgentState, AgentStateType } from "./state";

// Create the model with tools bound
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  streaming: true
});

// Bind tools to the model
const toolsByName = Object.fromEntries(
  tutorTools.map(tool => [tool.name, tool])
);
const modelWithTools = model.bindTools(tutorTools);

// System prompt for the tutor agent
const SYSTEM_PROMPT = `You are an intelligent AI Course Tutor Agent. You help students learn effectively.

**Your Capabilities:**
1. Search course content to answer questions
2. Track and show student progress
3. Generate quizzes to test understanding
4. Mark lessons as complete
5. Recommend next lessons
6. Provide learning resources

**Guidelines:**
- Always search course content before answering subject questions
- Be encouraging and supportive
- If a student seems stuck, offer to explain differently or provide examples
- Suggest quizzes after explaining concepts
- Celebrate progress and completions
- Keep responses concise but helpful

**Current Context:**
- Course: {courseTitle}
- Student ID: {studentId}
- Current Lesson: {currentLesson}

Think step by step about what the student needs, then use the appropriate tools.`;

// Node 1: Call the LLM
async function callModel(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const systemMessage = new SystemMessage(
    SYSTEM_PROMPT
      .replace("{courseTitle}", state.courseTitle)
      .replace("{studentId}", state.studentId)
      .replace("{currentLesson}", state.currentLessonTitle || "Not specified")
  );

  const response = await modelWithTools.invoke([
    systemMessage,
    ...state.messages
  ]);

  return {
    messages: [...state.messages, response]
  };
}

// Node 2: Execute Tools
async function executeTools(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
    return { messages: state.messages };
  }

  const toolResults: ToolMessage[] = [];

  for (const toolCall of lastMessage.tool_calls) {
    const tool = toolsByName[toolCall.name];
    
    if (!tool) {
      toolResults.push(new ToolMessage({
        tool_call_id: toolCall.id!,
        content: `Tool ${toolCall.name} not found`
      }));
      continue;
    }

    try {
      // Inject context into tool args
      const args = {
        ...toolCall.args,
        courseId: toolCall.args.courseId || state.courseId,
        studentId: toolCall.args.studentId || state.studentId
      };

      const result = await tool.invoke(args);
      
      toolResults.push(new ToolMessage({
        tool_call_id: toolCall.id!,
        content: typeof result === "string" ? result : JSON.stringify(result)
      }));
    } catch (error: any) {
      toolResults.push(new ToolMessage({
        tool_call_id: toolCall.id!,
        content: `Error executing tool: ${error.message}`
      }));
    }
  }

  return {
    messages: [...state.messages, ...toolResults]
  };
}

// Conditional edge: Should continue or end?
function shouldContinue(state: AgentStateType): "tools" | "end" {
  const lastMessage = state.messages[state.messages.length - 1];

  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "end";
}

// Build the Agent Graph
export function createTutorAgent() {
  const checkpointer = new MemorySaver();

  const workflow = new StateGraph(AgentState)
    // Add nodes
    .addNode("agent", callModel)
    .addNode("tools", executeTools)
    
    // Add edges
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


---

## Part 3: Agent Service Layer

### 3.1 Agent Service with Streaming

```typescript
// src/services/agent/agentService.ts
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

export interface AgentStreamEvent {
  type: "token" | "tool_start" | "tool_end" | "done" | "error";
  content?: string;
  toolName?: string;
  toolResult?: string;
}

export async function* streamAgentResponse(
  options: AgentChatOptions
): AsyncGenerator<AgentStreamEvent> {
  const {
    conversationId,
    courseId,
    courseTitle,
    studentId,
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
    studentId,
    currentLessonId,
    currentLessonTitle
  };

  try {
    // Stream with events
    for await (const event of await tutorAgent.streamEvents(input, {
      ...config,
      version: "v2"
    })) {
      // Handle different event types
      if (event.event === "on_chat_model_stream") {
        const chunk = event.data?.chunk;
        if (chunk?.content) {
          yield { type: "token", content: chunk.content };
        }
      }

      if (event.event === "on_tool_start") {
        yield { 
          type: "tool_start", 
          toolName: event.name,
          content: `🔧 Using tool: ${event.name}...`
        };
      }

      if (event.event === "on_tool_end") {
        yield { 
          type: "tool_end", 
          toolName: event.name,
          toolResult: event.data?.output
        };
      }
    }

    yield { type: "done" };
  } catch (error: any) {
    yield { type: "error", content: error.message };
  }
}

// Non-streaming version for simple use cases
export async function invokeAgent(options: AgentChatOptions) {
  const {
    conversationId,
    courseId,
    courseTitle,
    studentId,
    currentLessonId,
    currentLessonTitle,
    message
  } = options;

  const config = {
    configurable: { thread_id: conversationId }
  };

  const result = await tutorAgent.invoke({
    messages: [new HumanMessage(message)],
    courseId,
    courseTitle,
    studentId,
    currentLessonId,
    currentLessonTitle
  }, config);

  // Get the last AI message
  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage.content;
}
```

### 3.2 Get Conversation History

```typescript
// src/services/agent/historyService.ts
import { tutorAgent } from "./tutorAgent";

export async function getAgentHistory(conversationId: string) {
  const config = { configurable: { thread_id: conversationId } };
  const state = await tutorAgent.getState(config);
  
  return state.values?.messages?.map(msg => ({
    role: msg._getType(),
    content: msg.content,
    toolCalls: msg.tool_calls || []
  })) || [];
}

export async function clearAgentHistory(conversationId: string) {
  const config = { configurable: { thread_id: conversationId } };
  // LangGraph doesn't have a direct clear, but you can start fresh
  // by using a new thread_id
  return true;
}
```


---

## Part 4: Supabase Edge Function for Agent

### 4.1 Edge Function Implementation

```typescript
// supabase/functions/ai-tutor-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatOpenAI } from "npm:@langchain/openai";
import { tool } from "npm:@langchain/core/tools";
import { 
  HumanMessage, 
  SystemMessage, 
  ToolMessage,
  isAIMessage 
} from "npm:@langchain/core/messages";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define Tools
const searchCourse = tool(
  async ({ query, courseId }) => {
    const { data } = await supabase
      .from("lessons")
      .select("title, content, course_modules!inner(title, course_id)")
      .eq("course_modules.course_id", courseId)
      .textSearch("content", query);
    
    if (!data?.length) return "No relevant content found.";
    return data.map(l => `**${l.title}**\n${l.content}`).join("\n\n");
  },
  {
    name: "search_course",
    description: "Search course content for relevant information",
    schema: z.object({
      query: z.string(),
      courseId: z.string()
    })
  }
);

const getProgress = tool(
  async ({ studentId, courseId }) => {
    const { data } = await supabase
      .from("student_course_progress")
      .select("status, lessons(title)")
      .eq("student_id", studentId)
      .eq("course_id", courseId);
    
    const completed = data?.filter(p => p.status === "completed") || [];
    return `Completed ${completed.length} lessons: ${completed.map(p => p.lessons?.title).join(", ")}`;
  },
  {
    name: "get_progress",
    description: "Get student's learning progress",
    schema: z.object({
      studentId: z.string(),
      courseId: z.string()
    })
  }
);

const markComplete = tool(
  async ({ studentId, courseId, lessonId }) => {
    await supabase.from("student_course_progress").upsert({
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId,
      status: "completed",
      completed_at: new Date().toISOString()
    });
    return "✅ Lesson marked as complete!";
  },
  {
    name: "mark_complete",
    description: "Mark a lesson as completed",
    schema: z.object({
      studentId: z.string(),
      courseId: z.string(),
      lessonId: z.string()
    })
  }
);

const tools = [searchCourse, getProgress, markComplete];
const toolsByName = Object.fromEntries(tools.map(t => [t.name, t]));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, conversationId, courseId, courseTitle, studentId, lessonId } = await req.json();

    // Create model with tools
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true,
      openAIApiKey: Deno.env.get("OPENAI_API_KEY"),
    }).bindTools(tools);

    const systemPrompt = `You are an AI Course Tutor Agent for "${courseTitle}".

You can:
1. search_course - Find relevant course content
2. get_progress - Check student's progress  
3. mark_complete - Mark lessons as done

Always search course content before answering subject questions.
Be helpful, encouraging, and suggest next steps.

Student ID: ${studentId}
Course ID: ${courseId}`;

    // Agent loop
    let messages: any[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(message)
    ];

    const encoder = new TextEncoder();
    
    const readable = new ReadableStream({
      async start(controller) {
        const MAX_ITERATIONS = 5;
        let iteration = 0;

        while (iteration < MAX_ITERATIONS) {
          iteration++;

          // Call model
          const response = await model.invoke(messages);
          messages.push(response);

          // Check for tool calls
          if (!isAIMessage(response) || !response.tool_calls?.length) {
            // No tool calls - stream final response
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "response", 
                content: response.content 
              })}\n\n`)
            );
            break;
          }

          // Execute tools
          for (const toolCall of response.tool_calls) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "tool", 
                name: toolCall.name,
                status: "running"
              })}\n\n`)
            );

            const tool = toolsByName[toolCall.name];
            const args = {
              ...toolCall.args,
              courseId,
              studentId
            };

            const result = await tool.invoke(args);
            
            messages.push(new ToolMessage({
              tool_call_id: toolCall.id!,
              content: result
            }));

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "tool", 
                name: toolCall.name,
                status: "done",
                result 
              })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```


---

## Part 5: React Frontend for Agent

### 5.1 Agent Chat Hook

```typescript
// src/hooks/useAgentChat.ts
import { useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  toolStatus?: 'running' | 'done';
  timestamp: Date;
}

interface UseAgentChatOptions {
  courseId: string;
  courseTitle: string;
  studentId: string;
  lessonId?: string;
}

export function useAgentChat(options: UseAgentChatOptions) {
  const { courseId, courseTitle, studentId, lessonId } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId] = useState(() => crypto.randomUUID());
  
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setError(null);

    // Prepare assistant message
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-agent`,
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
            courseTitle,
            studentId,
            lessonId
          }),
          signal: abortRef.current.signal
        }
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const data = JSON.parse(line.slice(6));

          if (data.type === 'tool') {
            setCurrentTool(data.status === 'running' ? data.name : null);
            
            // Add tool message
            if (data.status === 'done') {
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'tool',
                content: data.result,
                toolName: data.name,
                toolStatus: 'done',
                timestamp: new Date()
              }]);
            }
          }

          if (data.type === 'response') {
            // Update assistant message
            setMessages(prev => {
              const updated = [...prev];
              const lastAssistant = updated.findLast(m => m.role === 'assistant');
              if (lastAssistant) {
                lastAssistant.content = data.content;
              }
              return updated;
            });
          }

          if (data.type === 'done') {
            setCurrentTool(null);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsProcessing(false);
      setCurrentTool(null);
    }
  }, [courseId, courseTitle, studentId, lessonId, conversationId, isProcessing]);

  const stopProcessing = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isProcessing,
    currentTool,
    error,
    sendMessage,
    stopProcessing
  };
}
```

### 5.2 Agent Chat UI Component

```tsx
// src/components/student/AgentTutorChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Sparkles, StopCircle, Bot, User, 
  Wrench, CheckCircle, Loader2 
} from 'lucide-react';
import { useAgentChat } from '../../hooks/useAgentChat';

interface AgentTutorChatProps {
  courseId: string;
  courseTitle: string;
  studentId: string;
  lessonId?: string;
  lessonTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AgentTutorChat: React.FC<AgentTutorChatProps> = ({
  courseId,
  courseTitle,
  studentId,
  lessonId,
  lessonTitle,
  isOpen,
  onClose
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isProcessing,
    currentTool,
    error,
    sendMessage,
    stopProcessing
  } = useAgentChat({ courseId, courseTitle, studentId, lessonId });

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

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-6 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-t-2xl">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <div>
              <span className="font-semibold">AI Tutor Agent</span>
              <p className="text-xs text-white/80">{courseTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tool indicator */}
        {currentTool && (
          <div className="mt-2 flex items-center gap-2 text-xs text-white/90 bg-white/10 px-2 py-1 rounded">
            <Loader2 className="w-3 h-3 animate-spin" />
            Using: {currentTool}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bot className="w-16 h-16 mx-auto mb-3 text-indigo-200" />
            <p className="font-medium">Hi! I'm your AI Tutor Agent</p>
            <p className="text-sm mt-1">I can search lessons, track progress, and quiz you!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'tool' ? (
              // Tool result message
              <div className="max-w-[90%] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <Wrench className="w-3 h-3" />
                  <span>{msg.toolName}</span>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              // User or Assistant message
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-center text-red-500 text-sm">{error}</div>
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
            placeholder="Ask anything about the course..."
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isProcessing ? (
            <button
              type="button"
              onClick={stopProcessing}
              className="p-2 bg-red-500 text-white rounded-full"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default AgentTutorChat;
```


---

## Part 6: Example Agent Interactions

### 6.1 How the Agent Works

```
Student: "What is polymorphism?"

Agent Thinking:
1. This is a subject question → I should search course content
2. Call tool: search_course(query="polymorphism", courseId="...")

Tool Result: "**Module 3 > OOP Concepts**
Polymorphism allows objects of different classes to be treated as objects of a common parent class..."

Agent Response:
"Based on your course materials, polymorphism is a key OOP concept covered in Module 3.

**Definition:** Polymorphism allows objects of different classes to be treated as objects of a common parent class.

**Key Points:**
- Method overriding
- Method overloading
- Runtime vs compile-time polymorphism

Would you like me to quiz you on this topic? 📝"
```

### 6.2 Multi-Step Agent Example

```
Student: "How am I doing in this course?"

Agent Thinking:
1. Student wants progress info → Call get_progress tool
2. Then provide encouragement and next steps

Tool Call 1: get_progress(studentId="...", courseId="...")
Tool Result: "Completed 5 lessons: Intro, Variables, Functions, Arrays, Loops"

Agent Thinking:
3. Good progress! → Recommend next lesson

Tool Call 2: get_next_lesson(studentId="...", courseId="...")
Tool Result: "Next: Module 3 > OOP Concepts"

Agent Response:
"Great progress! 🎉

**Your Stats:**
✅ 5 lessons completed
📚 Currently on: Module 3

**Completed:**
- Introduction
- Variables
- Functions
- Arrays
- Loops

**Next Up:** OOP Concepts

You're doing fantastic! Ready to dive into Object-Oriented Programming?"
```

---

## Summary: Complete AI Agent vs RAG Chatbot

| Component | RAG Chatbot | AI Agent (This Doc) |
|-----------|-------------|---------------------|
| **Architecture** | Linear chain | Loop with reasoning |
| **Tools** | None | 6 tools defined |
| **Actions** | Only answers | Searches, tracks, marks complete |
| **Reasoning** | None | Decides what tool to use |
| **State** | Simple memory | Full state management |
| **Multi-step** | No | Yes (up to 5 iterations) |

### Files to Create

```
src/
├── services/
│   └── agent/
│       ├── tools/
│       │   └── index.ts          # All tool definitions
│       ├── state.ts              # Agent state schema
│       ├── tutorAgent.ts         # Main agent with LangGraph
│       ├── agentService.ts       # Service layer with streaming
│       └── historyService.ts     # Conversation history
├── hooks/
│   └── useAgentChat.ts           # React hook for agent
└── components/
    └── student/
        └── AgentTutorChat.tsx    # Agent chat UI

supabase/
└── functions/
    └── ai-tutor-agent/
        └── index.ts              # Edge function
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

This is now a **complete AI Agent** that can reason, use tools, and take actions! 🤖
