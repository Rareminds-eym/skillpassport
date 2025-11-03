import { useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentDataByEmail } from '../hooks/useStudentDataByEmail';
import { GlobalPresenceProvider } from '../context/GlobalPresenceContext';
import Header from '../components/Students/components/Header';
import ProfileHeroEdit from '../components/Students/components/ProfileHeroEdit';
import Footer from '../components/Students/components/Footer';
import { Toaster } from '../components/Students/components/ui/toaster';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from '../components/Students/components/ProfileEditModals';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../components/Students/data/mockData';

const StudentLayout = () => {
  const [activeTab, setActiveTab] = useState('skills');
  const [activeModal, setActiveModal] = useState(null);
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if viewing someone else's profile
  const isViewingOthersProfile = location.pathname.includes('/student/profile/');
  
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
      // Navigate to profile edit or handle profile editing
      setActiveTab('profile');
    } else {
      // Open specific modal
      setActiveModal(sectionId);
    }
  };

  return (
    <GlobalPresenceProvider userType="student">
      <div className="min-h-screen bg-gray-50">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        {!isViewingOthersProfile && <ProfileHeroEdit onEditClick={handleEditClick} />}
        <main className="py-8 px-6">
          <Outlet context={{ activeTab, userData, handleSave, setActiveModal }} />
        </main>
        <Footer />
        <Toaster />

      {/* Edit Modals - Only show if not viewing someone else's profile */}
      {!isViewingOthersProfile && (
        <>
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
        </>
      )}
      </div>
    </GlobalPresenceProvider>
  );
};

export default StudentLayout;
