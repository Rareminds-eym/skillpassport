import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  BookOpen,
  ArrowRight,
  Palette,
  Layout,
  Download,
  Share2,
  Video,
} from 'lucide-react';
import ThemeToggle from '../../../../components/digital-pp/ThemeToggle';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Navbar - Folds on Scroll */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{
          y: 0,
          height: isScrolled ? '48px' : '80px',
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/98 dark:bg-transparent backdrop-blur-md shadow-lg'
            : 'bg-white/80 dark:bg-transparent backdrop-blur-sm'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto h-full flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'px-1' : 'px-3'
          }`}
        >
          {/* Company Logo - Left */}
          <Link
            to="/"
            className={`flex items-center group transition-all duration-300 ${
              isScrolled ? 'space-x-1.5' : 'space-x-2'
            }`}
          >
            <motion.img
              src="/RareMinds.webp"
              alt="Rareminds Logo"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.6 }}
              className={`object-contain transition-all duration-300 ${
                isScrolled ? 'w-16 h-12' : 'w-36 h-22'
              }`}
            />
            {/* <span className={`font-bold text-gray-900 dark:text-white transition-all duration-300 ${
              isScrolled ? 'text-sm' : 'text-xl'
            }`}>
              SkillPassport
            </span> */}
          </Link>

          {/* Right Side - Theme Toggle and Menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle - Visible on desktop */}
            <motion.div
              className="hidden md:block"
              animate={{
                scale: isScrolled ? 0.85 : 1,
                opacity: isScrolled ? 0.8 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <ThemeToggle />
            </motion.div>

            {/* Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ${
                isScrolled ? 'p-1.5' : 'p-2'
              }`}
            >
              {isMobileMenuOpen ? (
                <X
                  className={`text-gray-700 dark:text-gray-300 transition-all duration-300 ${
                    isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                  }`}
                />
              ) : (
                <Menu
                  className={`text-gray-700 dark:text-gray-300 transition-all duration-300 ${
                    isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                  }`}
                />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h2>
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
                    to="/portfolio"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Portfolio Mode</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/passport"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Passport Mode</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/video-portfolio"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
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

                  {/* <Link
                    to="/settings/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile Settings</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link> */}

                  <Link
                    to="/settings/theme"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                  >
                    <Palette className="w-5 h-5" />
                    <span className="font-medium">Theme Settings</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/settings/layout"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                  >
                    <Layout className="w-5 h-5" />
                    <span className="font-medium">Portfolio Layout</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/settings/export"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/settings/sharing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Sharing</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </nav>

                {/* Theme Toggle in Mobile Menu */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 md:hidden">
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

export default Navbar;
