import { Battery, FlaskRound, Leaf, Apple, Shield } from 'lucide-react';
// @ts-expect-error - Auto-suppressed for migration
import { Course } from '../types';

export const courses: Course[] = [
  {
    id: 'csevbm',
    courseId: 2811,
    title: 'Chemical Safety in Battery Management',
    description:
      'Learn about chemical safety protocols and best practices in EV battery management systems.',
    icon: Shield,
  },
  {
    id: 'green-chemistry',
    courseId: 2849,
    title: 'Sustanbility  and Green Chemistry in EV Sector',
    description:
      'Evaluate your understanding of sustainable practices and green chemistry principles in electric vehicle development.',
    icon: Leaf,
  },
  {
    id: 'ev-battery-management',
    courseId: 2812,
    title: 'EV Battery Management',
    description:
      'Test your knowledge on advanced battery management systems for electric vehicles.',
    icon: Battery,
  },
  {
    id: 'organic-food',
    courseId: 2848,
    title: 'Organic Food Production Techniques',
    description:
      'Test your knowledge about organic farming methods and sustainable agricultural practices.',
    icon: Apple,
  },
  {
    id: 'food-analysis',
    courseId: 2847,
    title: 'Food Processing and Preservation Techniques',
    description:
      'Evaluate your understanding of food analysis techniques, preservation methods, and processing strategies.',
    icon: FlaskRound,
  },
];
