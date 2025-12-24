import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap
} from 'lucide-react';
import { matchJobsWithAI } from '../../../services/aiJobMatchingService';
import { WavyBackground } from '@/components/Students/components/ui/wavy-background';

const RecommendedJobs = ({
  studentProfile,
  opportunities,
  onSelectJob,
  appliedJobs = new Set(),
  savedJobs = new Set(),
  onToggleSave,
  onApply
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismiss preference
  useEffect(() => {
    const dismissed = localStorage.getItem('recommendations_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Fetch AI recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!studentProfile || !opportunities || opportunities.length === 0 || isDismissed) {
        setLoading(false);
        setShowAnimation(false);
        return;
      }

      try {
        setLoading(true);
        setShowAnimation(true);
        setError(null);

        const startTime = Date.now();

        // Call AI matching service
        const matches = await matchJobsWithAI(studentProfile, opportunities, 3);

        // Ensure animation shows for at least 5 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 5000 - elapsedTime);

        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        setRecommendations(matches);
        setLoading(false);
        setShowAnimation(false);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
        setLoading(false);
        setShowAnimation(false);
      }
    };

    fetchRecommendations();
  }, [studentProfile, opportunities, isDismissed]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem('recommendations_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Entry Level';
  };

  // Show small prompt if dismissed
  if (isDismissed) {
    return (
      <div className="mb-6">
        <button
          onClick={() => {
            localStorage.removeItem('recommendations_dismissed');
            setIsDismissed(false);
            setLoading(true);
            setShowAnimation(true);
          }}
          className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 hover:from-indigo-100 hover:to-purple-100 transition-all group"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-900">Show AI Recommendations</h3>
              <p className="text-xs text-gray-600">Get personalized job matches based on your profile</p>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // Show wavy animation while loading
  if (showAnimation || loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mb-6 h-[400px] rounded-xl overflow-hidden w-full"
      >
        <WavyBackground
          className="w-full pb-20"
          containerClassName="h-full"
          colors={["#4f46e5", "#7c3aed", "#2563eb", "#06b6d4", "#8b5cf6"]}
          waveOpacity={0.3}
          speed="fast"
          blur={10}
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <img src="/RMLogo.webp" alt="RareMinds Logo" className="w-16 h-16" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-5 -right-2"
                >
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl md:text-5xl lg:text-6xl text-white font-bold">
                AI is Analyzing Your Profile
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-base md:text-xl text-white/90 font-normal max-w-2xl mx-auto">
                Matching your skills, education, and experience with the perfect opportunities
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 text-white/80"
            >
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">Powered by Advanced AI Technology</span>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex justify-center gap-2 pt-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-3 h-3 bg-white rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </WavyBackground>
      </motion.div>
    );
  }

  // Show error state with user-friendly message
  if (error && !loading && !showAnimation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-amber-100 rounded-lg transition-colors z-10"
            title="Dismiss"
          >
            <X className="w-5 h-5 text-amber-700" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                Unable to Load AI Recommendations
              </h3>
              <p className="text-amber-800 mb-4">
                We're having trouble connecting to our AI matching service. This could be due to:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 mb-4">
                <li>Temporary service unavailability</li>
                <li>Network connectivity issues</li>
                <li>API rate limits</li>
              </ul>
              <p className="text-sm text-amber-700">
                Don't worry! You can still browse all available opportunities below. Please try refreshing the page in a few moments for AI-powered recommendations.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Don't render if no data
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const currentJob = recommendations[currentIndex];
  const opportunity = currentJob?.opportunity;

  if (!opportunity) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30 -z-0"></div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-red-100 rounded-lg transition-all duration-200 group z-10"
          title="Dismiss recommendations"
        >
          <X className="w-5 h-5 text-gray-500 group-hover:text-red-600 group-hover:scale-110 transition-all duration-200" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 bg-gradient-to-br from-slate-200 to-gray-200 rounded-lg">
            <img src="/RMLogo.webp" alt="RareMinds Logo" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Recommended For You</h2>
            <p className="text-sm text-gray-600">Based on your profile, skills, and experience</p>
          </div>
        </div>

        {/* Carousel Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-md"
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentJob.job_title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMatchColor(currentJob.match_score)}`}>
                      {currentJob.match_score}% {getMatchLabel(currentJob.match_score)}
                    </span>
                  </div>
                  <p className="text-lg text-gray-700 font-medium">{currentJob.company_name}</p>
                </div>
              </div>

              {/* Job Details */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                {opportunity.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{opportunity.location}</span>
                  </div>
                )}
                {opportunity.employment_type && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span className="capitalize">{opportunity.employment_type}</span>
                  </div>
                )}
              </div>

              {/* Match Reason */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-1">Why this matches</h4>
                    <p className="text-sm text-indigo-800">{currentJob.match_reason}</p>
                  </div>
                </div>
              </div>

              {/* Matching Skills */}
              {currentJob.key_matching_skills && currentJob.key_matching_skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Your Matching Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentJob.key_matching_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Gap */}
              {currentJob.skills_gap && currentJob.skills_gap.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Skills to Learn</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentJob.skills_gap.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {currentJob.recommendation && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 italic">
                    <span className="font-semibold text-gray-900">Recommendation: </span>
                    {currentJob.recommendation}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => onSelectJob(opportunity)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  View Details
                </button>
                {!appliedJobs.has(opportunity.id) && (
                  <button
                    onClick={() => onApply(opportunity)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Apply Now
                  </button>
                )}
                {appliedJobs.has(opportunity.id) && (
                  <div className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Applied
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Navigation */}
          {recommendations.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handlePrev}
                className="p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                disabled={recommendations.length <= 1}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div className="flex gap-2">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-indigo-600 w-6'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                disabled={recommendations.length <= 1}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendedJobs;
