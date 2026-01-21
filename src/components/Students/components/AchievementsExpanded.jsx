import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Briefcase,
  Code,
  Medal,
  BookOpen,
  Calendar as CalendarIcon,
  TrendingUp,
  Target,
  Zap,
  Grid,
  List,
  Filter,
  ChevronDown,
  Star,
  Trophy,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useStudentAchievements } from '../../../hooks/useStudentAchievements';

const AchievementsExpanded = ({ studentId, email }) => {
  const { achievements, badges, loading, error, refresh } = useStudentAchievements(
    studentId,
    email
  );
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'calendar'
  const [filterType, setFilterType] = useState('all');
  const [showBadges, setShowBadges] = useState(true);

  // Group achievements by month for calendar view
  const achievementsByMonth = useMemo(() => {
    const grouped = {};
    achievements.forEach((achievement) => {
      const date = new Date(achievement.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(achievement);
    });
    return grouped;
  }, [achievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (filterType === 'all') return achievements;
    return achievements.filter((a) => a.type === filterType);
  }, [achievements, filterType]);

  // Get icon by type
  const getIconByType = (type) => {
    switch (type) {
      case 'training':
        return <BookOpen className="w-5 h-5" />;
      case 'skill':
        return <Code className="w-5 h-5" />;
      case 'education':
        return <Award className="w-5 h-5" />;
      case 'experience':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <Medal className="w-5 h-5" />;
    }
  };

  // Get color by type
  const getColorByType = (type) => {
    switch (type) {
      case 'training':
        return 'from-green-500 to-emerald-500';
      case 'skill':
        return 'from-blue-500 to-indigo-500';
      case 'education':
        return 'from-purple-500 to-violet-500';
      case 'experience':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  // Badge rarity colors
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 via-orange-500 to-red-500';
      case 'epic':
        return 'from-purple-400 via-pink-500 to-purple-600';
      case 'rare':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600 font-medium">Error loading achievements: {error}</p>
          <Button onClick={refresh} className="mt-4" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="achievements-expanded">
      {/* AI-Generated Badges Section */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">AI-Generated Badges</span>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                      Earned through your achievements
                    </p>
                  </div>
                </CardTitle>
                <Badge className="bg-amber-500 text-white text-sm px-3 py-1">
                  {badges.length} Earned
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className={`p-4 rounded-xl bg-gradient-to-br ${getRarityColor(badge.rarity)} shadow-lg hover:shadow-xl transition-all cursor-pointer group`}
                    >
                      <div className="absolute top-2 right-2">
                        <Trophy className="w-4 h-4 text-white/80" />
                      </div>
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="text-5xl group-hover:scale-110 transition-transform">
                          {badge.icon}
                        </div>
                        <h3 className="font-bold text-white text-lg">{badge.name}</h3>
                        <p className="text-white/90 text-sm">{badge.description}</p>
                        <Badge className="bg-white/20 text-white text-xs capitalize">
                          {badge.rarity}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Achievements Section */}
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">Achievement Timeline</span>
                <p className="text-sm text-gray-500 font-normal mt-0.5">
                  {filteredAchievements.length} achievements from separate tables
                </p>
              </div>
            </CardTitle>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Timeline
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center gap-2"
              >
                <Grid className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['all', 'education', 'training', 'experience', 'skill'].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
                className="capitalize"
              >
                {type === 'all' ? 'All' : type}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {viewMode === 'timeline' ? (
            <TimelineView
              achievements={filteredAchievements}
              getIconByType={getIconByType}
              getColorByType={getColorByType}
            />
          ) : (
            <CalendarView
              achievementsByMonth={achievementsByMonth}
              filterType={filterType}
              getIconByType={getIconByType}
              getColorByType={getColorByType}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Timeline View Component
const TimelineView = ({ achievements, getIconByType, getColorByType }) => {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No achievements found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
        >
          {/* Timeline dot */}
          <div
            className={`absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-gradient-to-br ${getColorByType(achievement.type)} flex items-center justify-center shadow-lg`}
          >
            {getIconByType(achievement.type)}
          </div>

          {/* Achievement card */}
          <div className="bg-gray-50 rounded-lg p-4 hover:bg-white hover:shadow-md transition-all border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{achievement.title}</h3>
                {achievement.subtitle && (
                  <p className="text-blue-600 text-sm font-medium mb-2">{achievement.subtitle}</p>
                )}
                <p className="text-gray-600 text-sm">{achievement.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className="text-xs">
                  {new Date(achievement.date).toLocaleDateString()}
                </Badge>
                {achievement.verified && (
                  <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {achievement.progress !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              </div>
            )}

            {achievement.level && (
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < achievement.level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">Source: {achievement.source}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Calendar View Component
const CalendarView = ({ achievementsByMonth, filterType, getIconByType, getColorByType }) => {
  const months = Object.keys(achievementsByMonth).sort().reverse();

  if (months.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No achievements found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {months.map((monthKey) => {
        const monthAchievements = achievementsByMonth[monthKey].filter(
          (a) => filterType === 'all' || a.type === filterType
        );

        if (monthAchievements.length === 0) return null;

        const [year, month] = monthKey.split('-');
        const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });

        return (
          <div key={monthKey} className="space-y-3">
            <div className="flex items-center gap-3 sticky top-0 bg-white py-2 z-10">
              <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
              <Badge className="bg-blue-100 text-blue-700">
                {monthAchievements.length}{' '}
                {monthAchievements.length === 1 ? 'achievement' : 'achievements'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`p-4 rounded-lg bg-gradient-to-br ${getColorByType(achievement.type)} bg-opacity-10 border-2 hover:shadow-md transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorByType(achievement.type)} flex items-center justify-center shadow-sm flex-shrink-0`}
                    >
                      {getIconByType(achievement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base truncate">
                        {achievement.title}
                      </h4>
                      {achievement.subtitle && (
                        <p className="text-sm text-gray-600 truncate">{achievement.subtitle}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(achievement.date).toLocaleDateString('default', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      {achievement.verified && (
                        <Badge className="bg-green-100 text-green-700 text-xs mt-2 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsExpanded;
