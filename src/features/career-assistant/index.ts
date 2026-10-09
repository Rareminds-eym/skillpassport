export { default as CareerAssistant } from './ui/CareerAssistant';
export { default as FloatingAIButton } from './ui/FloatingAIButton';

export { formatConversationDate } from './lib/dateUtils';

export type { EnhancedAIResponse } from './model/interactive';

export { buildOpportunitiesContext } from './lib/contextBuilder';

export { extractInDemandSkills } from './lib/contextBuilder';

export { formatMessageTime } from './lib/dateUtils';

export type { SuggestedAction } from './model/interactive';

export { buildlearnerContext } from './lib/contextBuilder';

export type { ActionButton } from './model/interactive';

export { getConversationGroup } from './lib/dateUtils';

export { streamCareerChat, fetchCareerCredits } from './api/careerWorkerService';
