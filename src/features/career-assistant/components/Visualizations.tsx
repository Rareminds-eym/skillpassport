import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { ProgressBar, ScoreDisplay, VisualizationData } from '../types/interactive';
import * as Icons from 'lucide-react';

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

interface ProgressBarProps {
  data: ProgressBar;
}

export const ProgressBarComponent: React.FC<ProgressBarProps> = ({ data }) => {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  const bgColorMap = {
    blue: 'bg-gray-200',
    green: 'bg-gray-200',
    yellow: 'bg-gray-200',
    red: 'bg-gray-200',
    purple: 'bg-gray-200',
  };

  const barColor = colorMap[data.color || 'blue'];
  const bgColor = bgColorMap[data.color || 'blue'];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{data.label}</span>
        {data.showPercentage && (
          <span className="text-sm font-semibold text-gray-900">{data.value}%</span>
        )}
      </div>
      <div className={`w-full ${bgColor} rounded-full h-2 overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, data.value)}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`${barColor} h-2 rounded-full`}
        />
      </div>
    </div>
  );
};

// ============================================================================
// SCORE DISPLAY COMPONENT
// ============================================================================

interface ScoreDisplayProps {
  data: ScoreDisplay;
}

export const ScoreDisplayComponent: React.FC<ScoreDisplayProps> = ({ data }) => {
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-2xl border ${getScoreBg(data.score, data.maxScore)}`}
    >
      {/* Main Score */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className={`text-4xl font-bold ${getScoreColor(data.score, data.maxScore)}`}
        >
          {data.score}
          <span className="text-xl text-gray-500">/{data.maxScore}</span>
        </motion.div>
        <p className="text-sm font-medium text-gray-600 mt-2">{data.label}</p>
      </div>

      {/* Breakdown */}
      {data.breakdown && data.breakdown.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Breakdown</p>
          {data.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  // Dynamic icon loading
  let IconComponent: LucideIcon | null = null;
  if (icon && icon in Icons) {
    IconComponent = (Icons as any)[icon] as LucideIcon;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {IconComponent && <IconComponent className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
      </div>
    </motion.div>
  );
};

// ============================================================================
// VISUALIZATION CONTAINER
// ============================================================================

interface VisualizationContainerProps {
  data: VisualizationData;
}

export const VisualizationContainer: React.FC<VisualizationContainerProps> = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 my-4"
    >
      {/* Progress Bars */}
      {data.progressBars && data.progressBars.length > 0 && (
        <div className="space-y-3">
          {data.progressBars.map((bar, idx) => (
            <ProgressBarComponent key={idx} data={bar} />
          ))}
        </div>
      )}

      {/* Scores */}
      {data.scores && data.scores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.scores.map((score, idx) => (
            <ScoreDisplayComponent key={idx} data={score} />
          ))}
        </div>
      )}

      {/* Stats */}
      {data.stats && data.stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.stats.map((stat, idx) => (
            <StatCard
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
