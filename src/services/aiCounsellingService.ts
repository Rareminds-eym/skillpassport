// AI Counselling Service - OpenAI Integration

import OpenAI from 'openai';
import {
  CounsellingRequest,
  StudentContext,
  CounsellingTopicType,
  MessageRole,
} from '../types/counselling';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: For production, use a backend proxy
});

// System prompts for different counselling topics
const SYSTEM_PROMPTS: Record<CounsellingTopicType, string> = {
  academic: `You are an experienced academic counsellor at a university. Your role is to:
    - Help students with course selection and academic planning
    - Provide study strategies and time management advice
    - Guide students on academic goals and career pathways
    - Offer constructive feedback on academic performance
    - Be supportive, empathetic, and professional
    Always consider the student's background, interests, and goals when providing advice.`,

  career: `You are a professional career counsellor specializing in helping university students. Your role is to:
    - Guide students on career exploration and planning
    - Provide insights on industry trends and job market
    - Help with resume building and interview preparation
    - Suggest skill development and networking opportunities
    - Connect academic choices with career prospects
    Be practical, encouraging, and provide actionable advice.`,

  performance: `You are an academic performance advisor. Your role is to:
    - Analyze student performance data and provide insights
    - Identify strengths and areas for improvement
    - Suggest personalized learning strategies
    - Help students set realistic academic goals
    - Provide motivational support and accountability
    Be data-driven, objective, and constructive in your feedback.`,

  'mental-health': `You are a supportive university counsellor focused on student wellbeing. Your role is to:
    - Provide emotional support and stress management strategies
    - Help with work-life balance and time management
    - Offer coping mechanisms for academic pressure
    - Encourage healthy habits and self-care
    - IMPORTANT: You are NOT a licensed therapist. For serious mental health concerns, always recommend professional help
    Be compassionate, understanding, and non-judgmental.`,

  general: `You are a friendly and knowledgeable university counsellor. Your role is to:
    - Assist students with various university-related questions
    - Provide guidance on campus resources and opportunities
    - Help with general student life concerns
    - Offer advice on extracurricular activities and personal development
    - Be approachable, helpful, and informative
    Always maintain a supportive and professional tone.`,
};

// Build student context prompt
function buildStudentContextPrompt(context?: StudentContext): string {
  if (!context) return '';

  let prompt = `\n\n=== Student Information ===\n`;
  prompt += `Name: ${context.name}\n`;

  if (context.department) prompt += `Department: ${context.department}\n`;
  if (context.year) prompt += `Year: ${context.year}\n`;
  if (context.gpa) prompt += `GPA: ${context.gpa}\n`;

  if (context.enrolled_courses && context.enrolled_courses.length > 0) {
    prompt += `Enrolled Courses: ${context.enrolled_courses.join(', ')}\n`;
  }

  if (context.interests && context.interests.length > 0) {
    prompt += `Interests: ${context.interests.join(', ')}\n`;
  }

  if (context.career_goals && context.career_goals.length > 0) {
    prompt += `Career Goals: ${context.career_goals.join(', ')}\n`;
  }

  if (context.recent_performance && context.recent_performance.length > 0) {
    prompt += `Recent Performance:\n`;
    context.recent_performance.forEach((perf) => {
      prompt += `  - ${perf.subject}: ${perf.grade}\n`;
    });
  }

  prompt += `========================\n`;
  return prompt;
}

// Stream chat completion
export async function* streamCounsellingResponse(
  request: CounsellingRequest,
  conversationHistory: { role: MessageRole; content: string }[]
) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[request.topic];
    const contextPrompt = buildStudentContextPrompt(request.student_context);

    // Prepare messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt + contextPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      {
        role: 'user',
        content: request.message,
      },
    ];

    // Stream the response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error streaming counselling response:', error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
    throw error;
  }
}

// Non-streaming version for compatibility
export async function getCounsellingResponse(
  request: CounsellingRequest,
  conversationHistory: { role: MessageRole; content: string }[]
): Promise<string> {
  try {
    const systemPrompt = SYSTEM_PROMPTS[request.topic];
    const contextPrompt = buildStudentContextPrompt(request.student_context);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt + contextPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      {
        role: 'user',
        content: request.message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error getting counselling response:', error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
    throw error;
  }
}

// Generate session summary
export async function generateSessionSummary(
  messages: { role: MessageRole; content: string }[],
  topic: CounsellingTopicType
): Promise<string> {
  try {
    const conversation = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an assistant that creates concise summaries of counselling sessions. 
          Create a brief summary (3-4 sentences) highlighting key topics discussed, advice given, and any action items.`,
        },
        {
          role: 'user',
          content: `Summarize this ${topic} counselling session:\n\n${conversation}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || 'No summary available';
  } catch (error) {
    console.error('Error generating session summary:', error);
    return 'Failed to generate summary';
  }
}
