import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearnerProfile } from '@/features/learner-profile';
import { useOpportunities } from '@/features/opportunities';
import { useAIRecommendations } from '@/features/ai-tutor';
import { OpportunitiesCard } from './OpportunitiesCard';
import { ProfileSection } from './ProfileSection';
import { LearningSection } from './LearningSection';
import { ActivitySection } from './ActivitySection';

/**
 * Learner Dashboard Widget
 * 
 * Composite widget that combines multiple features:
 * - Learner profile (from features/learner-profile)
 * - Opportunities (from features/opportunities)
 * - Learning/courses (from features/courses)
 * - Activity feed
 */
export const LearnerDashboardWidget: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useLearnerProfile();
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
        
        <LearningSection learnerId={profile?.id} />
      </div>
      
      <ActivitySection learnerId={profile?.id} />
    </div>
  );
};
