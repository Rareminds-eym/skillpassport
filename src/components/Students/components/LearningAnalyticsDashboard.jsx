import { useMemo } from "react";
import { Clock, BookOpen, Target, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Learning Analytics Dashboard Component
 * Displays learning statistics, activity heatmap, and progress charts
 * Design: Clean white cards with blue accent colors
 */
const LearningAnalyticsDashboard = ({ trainings = [], stats = {} }) => {
  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Total hours spent
    const totalHours = trainings.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);

    // Courses completed this month
    const completedThisMonth = trainings.filter((t) => {
      if (t.status !== "completed") return false;
      const updated = new Date(t.updatedAt || t.updated_at);
      return updated.getMonth() === thisMonth && updated.getFullYear() === thisYear;
    }).length;

    // Courses completed last month
    const completedLastMonth = trainings.filter((t) => {
      if (t.status !== "completed") return false;
      const updated = new Date(t.updatedAt || t.updated_at);
      return updated.getMonth() === lastMonth && updated.getFullYear() === lastMonthYear;
    }).length;

    // Completion rate
    const totalCourses = trainings.length;
    const completedCourses = trainings.filter((t) => t.status === "completed").length;
    const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    // Total modules completed
    const totalModulesCompleted = trainings.reduce((sum, t) => sum + (Number(t.completedModules) || 0), 0);
    const totalModules = trainings.reduce((sum, t) => sum + (Number(t.totalModules) || 0), 0);

    // Average progress
    const avgProgress = totalModules > 0 ? Math.round((totalModulesCompleted / totalModules) * 100) : 0;

    // Generate activity data for heatmap (last 4 weeks)
    const activityData = generateActivityData(trainings);

    // Course progress data
    const courseProgress = trainings
      .filter((t) => t.status === "ongoing")
      .map((t) => ({
        id: t.id,
        title: t.title || t.course || "Untitled",
        progress: t.totalModules > 0 ? Math.round((t.completedModules / t.totalModules) * 100) : 0,
        hoursSpent: t.hoursSpent || 0,
      }))
      .slice(0, 5);

    // Monthly completion trend (last 6 months)
    const monthlyTrend = generateMonthlyTrend(trainings);

    return {
      totalHours,
      completedThisMonth,
      completedLastMonth,
      completionRate,
      totalCourses,
      completedCourses,
      avgProgress,
      activityData,
      courseProgress,
      monthlyTrend,
    };
  }, [trainings]);

  // Trend indicator component
  const TrendIndicator = ({ current, previous }) => {
    if (current > previous) {
      return (
        <span className="flex items-center text-emerald-600 text-xs font-medium mt-1">
          <TrendingUp className="w-3 h-3 mr-0.5" />
          +{current - previous} this month
        </span>
      );
    } else if (current < previous) {
      return (
        <span className="flex items-center text-red-500 text-xs font-medium mt-1">
          <TrendingDown className="w-3 h-3 mr-0.5" />
          {current - previous} this month
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-400 text-xs font-medium mt-1">
        <Minus className="w-3 h-3 mr-0.5" />
        No change
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalHours}</p>
              <p className="text-sm text-gray-500 mt-1">Total Hours</p>
            </div>
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Courses Completed */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{analytics.completedCourses}</p>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
              <TrendIndicator current={analytics.completedThisMonth} previous={analytics.completedLastMonth} />
            </div>
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{analytics.completionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
            </div>
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{analytics.avgProgress}%</p>
              <p className="text-sm text-gray-500 mt-1">Avg Progress</p>
            </div>
            <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sky-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap & Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Heatmap */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Learning Activity</h3>
          <div className="space-y-3">
            {/* Day Labels */}
            <div className="flex gap-1.5 pl-8">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="flex-1 text-center text-xs text-gray-400 font-medium">
                  {day}
                </div>
              ))}
            </div>
            {/* Heatmap Grid */}
            <div className="space-y-1.5">
              {analytics.activityData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 w-6 text-right">W{4 - weekIdx}</span>
                  <div className="flex gap-1.5 flex-1">
                    {week.map((day, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={`flex-1 h-8 rounded-md transition-all cursor-pointer hover:scale-105 ${getActivityColor(day.level)}`}
                        title={`${day.date}: ${day.hours} hours`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div key={level} className={`w-4 h-4 rounded-sm ${getActivityColor(level)}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400">More</span>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Course Progress</h3>
          <div className="space-y-4">
            {analytics.courseProgress.length > 0 ? (
              analytics.courseProgress.map((course) => (
                <div key={course.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px] group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No courses in progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Monthly Completions</h3>
        <div className="flex items-end justify-between h-40 gap-3 px-2">
          {analytics.monthlyTrend.map((month, idx) => {
            const maxCount = Math.max(...analytics.monthlyTrend.map(m => m.count), 1);
            const heightPercent = (month.count / maxCount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="flex-1 w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500"
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-3 font-medium">{month.label}</span>
                <span className="text-xs font-bold text-gray-700">{month.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate activity data for heatmap
function generateActivityData(trainings) {
  const weeks = [];
  const now = new Date();

  // Generate last 4 weeks of data
  for (let w = 3; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));

      // Simulate activity based on training data
      const dayStr = date.toISOString().split("T")[0];
      const hasActivity = trainings.some((t) => {
        const start = new Date(t.start_date || t.startDate);
        const end = t.end_date || t.endDate ? new Date(t.end_date || t.endDate) : now;
        return date >= start && date <= end;
      });

      // Random hours for demo (in real app, track actual daily hours)
      const hours = hasActivity ? Math.floor(Math.random() * 4) + 1 : 0;
      const level = hours === 0 ? 0 : hours <= 1 ? 1 : hours <= 2 ? 2 : hours <= 3 ? 3 : 4;

      week.push({
        date: dayStr,
        hours,
        level,
      });
    }
    weeks.push(week);
  }

  return weeks;
}

// Helper function to generate monthly trend data
function generateMonthlyTrend(trainings) {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString("default", { month: "short" });

    const count = trainings.filter((t) => {
      if (t.status !== "completed") return false;
      const updated = new Date(t.updatedAt || t.updated_at || t.created_at);
      return updated.getMonth() === date.getMonth() && updated.getFullYear() === date.getFullYear();
    }).length;

    months.push({
      label: monthName,
      count,
    });
  }

  return months;
}

// Helper function to get activity color based on level (Blue shades)
function getActivityColor(level) {
  switch (level) {
    case 0:
      return "bg-gray-100";
    case 1:
      return "bg-blue-100";
    case 2:
      return "bg-blue-200";
    case 3:
      return "bg-blue-400";
    case 4:
      return "bg-blue-600";
    default:
      return "bg-gray-100";
  }
}

export default LearningAnalyticsDashboard;
