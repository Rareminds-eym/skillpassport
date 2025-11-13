import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  Target,
  Lightbulb,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

/**
 * Educator Card Components
 * Visual, interactive cards for displaying student insights, analytics, and recommendations
 */

// ============================================================================
// STUDENT INSIGHT CARD
// Shows analysis about individual student
// ============================================================================

interface StudentInsightCardProps {
  studentId: string;
  studentName: string;
  insightType: 'strength' | 'gap' | 'interest' | 'concern' | 'opportunity';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  actionItems?: string[];
  onViewProfile?: () => void;
}

export const StudentInsightCard: React.FC<StudentInsightCardProps> = ({
  studentName,
  insightType,
  title,
  description,
  recommendation,
  priority,
  actionItems,
  onViewProfile
}) => {
  const insightConfig = {
    strength: { 
      color: 'bg-green-50 border-green-200', 
      badge: 'bg-green-600', 
      icon: CheckCircle, 
      iconColor: 'text-green-600' 
    },
    gap: { 
      color: 'bg-orange-50 border-orange-200', 
      badge: 'bg-orange-600', 
      icon: TrendingDown, 
      iconColor: 'text-orange-600' 
    },
    interest: { 
      color: 'bg-blue-50 border-blue-200', 
      badge: 'bg-blue-600', 
      icon: Lightbulb, 
      iconColor: 'text-blue-600' 
    },
    concern: { 
      color: 'bg-red-50 border-red-200', 
      badge: 'bg-red-600', 
      icon: AlertCircle, 
      iconColor: 'text-red-600' 
    },
    opportunity: { 
      color: 'bg-purple-50 border-purple-200', 
      badge: 'bg-purple-600', 
      icon: Target, 
      iconColor: 'text-purple-600' 
    }
  };

  const priorityBadge = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-gray-100 text-gray-700 border-gray-300'
  };

  const config = insightConfig[insightType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`${config.color} border-2 rounded-2xl p-5 hover:shadow-md transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white shadow-sm`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{studentName}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{title}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${priorityBadge[priority]}`}>
          {priority.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{description}</p>

      {/* Recommendation */}
      <div className="p-3 bg-white rounded-lg border border-gray-200 mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-1">💡 Recommendation:</p>
        <p className="text-sm text-gray-800">{recommendation}</p>
      </div>

      {/* Action Items */}
      {actionItems && actionItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">📋 Action Items:</p>
          <ul className="space-y-1.5">
            {actionItems.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {onViewProfile && (
          <button
            onClick={onViewProfile}
            className="flex-1 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// CLASS ANALYTICS CARD
// Shows class-level metrics and trends
// ============================================================================

interface ClassAnalyticsCardProps {
  className: string;
  metrics: {
    totalStudents: number;
    activeRate: number;
    avgSkillLevel: number;
    careerReadinessScore: number;
  };
  trends: {
    popularCareers: { career: string; count: number }[];
    skillGaps: { skill: string; frequency: number }[];
  };
  onViewDetails?: () => void;
}

export const ClassAnalyticsCard: React.FC<ClassAnalyticsCardProps> = ({
  className,
  metrics,
  trends,
  onViewDetails
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-5 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{className}</h3>
            <p className="text-xs text-gray-600 mt-0.5">Class Analytics</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600 font-medium">Students</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalStudents}</p>
          <p className="text-xs text-green-600 mt-1">
            {metrics.activeRate}% active
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600 font-medium">Readiness</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.careerReadinessScore}%</p>
          <p className="text-xs text-gray-500 mt-1">Career ready</p>
        </div>
      </div>

      {/* Trends */}
      <div className="space-y-3">
        {/* Popular Careers */}
        {trends.popularCareers && trends.popularCareers.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Top Career Interests
            </p>
            <div className="space-y-1.5">
              {trends.popularCareers.slice(0, 3).map((career, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{career.career}</span>
                  <span className="text-xs font-semibold text-purple-600">{career.count} students</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Gaps */}
        {trends.skillGaps && trends.skillGaps.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Common Skill Gaps
            </p>
            <div className="flex flex-wrap gap-1.5">
              {trends.skillGaps.slice(0, 5).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full border border-orange-200"
                >
                  {skill.skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full mt-4 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          View Detailed Analytics
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// INTERVENTION CARD
// Alerts for at-risk students requiring intervention
// ============================================================================

interface InterventionCardProps {
  studentName: string;
  concernType: 'disengagement' | 'skill_gap' | 'career_confusion' | 'performance';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  suggestedActions: string[];
  followUpTimeline: string;
  onTakeAction?: () => void;
}

export const InterventionCard: React.FC<InterventionCardProps> = ({
  studentName,
  concernType,
  severity,
  description,
  suggestedActions,
  followUpTimeline,
  onTakeAction
}) => {
  const severityConfig = {
    critical: {
      color: 'bg-red-50 border-red-300',
      badge: 'bg-red-600 text-white',
      iconColor: 'text-red-600'
    },
    high: {
      color: 'bg-orange-50 border-orange-300',
      badge: 'bg-orange-600 text-white',
      iconColor: 'text-orange-600'
    },
    medium: {
      color: 'bg-yellow-50 border-yellow-300',
      badge: 'bg-yellow-600 text-white',
      iconColor: 'text-yellow-600'
    }
  };

  const concernLabels = {
    disengagement: 'Low Engagement',
    skill_gap: 'Skill Gap',
    career_confusion: 'Career Uncertainty',
    performance: 'Performance Issue'
  };

  const config = severityConfig[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`${config.color} border-2 rounded-2xl p-5 hover:shadow-md transition-all`}
    >
      {/* Header with Alert */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm">
            <AlertCircle className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{studentName}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{concernLabels[concernType]}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${config.badge}`}>
          {severity.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
        <p className="text-sm text-gray-800">{description}</p>
      </div>

      {/* Suggested Actions */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">🎯 Suggested Actions:</p>
        <ul className="space-y-1.5">
          {suggestedActions.map((action, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">{idx + 1}.</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-gray-600">⏰ Follow up:</span>
        <span className="font-semibold text-gray-900">{followUpTimeline}</span>
      </div>

      {/* Action Button */}
      {onTakeAction && (
        <button
          onClick={onTakeAction}
          className="w-full px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          Take Action
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// TREND CARD
// Shows skill or career trends
// ============================================================================

interface TrendCardProps {
  title: string;
  trendType: 'skill' | 'career' | 'industry';
  items: { name: string; value: number; trend: 'up' | 'down' | 'stable' }[];
  insights: string[];
  onExplore?: () => void;
}

export const TrendCard: React.FC<TrendCardProps> = ({
  title,
  trendType,
  items,
  insights,
  onExplore
}) => {
  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-600" />,
    down: <TrendingDown className="w-4 h-4 text-red-600" />,
    stable: <div className="w-4 h-4 text-gray-400">→</div>
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white shadow-sm">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <p className="text-xs text-gray-600 mt-0.5 capitalize">{trendType} Trends</p>
        </div>
      </div>

      {/* Trend Items */}
      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {trendIcons[item.trend]}
              <span className="text-sm font-medium text-gray-800">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{item.value}%</span>
          </div>
        ))}
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-blue-100 mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">💡 Key Insights:</p>
          <ul className="space-y-1">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action */}
      {onExplore && (
        <button
          onClick={onExplore}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Explore Trends
          <ExternalLink className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
