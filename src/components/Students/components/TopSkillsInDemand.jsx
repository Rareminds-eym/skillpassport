import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Award, TrendingUp, Briefcase, RefreshCw } from 'lucide-react';
import SkillsAnalyticsService from '../../../services/skillsAnalyticsService';

/**
 * Top Skills in Demand Component
 * Dynamically analyzes opportunities to show the most demanded skills
 */
const TopSkillsInDemand = ({ limit = 5, showHeader = true, className = '' }) => {
  const [skillsData, setSkillsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug logging
  const debugLog = (message, data = null) => {
    console.log(`[TopSkillsInDemand] ${message}`, data || '');
  };

  useEffect(() => {
    debugLog('Component mounted, fetching top skills...');
    fetchTopSkills();
  }, [limit]);

  const fetchTopSkills = async () => {
    try {
      debugLog('Starting fetchTopSkills...');
      setLoading(true);
      setError(null);

      // Debug the opportunities table first
      await SkillsAnalyticsService.debugOpportunitiesTable();

      const analysis = await SkillsAnalyticsService.getSkillsDemandAnalysis(limit);

      debugLog('Received analysis:', analysis);

      setSkillsData(analysis.topSkills);
      setLastUpdated(analysis.lastUpdated);
      setDebugInfo({
        totalOpportunities: analysis.totalOpportunities,
        skillsCount: analysis.topSkills.length,
        mostDemanded: analysis.analysis.mostDemandedSkill,
        averageDemand: analysis.analysis.averageDemand,
      });

      debugLog('State updated with skills data:', analysis.topSkills);
    } catch (err) {
      debugLog('Error in fetchTopSkills:', err);
      console.error('Error fetching top skills:', err);
      setError('Failed to load skills data');
    } finally {
      setLoading(false);
      debugLog('fetchTopSkills completed');
    }
  };

  const handleRefresh = () => {
    fetchTopSkills();
  };

  if (loading) {
    return (
      <Card className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        {showHeader && (
          <CardHeader className="px-6 py-4 border-b border-gray-100 bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Award className="w-4 h-4 text-blue-600" />
              Top {limit} Skills in Demand
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        {showHeader && (
          <CardHeader className="px-6 py-4 border-b border-gray-100 bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Award className="w-4 h-4 text-blue-600" />
              Top {limit} Skills in Demand
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (skillsData.length === 0) {
    return (
      <Card className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        {showHeader && (
          <CardHeader className="px-6 py-4 border-b border-gray-100 bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Award className="w-4 h-4 text-blue-600" />
              Top {limit} Skills in Demand
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="mb-4 inline-block p-3 bg-blue-50 rounded-full">
              <Briefcase className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">No skills data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {showHeader && (
        <CardHeader className="px-6 py-4 border-b border-gray-100 bg-blue-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Award className="w-4 h-4 text-blue-600" />
              Top {limit} Skills in Demand
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-12">
        {/* Main Content Layout - Grid with 2:1 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Pie Chart Container - Takes 2 columns */}
          <div className="lg:col-span-2 flex flex-col lg:flex-row items-center gap-8">
            {/* SVG Pie Chart */}
            <div className="relative flex-shrink-0">
              <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                {(() => {
                  let cumulativePercentage = 0;
                  const radius = 80;
                  const centerX = 100;
                  const centerY = 100;

                  return skillsData.map((skill, index) => {
                    const percentage = skill.percentage;
                    const startAngle = (cumulativePercentage / 100) * 360;
                    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;

                    // Calculate path for pie slice
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;

                    const x1 = centerX + radius * Math.cos(startAngleRad);
                    const y1 = centerY + radius * Math.sin(startAngleRad);
                    const x2 = centerX + radius * Math.cos(endAngleRad);
                    const y2 = centerY + radius * Math.sin(endAngleRad);

                    const largeArcFlag = percentage > 50 ? 1 : 0;

                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      'Z',
                    ].join(' ');

                    cumulativePercentage += percentage;

                    // Color based on rank
                    const colors = [
                      '#2563eb', // blue-600 for rank 1
                      '#3b82f6', // blue-500 for rank 2
                      '#60a5fa', // blue-400 for rank 3
                      '#93c5fd', // blue-300 for rank 4
                      '#bfdbfe', // blue-200 for rank 5+
                    ];

                    return (
                      <path
                        key={skill.skill}
                        d={pathData}
                        fill={colors[Math.min(index, colors.length - 1)]}
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Circle with Total */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg border-2 border-blue-100">
                  <span className="text-lg font-bold text-blue-600">
                    {skillsData.reduce((sum, skill) => sum + skill.count, 0)}
                  </span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2 ml-2">
              {skillsData.map((skill, index) => {
                const colors = [
                  'bg-blue-600', // rank 1
                  'bg-blue-500', // rank 2
                  'bg-blue-400', // rank 3
                  'bg-blue-300', // rank 4
                  'bg-blue-200', // rank 5+
                ];

                return (
                  <div key={skill.skill} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {/* Color Indicator */}
                      <div
                        className={`w-4 h-4 rounded-full ${colors[Math.min(index, colors.length - 1)]}`}
                      />

                      {/* Rank Badge */}
                      <div
                        className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${
                          index === 0
                            ? 'bg-blue-200 text-blue-900'
                            : index === 1
                              ? 'bg-blue-100 text-blue-800'
                              : index === 2
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-blue-50 text-blue-600'
                        }
                      `}
                      >
                        {index + 1}
                      </div>

                      {/* Skill Info */}
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {skill.skill}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {skill.count} {skill.count === 1 ? 'opportunity' : 'opportunities'}
                        </span>
                      </div>

                      {/* Trending Icon for top 3 */}
                      {index < 3 && <TrendingUp className="w-4 h-4 text-blue-500" />}
                    </div>

                    {/* Percentage Badge - positioned at the far right */}
                    <div
                      className={`
                      px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        index === 0
                          ? 'bg-blue-600 text-white'
                          : index < 3
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-400 text-white'
                      }
                    `}
                    >
                      {skill.percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Statistics - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50 rounded-lg p-3 min-w-[100px]">
                <div className="text-lg font-bold text-blue-600">{skillsData.length}</div>
                <div className="text-xs text-gray-600">Top Skills</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 min-w-[100px]">
                <div className="text-lg font-bold text-blue-600">
                  {skillsData.reduce((sum, skill) => sum + skill.count, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Opportunities</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 min-w-[100px]">
                <div className="text-lg font-bold text-blue-600">
                  {skillsData[0]?.percentage || 0}%
                </div>
                <div className="text-xs text-gray-600">Highest Demand</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 min-w-[100px]">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(
                    skillsData.reduce((sum, skill) => sum + skill.percentage, 0) / skillsData.length
                  ) || 0}
                  %
                </div>
                <div className="text-xs text-gray-600">Average Demand</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {lastUpdated && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span>Real-time market analysis</span>
              </div>
              <p className="text-xs text-gray-400">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSkillsInDemand;
