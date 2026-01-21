import { WavyBackground } from '@/components/Students/components/ui/wavy-background';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAIJobMatching } from '../../../hooks/useAIJobMatching';
import { FeatureGate } from '../../Subscription/FeatureGate';

/**
 * RecommendedJobs - AI-powered job recommendations with industrial-grade caching
 *
 * Uses the useAIJobMatching hook which implements:
 * - Database-level caching (24-hour TTL)
 * - Automatic cache invalidation when student data changes
 * - Profile hash-based change detection
 * - Force refresh capability
 *
 * Wrapped with FeatureGate for ai_job_matching add-on access control
 */
const RecommendedJobsContent = ({
  studentProfile,
  onSelectJob,
  appliedJobs = new Set(),
  savedJobs = new Set(),
  onToggleSave,
  onApply,
}) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Use the industrial-grade caching hook
  const {
    matchedJobs: recommendations,
    loading,
    error,
    cacheInfo = {},
    refreshMatches,
  } = useAIJobMatching(studentProfile, !isDismissed, 3);

  // Check localStorage for dismiss preference
  useEffect(() => {
    const dismissed = localStorage.getItem('recommendations_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Handle animation timing - show for minimum 3 seconds on cache miss, 1 second on cache hit
  useEffect(() => {
    if (loading) {
      setShowAnimation(true);
    } else {
      // Shorter animation for cache hits (data was instant)
      const minAnimationTime = cacheInfo?.cached ? 1000 : 3000;
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, minAnimationTime);
      return () => clearTimeout(timer);
    }
  }, [loading, cacheInfo?.cached]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem('recommendations_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleRefresh = async () => {
    setShowAnimation(true);
    await refreshMatches();
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
              <p className="text-xs text-gray-600">
                Get personalized job matches based on your profile
              </p>
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
        className="relative h-[400px] overflow-hidden"
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
        }}
      >
        <WavyBackground
          className="w-full pb-20"
          containerClassName="h-full"
          colors={['#4f46e5', '#7c3aed', '#2563eb', '#06b6d4', '#8b5cf6']}
          waveOpacity={0.3}
          speed="fast"
          blur={10}
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <img src="/RMLogo.webp" alt="RareMinds Logo" className="w-16 h-16" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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
                Don't worry! You can still browse all available opportunities below. Please try
                refreshing the page in a few moments for AI-powered recommendations.
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
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-200 to-gray-200 rounded-lg">
              <img src="/RMLogo.webp" alt="RareMinds Logo" className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">AI Recommended For You</h2>
                {cacheInfo?.cached && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <Clock className="w-3 h-3" />
                    Cached
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Based on your profile, skills, and experience
                {cacheInfo?.computedAt && (
                  <span className="text-gray-400 ml-1">
                    • Updated {new Date(cacheInfo.computedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 mr-10"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Grid Content */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.slice(0, 3).map((currentJob, index) => {
            // Support both nested opportunity and flat structure from API
            const opportunity = currentJob?.opportunity || currentJob;
            if (!opportunity) return null;

            // Get job details - handle both structures
            const jobTitle = currentJob.job_title || opportunity.job_title || opportunity.title;
            const companyName = currentJob.company_name || opportunity.company_name;
            const matchScore =
              currentJob.match_score ||
              Math.round((opportunity.similarity || opportunity.final_score || 0.5) * 100);
            const location = opportunity.location;
            const employmentType = opportunity.employment_type;
            const skillsRequired = opportunity.skills_required || [];
            const matchReason =
              currentJob.match_reason ||
              `This opportunity matches your profile with ${matchScore}% similarity.`;
            const jobId = currentJob.job_id || opportunity.id;

            return (
              <motion.div
                key={jobId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg p-5 shadow-md flex flex-col h-full border border-gray-100 hover:border-indigo-200 transition-all"
              >
                {/* Job Header */}
                <div className="mb-3">
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={jobTitle}>
                        {jobTitle}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getMatchColor(matchScore)}`}
                      >
                        {matchScore}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium line-clamp-1">{companyName}</p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[100px]">{location}</span>
                    </div>
                  )}
                  {employmentType && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="capitalize">{employmentType}</span>
                    </div>
                  )}
                </div>

                {/* Skills - Show required skills from opportunity */}
                {skillsRequired && skillsRequired.length > 0 && (
                  <div className="mb-3 flex-grow">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <h4 className="font-semibold text-gray-900 text-xs">Required Skills</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(skillsRequired) ? skillsRequired : [skillsRequired])
                        .slice(0, 3)
                        .map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium border border-emerald-100"
                          >
                            {skill}
                          </span>
                        ))}
                      {Array.isArray(skillsRequired) && skillsRequired.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-medium border border-gray-100">
                          +{skillsRequired.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Match Reason - Truncated */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-4 text-xs">
                  <div className="flex items-start gap-1.5 ">
                    <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-indigo-900 line-clamp-2" title={matchReason}>
                      {matchReason}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => onSelectJob(opportunity)}
                    className="flex-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Details
                  </button>
                  {!appliedJobs.has(jobId) ? (
                    <button
                      onClick={() => onApply(opportunity)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Apply
                    </button>
                  ) : (
                    <div className="flex-1 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Applied
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Wrapped RecommendedJobs with FeatureGate for ai_job_matching add-on
 * Uses blurContent={false} to show a centered card instead of overlay
 * This prevents the FeatureGate from covering other page content
 */
const RecommendedJobs = (props) => (
  <div className="relative mb-6">
    <FeatureGate featureKey="ai_job_matching" showUpgradePrompt={true} blurContent={false}>
      <RecommendedJobsContent {...props} />
    </FeatureGate>
  </div>
);

export default RecommendedJobs;
