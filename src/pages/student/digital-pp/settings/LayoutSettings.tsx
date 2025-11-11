import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Save, Eye } from 'lucide-react';
import { usePortfolio } from '../../../context/PortfolioContext';
import ThemeToggle from '../../../components/digital-pp/ThemeToggle';
import type { PortfolioLayout, DisplayPreferences } from '../../../types/student';

const LayoutSettings: React.FC = () => {
  const { settings, updateSettings } = usePortfolio();
  const navigate = useNavigate();
  const [selectedLayout, setSelectedLayout] = useState<PortfolioLayout>(settings.layout);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>(
    settings.displayPreferences || {
      showSocialLinks: true,
      showSkillBars: true,
      showProjectImages: true,
      enableAnimations: true,
      showContactForm: true,
      showDownloadResume: true,
    }
  );

  const layouts = [
    { 
      id: 'modern', 
      name: 'Modern', 
      desc: 'Clean and contemporary design',
      icon: '✨',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'creative', 
      name: 'Creative', 
      desc: 'Bold and artistic expression',
      icon: '🎨',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'splitscreen', 
      name: 'Split Screen', 
      desc: 'Interactive dual-pane layout',
      icon: '⚡',
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 'aipersona', 
      name: 'AI Persona', 
      desc: 'Futuristic digital twin',
      icon: '🤖',
      color: 'from-indigo-500 to-blue-500'
    },
    { 
      id: 'infographic', 
      name: 'Infographic', 
      desc: 'Data visualization dashboard',
      icon: '📊',
      color: 'from-green-500 to-teal-500'
    },
    { 
      id: 'resume', 
      name: 'Resume Dashboard', 
      desc: 'Professional recruiter view',
      icon: '📄',
      color: 'from-slate-600 to-gray-700'
    },
    { 
      id: 'journey', 
      name: 'Journey Map', 
      desc: 'Interactive milestone timeline',
      icon: '🗺️',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  const handleSaveSettings = () => {
    updateSettings({
      layout: selectedLayout,
      displayPreferences: displayPreferences
    });
    
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
      navigate('/settings/theme');
    }, 1500);
  };

  const handlePreview = () => {
    updateSettings({ layout: selectedLayout });
    navigate('/portfolio');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 dark:from-gray-900 dark:via-orange-950 dark:to-amber-950 transition-colors duration-300">
      {/* Save Confirmation Toast */}
      {showSaveConfirmation && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
          <Save className="w-5 h-5" />
          <span>Layout saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Layout</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handlePreview}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-gray-600 to-slate-700 dark:from-gray-500 dark:to-slate-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </span>
                <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Layout Style</h2>
              <p className="text-gray-600 dark:text-gray-400">Select how you want to showcase your portfolio</p>
            </div>
          </div>

          {/* Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id as PortfolioLayout)}
                className={`group relative p-6 rounded-2xl border-2 text-left transition-all hover:shadow-2xl hover:scale-105 ${
                  selectedLayout === layout.id
                    ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20 ring-4 ring-orange-200 dark:ring-orange-800 shadow-xl'
                    : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500'
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${layout.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`}></div>
                
                {/* Content */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{layout.icon}</span>
                    {selectedLayout === layout.id && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-lg">
                        ✓
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{layout.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{layout.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Display Options */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Display Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer transition-all">
                <span className="text-gray-700 dark:text-gray-300">Show social media links</span>
                <input
                  type="checkbox"
                  checked={displayPreferences.showSocialLinks}
                  onChange={(e) => setDisplayPreferences({ ...displayPreferences, showSocialLinks: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer transition-all">
                <span className="text-gray-700 dark:text-gray-300">Display skill progress bars</span>
                <input
                  type="checkbox"
                  checked={displayPreferences.showSkillBars}
                  onChange={(e) => setDisplayPreferences({ ...displayPreferences, showSkillBars: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer transition-all">
                <span className="text-gray-700 dark:text-gray-300">Show project images</span>
                <input
                  type="checkbox"
                  checked={displayPreferences.showProjectImages}
                  onChange={(e) => setDisplayPreferences({ ...displayPreferences, showProjectImages: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer transition-all">
                <span className="text-gray-700 dark:text-gray-300">Enable animations</span>
                <input
                  type="checkbox"
                  checked={displayPreferences.enableAnimations}
                  onChange={(e) => setDisplayPreferences({ ...displayPreferences, enableAnimations: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer transition-all">
                <span className="text-gray-700 dark:text-gray-300">Display contact form</span>
                <input
                  type="checkbox"
                  checked={displayPreferences.showContactForm}
                  onChange={(e) => setDisplayPreferences({ ...displayPreferences, showContactForm: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer transition-all">
                <span className="text-gray-700 dark:text-gray-300">Show download resume button</span>
                <input
                  type="checkbox"
                  checked={displayPreferences.showDownloadResume}
                  onChange={(e) => setDisplayPreferences({ ...displayPreferences, showDownloadResume: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={handlePreview}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
            >
              Preview Layout
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-xl transition-all font-semibold relative overflow-hidden group"
            >
              <span className="relative z-10">Save Layout Settings</span>
              <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSettings;
