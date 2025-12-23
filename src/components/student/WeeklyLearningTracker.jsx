import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ArrowRight, BookOpen, Clock, Flame, GraduationCap, TrendingUp, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import '../../utils/suppressRechartsWarnings'; // Auto-suppress Recharts warnings

// Compact tooltip for chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
        {label}: {payload[0].value}m
      </div>
    );
  }
  return null;
};

// Continue Learning Hero Card (Full Width) - Always visible with floating animation
const ContinueLearningHero = ({ course, onContinue }) => {
  const hasCourse = course && course.completionRate < 100;
  
  return (
    <div className="relative mt-20">
      {/* Floating Book Animation - Top Center Overlap */}
      <div 
        className="absolute left-6 -top-20 z-20"
        style={{
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        <div className="drop-shadow-xl" style={{ width: 128, height: 128 }}>
          <DotLottieReact 
            src="https://lottie.host/45abe60c-5bde-4cc9-b112-d35f11a7ffd0/DwMCYzvoQM.lottie" 
            loop 
            autoplay
            renderConfig={{
              autoResize: true,
              devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
            }}
            style={{ width: '100%', height: '100%' }}
            dotLottieRefCallback={(dotLottie) => {
              if (dotLottie) {
                dotLottie.addEventListener('load', () => {
                  dotLottie.resize();
                });
              }
            }}
          />
        </div>
      </div>
      
      {/* Card */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
        {/* Row 1: Title + Button */}
        <div className="flex items-center justify-between mb-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-blue-100 text-sm font-medium">
              {hasCourse ? 'Continue Learning' : 'Ready to Learn?'}
            </p>
          </div>
          <button 
            onClick={() => hasCourse ? onContinue?.(course.courseId) : onContinue?.()}
            className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-md"
          >
            {hasCourse ? 'Continue' : 'Browse Courses'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Row 2: Course Name */}
        <h3 className="text-xl font-bold truncate mb-3">
          {hasCourse ? course.courseName : 'Start Your Learning Journey'}
        </h3>
        
        {/* Row 3: Progress Bar */}
        {hasCourse ? (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2.5 bg-white/20 rounded-full">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${course.completionRate}%` }} />
            </div>
            <span className="text-sm font-bold min-w-[40px]">{course.completionRate}%</span>
          </div>
        ) : (
          <p className="text-blue-200 text-sm">Explore courses and begin building new skills today!</p>
        )}
      </div>
      
      {/* CSS Keyframes for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

// Weekly Overview Card (Stats + Streak Combined)
const WeeklyOverviewCard = ({ stats, activeDays }) => {
  const statItems = [
    { icon: Clock, value: stats.totalMinutes, label: 'min', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: BookOpen, value: stats.completedLessons, label: 'lessons', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: GraduationCap, value: stats.completedCourses, label: 'courses', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full flex flex-col">
      {/* Streak Section */}
      <div className="flex items-center justify-between mb-auto">
        <div className="flex items-center gap-3">
          <div style={{ width: 64, height: 64, flexShrink: 0 }}>
            <DotLottieReact 
              src="https://lottie.host/c64de14f-ce23-41a2-90a6-b64b2d11ea54/nqY24O7vea.lottie" 
              loop 
              autoplay
              renderConfig={{
                autoResize: true,
                devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
              }}
              style={{ width: '100%', height: '100%' }}
              dotLottieRefCallback={(dotLottie) => {
                if (dotLottie) {
                  dotLottie.addEventListener('load', () => {
                    dotLottie.resize();
                  });
                }
              }}
            />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{stats.currentStreak}</p>
            <p className="text-sm text-gray-500">day streak</p>
          </div>
        </div>
        {/* Week dots */}
        <div className="flex gap-1.5">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-all ${
                i < activeDays ? 'bg-amber-400' : 'bg-gray-200'
              }`} 
            />
          ))}
        </div>
      </div>

      {/* Stats Row - pushed to bottom */}
      <div className="flex items-center justify-between gap-3 mt-6">
        {statItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Suppress Recharts warnings in development
const SuppressedResponsiveContainer = ({ children, ...props }) => {
  const originalWarn = console.warn;
  
  useEffect(() => {
    // Temporarily suppress Recharts dimension warnings
    console.warn = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('width') && message.includes('height') && message.includes('chart should be greater than 0')) {
        // Suppress this specific warning
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.warn = originalWarn;
    };
  }, []);
  
  return <ResponsiveContainer {...props}>{children}</ResponsiveContainer>;
};

// Daily Chart Card with Robust Error Prevention
const DailyChartCard = ({ weekData, derivedStats }) => {
  const [isChartReady, setIsChartReady] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Comprehensive visibility and dimension check
    const checkContainerReadiness = () => {
      if (!mountedRef.current || !containerRef.current) {
        return;
      }

      const element = containerRef.current;
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Multiple checks for element readiness
      const isVisible = element.offsetParent !== null;
      const hasValidDimensions = rect.width > 0 && rect.height > 0;
      const isNotHidden = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
      const hasMinimumSize = rect.width >= 200 && rect.height >= 120;
      
      console.log('📊 Chart readiness check:', {
        isVisible,
        hasValidDimensions,
        isNotHidden,
        hasMinimumSize,
        width: rect.width,
        height: rect.height,
        hasData: weekData && weekData.length > 0,
        display: computedStyle.display,
        visibility: computedStyle.visibility
      });
      
      if (isVisible && hasValidDimensions && isNotHidden && hasMinimumSize && mountedRef.current) {
        setContainerDimensions({ width: rect.width, height: rect.height });
        // Additional delay to ensure React has finished rendering
        setTimeout(() => {
          if (mountedRef.current) {
            setIsChartReady(true);
          }
        }, 100);
      } else {
        setIsChartReady(false);
        setContainerDimensions({ width: 0, height: 0 });
      }
    };

    // Multiple timing strategies
    const timers = [
      setTimeout(checkContainerReadiness, 100),
      setTimeout(checkContainerReadiness, 300),
      setTimeout(checkContainerReadiness, 500),
      setTimeout(checkContainerReadiness, 1000)
    ];
    
    // ResizeObserver with error handling
    let resizeObserver;
    if (containerRef.current && typeof window !== 'undefined' && window.ResizeObserver) {
      try {
        resizeObserver = new ResizeObserver((entries) => {
          if (mountedRef.current && entries.length > 0) {
            checkContainerReadiness();
          }
        });
        resizeObserver.observe(containerRef.current);
      } catch (error) {
        console.warn('ResizeObserver error:', error);
      }
    }
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch (error) {
          console.warn('ResizeObserver disconnect error:', error);
        }
      }
    };
  }, [weekData]);

  // Strict validation before rendering chart
  const shouldRenderChart = useMemo(() => {
    return (
      isChartReady &&
      weekData &&
      Array.isArray(weekData) &&
      weekData.length > 0 &&
      containerDimensions.width >= 200 &&
      containerDimensions.height >= 120 &&
      mountedRef.current
    );
  }, [isChartReady, weekData, containerDimensions]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Daily Learning</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">Avg: <span className="font-semibold text-gray-700">{derivedStats?.avgMinutes || 0}m</span></span>
          <span className="text-gray-500">Best: <span className="font-semibold text-blue-600">{derivedStats?.mostProductiveDay || 'N/A'}</span></span>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="h-[120px] w-full"
        style={{ 
          minHeight: '120px', 
          minWidth: '200px',
          width: '100%',
          height: '120px'
        }}
      >
        {shouldRenderChart ? (
          <SuppressedResponsiveContainer 
            width="100%" 
            height="100%" 
            minWidth={200} 
            minHeight={120}
            aspect={undefined}
          >
            <BarChart 
              data={weekData} 
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              width={containerDimensions.width}
              height={containerDimensions.height}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#93C5FD" />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 9 }} tickFormatter={(v) => `${v}m`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6', radius: 4 }} />
              <Bar dataKey="minutes" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </SuppressedResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-pulse bg-gray-200 rounded w-full h-full min-h-[120px]"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Achievement Badge
const AchievementBadge = ({ achievement, isUnlocked }) => {
  const progress = Math.min((achievement.current / achievement.target) * 100, 100);
  
  return (
    <div 
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all flex-shrink-0 ${
        isUnlocked 
          ? `${achievement.bgColor} ${achievement.borderColor}` 
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Icon with integrated progress ring */}
      <div className="relative w-9 h-9 flex-shrink-0">
        {/* Progress ring - always show for locked */}
        {!isUnlocked && (
          <svg className="absolute inset-0 w-9 h-9 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            {progress > 0 && (
              <circle 
                cx="18" cy="18" r="15" fill="none" 
                stroke={progress >= 75 ? '#F59E0B' : '#3B82F6'} 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 94.25} 94.25`}
              />
            )}
          </svg>
        )}
        {/* Icon circle - smaller to show ring */}
        <div className={`absolute inset-1.5 rounded-full flex items-center justify-center ${
          isUnlocked ? achievement.iconBg : 'bg-gray-100'
        }`}>
          <achievement.icon className={`w-3.5 h-3.5 ${isUnlocked ? achievement.iconColor : 'text-gray-400'}`} />
        </div>
      </div>
      
      <div className="min-w-0">
        <p className={`text-xs font-semibold truncate ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
          {achievement.label}
        </p>
        {isUnlocked ? (
          <p className={`text-[10px] ${achievement.iconColor}`}>✓ Unlocked</p>
        ) : (
          <p className="text-[10px] text-gray-400">{achievement.current}/{achievement.target}</p>
        )}
      </div>
    </div>
  );
};


// Compact Achievements Row
const CompactAchievementsRow = ({ stats, courseData }) => {
  const [achievementData, setAchievementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  
  // Extract primitive values to use as stable dependencies
  const statsCurrentStreak = stats?.currentStreak || 0;
  const statsTotalMinutes = stats?.totalMinutes || 0;
  const statsCompletedLessons = stats?.completedLessons || 0;
  const completedCoursesCount = useMemo(() => 
    courseData?.filter(c => c.completionRate === 100).length || 0, 
    [courseData]
  );

  useEffect(() => {
    // Only fetch once on mount
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    const fetchAchievementData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: streakData } = await supabase
          .from('student_streaks')
          .select('current_streak, longest_streak')
          .eq('student_id', user.id)
          .single();

        const { data: progressData } = await supabase
          .from('student_course_progress')
          .select('time_spent_seconds, status')
          .eq('student_id', user.id);

        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('completed_at')
          .eq('student_id', user.id)
          .not('completed_at', 'is', null);

        const MAX_SECONDS_PER_LESSON = 3600;
        const totalTimeMinutes = (progressData || []).reduce((sum, p) => sum + Math.min(p.time_spent_seconds || 0, MAX_SECONDS_PER_LESSON), 0) / 60;
        const completedLessons = (progressData || []).filter(p => p.status === 'completed').length;
        const completedCourses = (enrollmentData || []).length;

        setAchievementData({
          currentStreak: streakData?.current_streak || statsCurrentStreak,
          totalTimeMinutes: Math.round(totalTimeMinutes),
          completedLessons,
          completedCourses
        });
      } catch (error) {
        console.error('Error fetching achievement data:', error);
        setAchievementData({
          currentStreak: statsCurrentStreak,
          totalTimeMinutes: statsTotalMinutes,
          completedLessons: statsCompletedLessons,
          completedCourses: completedCoursesCount
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAchievementData();
  }, []); // Empty dependency - fetch only once on mount

  const data = achievementData || {
    currentStreak: stats.currentStreak || 0,
    totalTimeMinutes: stats.totalMinutes || 0,
    completedLessons: stats.completedLessons || 0,
    completedCourses: courseData.filter(c => c.completionRate === 100).length
  };

  const achievements = [
    { id: 'time60', icon: Clock, label: '1 Hour', current: data.totalTimeMinutes, target: 60, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
    { id: 'course1', icon: GraduationCap, label: 'First Course', current: data.completedCourses, target: 1, bgColor: 'bg-purple-50', borderColor: 'border-purple-200', iconBg: 'bg-purple-100', iconColor: 'text-purple-500' },
    { id: 'streak3', icon: Flame, label: '3-Day Streak', current: data.currentStreak, target: 3, bgColor: 'bg-orange-50', borderColor: 'border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
    { id: 'streak7', icon: Flame, label: '7-Day Streak', current: data.currentStreak, target: 7, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-500' },
    { id: 'lessons10', icon: BookOpen, label: '10 Lessons', current: data.completedLessons, target: 10, bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' },
    { id: 'time300', icon: Clock, label: '5 Hours', current: data.totalTimeMinutes, target: 300, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-500' },
    { id: 'lessons25', icon: BookOpen, label: '25 Lessons', current: data.completedLessons, target: 25, bgColor: 'bg-teal-50', borderColor: 'border-teal-200', iconBg: 'bg-teal-100', iconColor: 'text-teal-500' },
    { id: 'course3', icon: Trophy, label: '3 Courses', current: data.completedCourses, target: 3, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ];

  const unlockedCount = achievements.filter(a => a.current >= a.target).length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="flex gap-2 overflow-x-auto">
          {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl w-28 flex-shrink-0"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-900">Achievements</h3>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{unlockedCount}/{achievements.length} unlocked</span>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1">
          {achievements.map((a, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full ${a.current >= a.target ? 'bg-amber-400' : 'bg-gray-200'}`} 
            />
          ))}
        </div>
      </div>
      
      {/* Horizontal scrollable badges */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {achievements.map((achievement) => (
          <AchievementBadge 
            key={achievement.id} 
            achievement={achievement} 
            isUnlocked={achievement.current >= achievement.target}
          />
        ))}
      </div>
    </div>
  );
};

