import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Target,
  Send,
} from 'lucide-react';

interface JobOpportunity {
  rank: number;
  title: string;
  company: string;
  matchScore: string;
  location: string;
  type: string;
  salary: string;
  deadline: string;
  reason: string;
  matchingSkills: string[];
  skillsToLearn: string[];
  action: string;
  daysLeft: number;
  recommended?: boolean;
}

interface JobRecommendationsProps {
  userName?: string;
  opportunities: JobOpportunity[];
}

const JobRecommendations: React.FC<JobRecommendationsProps> = ({
  userName = 'P.DURKADEVID',
  opportunities = [],
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentJobIndex, setCurrentJobIndex] = useState(-1);
  const [isTypingHeader, setIsTypingHeader] = useState(true);
  const [showJobs, setShowJobs] = useState(false);

  const headerText = `Great news, ${userName}! 🎉\nI found ${opportunities.length} job opportunities that match your profile:`;

  // Type out the header text
  useEffect(() => {
    if (!isTypingHeader) return;

    let index = 0;
    const typingSpeed = 30; // milliseconds per character

    const timer = setInterval(() => {
      if (index < headerText.length) {
        setDisplayedText(headerText.slice(0, index + 1));
        index++;
      } else {
        setIsTypingHeader(false);
        // Start showing jobs after header is done
        setTimeout(() => setShowJobs(true), 300);
        clearInterval(timer);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [headerText, isTypingHeader]);

  // Animate jobs one by one
  useEffect(() => {
    if (!showJobs || currentJobIndex >= opportunities.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentJobIndex((prev) => prev + 1);
    }, 200); // delay between each job card

    return () => clearTimeout(timer);
  }, [showJobs, currentJobIndex, opportunities.length]);

  const getMatchScoreColor = (score: string) => {
    const numScore = parseInt(score);
    if (numScore >= 80) return 'text-green-600 bg-green-50';
    if (numScore >= 70) return 'text-blue-600 bg-blue-50';
    if (numScore >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getDeadlineColor = (daysLeft: number) => {
    if (daysLeft <= 32) return 'text-orange-600';
    if (daysLeft <= 37) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* AI Message Bubble */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start gap-4">
          {/* AI Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>

          {/* Message Content */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
              {displayedText}
              {isTypingHeader && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-0.5 h-5 bg-gray-800 ml-1"
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Job Cards */}
      <div className="space-y-4 ml-14">
        <AnimatePresence>
          {showJobs &&
            opportunities.map(
              (job, index) =>
                index <= currentJobIndex && (
                  <motion.div
                    key={job.rank}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Header with rank and match score */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">{job.rank}.</span>
                          {job.recommended && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <span className="text-2xl">⭐</span>
                            </motion.div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            at {job.company}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className={`px-4 py-2 rounded-full font-bold text-sm ${getMatchScoreColor(job.matchScore)}`}
                      >
                        Match Score: {job.matchScore}
                      </motion.div>
                    </div>

                    {/* Job Details */}
                    <div className="p-6">
                      {/* Meta Information */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{job.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{job.salary}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg ${getDeadlineColor(job.daysLeft)}`}
                        >
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{job.daysLeft} days left</span>
                        </div>
                      </div>

                      {/* Why it's a great fit */}
                      <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Why it's a great fit:
                        </h4>
                        <p className="text-sm text-blue-800 leading-relaxed">{job.reason}</p>
                      </div>

                      {/* Skills Section */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Matching Skills */}
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                          <h4 className="font-semibold text-sm text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Your matching skills:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.matchingSkills.map((skill, idx) => (
                              <motion.span
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * idx }}
                                className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200"
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </div>

                        {/* Skills to Develop */}
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <h4 className="font-semibold text-sm text-amber-900 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Skills to develop:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.skillsToLearn.map((skill, idx) => (
                              <motion.span
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * idx }}
                                className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200"
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Salary & Deadline */}
                      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-700">
                          <DollarSign className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Salary</p>
                            <p className="text-sm font-bold">{job.salary}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Deadline</p>
                            <p className="text-sm font-bold">{job.deadline}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-purple-100">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm text-purple-900 mb-1">Action:</h4>
                            <p className="text-sm text-purple-800">{job.action}</p>
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Apply Now
                      </motion.button>
                    </div>
                  </motion.div>
                )
            )}
        </AnimatePresence>
      </div>

      {/* Loading indicator for remaining cards */}
      {showJobs && currentJobIndex < opportunities.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-14 mt-4 flex items-center gap-2 text-gray-500"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-gray-300 border-t-violet-600 rounded-full"
          />
          <span className="text-sm">Loading more opportunities...</span>
        </motion.div>
      )}
    </div>
  );
};

export default JobRecommendations;
