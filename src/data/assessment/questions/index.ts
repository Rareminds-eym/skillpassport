import { Question } from '../../../types';
import { csevbmQuestions } from './csevbm';
import { greenChemistryQuestions } from './green-chemistry';
import { evBatteryQuestions } from './ev-battery';
import { organicFoodQuestions } from './organic-food';
import { foodAnalysisQuestions } from './food-analysis';

// Map of course IDs to their questions
const questionsMap: Record<string, Question[]> = {
  'csevbm': csevbmQuestions,
  'green-chemistry': greenChemistryQuestions,
  'ev-battery-management': evBatteryQuestions,
  'ev-battery': evBatteryQuestions,
  'organic-food': organicFoodQuestions,
  'food-analysis': foodAnalysisQuestions,
  'default': csevbmQuestions, // Default to csevbm questions
};

// Function to get questions for a specific course
export const getQuestions = async (courseId: string): Promise<Question[]> => {
  const questions = questionsMap[courseId] || questionsMap['default'];
  console.log(`Loading questions for course: ${courseId}, found ${questions.length} questions`);
  return Promise.resolve(questions);
};

// Default export for backward compatibility
const QuizQuestions: Record<string, Question[]> = questionsMap;
export default QuizQuestions;