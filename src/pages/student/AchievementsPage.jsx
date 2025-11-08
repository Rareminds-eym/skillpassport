import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';
import AchievementsExpanded from '../../components/Students/components/AchievementsExpanded';
import SkillTrackerExpanded from '../../components/Students/components/SkillTrackerExpanded';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/Students/components/ui/tabs';

const AchievementsPage = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');
  const studentId = localStorage.getItem('studentId');

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/dashboard')}
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
            <AchievementsExpanded studentId={studentId} email={userEmail} />
          </TabsContent>
          
          <TabsContent value="skills" className="mt-6">
            <SkillTrackerExpanded studentId={studentId} email={userEmail} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AchievementsPage;