// Mini Donut Chart
const MiniDonutChart = ({ completed, inProgress, notStarted, total }) => {
  const radius = 32;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
  
  const completedDash = (completedPct / 100) * circumference;
  const inProgressDash = (inProgressPct / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#3B82F6" strokeWidth={strokeWidth}
          strokeDasharray={`${inProgressDash} ${circumference}`} strokeDashoffset={-completedDash} />
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#10B981" strokeWidth={strokeWidth}
          strokeDasharray={`${completedDash} ${circumference}`} strokeDashoffset={0} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{total}</span>
        <span className="text-[9px] text-gray-400">courses</span>
      </div>
    </div>
  );
};


// Compact Course Card
const CompactCourseCard = ({ course, onClick }) => {
  const isCompleted = course.completionRate === 100;
  const isNotStarted = course.completionRate === 0;

  return (
    <div 
      onClick={onClick} 
      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all group"
    >
      {/* Progress Circle */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle 
            cx="20" cy="20" r="16" fill="none" 
            stroke={isCompleted ? '#10B981' : isNotStarted ? '#E5E7EB' : '#3B82F6'} 
            strokeWidth="3"
            strokeDasharray={`${(course.completionRate / 100) * 100.5} 100.5`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
          isCompleted ? 'text-emerald-600' : isNotStarted ? 'text-gray-400' : 'text-blue-600'
        }`}>
          {course.completionRate}%
        </span>
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {course.courseName}
        </h4>
        <p className="text-xs text-gray-400">{course.completedLessons}/{course.totalLessons} lessons</p>
      </div>

      {/* Action */}
      <button className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isCompleted 
          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
          : isNotStarted
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      }`}>
        {isCompleted ? 'Certificate' : isNotStarted ? 'Start' : 'Continue'}
      </button>
    </div>
  );
};

