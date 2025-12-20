// Career AI Agent Executor - ReAct Pattern Implementation
// Implements Reasoning + Acting loop for intelligent agent behavior

import { AgentTool, AgentContext, ToolResult, getToolByName, getToolDescriptions } from './tools.ts';

export interface AgentStep {
  thought: string;
  action?: string;
  actionInput?: Record<string, any>;
  observation?: string;
  isFinal?: boolean;
}

export interface AgentExecutionResult {
  steps: AgentStep[];
  finalAnswer: string;
  toolsUsed: string[];
  executionTime: number;
}

export interface AgentConfig {
  maxIterations: number;
  temperature: number;
  model: string;
  verbose: boolean;
}

const DEFAULT_CONFIG: AgentConfig = {
  maxIterations: 5,
  temperature: 0.3,
  model: 'openai/gpt-4o-mini',
  verbose: true
};

// ReAct Agent System Prompt
function buildAgentSystemPrompt(context: AgentContext, studentName: string): string {
  return `You are Career AI, an intelligent career assistant agent for Indian students.

<agent_identity>
You help students with: job matching, skill gap analysis, interview prep, resume review, learning paths, and career guidance.
You have access to TOOLS to fetch real data. ALWAYS use tools before answering data-related questions.
</agent_identity>

<student_context>
Name: ${studentName}
Field: ${context.studentProfile?.department || 'Not specified'}
Skills: ${context.studentProfile?.technicalSkills?.map((s: any) => s.name).join(', ') || 'None listed'}
</student_context>

<available_tools>
${getToolDescriptions()}
</available_tools>

<react_instructions>
You MUST follow the ReAct pattern:

1. **Thought**: Analyze what the user needs and what data you require
2. **Action**: Choose a tool to gather information (if needed)
3. **Observation**: Review the tool's output
4. **Repeat** if more data is needed
5. **Final Answer**: Provide a helpful, personalized response

Format your response EXACTLY like this:

Thought: [Your reasoning about what to do]
Action: [tool_name]
Action Input: {"param1": "value1", "param2": "value2"}

After receiving observation, continue with:

Thought: [Analysis of the observation]
Action: [next_tool_name] OR Final Answer: [Your complete response to the user]

IMPORTANT:
- Use tools to get REAL data, don't make up information
- Be specific and reference actual data from tool results
- Keep responses friendly and actionable
- Address the student by name (${studentName})
</react_instructions>`;
}

// Parse agent response to extract thought, action, and action input
function parseAgentResponse(response: string): AgentStep {
  const step: AgentStep = { thought: '' };
  
  // Extract Thought
  const thoughtMatch = response.match(/Thought:\s*(.+?)(?=Action:|Final Answer:|$)/s);
  if (thoughtMatch) {
    step.thought = thoughtMatch[1].trim();
  }

  // Check for Final Answer
  const finalMatch = response.match(/Final Answer:\s*(.+)/s);
  if (finalMatch) {
    step.isFinal = true;
    step.observation = finalMatch[1].trim();
    return step;
  }

  // Extract Action
  const actionMatch = response.match(/Action:\s*(\w+)/);
  if (actionMatch) {
    step.action = actionMatch[1].trim();
  }

  // Extract Action Input
  const inputMatch = response.match(/Action Input:\s*(\{[\s\S]*?\})/);
  if (inputMatch) {
    try {
      step.actionInput = JSON.parse(inputMatch[1]);
    } catch {
      step.actionInput = {};
    }
  }

  return step;
}

// Execute a single tool
async function executeTool(
  toolName: string, 
  params: Record<string, any>, 
  context: AgentContext
): Promise<ToolResult> {
  const tool = getToolByName(toolName);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }
  
  try {
    return await tool.execute(params, context);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Main agent execution loop
export async function executeAgent(
  userMessage: string,
  context: AgentContext,
  openRouterKey: string,
  config: Partial<AgentConfig> = {}
): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const steps: AgentStep[] = [];
  const toolsUsed: string[] = [];
  
  const studentName = context.studentProfile?.name?.split(' ')[0] || 'there';
  const systemPrompt = buildAgentSystemPrompt(context, studentName);
  
  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  for (let i = 0; i < cfg.maxIterations; i++) {
    // Call LLM
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: cfg.temperature,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || '';
    
    if (cfg.verbose) {
      console.log(`[Agent Step ${i + 1}]`, assistantMessage.slice(0, 200));
    }

    // Parse the response
    const step = parseAgentResponse(assistantMessage);
    steps.push(step);

    // Check if we have a final answer
    if (step.isFinal) {
      return {
        steps,
        finalAnswer: step.observation || '',
        toolsUsed,
        executionTime: Date.now() - startTime
      };
    }

    // Execute tool if action specified
    if (step.action) {
      toolsUsed.push(step.action);
      const toolResult = await executeTool(step.action, step.actionInput || {}, context);
      
      const observation = toolResult.success 
        ? `Tool returned: ${JSON.stringify(toolResult.data, null, 2).slice(0, 3000)}`
        : `Tool error: ${toolResult.error}`;
      
      step.observation = observation;

      // Add to conversation
      messages.push({ role: 'assistant', content: assistantMessage });
      messages.push({ role: 'user', content: `Observation: ${observation}\n\nContinue with your analysis.` });
    } else {
      // No action and no final answer - treat as final
      return {
        steps,
        finalAnswer: step.thought || assistantMessage,
        toolsUsed,
        executionTime: Date.now() - startTime
      };
    }
  }

  // Max iterations reached
  const lastStep = steps[steps.length - 1];
  return {
    steps,
    finalAnswer: lastStep?.observation || lastStep?.thought || 'I apologize, I could not complete the analysis. Please try again.',
    toolsUsed,
    executionTime: Date.now() - startTime
  };
}

// Simplified execution for streaming (non-agentic mode)
export async function executeSimpleChat(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: any[],
  openRouterKey: string,
  config: Partial<AgentConfig> = {}
): Promise<ReadableStream> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: cfg.temperature,
      max_tokens: 4000,
      stream: true
    })
  });

  if (!response.ok || !response.body) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  return response.body;
}
