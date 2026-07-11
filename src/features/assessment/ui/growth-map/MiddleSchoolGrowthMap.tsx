import React from 'react';
import { GrowthMapHero } from './GrowthMapHero';
import { InterestWorlds } from './InterestWorlds';
import { StrengthsCharacter } from './StrengthsCharacter';
import { SelfSocialStrengths } from './SelfSocialStrengths';
import { ExplorerMap } from './ExplorerMap';
import { ThinkingStyleSnapshot } from './ThinkingStyleSnapshot';
import { CapabilityWheel } from './CapabilityWheel';
import { WhatIHaveNeed } from './WhatIHaveNeed';
import { RecommendedMissions } from './RecommendedMissions';
import { JourneyFinale } from './JourneyFinale';
import './growth-map-journey.css';

interface MiddleSchoolGrowthMapProps {
  learnerInfo: {
    name: string;
    grade: string;
    school: string;
  };
  reports: {
    my_interest_worlds?: Array<any>;
    character_strengths_descriptions?: Array<{
      label: string;
      description: string;
      tag: string;
    }>;
    self_social?: {
      self_eq?: Array<{ label: string; status: string }>;
      social_sq?: Array<{ label: string; status: string }>;
    };
    explorer_map?: {
      explored?: Array<{ label: string; status: string }>;
      to_explore?: Array<{ label: string; status: string }>;
    };
    explorer_insights?: {
      exploredWorlds?: Array<any>;
      toExploreWorlds?: Array<any>;
    };
    thinking_styles?: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    capability_wheel?: Array<{
      capability_area: string;
      score_out_of_5: number;
      percentage: number;
      status: string;
    }>;
    what_i_have?: Array<{
      capability_area: string;
      score_out_of_5: number;
    }>;
    what_i_need?: Array<{
      capability_area: string;
      score_out_of_5: number;
    }>;
    mission_recommendations?: Array<{
      priority: number;
      mission_name: string;
      capability_target: string;
      why_recommended: string;
      difficulty: string;
      estimated_duration_days: number;
    }>;
  };
}

export const MiddleSchoolGrowthMap: React.FC<MiddleSchoolGrowthMapProps> = ({
  learnerInfo,
  reports,
}) => {
  const unlockedInterests = reports.my_interest_worlds?.length || 0;
  const unlockedStrengths = reports.character_strengths_descriptions?.length || 0;
  const unlockedSkillsCount = unlockedInterests + unlockedStrengths;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-8 relative overflow-hidden">
      
      {/* Main Container - Full width of viewport with no colorful page background gradients */}
      <main className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-6 sm:pt-10 space-y-8 md:space-y-12 relative z-10">

        {/* Level 0: Hero Header Stage */}
        <section id="hero" className="w-full">
          <GrowthMapHero learnerInfo={learnerInfo} />
        </section>

        {/* Level 1: Interests Discovery */}
        {reports.my_interest_worlds && reports.my_interest_worlds.length > 0 && (
          <section id="level-1" className="w-full">
            <InterestWorlds worlds={reports.my_interest_worlds} />
          </section>
        )}

        {/* Level 2 & 3: Strengths and EQ/SQ Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          
          {/* Level 2: Strengths & Character */}
          {reports.character_strengths_descriptions && reports.character_strengths_descriptions.length > 0 && (
            <section id="level-2" className="w-full">
              <StrengthsCharacter strengths={reports.character_strengths_descriptions} />
            </section>
          )}

          {/* Level 3: Self & Social Strengths */}
          {reports.self_social && (
            <section id="level-3" className="w-full">
              <SelfSocialStrengths selfSocial={reports.self_social} />
            </section>
          )}

        </div>

        {/* Level 4: Explorer Map */}
        {reports.explorer_map && (
          <section id="level-4" className="w-full">
            <ExplorerMap explorerMap={reports.explorer_map} explorerInsights={reports.explorerInsights || reports.explorer_insights} />
          </section>
        )}

        {/* Level 5 & 6: Thinking and Capability Wheel Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          
          {/* Level 5: Thinking Style Snapshot */}
          {reports.thinking_styles && reports.thinking_styles.length > 0 && (
            <section id="level-5" className="w-full">
              <ThinkingStyleSnapshot thinkingStyles={reports.thinking_styles} />
            </section>
          )}

          {/* Level 6: Capability Wheel */}
          {reports.capability_wheel && reports.capability_wheel.length > 0 && (
            <section id="level-6" className="w-full">
              <CapabilityWheel capabilities={reports.capability_wheel} />
            </section>
          )}

        </div>

        {/* Level 7: What I Have / Need */}
        {(reports.what_i_have || reports.what_i_need) && (
          <section id="level-7" className="w-full">
            <WhatIHaveNeed
              whatIHave={reports.what_i_have}
              whatINeed={reports.what_i_need}
            />
          </section>
        )}

        {/* Level 8: Recommended Missions */}
        {reports.mission_recommendations && reports.mission_recommendations.length > 0 && (
          <section id="level-8" className="w-full">
            <RecommendedMissions missions={reports.mission_recommendations} />
          </section>
        )}

        {/* Level 9: Final Celebration Section */}
        <section id="level-finale" className="w-full">
          <JourneyFinale 
            name={learnerInfo.name} 
            unlockedCount={unlockedSkillsCount} 
          />
        </section>

      </main>

    </div>
  );
};
