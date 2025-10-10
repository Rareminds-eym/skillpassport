import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ProfileHeroEdit from "./components/ProfileHeroEdit";
import Dashboard from "./components/Dashboard";
import ProfileEditSection from "./components/ProfileEditSection";
import Footer from "./components/Footer";
import { Toaster } from "./components/ui/toaster";
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from './components/ProfileEditModals';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from './data/mockData';

const SkillPassportDashboard = () => {
  const [activeTab, setActiveTab] = useState('skills');
  const [activeModal, setActiveModal] = useState(null);
  const [userData, setUserData] = useState({
    education: educationData,
    training: trainingData,
    experience: experienceData,
    technicalSkills: technicalSkills,
    softSkills: softSkills
  });

  const handleSave = (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const handleEditClick = (sectionId) => {
    if (sectionId === 'profile') {
      // Show full profile edit section
      setActiveTab('profile');
    } else {
      // Open specific modal
      setActiveModal(sectionId);
    }
  };

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <ProfileEditSection />;
    }
    return <Dashboard />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <ProfileHeroEdit onEditClick={handleEditClick} />
      {renderContent()}
      <Footer />
      <Toaster />

      {/* Edit Modals */}
      <EducationEditModal
        isOpen={activeModal === 'education'}
        onClose={() => setActiveModal(null)}
        data={userData.education}
        onSave={(data) => handleSave('education', data)}
      />

      <TrainingEditModal
        isOpen={activeModal === 'training'}
        onClose={() => setActiveModal(null)}
        data={userData.training}
        onSave={(data) => handleSave('training', data)}
      />

      <ExperienceEditModal
        isOpen={activeModal === 'experience'}
        onClose={() => setActiveModal(null)}
        data={userData.experience}
        onSave={(data) => handleSave('experience', data)}
      />

      <SkillsEditModal
        isOpen={activeModal === 'softSkills'}
        onClose={() => setActiveModal(null)}
        data={userData.softSkills}
        title="Soft Skills"
        type="Skill"
        onSave={(data) => handleSave('softSkills', data)}
      />

      <SkillsEditModal
        isOpen={activeModal === 'technicalSkills'}
        onClose={() => setActiveModal(null)}
        data={userData.technicalSkills}
        title="Technical Skills"
        type="Skill"
        onSave={(data) => handleSave('technicalSkills', data)}
      />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SkillPassportDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
