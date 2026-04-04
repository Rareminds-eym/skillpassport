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
  { id: 'o1', type: 'O', text: 'I enjoy exploring new ideas.' },
  { id: 'o2', type: 'O', text: 'I like courses that challenge my thinking.' },
  { id: 'o3', type: 'O', text: 'I\'m curious about how things can be improved.' },
  { id: 'o4', type: 'O', text: 'I appreciate art, design, or creative work.' },
  { id: 'o5', type: 'O', text: 'I\'m open to changing my opinions with evidence.' },
  { id: 'o6', type: 'O', text: 'I enjoy learning beyond what is required.' },

  // Conscientiousness (C) - 6 questions
  { id: 'c1', type: 'C', text: 'I plan my tasks before starting.' },
  { id: 'c2', type: 'C', text: 'I finish work on time.' },
  { id: 'c3', type: 'C', text: 'I double-check details for accuracy.' },
  { id: 'c4', type: 'C', text: 'I set goals and work steadily toward them.' },
  { id: 'c5', type: 'C', text: 'I keep my study/work space organized.' },
  { id: 'c6', type: 'C', text: 'I follow through even when work is boring.' },

  // Extraversion (E) - 6 questions
  { id: 'e1', type: 'E', text: 'I enjoy meeting new people.' },
  { id: 'e2', type: 'E', text: 'I feel energized in group settings.' },
  { id: 'e3', type: 'E', text: 'I speak up easily in class/meetings.' },
  { id: 'e4', type: 'E', text: 'I like being the one to start conversations.' },
  { id: 'e5', type: 'E', text: 'I\'m comfortable leading discussions.' },
  { id: 'e6', type: 'E', text: 'I prefer active, fast-paced environments.' },

  // Agreeableness (A) - 6 questions
  { id: 'a1', type: 'A', text: 'I cooperate even when opinions differ.' },
  { id: 'a2', type: 'A', text: 'I try to be supportive to teammates.' },
  { id: 'a3', type: 'A', text: 'I avoid being harsh or rude in conflicts.' },
  { id: 'a4', type: 'A', text: 'I assume good intent in others.' },
  { id: 'a5', type: 'A', text: 'I value harmony in groups.' },
  { id: 'a6', type: 'A', text: 'I\'m willing to help without expecting returns.' },

  // Neuroticism (N) - 6 questions
  { id: 'n1', type: 'N', text: 'I get stressed easily under pressure.' },
  { id: 'n2', type: 'N', text: 'I worry about making mistakes.' },
  { id: 'n3', type: 'N', text: 'I feel anxious before important tasks.' },
  { id: 'n4', type: 'N', text: 'Small problems can upset me a lot.' },
  { id: 'n5', type: 'N', text: 'I struggle to relax when things go wrong.' },
  { id: 'n6', type: 'N', text: 'I take criticism personally.' }
];

export default bigFiveQuestions;
