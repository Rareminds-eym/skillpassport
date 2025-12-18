import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, BookOpen, Award } from 'lucide-react';
import { courses } from '../../data/assessment/courses';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { score, totalQuestions, courseId } = location.state || { score: 0, totalQuestions: 0, courseId: '' };
  
  // Calculate percentage for internal logic
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Get course from courses array
  const course = courses.find(c => c.id === courseId);

  // Generate feedback based on course and score
  const getFeedback = () => {
    const performance = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'needs improvement';
    
    const feedbackMap = {
      'csevbm': {
        excellent: 'Outstanding understanding of chemical safety protocols! You demonstrated exceptional knowledge in handling hazardous materials, emergency procedures, and regulatory compliance. Your grasp of safety measures in battery production is commendable.',
        good: 'Good understanding of chemical safety fundamentals. While you show competency in basic safety protocols, consider reviewing advanced topics like emergency response procedures and chemical waste management.',
        'needs improvement': 'Your understanding of chemical safety needs strengthening. Focus on studying safety protocols, hazard identification, and emergency procedures. Consider reviewing the material safety data sheets and regulatory requirements.'
      },
      'green-chemistry': {
        excellent: 'Exceptional grasp of sustainable chemistry principles! Your understanding of eco-friendly practices and green manufacturing processes is outstanding. You show strong knowledge of environmental impact reduction strategies.',
        good: 'Good comprehension of green chemistry concepts. While you understand the basics, consider deepening your knowledge of advanced sustainable practices and innovative eco-friendly technologies.',
        'needs improvement': 'Your understanding of green chemistry concepts needs improvement. Focus on studying sustainable practices, environmental impact assessment, and eco-friendly manufacturing processes.'
      },
      'ev-battery-management': {
        excellent: 'Outstanding knowledge of EV battery management systems! Your understanding of battery technology, safety protocols, and maintenance procedures is exceptional. You show excellent grasp of performance optimization techniques.',
        good: 'Good understanding of EV battery management fundamentals. While you grasp the basics well, consider reviewing advanced topics in battery diagnostics and system optimization.',
        'needs improvement': 'Your understanding of EV battery management needs strengthening. Focus on studying battery technologies, maintenance procedures, and safety protocols.'
      },
      'organic-food': {
        excellent: 'Exceptional understanding of organic food production! Your knowledge of sustainable farming practices, certification requirements, and quality control is outstanding.',
        good: 'Good grasp of organic food production basics. While you understand the fundamentals, consider deepening your knowledge of advanced farming techniques and certification standards.',
        'needs improvement': 'Your understanding of organic food production needs improvement. Focus on studying sustainable farming practices, certification requirements, and quality control measures.'
      },
      'food-analysis': {
        excellent: 'Outstanding knowledge of food analysis techniques! Your understanding of testing methods, quality control, and safety standards is exceptional.',
        good: 'Good comprehension of food analysis fundamentals. While you grasp the basics well, consider reviewing advanced testing methods and quality assurance protocols.',
        'needs improvement': 'Your understanding of food analysis needs strengthening. Focus on studying testing methods, quality control procedures, and safety standards.'
      },
      'default': {
        excellent: 'Outstanding performance! You have demonstrated exceptional understanding of the subject matter.',
        good: 'Good performance! You have shown a solid grasp of the core concepts.',
        'needs improvement': 'Your understanding of the subject matter needs improvement. Consider reviewing the material and trying again.'
      }
    };

    const courseFeedback = feedbackMap[courseId] || feedbackMap['default'];
    return courseFeedback[performance];
  };

  return (
    <div className="min-h-screen bg-pattern-chemistry flex items-center justify-center py-12">
      <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-12 sm:px-8 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white bg-opacity-20 mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white font-serif mb-4">Hackathon Complete!</h2>
            <p className="text-xl text-white text-opacity-90">
              You've completed the {course?.title || 'Hackathon'}
            </p>
          </div>

          {/* Results */}
          <div className="px-6 py-8 sm:px-8">
            {/* Score Display */}
            {/* <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
              </div>
              <p className="text-lg text-gray-600">
                You scored {score} out of {totalQuestions} questions correctly
              </p>
            </div> */}

            {/* Feedback */}
            <div className="mb-8 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-4 flex items-center justify-center font-serif">
                <Award className="h-6 w-6 text-blue-600 mr-2" />
                Performance Analysis
              </h3>
              <p className="text-gray-600 bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 max-w-2xl mx-auto">
                {getFeedback()}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;