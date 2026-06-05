import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui';
import { AchievementsExpanded, SkillTrackerExpanded } from '@/widgets/learner-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

import { useUser } from '@/shared/model/authStore';
import { useLearnerId } from '@/shared/model/learnerStore';

const AchievementsPage = () => {
  const navigate = useNavigate();
  const user = useUser();
  const userEmail = user?.email;
  const storeLearnerId = useLearnerId();
  const learnerId = storeLearnerId;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/learner/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Achievements & Skills</h1>
              <p className="text-gray-600 mt-1">Track your progress and earned badges</p>
            </div>
          </div>
        </div>

        {/* Tabs for Achievements and Skills */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="achievements" data-testid="achievements-tab">
              Achievements & Badges
            </TabsTrigger>
            <TabsTrigger value="skills" data-testid="skills-tab">
              Skill Tracker
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="achievements" className="mt-6">
            <AchievementsExpanded learnerId={learnerId} email={userEmail} />
          </TabsContent>
          
          <TabsContent value="skills" className="mt-6">
            <SkillTrackerExpanded learnerId={learnerId} email={userEmail} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AchievementsPage;
