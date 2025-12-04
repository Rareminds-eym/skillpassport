# AI Course Tutor

An intelligent, context-aware tutoring system that provides personalized assistance to students learning course content. Built with React, Supabase Edge Functions, and powered by Grok AI.

## Features

- **Course-Aware Responses** - AI understands the full course structure including modules, lessons, and resources
- **Lesson Context** - Automatically adapts responses based on the current lesson being viewed
- **Real-time Streaming** - Token-by-token response delivery for immediate feedback
- **Reasoning Transparency** - Shows AI thinking process with Grok's reasoning tokens
- **Conversation History** - Persistent chat history with ability to continue past discussions
- **Suggested Questions** - Context-aware question suggestions based on current lesson
- **Feedback System** - Thumbs up/down feedback to improve AI responses
- **Progress Tracking** - Integrates with student progress data for personalized guidance
- **Keyboard Shortcuts** - `⌘K` to toggle panel, `Esc` to close, `Enter` to send

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌─────────────────┐  ┌─────────────┐  ┌────────────────┐   │
│  │ AITutorPanel    │  │ useTutorChat│  │ tutorService   │   │
│  │ AITutorChat     │  │ (hook)      │  │ (API client)   │   │
│  └─────────────────┘  └─────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ SSE Streaming
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                  │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ ai-tutor-chat    │  │ ai-tutor-progress│                 │
│  │ (main chat API)  │  │ (track progress) │                 │
│  ├──────────────────┤  ├──────────────────┤                 │
│  │ ai-tutor-suggest │  │ ai-tutor-feedback│                 │
│  │ (questions)      │  │ (ratings)        │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ courses         │  │ tutor_conversations             │   │
│  │ course_modules  │  │ tutor_feedback                  │   │
│  │ lessons         │  │ student_course_progress         │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenRouter API                            │
│                    (Grok 4.1 Fast)                           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Add the AI Tutor to a Course Page

```tsx
import { AITutorPanel } from '@/components/ai-tutor';

function CoursePage({ course, currentLesson }) {
  return (
    <div>
      {/* Your course content */}
      
      <AITutorPanel
        courseId={course.id}
        courseName={course.title}
        lessonContext={{
          lessonId: currentLesson?.id,
          lessonTitle: currentLesson?.title,
          moduleTitle: currentLesson?.module?.title
        }}
      />
    </div>
  );
}
```

### 2. Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge Function secrets (set in Supabase dashboard)
OPENROUTER_API_KEY=your-openrouter-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Tables

```sql
-- Conversations storage
CREATE TABLE tutor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(course_id),
  lesson_id UUID REFERENCES lessons(lesson_id),
  title TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback collection
CREATE TABLE tutor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES tutor_conversations(id),
  message_index INTEGER,
  rating INTEGER CHECK (rating IN (-1, 1)),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_feedback ENABLE ROW LEVEL SECURITY;
```

## Components

### AITutorPanel

Full-featured side panel with conversation history, suggested questions, and reasoning display.

```tsx
<AITutorPanel
  courseId="uuid"
  courseName="Introduction to React"
  lessonContext={{
    lessonId: "uuid",
    lessonTitle: "useState Hook",
    moduleTitle: "React Hooks"
  }}
  defaultExpanded={false}
/>
```

### AITutorChat

Standalone chat component for modal or embedded use.

```tsx
<AITutorChat
  courseId="uuid"
  lessonId="uuid"
  onClose={() => setShowChat(false)}
/>
```

### AITutorButton

Floating action button to trigger the chat.

```tsx
<AITutorButton
  courseId="uuid"
  lessonId="uuid"
/>
```

## Hook: useTutorChat

```tsx
const {
  messages,           // ChatMessage[]
  isLoading,          // boolean
  isStreaming,        // boolean
  isReasoning,        // boolean - AI is thinking
  currentReasoning,   // string - reasoning text
  error,              // string | null
  conversationId,     // string | null
  conversations,      // Conversation[]
  suggestedQuestions, // string[]
  sendMessage,        // (content: string) => Promise<void>
  loadConversation,   // (id: string) => Promise<void>
  startNewConversation, // () => void
  deleteConversation, // (id: string) => Promise<void>
  submitFeedback,     // (index, rating, text?) => Promise<void>
  refreshConversations,
  refreshSuggestions
} = useTutorChat({ courseId, lessonId });
```

