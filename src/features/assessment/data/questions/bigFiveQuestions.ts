/**
 * Big Five Personality Inventory
 * Based on OCEAN model: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
 * 
 * @module features/assessment/data/questions/bigFiveQuestions
 */

export interface BigFiveQuestion {
  id: string;
  type: 'O' | 'C' | 'E' | 'A' | 'N';
  text: string;
}

export const bigFiveQuestions: BigFiveQuestion[] = [
  // Openness (O) - 6 questions
  { id: 'bigfive_o1', type: 'O', text: 'I enjoy exploring new ideas.' },
  { id: 'bigfive_o2', type: 'O', text: 'I like courses that challenge my thinking.' },
  { id: 'bigfive_o3', type: 'O', text: 'I\'m curious about how things can be improved.' },
  { id: 'bigfive_o4', type: 'O', text: 'I appreciate art, design, or creative work.' },
  { id: 'bigfive_o5', type: 'O', text: 'I\'m open to changing my opinions with evidence.' },
  { id: 'bigfive_o6', type: 'O', text: 'I enjoy learning beyond what is required.' },

  // Conscientiousness (C) - 6 questions
  { id: 'bigfive_c1', type: 'C', text: 'I plan my tasks before starting.' },
  { id: 'bigfive_c2', type: 'C', text: 'I finish work on time.' },
  { id: 'bigfive_c3', type: 'C', text: 'I double-check details for accuracy.' },
  { id: 'bigfive_c4', type: 'C', text: 'I set goals and work steadily toward them.' },
  { id: 'bigfive_c5', type: 'C', text: 'I keep my study/work space organized.' },
  { id: 'bigfive_c6', type: 'C', text: 'I follow through even when work is boring.' },

  // Extraversion (E) - 6 questions
  { id: 'bigfive_e1', type: 'E', text: 'I enjoy meeting new people.' },
  { id: 'bigfive_e2', type: 'E', text: 'I feel energized in group settings.' },
  { id: 'bigfive_e3', type: 'E', text: 'I speak up easily in class/meetings.' },
  { id: 'bigfive_e4', type: 'E', text: 'I like being the one to start conversations.' },
  { id: 'bigfive_e5', type: 'E', text: 'I\'m comfortable leading discussions.' },
  { id: 'bigfive_e6', type: 'E', text: 'I prefer active, fast-paced environments.' },

  // Agreeableness (A) - 6 questions
  { id: 'bigfive_a1', type: 'A', text: 'I cooperate even when opinions differ.' },
  { id: 'bigfive_a2', type: 'A', text: 'I try to be supportive to teammates.' },
  { id: 'bigfive_a3', type: 'A', text: 'I avoid being harsh or rude in conflicts.' },
  { id: 'bigfive_a4', type: 'A', text: 'I assume good intent in others.' },
  { id: 'bigfive_a5', type: 'A', text: 'I value harmony in groups.' },
  { id: 'bigfive_a6', type: 'A', text: 'I\'m willing to help without expecting returns.' },

  // Neuroticism (N) - 6 questions
  { id: 'bigfive_n1', type: 'N', text: 'I get stressed easily under pressure.' },
  { id: 'bigfive_n2', type: 'N', text: 'I worry about making mistakes.' },
  { id: 'bigfive_n3', type: 'N', text: 'I feel anxious before important tasks.' },
  { id: 'bigfive_n4', type: 'N', text: 'Small problems can upset me a lot.' },
  { id: 'bigfive_n5', type: 'N', text: 'I struggle to relax when things go wrong.' },
  { id: 'bigfive_n6', type: 'N', text: 'I take criticism personally.' }
];

export default bigFiveQuestions;
