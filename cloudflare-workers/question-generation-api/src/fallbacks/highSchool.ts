/**
 * High School Fallback Questions (grades 9-12, ages 14-18)
 */

import type { Subtag } from '../types';

type FallbackQuestion = {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
};

export const HIGH_SCHOOL_FALLBACKS: Record<Subtag, FallbackQuestion[]> = {
  numerical_reasoning: [
    { text: 'If a shirt costs $25 and is on sale for 20% off, what is the sale price?', options: { A: '$20', B: '$22', C: '$18', D: '$15' }, correctAnswer: 'A' },
    { text: 'What is 15% of 80?', options: { A: '10', B: '12', C: '15', D: '8' }, correctAnswer: 'B' },
    { text: 'If 3x + 7 = 22, what is x?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    { text: 'A car travels 240 miles in 4 hours. What is its average speed?', options: { A: '50 mph', B: '55 mph', C: '60 mph', D: '65 mph' }, correctAnswer: 'C' },
    { text: 'If the ratio of boys to girls is 3:2 and there are 30 students, how many boys?', options: { A: '12', B: '15', C: '18', D: '20' }, correctAnswer: 'C' },
    { text: 'What is 2/5 expressed as a percentage?', options: { A: '25%', B: '30%', C: '35%', D: '40%' }, correctAnswer: 'D' },
  ],
  logical_reasoning: [
    { text: 'All roses are flowers. Some flowers fade quickly. Which conclusion is valid?', options: { A: 'All roses fade quickly', B: 'Some roses may fade quickly', C: 'No roses fade quickly', D: 'Roses never fade' }, correctAnswer: 'B' },
    { text: 'If P implies Q, and Q is false, what can we conclude about P?', options: { A: 'P is true', B: 'P is false', C: 'P could be either', D: 'Cannot determine' }, correctAnswer: 'B' },
    { text: 'All mammals are warm-blooded. Whales are mammals. Therefore:', options: { A: 'Whales live in water', B: 'Whales are warm-blooded', C: 'All warm-blooded are mammals', D: 'Whales are fish' }, correctAnswer: 'B' },
    { text: 'If A > B and B > C, which statement must be true?', options: { A: 'A = C', B: 'A < C', C: 'A > C', D: 'B = C' }, correctAnswer: 'C' },
  ],
  verbal_reasoning: [
    { text: 'HAPPY is to SAD as LIGHT is to:', options: { A: 'Lamp', B: 'Dark', C: 'Bright', D: 'Sun' }, correctAnswer: 'B' },
    { text: 'Choose the word most similar to ABUNDANT:', options: { A: 'Scarce', B: 'Plentiful', C: 'Empty', D: 'Small' }, correctAnswer: 'B' },
    { text: 'ARCHITECT is to BUILDING as AUTHOR is to:', options: { A: 'Library', B: 'Book', C: 'Reader', D: 'Publisher' }, correctAnswer: 'B' },
    { text: 'Choose the word most opposite to EXPAND:', options: { A: 'Grow', B: 'Contract', C: 'Extend', D: 'Increase' }, correctAnswer: 'B' },
  ],
  spatial_reasoning: [
    { text: 'How many faces does a cube have?', options: { A: '4', B: '6', C: '8', D: '12' }, correctAnswer: 'B' },
    { text: 'How many edges does a cube have?', options: { A: '6', B: '8', C: '10', D: '12' }, correctAnswer: 'D' },
    { text: 'If you unfold a cube, how many squares do you see?', options: { A: '4', B: '5', C: '6', D: '8' }, correctAnswer: 'C' },
    { text: 'How many vertices does a triangular pyramid have?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
  ],
  data_interpretation: [
    { text: 'A bar chart shows sales of 100, 150, 200, 250 for Jan-Apr. What is the average?', options: { A: '150', B: '175', C: '200', D: '225' }, correctAnswer: 'B' },
    { text: 'If a pie chart shows 25% for Category A, what angle does it represent?', options: { A: '45', B: '90', C: '180', D: '270' }, correctAnswer: 'B' },
    { text: 'If 40% of 200 students passed, how many failed?', options: { A: '80', B: '100', C: '120', D: '140' }, correctAnswer: 'C' },
    { text: 'In a dataset of 5, 10, 15, 20, 25, what is the median?', options: { A: '10', B: '15', C: '17.5', D: '20' }, correctAnswer: 'B' },
  ],
  pattern_recognition: [
    { text: 'What comes next: 2, 4, 8, 16, ?', options: { A: '24', B: '32', C: '20', D: '18' }, correctAnswer: 'B' },
    { text: 'Complete the pattern: A, C, E, G, ?', options: { A: 'H', B: 'I', C: 'J', D: 'K' }, correctAnswer: 'B' },
    { text: 'What comes next: 1, 1, 2, 3, 5, 8, ?', options: { A: '11', B: '12', C: '13', D: '14' }, correctAnswer: 'C' },
    { text: 'What comes next: 3, 9, 27, 81, ?', options: { A: '162', B: '189', C: '216', D: '243' }, correctAnswer: 'D' },
  ],
};
