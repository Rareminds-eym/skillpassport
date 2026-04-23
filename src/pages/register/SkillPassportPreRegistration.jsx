import { Footer, Header } from '@/shared/ui';
import { HeroSection, WhatIsSection, WhoIsThisForSection, TimelineSection, WhatYouGetSection, AboutRaremindsSection, NeedHelpSection } from '@/shared/ui/marketing';
import RegistrationForm from '@/features/marketing/ui/skillpassport/RegistrationForm';
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
