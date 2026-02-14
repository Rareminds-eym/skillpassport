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
  { id: 'values_sec1', type: 'Security', text: 'A predictable job with steady income.' },
  { id: 'values_sec2', type: 'Security', text: 'Long-term job certainty matters to me.' },
  { id: 'values_sec3', type: 'Security', text: 'I prefer low-risk career paths.' },

  // Autonomy/Independence - 3 questions
  { id: 'values_aut1', type: 'Autonomy', text: 'Freedom to decide how I work.' },
  { id: 'values_aut2', type: 'Autonomy', text: 'I dislike being micromanaged.' },
  { id: 'values_aut3', type: 'Autonomy', text: 'I want control over my schedule.' },

  // Creativity/Innovation - 3 questions
  { id: 'values_cre1', type: 'Creativity', text: 'Chances to create new solutions.' },
  { id: 'values_cre2', type: 'Creativity', text: 'Work that lets me experiment.' },
  { id: 'values_cre3', type: 'Creativity', text: 'I need variety and originality in tasks.' },

  // Status/Recognition - 3 questions
  { id: 'values_sta1', type: 'Status', text: 'Prestige and reputation matter to me.' },
  { id: 'values_sta2', type: 'Status', text: 'I want my achievements noticed.' },
  { id: 'values_sta3', type: 'Status', text: 'I\'d like to be seen as successful.' },

  // Impact/Service - 3 questions
  { id: 'values_imp1', type: 'Impact', text: 'I want my work to improve lives.' },
  { id: 'values_imp2', type: 'Impact', text: 'I prefer roles that help society.' },
  { id: 'values_imp3', type: 'Impact', text: 'I feel motivated by meaningful contribution.' },

  // Financial Reward - 3 questions
  { id: 'values_fin1', type: 'Financial', text: 'High earning potential is a priority.' },
  { id: 'values_fin2', type: 'Financial', text: 'I\'m motivated by growth in pay.' },
  { id: 'values_fin3', type: 'Financial', text: 'I\'d like performance-linked rewards.' },

  // Leadership/Influence - 3 questions
  { id: 'values_lea1', type: 'Leadership', text: 'I want to guide teams or decisions.' },
  { id: 'values_lea2', type: 'Leadership', text: 'I see myself taking responsibility for outcomes.' },
  { id: 'values_lea3', type: 'Leadership', text: 'I enjoy influencing direction of work.' },

  // Lifestyle/Balance - 3 questions
  { id: 'values_lif1', type: 'Lifestyle', text: 'Work should fit my life priorities.' },
  { id: 'values_lif2', type: 'Lifestyle', text: 'I value time for family/health/hobbies.' },
  { id: 'values_lif3', type: 'Lifestyle', text: 'I want flexibility even if pay is lower.' }
];

export default workValuesQuestions;
