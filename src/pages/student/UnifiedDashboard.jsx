import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import ReactApexChart from 'react-apexcharts';
import {
  TrendingUp,
  CheckCircle,
  Star,
  ExternalLink,
  Edit,
  Calendar,
  Award,
  Users,
  Code,
  MessageCircle,
  QrCode,
  FolderGit2,
  Medal,
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Sparkles,
  Target,
  BookOpen,
  Trophy,
  ChevronRight,
  Link,
  Github,
  Presentation,
  Video,
  File,
  FileText,
  BarChart3,
} from 'lucide-react';
import {
  suggestions,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills,
} from '../../components/Students/data/mockData';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal,
  ProjectsEditModal,
  CertificatesEditModal,
} from '../../components/Students/components/ProfileEditModals';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useStudentRealtimeActivities } from '../../hooks/useStudentRealtimeActivities';
import { useAIJobMatching } from '../../hooks/useAIJobMatching';
import { supabase } from '../../lib/supabaseClient';
import { useStudentMessageNotifications } from '../../hooks/useStudentMessageNotifications';
import { useStudentUnreadCount } from '../../hooks/useStudentMessages';
import { Toaster } from 'react-hot-toast';
import AchievementsTimeline from '../../components/Students/components/AchievementsTimeline';
import RecentUpdatesCard from '../../components/Students/components/RecentUpdatesCard';
import { useStudentAchievements } from '../../hooks/useStudentAchievements';
import { useStudentLearning } from '../../hooks/useStudentLearning';
import { useStudentCertificates } from '../../hooks/useStudentCertificates';
import { useStudentProjects } from '../../hooks/useStudentProjects';

const UnifiedDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  // Check if viewing someone else's profile
  const isViewingOthersProfile = location.pathname.includes('/student/profile/');

  // State for showing analytics section
  const [showAnalytics, setShowAnalytics] = useState(false);

  // State for sticky Recent Updates
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  const [recentUpdatesSticky, setRecentUpdatesSticky] = useState(true);
  const [recentUpdatesCollapsed, setRecentUpdatesCollapsed] = useState(false);

  // Refs for intersection observer
  const recentUpdatesRef = React.useRef(null);
  const suggestedNextStepsRef = React.useRef(null);

  useEffect(() => {
    if (!recentUpdatesRef.current || !suggestedNextStepsRef.current) return;
    const handleScroll = () => {
      const recentRect = recentUpdatesRef.current.getBoundingClientRect();
      const suggestedRect = suggestedNextStepsRef.current.getBoundingClientRect();
      if (recentRect.bottom >= suggestedRect.top) {
        setRecentUpdatesCollapsed(true);
      } else {
        setRecentUpdatesCollapsed(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Placeholder content since file was truncated */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Dashboard content loading...</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
