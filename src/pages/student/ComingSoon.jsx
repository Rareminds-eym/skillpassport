import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';

const ComingSoon = () => {
  const navigate = useNavigate();

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {/* Icon */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-blue-100 rounded-full p-6">
              <BookOpen className="w-16 h-16 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your next skill unlocks soon
          </h1>

     

          {/* Description */}
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Course content is being prepared and will be available soon. 
            Check back later for exciting new learning materials!
          </p>

          {/* Back Button */}
          <Button
            onClick={() => navigate('/student/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
