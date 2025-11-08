import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  ExternalLink,
  Send,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Info,
  Star
} from 'lucide-react';
import {
  JobCard as JobCardType,
  SkillCard as SkillCardType,
  CourseCard as CourseCardType,
  InsightCard as InsightCardType,
  ActionButton as ActionButtonType,
  InteractiveCard
} from '../types/interactive';

// ============================================================================
// ACTION BUTTON COMPONENT
// ============================================================================

interface ActionButtonProps {
  button: ActionButtonType;
  onAction: (button: ActionButtonType) => void;
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  ExternalLink,
  Send,
  Target,
  BookOpen,
  Briefcase,
  Bookmark,
  CheckCircle,
  Award
};

const ActionButton: React.FC<ActionButtonProps> = ({ button, onAction }) => {
  const Icon = iconMap[button.icon || 'ExternalLink'] || ExternalLink;
  
  const variantStyles = {
    primary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
    success: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200',
    outline: 'border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };

  return (
    <motion.button
      whileHover={{ scale: button.disabled ? 1 : 1.01 }}
      whileTap={{ scale: button.disabled ? 1 : 0.99 }}
      onClick={() => !button.disabled && onAction(button)}
      disabled={button.disabled}
      title={button.tooltip}
      className={`px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
        variantStyles[button.variant]
      } ${button.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {button.label}
    </motion.button>
  );
};

// ============================================================================
// JOB CARD COMPONENT
// ============================================================================

interface JobCardProps {
  card: JobCardType;
  onAction: (button: ActionButtonType) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ card, onAction }) => {
  const { data, actions } = card;
  
  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{data.title}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            {data.company}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-sm font-semibold border ${getMatchColor(data.matchScore)} flex-shrink-0`}>
          {data.matchScore}%
        </div>
      </div>

      {/* Details - Only essential info */}
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{data.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{data.employmentType}</span>
        </div>
      </div>

      {/* Skills Tags - Most important */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {data.tags.slice(0, 3).map((tag, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
          >
            {tag}
          </span>
        ))}
        {data.tags.length > 3 && (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
            +{data.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {actions.map((action) => (
          <ActionButton key={action.id} button={action} onAction={onAction} />
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// SKILL CARD COMPONENT
// ============================================================================

interface SkillCardProps {
  card: SkillCardType;
  onAction: (button: ActionButtonType) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ card, onAction }) => {
  const { data, actions } = card;

  const priorityConfig = {
    critical: { color: 'bg-red-50 border-red-200', badge: 'bg-red-600', textColor: 'text-red-700', barColor: 'bg-red-500' },
    high: { color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-600', textColor: 'text-orange-700', barColor: 'bg-orange-500' },
    medium: { color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-600', textColor: 'text-blue-700', barColor: 'bg-blue-500' },
    low: { color: 'bg-gray-50 border-gray-200', badge: 'bg-gray-600', textColor: 'text-gray-700', barColor: 'bg-gray-500' }
  };

  const config = priorityConfig[data.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.color} border rounded-2xl p-6 hover:shadow-sm transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{data.name}</h3>
          <p className={`text-xs font-medium ${config.textColor}`}>{data.priority.toUpperCase()} PRIORITY</p>
        </div>
        <div className={`px-2.5 py-1 ${config.badge} text-white text-xs font-semibold rounded-lg`}>
          {data.demand}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Market Demand</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.demand}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`${config.barColor} h-1.5 rounded-full`}
          />
        </div>
      </div>

      {/* Impact & Time */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-3 bg-white rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Impact</p>
          <p className="text-sm font-semibold text-emerald-600">{data.impact}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Time to Learn</p>
          <p className="text-sm font-semibold text-gray-900">{data.timeToLearn}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-200">
        {actions.map((action) => (
          <ActionButton key={action.id} button={action} onAction={onAction} />
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// COURSE CARD COMPONENT
// ============================================================================

interface CourseCardProps {
  card: CourseCardType;
  onAction: (button: ActionButtonType) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ card, onAction }) => {
  const { data, actions } = card;

  const levelColors = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    Advanced: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-3">
          <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2">{data.title}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
            {data.platform}
          </p>
        </div>
        {data.rating && (
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{data.rating}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex gap-2 mb-4">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${levelColors[data.level]}`}>
          {data.level}
        </span>
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          {data.duration}
        </span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
          data.cost.toLowerCase() === 'free' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {data.cost}
        </span>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">You'll learn:</p>
        <div className="flex flex-wrap gap-1.5">
          {data.skills.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              {skill}
            </span>
          ))}
          {data.skills.length > 4 && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
              +{data.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
        {actions.map((action) => (
          <ActionButton key={action.id} button={action} onAction={onAction} />
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

interface InsightCardProps {
  card: InsightCardType;
  onAction: (button: ActionButtonType) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ card, onAction }) => {
  const { data, actions } = card;

  const severityConfig = {
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle, iconColor: 'text-red-600', dotColor: 'bg-red-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle, iconColor: 'text-amber-600', dotColor: 'bg-amber-500' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600', dotColor: 'bg-emerald-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-600', dotColor: 'bg-blue-500' }
  };

  const config = severityConfig[data.severity || 'info'];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bg} border ${config.border} rounded-2xl p-6 hover:shadow-sm transition-all`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`${config.dotColor} w-2 h-2 rounded-full mt-2 flex-shrink-0`} />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">{data.title}</h3>
          {data.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
          )}
        </div>
      </div>

      {/* Metric */}
      {data.metric && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">{data.metric.value}</span>
            <div className="text-right">
              <p className="text-xs text-gray-500">{data.metric.label}</p>
              {data.metric.change && (
                <p className={`text-sm font-semibold ${
                  data.metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.metric.change}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {actions.map((action) => (
            <ActionButton key={action.id} button={action} onAction={onAction} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// UNIFIED CARD RENDERER
// ============================================================================

interface InteractiveCardRendererProps {
  card: InteractiveCard;
  onAction: (button: ActionButtonType) => void;
}

export const InteractiveCardRenderer: React.FC<InteractiveCardRendererProps> = ({ card, onAction }) => {
  switch (card.type) {
    case 'job':
      return <JobCard card={card} onAction={onAction} />;
    case 'skill':
      return <SkillCard card={card} onAction={onAction} />;
    case 'course':
      return <CourseCard card={card} onAction={onAction} />;
    case 'insight':
      return <InsightCard card={card} onAction={onAction} />;
    default:
      return null;
  }
};

