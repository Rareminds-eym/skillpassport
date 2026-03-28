import { Footer } from '@/shared/ui';
import Header from '@/app/layouts/Header';
import { HeroSection, WhatIsSection, WhoIsThisForSection, RegistrationForm, TimelineSection, WhatYouGetSection, AboutRaremindsSection, NeedHelpSection } from '@/shared/ui/marketing';
import { useLocation } from 'react-router-dom';

export default function SkillPassportPreRegistration() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
       <RegistrationForm campaign="skill-passport" />
      {/* <HeroSection /> */}
      <WhatIsSection />
      <WhoIsThisForSection />
      {/* <EarlyAccessSection /> */}
      <TimelineSection />
      <WhatYouGetSection />
      <AboutRaremindsSection />
      <NeedHelpSection />
      <Footer />
    </div>
  );
}
