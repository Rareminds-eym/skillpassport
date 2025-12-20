// Shared modules index - Export all shared functionality

// Types
export * from './types/career-ai.ts';

// Utils
export { corsHeaders } from './utils/cors.ts';
export { authenticateUser } from './utils/auth.ts';

// AI modules
export { normalizeSkill, calculateSkillSimilarity, calculateJobMatch, rankOpportunitiesByMatch, formatJobMatchForContext } from './ai/skill-matching.ts';
export { RIASEC_DESCRIPTIONS, interpretRIASEC, interpretBigFive } from './ai/riasec.ts';
export { detectIntentV2, detectIntentV2 as detectIntent } from './ai/intent-detection-v2.ts';
export { getConversationPhase, getPhaseParameters } from './ai/conversation-phase.ts';

// Safety & Memory modules
export { runGuardrails, validateResponse, detectPromptInjection, detectHarmfulContent, redactPII, isCareerRelated, getBlockedResponse } from './ai/guardrails.ts';
export { extractEntities, summarizeConversation, compressContext, buildMemoryContext, extractActionItems, detectTopicShift, getRelevantContext } from './ai/memory.ts';

// Prompt modules
export { buildFewShotExamples } from './ai/prompts/few-shot.ts';
export { buildChainOfThoughtFramework, getZeroShotTrigger, ZERO_SHOT_COT_TRIGGERS } from './ai/prompts/chain-of-thought.ts';
export { buildSelfVerificationChecklist } from './ai/prompts/verification.ts';
export { buildIntentInstructions } from './ai/prompts/intent-instructions.ts';
export { buildEnhancedSystemPrompt } from './ai/prompts/enhanced-system-prompt.ts';

// Context builders
export { buildStudentContext } from './context/student.ts';
export { buildAssessmentContext } from './context/assessment.ts';
export { buildCareerProgressContext } from './context/progress.ts';
export { buildCourseContext } from './context/courses.ts';
export { fetchOpportunities } from './context/opportunities.ts';
