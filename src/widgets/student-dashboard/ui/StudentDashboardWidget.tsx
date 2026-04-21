import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentProfile } from '@/features/student-profile';
import { useOpportunities } from '@/features/opportunities';
import { useAIRecommendations } from '@/features/ai-tutor';
import { OpportunitiesCard } from './OpportunitiesCard';
import { ProfileSection } from './ProfileSection';
import { LearningSection } from './LearningSection';
import { ActivitySection } from './ActivitySection';

/**
 * Student Dashboard Widget
 * 
 * Composite widget that combines multiple features:
 * - Student profile (from features/student-profile)
 * - Opportunities (from features/opportunities)
 * - Learning/courses (from features/courses)
 * - Activity feed
 */
export const StudentDashboardWidget: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useStudentProfile();
  const { opportunities, loading: opportunitiesLoading } = useOpportunities();
  const { recommendations, loading: aiLoading } = useAIRecommendations();

  if (profileLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <ProfileSection profile={profile} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpportunitiesCard 
          opportunities={opportunities}
          aiRecommendations={recommendations}
          loading={opportunitiesLoading || aiLoading}
        />
        
        <LearningSection studentId={profile?.id} />
      </div>
      
      <ActivitySection studentId={profile?.id} />
    </div>
  );
};
