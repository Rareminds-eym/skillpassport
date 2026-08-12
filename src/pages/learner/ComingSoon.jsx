import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Sparkles, Rocket, Users, Award, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '@/shared/ui';

const ComingSoon = ({ featureName = "This Feature" }) => {
  const navigate = useNavigate();

  // Select icon based on feature name
  const getIcon = () => {
    const name = featureName.toLowerCase();
    if (name.includes('transformation') || name.includes('lte')) return Rocket;
    if (name.includes('educators')) return GraduationCap;
    if (name.includes('projects') || name.includes('internships')) return Briefcase;
    if (name.includes('certificates')) return Award;
    if (name.includes('mentorship')) return Users;
    return BookOpen;
  };

  const IconComponent = getIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {/* Icon */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-blue-100 rounded-full p-6">
              <IconComponent className="w-16 h-16 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {featureName}
          </h1>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Coming Soon</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            We're working hard to bring you this amazing feature.
            Check back soon for updates!
          </p>

          {/* Back Button */}
          <Button
            onClick={() => navigate('/learner/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
