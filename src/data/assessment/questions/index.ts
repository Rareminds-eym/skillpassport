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

// Function to get questions for a specific course or certificate
export const getQuestions = async (courseId?: string, certificateName?: string): Promise<Question[]> => {
  // If certificateName is provided, try to match it
  if (certificateName && certificateName !== 'General Assessment') {
    const name = certificateName.toLowerCase();
    
    // Try to find matching questions by certificate name
    for (const [key, questions] of Object.entries(questionsMap)) {
      if (name.includes(key) || key.includes(name)) {
        console.log(`Loading questions for certificate: ${certificateName}, matched: ${key}, found ${questions.length} questions`);
        return Promise.resolve(questions);
      }
    }
    
    // Check for common patterns
    if (name.includes('chemistry')) {
      console.log(`Loading green chemistry questions for: ${certificateName}`);
      return Promise.resolve(questionsMap['green-chemistry']);
    }
    if (name.includes('ev') || name.includes('battery') || name.includes('electric vehicle')) {
      console.log(`Loading EV battery questions for: ${certificateName}`);
      return Promise.resolve(questionsMap['ev-battery']);
    }
    if (name.includes('food') && name.includes('analysis')) {
      console.log(`Loading food analysis questions for: ${certificateName}`);
      return Promise.resolve(questionsMap['food-analysis']);
    }
    if (name.includes('organic') || name.includes('food')) {
      console.log(`Loading organic food questions for: ${certificateName}`);
      return Promise.resolve(questionsMap['organic-food']);
    }
  }
  
  // Fall back to courseId if provided
  if (courseId) {
    const questions = questionsMap[courseId] || questionsMap['default'];
    console.log(`Loading questions for course: ${courseId}, found ${questions.length} questions`);
    return Promise.resolve(questions);
  }
  
  // Default fallback
  console.log(`Loading default questions`);
  return Promise.resolve(questionsMap['default']);
};

// Default export for backward compatibility
const QuizQuestions: Record<string, Question[]> = questionsMap;
export default QuizQuestions;