// @ts-expect-error - Auto-suppressed for migration
import { Question } from '../../../types';
import { csevbmQuestions } from './csevbm';
import { greenChemistryQuestions } from './green-chemistry';
import { evBatteryQuestions } from './ev-battery';
import { organicFoodQuestions } from './organic-food';
import { foodAnalysisQuestions } from './food-analysis';
import { getCertificateConfig, getConfiguredQuestions } from '../certificateConfig';

// Map of course IDs to their questions
const questionsMap: Record<string, Question[]> = {
  csevbm: csevbmQuestions,
  'green-chemistry': greenChemistryQuestions,
  'ev-battery-management': evBatteryQuestions,
  'ev-battery': evBatteryQuestions,
  'organic-food': organicFoodQuestions,
  'food-analysis': foodAnalysisQuestions,
  default: csevbmQuestions, // Default to csevbm questions
};

// Function to get questions for a specific course or certificate
export const getQuestions = async (
  courseId?: string,
  certificateName?: string
): Promise<Question[]> => {
  let matchedQuestions: Question[] = [];
  let matchedKey = '';

  // If certificateName is provided, try to match it
  if (certificateName && certificateName !== 'General Assessment') {
    const name = certificateName.toLowerCase();

    // Try to find matching questions by certificate name
    for (const [key, questions] of Object.entries(questionsMap)) {
      if (name.includes(key) || key.includes(name)) {
        matchedQuestions = questions;
        matchedKey = key;
        break;
      }
    }

    // Check for common patterns if no match yet
    if (matchedQuestions.length === 0) {
      if (name.includes('chemistry')) {
        matchedQuestions = questionsMap['green-chemistry'];
        matchedKey = 'green-chemistry';
      } else if (
        name.includes('ev') ||
        name.includes('battery') ||
        name.includes('electric vehicle')
      ) {
        matchedQuestions = questionsMap['ev-battery'];
        matchedKey = 'ev-battery';
      } else if (name.includes('food') && name.includes('analysis')) {
        matchedQuestions = questionsMap['food-analysis'];
        matchedKey = 'food-analysis';
      } else if (name.includes('organic') || name.includes('food')) {
        matchedQuestions = questionsMap['organic-food'];
        matchedKey = 'organic-food';
      }
    }
  }

  // Fall back to courseId if no certificate match
  if (matchedQuestions.length === 0 && courseId) {
    matchedQuestions = questionsMap[courseId] || questionsMap['default'];
    matchedKey = courseId;
  }

  // Final fallback to default
  if (matchedQuestions.length === 0) {
    matchedQuestions = questionsMap['default'];
    matchedKey = 'default';
  }

  // Get certificate configuration
  const config = getCertificateConfig(certificateName || courseId);

  // Apply question count limit based on certificate config
  const configuredQuestions = getConfiguredQuestions(matchedQuestions, certificateName || courseId);

  console.log(`✅ Certificate: "${certificateName || courseId}"`);
  console.log(`   Matched: ${matchedKey}`);
  console.log(`   Total available: ${matchedQuestions.length} questions`);
  console.log(`   Configured count: ${config.questionCount} questions`);
  console.log(`   Returning: ${configuredQuestions.length} questions`);
  console.log(
    `   Time limit: ${config.timeLimit ? `${config.timeLimit / 60} minutes` : 'No limit'}`
  );
  console.log(`   Passing score: ${config.passingScore}%`);

  return Promise.resolve(configuredQuestions);
};

// Default export for backward compatibility
const QuizQuestions: Record<string, Question[]> = questionsMap;
export default QuizQuestions;