// Courses Section with Tabs
const CoursesSection = ({ courseData, onCourseClick, completedCount, inProgressCount, notStartedCount }) => {
  const [activeTab, setActiveTab] = useState('inProgress');
  const totalCourses = courseData.length;
  
  const filteredCourses = useMemo(() => {
    switch (activeTab) {
      case 'inProgress': return courseData.filter(c => c.completionRate > 0 && c.completionRate < 100);
      case 'notStarted': return courseData.filter(c => c.completionRate === 0);
      case 'completed': return courseData.filter(c => c.completionRate === 100);
      default: return courseData;
    }
  }, [courseData, activeTab]);

  const tabs = [
    { id: 'inProgress', label: 'In Progress', count: inProgressCount, color: 'blue' },
    { id: 'notStarted', label: 'Not Started', count: notStartedCount, color: 'gray' },
    { id: 'completed', label: 'Completed', count: completedCount, color: 'green' },
  ];

  if (courseData.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Your Courses</h3>
            <p className="text-xs text-gray-400">Track your learning journey</p>
          </div>
          
          {/* Donut + Legend */}
          <div className="flex items-center gap-4">
            <MiniDonutChart 
              completed={completedCount} 
              inProgress={inProgressCount} 
              notStarted={notStartedCount}
              total={totalCourses}
            />
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Completed ({completedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">In Progress ({inProgressCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">Not Started ({notStartedCount})</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const colorMap = {
              blue: isActive ? 'bg-blue-100 text-blue-700 border-blue-200' : '',
              gray: isActive ? 'bg-gray-200 text-gray-700 border-gray-300' : '',
              green: isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : '',
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isActive ? colorMap[tab.color] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isActive ? 'bg-white/50' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course List */}
      <div className="p-4 max-h-[320px] overflow-y-auto">
        {filteredCourses.length > 0 ? (
          <div className="space-y-2">
            {filteredCourses.map((course) => (
              <CompactCourseCard 
                key={course.courseId} 
                course={course} 
                onClick={() => onCourseClick(course.courseId)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              {activeTab === 'inProgress' && 'No courses in progress'}
              {activeTab === 'notStarted' && 'All courses started!'}
              {activeTab === 'completed' && 'No completed courses yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


// Main Component - Bento Grid Layout
const WeeklyLearningTracker = () => {
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [stats, setStats] = useState({ totalMinutes: 0, completedLessons: 0, completedModules: 0, completedCourses: 0, currentStreak: 0 });
  const [loading, setLoading] = useState(true);
  
  // Refs to prevent duplicate fetches and track component mount
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const handleCourseClick = useCallback((courseId) => navigate(`/student/courses/${courseId}/learn`), [navigate]);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getCurrentWeek = useCallback(() => {
    const curr = new Date();
    const week = [];
    const first = curr.getDate() - curr.getDay() + 1;
    for (let i = 0; i < 7; i++) {
      const date = new Date(curr);
      date.setDate(first + i);
      week.push(date);
    }
    return week;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    // Initial load - show loading spinner
    fetchWeeklyProgress(true);
    
    // Background refresh every 2 minutes (increased from 60s) - no loading spinner
    const interval = setInterval(() => {
      if (!isFetchingRef.current && isMountedRef.current) {
        fetchWeeklyProgress(false); // Background refresh - no loading spinner
      }
    }, 120000); // 2 minutes
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const fetchWeeklyProgress = async (isInitialLoad = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      console.log('📊 Weekly progress fetch already in progress, skipping...');
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      // Only show loading spinner on initial load, not on background refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        isFetchingRef.current = false;
        return;
      }

      const weekDates = getCurrentWeek();
      const { data: progressData } = await supabase.from('student_course_progress').select('*').eq('student_id', user.id);
      const { data: enrollments } = await supabase.from('course_enrollments').select('*').eq('student_id', user.id);

      const courseProgress = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          const { data: courseDetails } = await supabase.from('courses').select('course_id, title').eq('course_id', enrollment.course_id).single();
          const { data: modulesData } = await supabase.from('course_modules').select('module_id').eq('course_id', enrollment.course_id);

          let totalCount = 0;
          if (modulesData?.length > 0) {
            const { count } = await supabase.from('lessons').select('*', { count: 'exact', head: true }).in('module_id', modulesData.map(m => m.module_id));
            totalCount = count || 0;
          }

          const { count: completedCount } = await supabase.from('student_course_progress').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('course_id', enrollment.course_id).eq('status', 'completed');
          const completionRate = totalCount > 0 ? Math.round(((completedCount || 0) / totalCount) * 100) : 0;

          return {
            courseId: enrollment.course_id,
            courseName: courseDetails?.title || 'Untitled Course',
            completionRate,
            completedLessons: completedCount || 0,
            totalLessons: totalCount,
            startDate: enrollment.enrolled_at,
          };
        })
      );

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        isFetchingRef.current = false;
        return;
      }
      
      setCourseData(courseProgress.sort((a, b) => b.completionRate - a.completionRate));

      const weeklyData = dayNames.map((day, index) => {
        const currentDate = weekDates[index];
        const dayStart = new Date(currentDate); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate); dayEnd.setHours(23, 59, 59, 999);

        const dayLessons = (progressData || []).filter(p => {
          const accessDate = new Date(p.last_accessed);
          return accessDate >= dayStart && accessDate <= dayEnd;
        });

        const totalSeconds = dayLessons.reduce((sum, p) => sum + Math.min(p.time_spent_seconds || 0, 3600), 0);
        const minutes = Math.min(Math.round(totalSeconds / 60), 480);

        return { day, minutes };
      });

      setWeekData(weeklyData);

      let streak = 0;
      const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      for (let i = currentDayIndex; i >= 0; i--) {
        if (weeklyData[i].minutes > 0) streak++;
        else break;
      }

      setStats({
        totalMinutes: weeklyData.reduce((sum, d) => sum + d.minutes, 0),
        completedLessons: (progressData || []).filter(p => p.status === 'completed').length,
        completedModules: new Set((progressData || []).map(p => p.module_id)).size,
        completedCourses: (enrollments || []).filter(e => e.completed_at !== null).length,
        currentStreak: streak
      });
    } catch (error) {
      console.error('Error:', error);
      if (isMountedRef.current) {
        setWeekData(dayNames.map(day => ({ day, minutes: 0 })));
      }
    } finally {
      if (isMountedRef.current && isInitialLoad) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  const derivedStats = useMemo(() => {
    const activeDays = weekData.filter(d => d.minutes > 0).length;
    const avgMinutes = activeDays > 0 ? Math.round(stats.totalMinutes / activeDays) : 0;
    const mostProductiveDay = weekData.reduce((max, d) => d.minutes > max.minutes ? d : max, { day: '-', minutes: 0 });
    return { avgMinutes, mostProductiveDay: mostProductiveDay.day, activeDays };
  }, [weekData, stats.totalMinutes]);

  const lastInProgressCourse = useMemo(() => courseData.find(c => c.completionRate > 0 && c.completionRate < 100) || courseData.find(c => c.completionRate === 0), [courseData]);
  const completedCount = courseData.filter(c => c.completionRate === 100).length;
  const inProgressCount = courseData.filter(c => c.completionRate > 0 && c.completionRate < 100).length;
  const notStartedCount = courseData.filter(c => c.completionRate === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Continue Learning Hero (Full Width) */}
      <ContinueLearningHero course={lastInProgressCourse} onContinue={handleCourseClick} />

      {/* Row 2: Weekly Overview + Daily Chart (Bento Grid) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <WeeklyOverviewCard stats={stats} activeDays={derivedStats.activeDays} />
        </div>
        <div className="col-span-7">
          <DailyChartCard weekData={weekData} derivedStats={derivedStats} />
        </div>
      </div>

      {/* Row 3: Compact Achievements (Full Width) */}
      <CompactAchievementsRow stats={stats} courseData={courseData} />

      {/* Row 4: Courses Section (Full Width) */}
      <CoursesSection 
        courseData={courseData} 
        onCourseClick={handleCourseClick}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        notStartedCount={notStartedCount}
      />
    </div>
  );
};

export default WeeklyLearningTracker;
