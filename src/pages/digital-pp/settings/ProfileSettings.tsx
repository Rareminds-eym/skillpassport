import { Save, Upload, User, FileEdit } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/features/digital-portfolio/model/portfolioStore';
import { ProfileCompletionModal, ProfileCompletionErrorBoundary } from '@/features/digital-portfolio';
import { useProfileCompletionPrompt } from '@/features/learner-profile';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('profile-settings');


const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, learner } = usePortfolio();
  const [profileImage, setProfileImage] = useState(settings.profileImage || '');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);

  // Get incomplete sections for the modal
  const getIncompleteSections = () => {
    const incomplete: string[] = [];
    if (!learner?.profile) return incomplete;

    if (!learner.profile.education || learner.profile.education.length === 0) incomplete.push('Education');
    if (!learner.profile.skills || learner.profile.skills.length === 0) incomplete.push('Skills');
    if (!learner.profile.projects || learner.profile.projects.length === 0) incomplete.push('Projects');
    if (!learner.profile.achievements || learner.profile.achievements.length === 0) incomplete.push('Achievements');
    if (!learner.profile.hobbies || learner.profile.hobbies.length === 0) incomplete.push('Hobbies');
    if (!learner.profile.interests || learner.profile.interests.length === 0) incomplete.push('Interests');
    if (!learner.profile.languages || learner.profile.languages.length === 0) incomplete.push('Languages');
    
    return incomplete;
  };

  const incompleteSections = getIncompleteSections();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setProfileImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    updateSettings({
      profileImage: profileImage
    });
    
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 2000);
  };

  const handleOpenProfileCompletion = () => {
    setShowProfileCompletionModal(true);
  };

  const handleCloseProfileCompletion = () => {
    setShowProfileCompletionModal(false);
  };

  const handleCompleteProfile = () => {
    setShowProfileCompletionModal(false);
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      {/* Save Confirmation Toast */}
      {showSaveConfirmation && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
          <Save className="w-5 h-5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Manage your profile details and preferences</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Complete Profile Button */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <FileEdit className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Complete Your Profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Fill in your education, skills, projects, and achievements to make your digital passport stand out.
                      {incompleteSections.length > 0 && (
                        <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-medium">
                          {incompleteSections.length} section{incompleteSections.length !== 1 ? 's' : ''} incomplete
                        </span>
                      )}
                    </p>
                    <button
                      onClick={handleOpenProfileCompletion}
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      {incompleteSections.length > 0 ? 'Complete Profile' : 'Update Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Profile Picture
              </label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 border-4 border-white dark:border-gray-800 shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:shadow-lg transition-all">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">JPG, PNG or GIF, max 5MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveSettings}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:shadow-xl transition-all font-semibold"
            >
              Save Profile Changes
            </button>
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionErrorBoundary
        onError={(error, errorInfo) => {
          if (import.meta.env.DEV) {
            logger.error('ProfileCompletionModal error', error as Error, { errorInfo });
          }
        }}
      >
        <ProfileCompletionModal
          isOpen={showProfileCompletionModal}
          incompleteSections={incompleteSections}
          onComplete={handleCompleteProfile}
          onSkip={handleCloseProfileCompletion}
          onNeverShow={handleCloseProfileCompletion}
          onClose={handleCloseProfileCompletion}
        />
      </ProfileCompletionErrorBoundary>
    </div>
  );
};

export default ProfileSettings;