import React, { useState } from 'react';
import {
  XMarkIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  LightBulbIcon,
  MapIcon,
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { CareerPathResponse } from '@/services/aiCareerPathService';

interface CareerPathDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  careerPath: CareerPathResponse | null;
  isLoading?: boolean;
  error?: string | null;
}

export const CareerPathDrawer: React.FC<CareerPathDrawerProps> = ({
  isOpen,
  onClose,
  careerPath,
  isLoading = false,
  error = null,
}) => {
  const [expandedStep, setExpandedStep] = useState<number>(0);

  if (!isOpen) return null;

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      entry: 'bg-blue-100 text-blue-800',
      junior: 'bg-cyan-100 text-cyan-800',
      mid: 'bg-purple-100 text-purple-800',
      senior: 'bg-amber-100 text-amber-800',
      lead: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getLevelBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      entry: 'border-l-4 border-blue-500',
      junior: 'border-l-4 border-cyan-500',
      mid: 'border-l-4 border-purple-500',
      senior: 'border-l-4 border-amber-500',
      lead: 'border-l-4 border-red-500',
    };
    return colors[level] || 'border-l-4 border-gray-500';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 max-w-2xl w-full bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Career Development Path</h2>
              {careerPath && (
                <p className="text-primary-100 text-sm">{careerPath.studentName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-primary-700 p-1 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin mb-4">
                  <ArrowPathIcon className="h-8 w-8 text-primary-600 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">Generating career path...</p>
                <p className="text-sm text-gray-500">This may take a moment</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Error generating career path</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {careerPath && !isLoading && (
            <>
              {/* Career Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
                  <p className="text-sm text-primary-700 font-medium">Current Level</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">
                    {careerPath.currentRole}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg p-4 border border-success-200">
                  <p className="text-sm text-success-700 font-medium">Career Goal</p>
                  <p className="text-lg font-bold text-success-900 mt-1">
                    {careerPath.careerGoal}
                  </p>
                </div>
              </div>

              {/* Overall Score */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-medium">Career Readiness Score</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {careerPath.overallScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${careerPath.overallScore}%` }}
                  />
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {careerPath.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skill Gaps */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <LightBulbIcon className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Skill Gaps</h3>
                  </div>
                  <ul className="space-y-2">
                    {careerPath.gaps.map((gap, idx) => (
                      <li key={idx} className="text-sm text-amber-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Career Path */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Recommended Career Path
                </h3>
                <div className="space-y-3">
                  {careerPath.recommendedPath.map((step, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg overflow-hidden transition-all ${getLevelBadgeColor(
                        step.level
                      )}`}
                    >
                      <button
                        onClick={() =>
                          setExpandedStep(expandedStep === idx ? -1 : idx)
                        }
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white font-bold text-sm">
                                  {idx + 1}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {step.roleTitle}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getLevelColor(step.level)}`}>
                                    {step.level.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-gray-600 flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {step.timeline}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronDownIcon
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              expandedStep === idx ? 'transform rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {expandedStep === idx && (
                        <div className="bg-gray-50 border-t px-4 py-4 space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                              Timeline
                            </h5>
                            <p className="text-sm text-gray-700">
                              {step.estimatedTimeline}
                            </p>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                              Skills You Have
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {step.skillsNeeded.map((skill, sidx) => (
                                <span
                                  key={sidx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  ✓ {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                              Skills to Develop
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {step.skillsToGain.map((skill, sidx) => (
                                <span
                                  key={sidx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  + {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <BookOpenIcon className="h-4 w-4 text-primary-600" />
                              <h5 className="font-semibold text-gray-900 text-sm">
                                Learning Resources
                              </h5>
                            </div>
                            <ul className="space-y-1">
                              {step.learningResources.map((resource, ridx) => (
                                <li
                                  key={ridx}
                                  className="text-sm text-gray-700 flex items-start"
                                >
                                  <span className="mr-2">→</span>
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternative Paths */}
              {careerPath.alternativePaths && careerPath.alternativePaths.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">
                    Alternative Career Directions
                  </h3>
                  <ul className="space-y-2">
                    {careerPath.alternativePaths.map((path, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-indigo-800 flex items-start"
                      >
                        <span className="mr-2">→</span>
                        <span>{path}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {careerPath.actionItems && careerPath.actionItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Immediate Action Items
                  </h3>
                  <ol className="space-y-2">
                    {careerPath.actionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-blue-800 flex items-start"
                      >
                        <span className="mr-3 font-bold text-blue-600">
                          {idx + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Next Steps */}
              {careerPath.nextSteps && careerPath.nextSteps.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">
                    Next Steps (This Month)
                  </h3>
                  <ul className="space-y-2">
                    {careerPath.nextSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-purple-800 flex items-start"
                      >
                        <span className="mr-2">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated Info */}
              <div className="text-xs text-gray-500 text-center pt-4 border-t">
                Generated on {new Date(careerPath.generatedAt).toLocaleDateString()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerPathDrawer;
