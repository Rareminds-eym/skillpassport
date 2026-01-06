import React, { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronDown, ChevronUp, Target, TrendingUp, Rocket, Star, Sprout, Wrench, FileText } from "lucide-react";

// Map level to icon component
const getLevelIcon = (level) => {
  switch (level) {
    case "Excellent":
      return <Star className="w-3.5 h-3.5" />;
    case "Good":
      return <Rocket className="w-3.5 h-3.5" />;
    case "Moderate":
      return <Sprout className="w-3.5 h-3.5" />;
    case "Needs Support":
      return <Wrench className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
};

/**
 * Employability Score Card with Progress Bar and Radar Chart
 */
const EmployabilityScoreCard = ({ employabilityData }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const {
    employabilityScore = 0,
    level = "Not Started",
    label: rawLabel = "Complete Your Profile",
    focusArea = "All Areas",
    breakdown = {},
  } = employabilityData || {};

  // Strip any emoji characters from the label (in case of cached/old data)
  // Using a simpler approach to remove emojis that's more compatible
  const label = rawLabel
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Remove surrogate pairs (most emojis)
    .replace(/[\u2600-\u26FF\u2700-\u27BF\u2300-\u23FF\u2B50]/g, '') // Remove misc symbols
    .replace(/[\uFE00-\uFE0F]/g, '') // Remove variation selectors
    .trim();

  // Get color based on score
  const getScoreColor = () => {
    if (employabilityScore >= 85) return "from-green-500 to-emerald-500";
    if (employabilityScore >= 70) return "from-blue-500 via-indigo-500 to-blue-600";
    if (employabilityScore >= 50) return "from-amber-500 to-yellow-500";
    if (employabilityScore > 0) return "from-orange-500 to-red-500";
    return "from-gray-400 to-gray-500";
  };

  const getTextColor = () => {
    if (employabilityScore >= 85) return "text-green-600";
    if (employabilityScore >= 70) return "text-blue-600";
    if (employabilityScore >= 50) return "text-amber-600";
    if (employabilityScore > 0) return "text-orange-600";
    return "text-gray-500";
  };

  // Prepare radar chart data
  const radarData = [
    {
      category: "Foundational",
      score: breakdown.foundational || 0,
      fullMark: 100,
      description: "Communication, Comprehension, Critical Thinking",
    },
    {
      category: "21st Century",
      score: breakdown.century21 || 0,
      fullMark: 100,
      description: "Collaboration, Creativity, Problem Solving",
    },
    {
      category: "Digital",
      score: breakdown.digital || 0,
      fullMark: 100,
      description: "Digital Literacy, Tech Tools Usage",
    },
    {
      category: "Behavior",
      score: breakdown.behavior || 0,
      fullMark: 100,
      description: "Punctuality, Discipline, Accountability",
    },
    {
      category: "Career",
      score: breakdown.career || 0,
      fullMark: 100,
      description: "Projects, Internships, Achievements",
    },
  ];

  // Custom tooltip for radar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.category}</p>
          <p className="text-blue-600 font-bold">{data.score}%</p>
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-blue-100 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Employability Score
        </span>
        <span className={`text-lg font-bold ${getTextColor()} drop-shadow-sm`}>
          {employabilityScore}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getScoreColor()} rounded-full transition-all duration-500 shadow-lg`}
          style={{ width: `${employabilityScore}%` }}
        />
      </div>

      {/* Label and Focus Area */}
      <div className="flex items-center justify-between">
        <span className={`text-xs ${getTextColor()} font-semibold flex items-center gap-1`}>
          {getLevelIcon(level)}
          {label}
        </span>
        {employabilityScore > 0 && focusArea && focusArea !== "All Areas" && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200">
            <Target className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-700">
              Focus: <strong>{focusArea}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Show Details Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full text-blue-600 hover:text-blue-800 text-xs flex items-center justify-center gap-1 transition-colors pt-1"
      >
        {showBreakdown ? "Hide" : "Show"} Details
        {showBreakdown ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Expandable Breakdown Section */}
      {showBreakdown && (
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-3 text-center">
            Category Breakdown
          </h4>

          {/* Radar Chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
              >
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#9CA3AF", fontSize: 9 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {radarData.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-xs text-gray-600">{item.category}</span>
                <span
                  className={`text-xs font-semibold ${
                    item.score >= 70
                      ? "text-green-600"
                      : item.score >= 50
                        ? "text-blue-600"
                        : item.score > 0
                          ? "text-amber-600"
                          : "text-gray-400"
                  }`}
                >
                  {item.score}%
                </span>
              </div>
            ))}
          </div>

          {/* Score Legend */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex justify-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                85+ Ready
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                70+ Emerging
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                50+ Developing
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployabilityScoreCard;
