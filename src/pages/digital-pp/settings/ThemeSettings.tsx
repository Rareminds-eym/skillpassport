import { Palette, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../../components/digital-pp/ThemeToggle';
import { usePortfolio } from '../../../context/PortfolioContext';
import { useTheme } from '../../../context/ThemeContext';
import type { AnimationType } from '../../../types/student';

const ThemeSettings: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { settings, updateSettings } = usePortfolio();
  
  const colorThemes = [
    { id: 'blue', name: 'Ocean Blue', primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' },
    { id: 'purple', name: 'Royal Purple', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
    { id: 'green', name: 'Forest Green', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    { id: 'orange', name: 'Sunset Orange', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
    { id: 'pink', name: 'Rose Pink', primary: '#ec4899', secondary: '#db2777', accent: '#f472b6' },
    { id: 'indigo', name: 'Deep Indigo', primary: '#6366f1', secondary: '#4f46e5', accent: '#818cf8' }
  ];

  // derive initial selected color theme from saved settings.primaryColor
  const initialColorId = (
    colorThemes.find((t) => t.primary.toLowerCase() === settings.primaryColor?.toLowerCase()) || colorThemes[0]
  ).id;

  const [selectedColorTheme, setSelectedColorTheme] = useState<string>(initialColorId);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>(settings.animation);
  const [selectedFontSize, setSelectedFontSize] = useState(settings.fontSize);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Apply font size on component mount
  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
  }, [settings.fontSize]);
  
  // Keep selectedColorTheme in sync with saved settings
  useEffect(() => {
    const match = colorThemes.find((t) => t.primary.toLowerCase() === settings.primaryColor?.toLowerCase());
    if (match) setSelectedColorTheme(match.id);
  }, [settings.primaryColor]);
 

  const handleColorThemeSelect = (themeId: string) => {
    setSelectedColorTheme(themeId);
    const selectedTheme = colorThemes.find(t => t.id === themeId);
    if (selectedTheme) {
      updateSettings({
        primaryColor: selectedTheme.primary,
        secondaryColor: selectedTheme.secondary,
        accentColor: selectedTheme.accent
      });
    }
  };

  const handleSaveSettings = () => {
    updateSettings({
      animation: selectedAnimation,
      fontSize: selectedFontSize
    });
    
    // Apply font size to root element
    document.documentElement.style.fontSize = `${selectedFontSize}px`;
    
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
      navigate('/portfolio');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 transition-colors duration-300">
      {/* Save Confirmation Toast */}
      {showSaveConfirmation && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
          <Save className="w-5 h-5" />
          <span>Theme settings saved!</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance & Colors</h2>
              <p className="text-gray-600 dark:text-gray-400">Customize your visual experience</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Dark Mode Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Appearance Mode
              </label>
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                <div>
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">
                    {theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {theme === 'light' ? 'Bright and clean interface' : 'Easy on the eyes at night'}
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Color Palette
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colorThemes.map((colorTheme) => (
                  <button
                    key={colorTheme.id}
                    onClick={() => handleColorThemeSelect(colorTheme.id)}
                    className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                      selectedColorTheme === colorTheme.id
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 ring-4 ring-purple-200 dark:ring-purple-800 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-base dark:text-white">{colorTheme.name}</span>
                      {selectedColorTheme === colorTheme.id && (
                        <span className="text-purple-600 dark:text-purple-400">✓</span>
                      )}
                    </div>
                    <div className="flex space-x-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                        style={{ backgroundColor: colorTheme.primary }}
                      ></div>
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                        style={{ backgroundColor: colorTheme.secondary }}
                      ></div>
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                        style={{ backgroundColor: colorTheme.accent }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Primary • Secondary • Accent
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Settings */}
            {/* <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Animation Style
              </label>
              <div className="space-y-3">
                {[
                  { id: 'fade', label: 'Fade Animations', desc: 'Smooth opacity transitions' },
                  { id: 'slide', label: 'Slide Animations', desc: 'Dynamic sliding effects' },
                  { id: 'bounce', label: 'Bounce Animations', desc: 'Playful bouncing motions' },
                  { id: 'none', label: 'No Animations', desc: 'Static, minimal movement' }
                ].map((anim) => (
                  <label 
                    key={anim.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedAnimation === anim.id
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="animation"
                        checked={selectedAnimation === anim.id}
                        onChange={() => setSelectedAnimation(anim.id as AnimationType)}
                        className="w-5 h-5 border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="ml-4">
                        <span className="font-medium text-gray-900 dark:text-white">{anim.label}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{anim.desc}</p>
                      </div>
                    </div>
                    {selectedAnimation === anim.id && (
                      <span className="text-purple-600 dark:text-purple-400">✓</span>
                    )}
                  </label>
                ))}
              </div>
            </div> */}

            {/* Font Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Font Size
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Small</span>
                  <input 
                    type="range" 
                    min="12" 
                    max="20" 
                    value={selectedFontSize}
                    onChange={(e) => setSelectedFontSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Large</span>
                </div>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Current size: {selectedFontSize}px
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveSettings}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-xl transition-all font-semibold"
            >
              Save Theme Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
