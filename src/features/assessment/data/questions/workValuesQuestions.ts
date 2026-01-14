/**
 * Work Values Questions (24 items; 3 per value)
 * Identifies what drives career satisfaction
 * 
 * @module features/assessment/data/questions/workValuesQuestions
 */

export type WorkValueType = 
  | 'Security' 
  | 'Autonomy' 
  | 'Creativity' 
  | 'Status' 
  | 'Impact' 
  | 'Financial' 
  | 'Leadership' 
  | 'Lifestyle';

export interface WorkValueQuestion {
  id: string;
  type: WorkValueType;
  text: string;
}

export const workValuesQuestions: WorkValueQuestion[] = [
  // Security/Stability - 3 questions
  { id: 'sec1', type: 'Security', text: 'A predictable job with steady income.' },
  { id: 'sec2', type: 'Security', text: 'Long-term job certainty matters to me.' },
  { id: 'sec3', type: 'Security', text: 'I prefer low-risk career paths.' },

  // Autonomy/Independence - 3 questions
  { id: 'aut1', type: 'Autonomy', text: 'Freedom to decide how I work.' },
  { id: 'aut2', type: 'Autonomy', text: 'I dislike being micromanaged.' },
  { id: 'aut3', type: 'Autonomy', text: 'I want control over my schedule.' },

  // Creativity/Innovation - 3 questions
  { id: 'cre1', type: 'Creativity', text: 'Chances to create new solutions.' },
  { id: 'cre2', type: 'Creativity', text: 'Work that lets me experiment.' },
  { id: 'cre3', type: 'Creativity', text: 'I need variety and originality in tasks.' },

  // Status/Recognition - 3 questions
  { id: 'sta1', type: 'Status', text: 'Prestige and reputation matter to me.' },
  { id: 'sta2', type: 'Status', text: 'I want my achievements noticed.' },
  { id: 'sta3', type: 'Status', text: 'I\'d like to be seen as successful.' },

  // Impact/Service - 3 questions
  { id: 'imp1', type: 'Impact', text: 'I want my work to improve lives.' },
  { id: 'imp2', type: 'Impact', text: 'I prefer roles that help society.' },
  { id: 'imp3', type: 'Impact', text: 'I feel motivated by meaningful contribution.' },

  // Financial Reward - 3 questions
  { id: 'fin1', type: 'Financial', text: 'High earning potential is a priority.' },
  { id: 'fin2', type: 'Financial', text: 'I\'m motivated by growth in pay.' },
  { id: 'fin3', type: 'Financial', text: 'I\'d like performance-linked rewards.' },

  // Leadership/Influence - 3 questions
  { id: 'lea1', type: 'Leadership', text: 'I want to guide teams or decisions.' },
  { id: 'lea2', type: 'Leadership', text: 'I see myself taking responsibility for outcomes.' },
  { id: 'lea3', type: 'Leadership', text: 'I enjoy influencing direction of work.' },

  // Lifestyle/Balance - 3 questions
  { id: 'lif1', type: 'Lifestyle', text: 'Work should fit my life priorities.' },
  { id: 'lif2', type: 'Lifestyle', text: 'I value time for family/health/hobbies.' },
  { id: 'lif3', type: 'Lifestyle', text: 'I want flexibility even if pay is lower.' }
];

export default workValuesQuestions;