## Edge Functions

| Function | Method | Description |
|----------|--------|-------------|
| `ai-tutor-chat` | POST | Main chat endpoint with streaming |
| `ai-tutor-suggestions` | POST | Generate suggested questions |
| `ai-tutor-progress` | GET/POST | Track student progress |
| `ai-tutor-feedback` | POST | Submit response feedback |

## AI Model

Uses **Grok 4.1 Fast** via OpenRouter with:
- Streaming responses
- Reasoning tokens (shows AI thinking)
- 10,000 max tokens
- Temperature: 0.7

## How It Works

1. **Context Building**: When a student opens the tutor, the system fetches:
   - Course title, description, code
   - All modules and lessons structure
   - Current lesson content and resources
   - Student's progress (completed lessons)

2. **System Prompt**: A detailed prompt instructs the AI to:
   - Answer based on course content only
   - Reference specific lessons/modules
   - Be encouraging and supportive
   - Redirect off-topic questions politely

3. **Streaming**: Responses stream token-by-token via SSE for immediate feedback

4. **Persistence**: Conversations are saved to Supabase with auto-generated titles

## Implementation Approaches

This project supports two implementation approaches. Choose based on your needs:

### Comparison Table

| Feature | Without LangChain (Current) | With LangChain |
|---------|----------------------------|----------------|
| **Complexity** | Simple, ~500 LOC | Complex, ~2000+ LOC |
| **Dependencies** | None (native fetch) | @langchain/core, @langchain/openai, @langchain/langgraph |
| **Latency** | Fast (~500ms) | Slower (~1-2s with RAG) |
| **Context Method** | Full course loading | RAG with vector search |
| **Best For** | Small-medium courses | Large courses (100+ lessons) |
| **Agent Tools** | Manual implementation | Built-in tool framework |
| **Memory** | Supabase storage | LangGraph checkpointer |
| **Deno Support** | ✅ Native | ⚠️ npm: imports required |
| **Maintenance** | Easy | More complex |

---

## Approach 1: Without LangChain (Recommended)

The current production implementation. Simple, fast, and reliable.

### Why This Approach?

1. **Course-sized content** - Typical courses have 10-50 lessons, which fit in context
2. **Lower latency** - No embedding/retrieval overhead
3. **Higher reliability** - No retrieval misses
4. **Simpler architecture** - Fewer moving parts
5. **Deno compatibility** - Native Edge Function support

### Architecture

```
User Message → Edge Function → Build Course Context → OpenRouter API → Stream Response
```

### Key Code (Edge Function)

```typescript
// supabase/functions/ai-tutor-chat/index.ts
serve(async (req) => {
  const { message, courseId, lessonId } = await req.json();
  
  // Build full course context
  const courseContext = await buildCourseContext(supabase, courseId, lessonId, studentId);
  const systemPrompt = buildSystemPrompt(courseContext);
  
  // Direct API call with streaming
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'x-ai/grok-4.1-fast:free',
      messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }],
      stream: true,
      reasoning: { effort: 'high' }
    })
  });
  
  // Stream SSE response
  return new Response(streamResponse(response), {
    headers: { 'Content-Type': 'text/event-stream' }
  });
});
```

### Adding Tools (Without LangChain)

Use native function calling:

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: 'x-ai/grok-4.1-fast:free',
    messages: aiMessages,
    tools: [
      {
        type: 'function',
        function: {
          name: 'mark_lesson_complete',
          description: 'Mark a lesson as completed for the student',
          parameters: {
            type: 'object',
            properties: {
              lessonId: { type: 'string', description: 'The lesson ID' }
            },
            required: ['lessonId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_quiz',
          description: 'Generate a quiz for the current lesson',
          parameters: {
            type: 'object',
            properties: {
              questionCount: { type: 'number', description: 'Number of questions' }
            }
          }
        }
      }
    ]
  })
});

