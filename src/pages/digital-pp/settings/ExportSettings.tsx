import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Save } from 'lucide-react';
import { usePortfolio } from '../../../context/PortfolioContext';
import ThemeToggle from '../../../components/digital-pp/ThemeToggle';
import { exportAsJSON, exportResume } from '../../../utils/exportppUtils';

const ExportSettings: React.FC = () => {
  const navigate = useNavigate();
  const { student, settings } = usePortfolio();
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [exportType, setExportType] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportPreferences, setExportPreferences] = useState({
    includeImages: true,
    includeContactDetails: true,
    includeSkillRatings: true,
    includeSocialLinks: true
  });

  const handleExport = async (type: string) => {
    if (!student) {
      setExportError('No portfolio data available to export');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportType(type);

    try {
      // For HTML, PDF exports, first navigate to portfolio in fullscreen mode
      if (type === 'HTML' || type === 'PDF') {
        // Store export intent
           sessionStorage.setItem('pendingExport', JSON.stringify({ 
          type, 
          filename: getFileName(type === 'HTML' ? 'Portfolio.html' : 'Portfolio.pdf'),
          preferences: exportPreferences,
          layout: settings.layout
        }));
        
        // Navigate to portfolio
        navigate('/portfolio');
        setIsExporting(false);
        return;
      }

      // For JSON and Resume, proceed directly
      switch (type) {
        case 'PDF':
          await exportAsPDF(student, settings, getFileName('Portfolio.pdf'));
          break;
        case 'JSON':
          exportAsJSON(student, settings, getFileName('Data.json'));
          break;
        case 'Resume':
          await exportResume(student, getFileName('Resume.pdf'));
          break;
        default:
          throw new Error('Unknown export type');
      }

      setShowExportConfirmation(true);
      setTimeout(() => {
        setShowExportConfirmation(false);
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(`Failed to export ${type}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const togglePreference = (key: keyof typeof exportPreferences) => {
    setExportPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getFileName = (prefix: string): string => {
    const name = student?.profile.name || 'Portfolio';
    return `${name.replace(/\s+/g, '_')}_${prefix}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-green-950 dark:to-teal-950 transition-colors duration-300">
      {/* Export Confirmation Toast */}
      {showExportConfirmation && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
          <Download className="w-5 h-5" />
          <span>{exportType} exported successfully!</span>
        </div>
      )}

      {/* Error Toast */}
      {exportError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} className="ml-2 hover:bg-red-700 rounded px-2">×</button>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Export & Download</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Your Portfolio</h2>
              <p className="text-gray-600 dark:text-gray-400">Download or share your portfolio data</p>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            {/* PDF Export */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-500 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export as PDF</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download your complete portfolio as a beautifully formatted PDF document. Perfect for sending to recruiters or printing.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Professional Format</span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">Print Ready</span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">ATS Compatible</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('PDF')}
                  disabled={isExporting}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10">{isExporting && exportType === 'PDF' ? 'Exporting...' : 'Download PDF'}</span>
                  <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                </button>
              </div>
            </div>

            {/* JSON Export */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-500 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Save className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Data (JSON)</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download all your portfolio data as a JSON file. Use this to backup your data or import it into other platforms.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">Machine Readable</span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Backup Ready</span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">Platform Agnostic</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('JSON')}
                  disabled={isExporting}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10">{isExporting && exportType === 'JSON' ? 'Exporting...' : 'Download JSON'}</span>
                  <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                </button>
              </div>
            </div>

            {/* HTML Export */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-green-300 dark:hover:border-green-500 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export as HTML</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download a standalone HTML version of your portfolio. Host it anywhere or send it via email.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">Self Contained</span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Host Anywhere</span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">Offline Ready</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('HTML')}
                  disabled={isExporting}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10">{isExporting && exportType === 'HTML' ? 'Exporting...' : 'Download HTML'}</span>
                  <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                </button>
              </div>
            </div>

            {/* Resume Export */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generate Resume</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Create a traditional resume from your portfolio data. Choose from multiple professional templates.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">Multiple Templates</span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">ATS Optimized</span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">1-2 Pages</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('Resume')}
                  disabled={isExporting}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10">{isExporting && exportType === 'Resume' ? 'Generating...' : 'Generate Resume'}</span>
                  <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Export Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-300 dark:hover:border-green-500 transition-all">
                <span className="text-gray-700 dark:text-gray-300">Include project images</span>
                <input
                  type="checkbox"
                  checked={exportPreferences.includeImages}
                  onChange={() => togglePreference('includeImages')}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-300 dark:hover:border-green-500 transition-all">
                <span className="text-gray-700 dark:text-gray-300">Include contact details</span>
                <input
                  type="checkbox"
                  checked={exportPreferences.includeContactDetails}
                  onChange={() => togglePreference('includeContactDetails')}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-300 dark:hover:border-green-500 transition-all">
                <span className="text-gray-700 dark:text-gray-300">Include skill ratings</span>
                <input
                  type="checkbox"
                  checked={exportPreferences.includeSkillRatings}
                  onChange={() => togglePreference('includeSkillRatings')}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-300 dark:hover:border-green-500 transition-all">
                <span className="text-gray-700 dark:text-gray-300">Include social media links</span>
                <input
                  type="checkbox"
                  checked={exportPreferences.includeSocialLinks}
                  onChange={() => togglePreference('includeSocialLinks')}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSettings;
