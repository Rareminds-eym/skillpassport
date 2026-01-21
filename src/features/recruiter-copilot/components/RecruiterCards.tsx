import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, Target, TrendingUp, Award, MapPin } from 'lucide-react';

interface CandidateInsightCardProps {
  card: {
    candidateId: string;
    candidateName: string;
    insightType: 'top-match' | 'emerging-talent' | 'skill-gap' | 'high-potential' | 'ready-to-hire';
    title: string;
    description: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    matchScore?: number;
    matchedSkills?: string[];
    missingSkills?: string[];
    actionItems?: string[];
  };
}

export const CandidateInsightCard: React.FC<CandidateInsightCardProps> = ({ card }) => {
  const getInsightColor = () => {
    switch (card.insightType) {
      case 'top-match':
      case 'ready-to-hire':
        return 'border-green-500 bg-green-50';
      case 'high-potential':
        return 'border-blue-500 bg-blue-50';
      case 'emerging-talent':
        return 'border-purple-500 bg-purple-50';
      case 'skill-gap':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getInsightIcon = () => {
    switch (card.insightType) {
      case 'top-match':
        return <Target className="text-green-600" size={20} />;
      case 'ready-to-hire':
        return <Award className="text-green-600" size={20} />;
      case 'high-potential':
        return <TrendingUp className="text-blue-600" size={20} />;
      case 'emerging-talent':
        return <User className="text-purple-600" size={20} />;
      case 'skill-gap':
        return <Briefcase className="text-yellow-600" size={20} />;
      default:
        return <User className="text-gray-600" size={20} />;
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${colors[card.priority]}`}>
        {card.priority.toUpperCase()} PRIORITY
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border-l-4 ${getInsightColor()} rounded-lg p-4 shadow-sm`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getInsightIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.candidateName}</p>
          </div>
        </div>
        {getPriorityBadge()}
      </div>

      {/* Match Score */}
      {card.matchScore !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Match Score</span>
            <span className="font-semibold text-gray-900">{card.matchScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                card.matchScore >= 80
                  ? 'bg-green-500'
                  : card.matchScore >= 60
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${card.matchScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{card.description}</p>

      {/* Matched Skills */}
      {card.matchedSkills && card.matchedSkills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Matched Skills:</p>
          <div className="flex flex-wrap gap-1">
            {card.matchedSkills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {card.missingSkills && card.missingSkills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Skills to Develop:</p>
          <div className="flex flex-wrap gap-1">
            {card.missingSkills.map((skill, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-1">💡 Recommendation:</p>
        <p className="text-sm text-gray-800">{card.recommendation}</p>
      </div>

      {/* Action Items */}
      {card.actionItems && card.actionItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Next Steps:</p>
          <ul className="space-y-1">
            {card.actionItems.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

interface JobAnalyticsCardProps {
  card: {
    jobTitle: string;
    totalApplicants: number;
    qualifiedCandidates: number;
    avgMatchScore: number;
    topSkills: string[];
    recommendations: string[];
  };
}

export const JobAnalyticsCard: React.FC<JobAnalyticsCardProps> = ({ card }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="text-purple-600" size={20} />
        <h3 className="font-semibold text-gray-900">{card.jobTitle}</h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{card.totalApplicants}</p>
          <p className="text-xs text-gray-600">Total Applicants</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{card.qualifiedCandidates}</p>
          <p className="text-xs text-gray-600">Qualified</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{card.avgMatchScore}%</p>
          <p className="text-xs text-gray-600">Avg Match</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Top Skills:</p>
        <div className="flex flex-wrap gap-1">
          {card.topSkills.map((skill, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {card.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Recommendations:</p>
          <ul className="space-y-1">
            {card.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

interface TalentPoolCardProps {
  card: {
    totalCandidates: number;
    topSkills: { skill: string; count: number }[];
    topLocations: { location: string; count: number }[];
    insights: string[];
  };
}

export const TalentPoolCard: React.FC<TalentPoolCardProps> = ({ card }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-blue-600" size={20} />
        <h3 className="font-semibold text-gray-900">Talent Pool Overview</h3>
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-gray-900">{card.totalCandidates}</p>
        <p className="text-sm text-gray-600">Total Candidates</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Top Skills:</p>
          <div className="space-y-1">
            {card.topSkills.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.skill}</span>
                <span className="text-gray-500">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Top Locations:</p>
          <div className="space-y-1">
            {card.topLocations.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 text-sm">
                <MapPin size={12} className="text-gray-500" />
                <span className="text-gray-700">{item.location}</span>
                <span className="text-gray-500">({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