// Handle tool calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    if (toolCall.function.name === 'mark_lesson_complete') {
      await supabase.from('student_course_progress').upsert({...});
    }
  }
}
```

---

## Approach 2: With LangChain

For advanced use cases requiring RAG, complex agents, or very large courses.

### When to Use LangChain

- ✅ Courses with 100+ lessons
- ✅ Need semantic search across content
- ✅ Complex multi-step agent workflows
- ✅ Multiple specialized tools
- ✅ Need to switch LLM providers frequently

### Required Packages

```bash
npm install @langchain/core @langchain/openai @langchain/langgraph
npm install @langchain/community @langchain/textsplitters zod
```

### Architecture

```
User Message → Retrieve Context (RAG) → Agent Reasoning Loop → Tool Execution → Response
                     ↓                         ↓
              Vector Store              LangGraph State
```

### RAG Setup

```typescript
// src/services/langchain/vectorStore.ts
import { MemoryVectorStore } from "@langchain/community/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function createCourseVectorStore(courseId: string, documents: Document[]) {
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  });
  
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
  return vectorStore.asRetriever({ k: 3 });
}
```

### Agent with Tools

```typescript
// src/services/langchain/tutorAgent.ts
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define tools
const searchCourse = tool(
  async ({ query, courseId }) => {
    const retriever = await getCourseRetriever(courseId);
    const docs = await retriever.invoke(query);
    return docs.map(d => d.pageContent).join("\n\n");
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

const markComplete = tool(
  async ({ studentId, lessonId }) => {
    await supabase.from('student_course_progress').upsert({
      student_id: studentId,
      lesson_id: lessonId,
      status: 'completed'
    });
    return "✅ Lesson marked complete!";
  },
  {
    name: "mark_complete",
    description: "Mark a lesson as completed",
    schema: z.object({
      studentId: z.string(),
      lessonId: z.string()
    })
  }
);

const generateQuiz = tool(
  async ({ lessonId, count }) => {
    // Returns structured data for LLM to generate questions
    const lesson = await fetchLesson(lessonId);
    return JSON.stringify({ action: 'quiz', content: lesson.content, count });
  },
  {
    name: "generate_quiz",
    description: "Generate a quiz to test understanding",
    schema: z.object({
      lessonId: z.string(),
      count: z.number().default(3)
    })
  }
);

// Create agent
const model = new ChatOpenAI({ modelName: "gpt-4o-mini", streaming: true });
const modelWithTools = model.bindTools([searchCourse, markComplete, generateQuiz]);

// Build graph
const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", executeTools)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, { tools: "tools", end: END })
  .addEdge("tools", "agent");

export const tutorAgent = workflow.compile({ checkpointer: new MemorySaver() });
```

### LangChain Edge Function

```typescript
// supabase/functions/ai-tutor-langchain/index.ts
import { ChatOpenAI } from "npm:@langchain/openai";
import { tool } from "npm:@langchain/core/tools";

serve(async (req) => {
  const { message, courseId, studentId } = await req.json();
  
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    streaming: true,
    openAIApiKey: Deno.env.get("OPENAI_API_KEY")
  }).bindTools(tools);
  
  // Agent loop
  let messages = [systemMessage, new HumanMessage(message)];
  const MAX_ITERATIONS = 5;
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await model.invoke(messages);
    messages.push(response);
    
    if (!response.tool_calls?.length) break;
    
    // Execute tools
    for (const toolCall of response.tool_calls) {
      const result = await toolsByName[toolCall.name].invoke(toolCall.args);
      messages.push(new ToolMessage({ tool_call_id: toolCall.id, content: result }));
    }
  }
  
  return streamResponse(messages[messages.length - 1].content);
});
```

### Frontend Hook for LangChain Agent

```typescript
// src/hooks/useAgentChat.ts
export function useAgentChat(options: UseAgentChatOptions) {
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  
  const sendMessage = useCallback(async (content: string) => {
    const response = await fetch('/functions/v1/ai-tutor-langchain', {
      method: 'POST',
      body: JSON.stringify({ message: content, ...options })
    });
    
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const data = JSON.parse(decoder.decode(value));
      
      if (data.type === 'tool') {
        setCurrentTool(data.status === 'running' ? data.name : null);
      }
      if (data.type === 'response') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    }
  }, [options]);
  
  return { messages, currentTool, sendMessage };
}
```

---

## Migration Path

### From Without LangChain → With LangChain

1. **Install dependencies**
   ```bash
   npm install @langchain/core @langchain/openai @langchain/langgraph
   ```

2. **Create vector store** for course content
   ```typescript
   // Run once per course update
   const docs = await loadCourseDocuments(courseId);
   const splitDocs = await splitDocuments(docs);
   await createVectorStore(courseId, splitDocs);
   ```

3. **Update Edge Function** to use LangChain agent

4. **Update frontend hook** to handle tool events

### From With LangChain → Without LangChain

1. **Remove LangChain dependencies**
2. **Replace RAG** with full context loading
3. **Replace agent** with direct API calls + native function calling
4. **Simplify frontend** to standard streaming

---

## Recommendation

| Scenario | Recommended Approach |
|----------|---------------------|
| MVP / Prototype | Without LangChain |
| Small-medium courses (<50 lessons) | Without LangChain |
| Large courses (100+ lessons) | With LangChain (RAG) |
| Need quiz generation, progress tools | Either (native tools work fine) |
| Complex multi-agent workflows | With LangChain |
| Production with minimal dependencies | Without LangChain |
| Rapid LLM provider switching | With LangChain |

**Current Implementation**: Without LangChain ✅

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Toggle panel |
| `Escape` | Close panel |
| `Enter` | Send message |
| `Shift+Enter` | New line |

## File Structure

```
src/
├── components/ai-tutor/
│   ├── index.ts
│   ├── AITutorPanel.tsx    # Main side panel
│   ├── AITutorChat.tsx     # Standalone chat
│   └── AITutorButton.tsx   # Floating button
├── hooks/
│   └── useTutorChat.ts     # Chat state management
└── services/
    └── tutorService.ts     # API client

