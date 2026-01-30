/**
 * Middle School Fallback Questions (grades 6-8, ages 11-14)
 */

import type { Subtag } from '../types';

type FallbackQuestion = {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
};

export const MIDDLE_SCHOOL_FALLBACKS: Record<Subtag, FallbackQuestion[]> = {
  numerical_reasoning: [
    { text: 'If you have 24 cookies and want to share them equally among 6 friends, how many cookies does each friend get?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
    { text: 'A pizza has 8 slices. If you eat 2 slices, what fraction of the pizza is left?', options: { A: '1/4', B: '1/2', C: '3/4', D: '2/3' }, correctAnswer: 'C' },
    { text: 'If a book costs $12 and you have $50, how many books can you buy?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
    { text: 'A movie ticket costs $8. How much do 5 tickets cost?', options: { A: '$35', B: '$40', C: '$45', D: '$50' }, correctAnswer: 'B' },
    { text: 'If you save $5 each week, how much will you have after 8 weeks?', options: { A: '$30', B: '$35', C: '$40', D: '$45' }, correctAnswer: 'C' },
    { text: 'A bag has 15 marbles. If 1/3 are blue, how many blue marbles are there?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    { text: 'What is 25% of 80?', options: { A: '15', B: '20', C: '25', D: '30' }, correctAnswer: 'B' },
    { text: 'If 4 pencils cost $2, how much do 10 pencils cost?', options: { A: '$4', B: '$5', C: '$6', D: '$8' }, correctAnswer: 'B' },
  ],
  logical_reasoning: [
    { text: 'All dogs are animals. Max is a dog. What can we conclude?', options: { A: 'Max is a cat', B: 'Max is an animal', C: 'All animals are dogs', D: 'Max is not a pet' }, correctAnswer: 'B' },
    { text: 'If it rains, the grass gets wet. The grass is wet. What can we say?', options: { A: 'It definitely rained', B: 'It might have rained', C: 'It did not rain', D: 'The sun is out' }, correctAnswer: 'B' },
    { text: 'All birds have feathers. A robin is a bird. What can we conclude?', options: { A: 'A robin can fly', B: 'A robin has feathers', C: 'All feathered things are birds', D: 'Robins are red' }, correctAnswer: 'B' },
    { text: 'If today is Monday, what day was it 3 days ago?', options: { A: 'Thursday', B: 'Friday', C: 'Saturday', D: 'Sunday' }, correctAnswer: 'B' },
    { text: 'All squares are rectangles. This shape is a square. What do we know?', options: { A: 'It has 3 sides', B: 'It is a rectangle', C: 'It is a circle', D: 'It has 5 corners' }, correctAnswer: 'B' },
    { text: 'If A is taller than B, and B is taller than C, who is the shortest?', options: { A: 'A', B: 'B', C: 'C', D: 'Cannot tell' }, correctAnswer: 'C' },
  ],
  verbal_reasoning: [
    { text: 'HOT is to COLD as DAY is to:', options: { A: 'Sun', B: 'Night', C: 'Light', D: 'Morning' }, correctAnswer: 'B' },
    { text: 'BOOK is to READ as SONG is to:', options: { A: 'Dance', B: 'Write', C: 'Listen', D: 'Play' }, correctAnswer: 'C' },
    { text: 'Which word means the OPPOSITE of "happy"?', options: { A: 'Joyful', B: 'Excited', C: 'Sad', D: 'Cheerful' }, correctAnswer: 'C' },
    { text: 'FISH is to SWIM as BIRD is to:', options: { A: 'Nest', B: 'Fly', C: 'Feather', D: 'Egg' }, correctAnswer: 'B' },
    { text: 'Which word means the SAME as "big"?', options: { A: 'Tiny', B: 'Small', C: 'Large', D: 'Short' }, correctAnswer: 'C' },
    { text: 'TEACHER is to SCHOOL as DOCTOR is to:', options: { A: 'Medicine', B: 'Hospital', C: 'Patient', D: 'Nurse' }, correctAnswer: 'B' },
    { text: 'UP is to DOWN as LEFT is to:', options: { A: 'Side', B: 'Right', C: 'Center', D: 'Forward' }, correctAnswer: 'B' },
    { text: 'PENCIL is to WRITE as SCISSORS is to:', options: { A: 'Paper', B: 'Sharp', C: 'Cut', D: 'Draw' }, correctAnswer: 'C' },
  ],
  spatial_reasoning: [
    { text: 'How many sides does a triangle have?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'B' },
    { text: 'If you fold a square piece of paper in half, what shape do you get?', options: { A: 'Triangle', B: 'Circle', C: 'Rectangle', D: 'Pentagon' }, correctAnswer: 'C' },
    { text: 'How many corners does a rectangle have?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'C' },
    { text: 'Which shape has no corners?', options: { A: 'Square', B: 'Triangle', C: 'Circle', D: 'Rectangle' }, correctAnswer: 'C' },
    { text: 'How many sides does a hexagon have?', options: { A: '4', B: '5', C: '6', D: '7' }, correctAnswer: 'C' },
    { text: 'If you cut a square diagonally, what shapes do you get?', options: { A: 'Two squares', B: 'Two triangles', C: 'Two rectangles', D: 'Two circles' }, correctAnswer: 'B' },
  ],
  data_interpretation: [
    { text: 'In a class of 20 students, 8 like soccer and 12 like basketball. How many more students like basketball than soccer?', options: { A: '2', B: '4', C: '6', D: '8' }, correctAnswer: 'B' },
    { text: 'If a graph shows Monday: 5 books, Tuesday: 3 books, Wednesday: 7 books read, which day had the most books read?', options: { A: 'Monday', B: 'Tuesday', C: 'Wednesday', D: 'All equal' }, correctAnswer: 'C' },
    { text: 'A survey shows 10 students like apples, 15 like oranges, 5 like bananas. What is the total?', options: { A: '25', B: '30', C: '35', D: '40' }, correctAnswer: 'B' },
    { text: 'If a chart shows Team A scored 20 points and Team B scored 15 points, what is the difference?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    { text: 'A table shows: Jan-10, Feb-15, Mar-20 sales. What is the total for all three months?', options: { A: '35', B: '40', C: '45', D: '50' }, correctAnswer: 'C' },
    { text: 'In a group of 30 students, half are girls. How many boys are there?', options: { A: '10', B: '15', C: '20', D: '25' }, correctAnswer: 'B' },
  ],
  pattern_recognition: [
    { text: 'What comes next: 2, 4, 6, 8, ?', options: { A: '9', B: '10', C: '11', D: '12' }, correctAnswer: 'B' },
    { text: 'What comes next: A, B, C, D, ?', options: { A: 'F', B: 'E', C: 'G', D: 'A' }, correctAnswer: 'B' },
    { text: 'What comes next: 1, 3, 5, 7, ?', options: { A: '8', B: '9', C: '10', D: '11' }, correctAnswer: 'B' },
    { text: 'What comes next: 5, 10, 15, 20, ?', options: { A: '22', B: '23', C: '24', D: '25' }, correctAnswer: 'D' },
    { text: 'What comes next: 3, 6, 9, 12, ?', options: { A: '13', B: '14', C: '15', D: '16' }, correctAnswer: 'C' },
    { text: 'What comes next: 1, 2, 4, 8, ?', options: { A: '10', B: '12', C: '14', D: '16' }, correctAnswer: 'D' },
    { text: 'What comes next: 100, 90, 80, 70, ?', options: { A: '50', B: '55', C: '60', D: '65' }, correctAnswer: 'C' },
    { text: 'What comes next: Z, Y, X, W, ?', options: { A: 'U', B: 'V', C: 'T', D: 'S' }, correctAnswer: 'B' },
  ],
};
