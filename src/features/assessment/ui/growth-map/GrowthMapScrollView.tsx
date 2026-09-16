import type { FC } from 'react';
import { GrowthMapLearnerInfoCard } from './GrowthMapLearnerInfoCard';
import { ScrollCapabilityWheelSection } from './ScrollCapabilityWheelSection';
import { InterestWorlds } from './InterestWorlds';
import { StrengthsCharacter } from './StrengthsCharacter';
import { SelfSocialStrengths } from './SelfSocialStrengths';
import { ExplorerMap } from './ExplorerMap';
import { ThinkingStyleSnapshot } from './ThinkingStyleSnapshot';
import { WhatIHaveNeed } from './WhatIHaveNeed';
import { RecommendedMissions } from './RecommendedMissions';
import { JourneyFinale } from './JourneyFinale';
import type { StageReports } from './growthStageConfig';

interface Props {
  learnerInfo: {
    name: string;
    grade: string;
    school: string;
    enrollmentNumber?: string;
    assessmentDate?: string;
  };
  reports: StageReports;
  doneCount: number;
}

export const GrowthMapScrollView: FC<Props> = ({ learnerInfo, reports, doneCount }) => {
  const sectionSurfaceClass =
    'mx-auto max-w-6xl rounded-[1.75rem] border border-slate-300/80 bg-white px-5 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.12)] sm:px-8 sm:py-7';
  const sectionGridSurfaceClass =
    'mx-auto grid max-w-6xl grid-cols-1 gap-8 rounded-[1.75rem] border border-slate-300/80 bg-white px-5 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.12)] sm:px-8 sm:py-7 lg:grid-cols-2';

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <section className="sticky top-14 z-10 bg-slate-50 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <GrowthMapLearnerInfoCard
            name={learnerInfo.name}
            grade={learnerInfo.grade}
            school={learnerInfo.school}
            enrollmentNumber={learnerInfo.enrollmentNumber}
            assessmentDate={learnerInfo.assessmentDate}
            variant="scroll"
          />
        </div>
      </section>

      <div className="relative z-20 mx-auto max-w-[76rem] overflow-hidden rounded-t-[3rem] bg-white shadow-[0_-10px_30px_rgba(15,23,42,0.09)] sm:rounded-t-[4rem] lg:rounded-t-[5rem] [&_h2]:text-[19px] [&_h2]:font-extrabold [&_h2]:leading-tight [&_h2+p]:text-[13px] [&_h2~p]:text-[13px]">
        {reports.capability_wheel && reports.capability_wheel.length > 0 && (
          <section
            id="growth-map-capability-wheel"
            className="scroll-mt-24 border-b border-slate-100 bg-[#f8fbff] px-5 pt-8 pb-4 sm:px-8 sm:pt-10 sm:pb-5"
          >
            <div className={sectionSurfaceClass}>
              <ScrollCapabilityWheelSection
                capabilities={reports.capability_wheel}
                sectionIntro={reports.stage_guidance?.capabilityWheel?.sectionIntro}
              />
            </div>
          </section>
        )}

        {reports.my_interest_worlds && reports.my_interest_worlds.length > 0 && (
          <section className="border-b border-slate-100 bg-white px-5 pt-5 pb-8 sm:px-8 sm:pt-6 sm:pb-10">
            <div className={sectionSurfaceClass}>
              <InterestWorlds
                worlds={reports.my_interest_worlds}
                sectionIntro={reports.stage_guidance?.interestWorlds?.sectionIntro}
              />
            </div>
          </section>
        )}

        {((reports.character_strengths_descriptions &&
          reports.character_strengths_descriptions.length > 0) ||
          reports.self_social) && (
          <section className="border-b border-slate-100 bg-slate-50 px-5 py-8 sm:px-8 sm:py-10">
            <div className={sectionGridSurfaceClass}>
              {reports.character_strengths_descriptions &&
                reports.character_strengths_descriptions.length > 0 && (
                  <StrengthsCharacter
                    strengths={reports.character_strengths_descriptions}
                    sectionIntro={reports.stage_guidance?.characterConstellation?.sectionIntro}
                  />
                )}
              {reports.self_social && (
                <SelfSocialStrengths
                  selfSocial={reports.self_social}
                  sectionIntro={reports.stage_guidance?.selfSocial?.sectionIntro}
                />
              )}
            </div>
          </section>
        )}

        {reports.explorer_map && (
          <section className="border-b border-slate-100 bg-white px-5 py-8 sm:px-8 sm:py-10">
            <div className={sectionSurfaceClass}>
              <ExplorerMap
                explorerMap={reports.explorer_map}
                explorerInsights={reports.explorer_insights}
                sectionIntro={reports.stage_guidance?.explorerMap?.sectionIntro}
              />
            </div>
          </section>
        )}

        {reports.thinking_styles && reports.thinking_styles.length > 0 && (
          <section className="border-b border-slate-100 bg-slate-50 px-5 py-8 sm:px-8 sm:py-10">
            <div className={sectionSurfaceClass}>
              <ThinkingStyleSnapshot
                thinkingStyles={reports.thinking_styles}
                sectionIntro={reports.stage_guidance?.thinkingStyle?.sectionIntro}
              />
            </div>
          </section>
        )}

        {(reports.what_i_have || reports.what_i_need) && (
          <section className="border-b border-slate-100 bg-white px-5 py-8 sm:px-8 sm:py-10">
            <div className={sectionSurfaceClass}>
              <WhatIHaveNeed
                whatIHave={reports.what_i_have}
                whatINeed={reports.what_i_need}
                sectionIntro={reports.stage_guidance?.whatIHaveNeed?.sectionIntro}
              />
            </div>
          </section>
        )}

        {reports.mission_recommendations && reports.mission_recommendations.length > 0 && (
          <section className="border-b border-slate-100 bg-slate-50 px-5 py-8 sm:px-8 sm:py-10">
            <div className={sectionSurfaceClass}>
              <RecommendedMissions
                missions={reports.mission_recommendations}
                sectionIntro={reports.stage_guidance?.missions?.sectionIntro}
              />
            </div>
          </section>
        )}

        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <JourneyFinale
              name={learnerInfo.name}
              unlockedCount={doneCount}
              variant="band"
              ctaLabel="Explore Courses"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
