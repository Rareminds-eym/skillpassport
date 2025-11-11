import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, BookOpen, ArrowRight, Palette, Layout, Download, Share2, Video, Settings } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const StudentDigitalPortfolioNav: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <>
      {/* Floating Menu Button */}
      <div className="fixed top-20 right-4 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Slide Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Menu Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Portfolio</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="space-y-2">
                  <Link
                    to="/student/digital-portfolio"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      location.pathname === '/student/digital-portfolio'
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </Link>

                  <Link
                    to="/student/digital-portfolio/portfolio"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/portfolio')
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Portfolio Mode</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/passport"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/passport')
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Passport Mode</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/video"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/video')
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Video Portfolio</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <div className="pt-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Settings
                    </p>
                  </div>

                  <Link
                    to="/student/digital-portfolio/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      location.pathname === '/student/digital-portfolio/settings'
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings Hub</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/settings/theme"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/settings/theme')
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    <Palette className="w-5 h-5" />
                    <span className="font-medium">Theme Settings</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/settings/layout"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/settings/layout')
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    <Layout className="w-5 h-5" />
                    <span className="font-medium">Portfolio Layout</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/settings/export"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/settings/export')
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/settings/sharing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/settings/sharing')
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Sharing</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/student/digital-portfolio/settings/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                      isActive('/settings/profile')
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile Settings</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </nav>

                {/* Theme Toggle in Mobile Menu */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Theme</p>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentDigitalPortfolioNav;