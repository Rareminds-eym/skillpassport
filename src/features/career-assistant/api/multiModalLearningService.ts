/**
 * 📊 MULTI-MODAL LEARNING SERVICE
 *
 * Generates:
 * - Mermaid diagrams (flowcharts, architecture, sequences)
 * - Visual comparisons and tables
 * - Interactive code examples
 * - Step-by-step visual guides
 * - Learning roadmaps with visuals
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('multi-modal-learning-service');

export interface VisualLearningContent {
  textExplanation: string;
  diagram?: {
    type: 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'mindmap';
    mermaidCode: string;
    description: string;
  };
  codeExample?: {
    language: string;
    code: string;
    explanation: string;
    highlights: Array<{
      line: number;
      note: string;
    }>;
  };
  visualComparison?: {
    items: Array<{
      name: string;
      pros: string[];
      cons: string[];
      bestFor: string;
    }>;
  };
  interactiveSteps?: Array<{
    step: number;
    title: string;
    description: string;
    codeSnippet?: string;
    visualAid?: string;
  }>;
}

class MultiModalLearningService {
  
  /**
   * 📊 Generate Visual Learning Content
   * Creates diagrams, examples, and visual aids for any concept
   */
  async generateVisualContent(
    topic: string,
    context?: string,
    studentLevel?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<VisualLearningContent> {
    
    try {
      const prompt = `You are an educational content creator who makes complex concepts easy through visuals.

**TOPIC:** ${topic}
${context ? `**CONTEXT:** ${context}` : ''}
**STUDENT LEVEL:** ${studentLevel || 'intermediate'}

**YOUR TASK:**
Create multi-modal learning content that includes:

1️⃣ **Text Explanation** (Clear, concise overview)
   - What is it?
   - Why is it important?
   - Key concepts

2️⃣ **Diagram** (If applicable - most topics benefit from visuals)
   Choose best diagram type:
   - **flowchart**: For processes, algorithms, decision flows
   - **sequence**: For interactions, API calls, system communication
   - **class**: For OOP structures, relationships
   - **er**: For database schemas, data relationships
   - **mindmap**: For concept relationships, brainstorming
   - **gantt**: For timelines, project plans
   
   Generate valid Mermaid.js code.
   
   Example flowchart:
   \`\`\`mermaid
   flowchart TD
       A[Start] --> B{Decision?}
       B -->|Yes| C[Action 1]
       B -->|No| D[Action 2]
       C --> E[End]
       D --> E
   \`\`\`

3️⃣ **Code Example** (If relevant)
   - Practical example showing the concept
   - Annotated with line-by-line highlights
   - Runnable code if possible

4️⃣ **Visual Comparison** (If comparing options)
   - Side-by-side pros/cons
   - Best use cases
   - Clear differentiation

5️⃣ **Interactive Steps** (For tutorials/how-tos)
   - Step-by-step guide
   - Code snippets per step
   - Visual aids per step

**GUIDELINES:**
- For ${studentLevel} level: ${studentLevel === 'beginner' ? 'Simpler visuals, more explanation' : studentLevel === 'advanced' ? 'Complex diagrams, less hand-holding' : 'Balanced approach'}
- Always include at least ONE visual element (diagram, comparison table, or annotated code)
- Make it ACTIONABLE and CLEAR
- Use colors in Mermaid (%%{init: {'theme':'base'}}%%)

**OUTPUT (JSON):**
{
  "textExplanation": "Clear explanation of the concept...",
  "diagram": {
    "type": "flowchart",
    "mermaidCode": "flowchart TD\\n    A[Start] --> B[Process]",
    "description": "This diagram shows the flow of..."
  },
  "codeExample": {
    "language": "javascript",
    "code": "const example = () => {\\n  // code here\\n}",
    "explanation": "This code demonstrates...",
    "highlights": [
      {"line": 2, "note": "This line does X"},
      {"line": 5, "note": "Here we handle Y"}
    ]
  },
  "visualComparison": {
    "items": [
      {
        "name": "Option A",
        "pros": ["Pro 1", "Pro 2"],
        "cons": ["Con 1"],
        "bestFor": "Use when..."
      },
      {
        "name": "Option B",
        "pros": ["Pro 1", "Pro 2"],
        "cons": ["Con 1"],
        "bestFor": "Use when..."
      }
    ]
  },
  "interactiveSteps": [
    {
      "step": 1,
      "title": "Setup",
      "description": "First, we need to...",
      "codeSnippet": "npm install package",
      "visualAid": "Shows the terminal output"
    }
  ]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. You make learning visual, interactive, and engaging. You create valid Mermaid.js diagrams and clear code examples.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return result as VisualLearningContent;

    } catch (error) {
      logger.error('Failed to generate visual learning content', error as Error, {
        topic,
        studentLevel,
        hasContext: !!context
      });
      throw new Error('Failed to generate visual learning content');
    }
  }
  
  /**
   * 🗺️ Generate Learning Roadmap with Visual Timeline
   */
  async generateLearningRoadmap(
    goal: string,
    currentSkills: string[],
    timeframe?: string
  ): Promise<{
    roadmap: string;
    timeline: string; // Mermaid gantt chart
    milestones: Array<{
      week: number;
      title: string;
      skills: string[];
      projects: string[];
    }>;
  }> {
    
    try {
      const prompt = `Create a visual learning roadmap for: ${goal}

Current Skills: ${currentSkills.join(', ') || 'Beginner'}
Timeframe: ${timeframe || '12 weeks'}

Generate:
1. Text roadmap (markdown)
2. Gantt chart timeline (Mermaid.js)
3. Weekly milestones with skills and projects

**Output (JSON):**
{
  "roadmap": "# Learning Path...\\n## Phase 1...",
  "timeline": "gantt\\n    title Learning Timeline\\n    dateFormat  YYYY-MM-DD\\n    section Phase 1\\n    Learn Basics :2024-01-01, 14d",
  "milestones": [
    {
      "week": 1,
      "title": "Fundamentals",
      "skills": ["HTML", "CSS"],
      "projects": ["Personal webpage"]
    }
  ]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You create detailed learning roadmaps with visual timelines.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(completion.choices[0]?.message?.content || '{}');

    } catch (error) {
      logger.error('Failed to generate learning roadmap', error as Error, {
        goal,
        currentSkillsCount: currentSkills.length,
        timeframe
      });
      throw new Error('Failed to generate learning roadmap');
    }
  }
  
  /**
   * 🏗️ Generate Architecture Diagram
   */
  async generateArchitectureDiagram(
    projectDescription: string,
    techStack: string[]
  ): Promise<{
    diagram: string; // Mermaid code
    explanation: string;
    components: Array<{
      name: string;
      responsibility: string;
      technology: string;
    }>;
  }> {
    
    try {
      const prompt = `Generate system architecture diagram for:

Project: ${projectDescription}
Tech Stack: ${techStack.join(', ')}

Create a Mermaid flowchart showing:
- Frontend components
- Backend services
- Database
- External APIs
- Data flow

**Output (JSON):**
{
  "diagram": "flowchart LR\\n    Client[React App] --> API[Node.js API]",
  "explanation": "This architecture shows...",
  "components": [
    {
      "name": "React Frontend",
      "responsibility": "User interface and interactions",
      "technology": "React 18 + TailwindCSS"
    }
  ]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You create clear, professional architecture diagrams.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(completion.choices[0]?.message?.content || '{}');

    } catch (error) {
      logger.error('Failed to generate architecture diagram', error as Error, {
        projectDescriptionLength: projectDescription.length,
        techStackCount: techStack.length
      });
      throw new Error('Failed to generate architecture diagram');
    }
  }
  
  /**
   * 📈 Format Response with Visuals
   * Takes text response and enhances with visuals where appropriate
   */
  formatWithVisuals(
    textResponse: string,
    visualContent: VisualLearningContent
  ): string {
    let formatted = textResponse;
    
    // Add diagram if available
    if (visualContent.diagram) {
      formatted += `\n\n### 📊 Visual Diagram\n\n`;
      formatted += `${visualContent.diagram.description}\n\n`;
      formatted += `\`\`\`mermaid\n${visualContent.diagram.mermaidCode}\n\`\`\`\n`;
    }
    
    // Add code example if available
    if (visualContent.codeExample) {
      formatted += `\n\n### 💻 Code Example\n\n`;
      formatted += `${visualContent.codeExample.explanation}\n\n`;
      formatted += `\`\`\`${visualContent.codeExample.language}\n${visualContent.codeExample.code}\n\`\`\`\n`;
      
      if (visualContent.codeExample.highlights.length > 0) {
        formatted += `\n**Key Points:**\n`;
        visualContent.codeExample.highlights.forEach(h => {
          formatted += `- Line ${h.line}: ${h.note}\n`;
        });
      }
    }
    
    // Add comparison table if available
    if (visualContent.visualComparison) {
      formatted += `\n\n### ⚖️ Comparison\n\n`;
      formatted += `| Feature | ${visualContent.visualComparison.items.map(i => i.name).join(' | ')} |\n`;
      formatted += `|---------|${visualContent.visualComparison.items.map(() => '---').join('|')}|\n`;
      
      const maxRows = Math.max(...visualContent.visualComparison.items.map(i => 
        Math.max(i.pros.length, i.cons.length)
      ));
      
      visualContent.visualComparison.items.forEach(item => {
        formatted += `| **Best For** | ${item.bestFor} |\n`;
      });
    }
    
    return formatted;
  }
}

export default new MultiModalLearningService();