supabase/functions/
├── ai-tutor-chat/
│   └── index.ts            # Main chat endpoint
├── ai-tutor-suggestions/
│   └── index.ts            # Question suggestions
├── ai-tutor-progress/
│   └── index.ts            # Progress tracking
└── ai-tutor-feedback/
    └── index.ts            # Feedback collection
```

## PDF/Document Content Extraction

The AI Tutor can now understand content from PDF and document resources attached to lessons.

### How It Works

1. **Upload resources** to lessons (PDFs, documents)
2. **Extract content** using the extraction Edge Function
3. **AI understands** the extracted text when answering questions

### Extract Content from Resources

```bash
# Extract content from a single resource
curl -X POST "${SUPABASE_URL}/functions/v1/extract-resource-content" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"resourceId": "uuid-of-resource"}'

# Extract content from all resources in a lesson
curl -X POST "${SUPABASE_URL}/functions/v1/extract-resource-content" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": "uuid-of-lesson"}'
```

### Database Schema Update

The `lesson_resources` table now includes a `content` column:

```sql
ALTER TABLE lesson_resources 
ADD COLUMN content TEXT;
```

### Automatic Extraction (Optional)

Set up a database trigger or webhook to automatically extract content when resources are uploaded:

```sql
-- Example: Create a function to call the extraction endpoint
CREATE OR REPLACE FUNCTION trigger_content_extraction()
RETURNS TRIGGER AS $$
BEGIN
  -- Call extraction function via pg_net or queue
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/extract-resource-content',
    body := json_build_object('resourceId', NEW.resource_id)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Supported Resource Types

| Type | Extraction Support |
|------|-------------------|
| PDF | ✅ Text extraction |
| Document | ✅ Text extraction |
| Video | ❌ (metadata only) |
| Image | ❌ (metadata only) |
| Link | ❌ (metadata only) |

---

## License

MIT
