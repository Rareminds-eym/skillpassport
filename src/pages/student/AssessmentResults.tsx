import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { score, totalQuestions, courseId, questions, certificateName } = location.state || { 
    score: 0, 
    totalQuestions: 0, 
    courseId: '',
    questions: [],
    certificateName: 'Assessment'
  };
  
  // Calculate percentage
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= 60;
  
  // Calculate total time taken
  const totalTimeTaken = questions?.reduce((acc: number, q: any) => acc + (q.timeTaken || 0), 0) || 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mark assessment as completed in database
  useEffect(() => {
    const markCompleted = async () => {
      if (!location.state?.attemptId) return;
      
      try {
        await supabase
          .from('external_assessment_attempts')
          .update({
            status: 'completed',
            score: percentage,
            correct_answers: score,
            completed_at: new Date().toISOString(),
            time_taken: totalTimeTaken
          })
          .eq('id', location.state.attemptId);
        
        console.log('✅ Assessment marked as completed');
      } catch (error) {
        console.error('Failed to mark assessment as completed:', error);
      }
    };
    
    markCompleted();
  }, [location.state?.attemptId, percentage, score, totalTimeTaken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className={`px-8 py-10 text-center ${
            passed 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}>
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              passed ? 'bg-white/20' : 'bg-white/20'
            }`}>
              {passed ? (
                <Award className="w-10 h-10 text-white" />
              ) : (
                <Target className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {passed ? 'Congratulations!' : 'Keep Learning!'}
            </h1>
            <p className="text-white/90 text-sm">
              {passed 
                ? 'You have successfully passed the assessment' 
                : 'Review the material and strengthen your skills'}
            </p>
          </div>

          {/* Score Section */}
          <div className="px-8 py-8">
            {/* Score Circle */}
            <div className="flex justify-center mb-8">
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                passed ? 'bg-emerald-50' : 'bg-blue-50'
              }`}>
                <div className="text-center">
                  <span className={`text-4xl font-bold ${
                    passed ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {percentage}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Your Score</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-gray-900">{totalQuestions}</p>
                <p className="text-xs text-gray-500">Total Questions</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className={`text-xl font-bold ${passed ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {score}
                </p>
                <p className="text-xs text-gray-500">Correct</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-gray-900">{formatTime(totalTimeTaken)}</p>
                <p className="text-xs text-gray-500">Time Taken</p>
              </div>
            </div>

            {/* Assessment Info */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                <span className="font-semibold">{certificateName}</span>
                <br />
                <span className="text-blue-600 text-xs">Assessment Completed</span>
              </p>
            </div>

            {/* Action Button - Only Back to Learning */}
            <button
              onClick={() => navigate('/student/my-learning')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-200/50"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to My Learning
            </button>

            {/* Note about one-time assessment */}
            <p className="text-center text-xs text-gray-400 mt-4">
              This assessment can only be taken once per course
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
