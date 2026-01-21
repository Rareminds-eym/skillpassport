/**
 * Category Selection Screen Component
 * Displays Science/Commerce/Arts category options
 *
 * @module features/assessment/components/CategorySelectionScreen
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, BarChart3, BookOpen } from 'lucide-react';
import { Button } from '../../../components/Students/components/ui/button';
import { Card, CardContent } from '../../../components/Students/components/ui/card';
import { STREAM_CATEGORIES } from '../constants/config';

/**
 * @typedef {Object} CategorySelectionScreenProps
 * @property {Function} onCategorySelect - Callback when category is selected
 * @property {Function} onBack - Callback to go back to grade selection
 * @property {string} gradeLevel - Selected grade level
 */

/**
 * Category icons mapping
 */
const CATEGORY_ICONS = {
  science: FlaskConical,
  commerce: BarChart3,
  arts: BookOpen,
};

/**
 * Category colors mapping
 */
const CATEGORY_COLORS = {
  science: {
    gradient: 'from-blue-500 to-cyan-500',
    hover: 'hover:border-blue-300',
    shadow: 'hover:shadow-blue-500/10',
  },
  commerce: {
    gradient: 'from-emerald-500 to-teal-500',
    hover: 'hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-500/10',
  },
  arts: {
    gradient: 'from-purple-500 to-pink-500',
    hover: 'hover:border-purple-300',
    shadow: 'hover:shadow-purple-500/10',
  },
};

/**
 * Category Option Button Component
 */
const CategoryOptionButton = ({ category, onClick }) => {
  const Icon = CATEGORY_ICONS[category.id] || BookOpen;
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.arts;

  return (
    <button
      onClick={() => onClick(category.id)}
      className={`w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl ${colors.shadow} ${colors.hover} transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center gap-4">
        <div
          className={`w-14 h-14 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 mb-1">
            {category.label}
          </h3>
          <p className="text-sm text-gray-600">{category.description}</p>
        </div>
      </div>
    </button>
  );
};

/**
 * Category Selection Screen Component
 */
export const CategorySelectionScreen = ({ onCategorySelect, onBack, gradeLevel }) => {
  const navigate = useNavigate();

  // Get title based on grade level
  const getTitle = () => {
    switch (gradeLevel) {
      case 'after10':
        return 'Choose Your Stream';
      case 'after12':
      case 'college':
        return 'Select Your Field';
      default:
        return 'Choose Your Category';
    }
  };

  // Get subtitle based on grade level
  const getSubtitle = () => {
    switch (gradeLevel) {
      case 'after10':
        return 'Select the stream you want to pursue after 10th';
      case 'after12':
        return 'Select your field of study for career recommendations';
      case 'college':
        return 'Select your field for personalized career guidance';
      default:
        return 'Select a category to continue';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl">
        <CardContent className="p-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{getTitle()}</h1>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>

          {/* Category Options */}
          <div className="space-y-4">
            {STREAM_CATEGORIES.map((category) => (
              <CategoryOptionButton
                key={category.id}
                category={category}
                onClick={onCategorySelect}
              />
            ))}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-700">
              <strong>Not sure which to choose?</strong> Select the category that best matches your
              interests. You can always retake the assessment later with a different selection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorySelectionScreen;
