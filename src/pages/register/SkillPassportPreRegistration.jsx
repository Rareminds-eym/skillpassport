import Footer from '../../components/Footer';
import Header from '../../layouts/Header';
import HeroSection from '../../components/skillpassport/HeroSection';
import WhatIsSection from '../../components/skillpassport/WhatIsSection';
import WhoIsThisForSection from '../../components/skillpassport/WhoIsThisForSection';
import EarlyAccessSection from '../../components/skillpassport/EarlyAccessSection';
import RegistrationForm from '../../components/skillpassport/RegistrationForm';
import TimelineSection from '../../components/TimelineSection';
import WhatYouGetSection from '../../components/skillpassport/WhatYouGetSection';
import AboutRaremindsSection from '../../components/skillpassport/AboutRaremindsSection';
import NeedHelpSection from '../../components/skillpassport/NeedHelpSection';

export default function SkillPassportPreRegistration() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
       <RegistrationForm campaign="skill-passport" />
      {/* <HeroSection /> */}
      <WhatIsSection />
      <WhoIsThisForSection />
      <EarlyAccessSection />
      <TimelineSection />
      <WhatYouGetSection />
      <AboutRaremindsSection />
      <NeedHelpSection />
      <Footer />
    </div>
  );
}
