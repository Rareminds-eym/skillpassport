import { showDemoModal } from '@/shared/ui/demoGuard';
import { useAuthStore } from '@/shared/model/authStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    Download,
    Layout,
    Menu,
    Palette,
    Share2,
    User,
    Video,
    FileEdit
} from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { useLearnerDataByEmail } from '@/entities/learner';
import { isLearner } from '@/entities/learner/lib/learnerType';

import { useUser } from '@/shared/model/authStore';
// Menu item interface
interface SideDrawerMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

// Main menu items
const mainMenuItems: SideDrawerMenuItem[] = [
  { id: 'portfolio', label: 'Portfolio Mode', icon: User, path: '/learner/digital-portfolio/portfolio' },
  { id: 'passport', label: 'Passport Mode', icon: BookOpen, path: '/learner/digital-portfolio/passport' },
  { id: 'video', label: 'Video Portfolio', icon: Video, path: '/learner/digital-portfolio/video' },
];

// Settings menu items
const settingsMenuItems: SideDrawerMenuItem[] = [
  { id: 'profile', label: 'Profile Settings', icon: User, path: '/learner/digital-portfolio/settings/profile' },
  { id: 'theme', label: 'Theme Settings', icon: Palette, path: '/learner/digital-portfolio/settings/theme' },
  { id: 'layout', label: 'Portfolio Layout', icon: Layout, path: '/learner/digital-portfolio/settings/layout' },
  { id: 'export', label: 'Export', icon: Download, path: '/learner/digital-portfolio/settings/export' },
  { id: 'sharing', label: 'Sharing', icon: Share2, path: '/learner/digital-portfolio/settings/sharing' },
];

interface DigitalPortfolioSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const DigitalPortfolioSideDrawer: React.FC<DigitalPortfolioSideDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  
  // Get learner data to check if learner
  const userEmail = (useAuthStore.getState().user?.email || localStorage.getItem("userEmail")) || user?.email;
  const { learnerData } = useLearnerDataByEmail(userEmail);
  const isLearnerUser = isLearner(learnerData);
  
  // Filter menu items based on user type
  const filteredMainMenuItems = mainMenuItems.filter(item => {
    // Hide Passport Mode for learners
    if (isLearnerUser && item.id === 'passport') {
      return false;
    }
    return true;
  });


  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle navigation
  const handleNavigate = (path: string) => {
    // Demo mode: these portfolio tools are disabled
    if (path.includes('/video') || path.includes('/settings/export') || path.includes('/settings/sharing')) {
      showDemoModal();
      onClose();
      return;
    }
    navigate(path);
    onClose();
  };

  // Render a menu item
  const renderMenuItem = (item: SideDrawerMenuItem) => {
    const Icon = item.icon;
    const isItemActive = isActive(item.path);

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.path)}
        className={`flex items-center w-full px-4 py-3 text-sm rounded-lg transition-colors ${
          isItemActive
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return createPortal(
    <>
      {/* Floating Menu Button - Fixed position on the right side */}
      <motion.button
        onClick={isOpen ? onClose : onOpen}
        className="fixed right-4 top-20 z-[101] p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border border-gray-200 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close Menu" : "Open Digital Portfolio Menu"}
      >
        <Menu className="w-5 h-5" />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-[100]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl z-[102] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {/* Main Menu Items */}
              <div className="space-y-1">
                {filteredMainMenuItems.map((item) => renderMenuItem(item))}
              </div>

              {/* Settings Section */}
              <div className="mt-6">
                <div className="px-4 py-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Settings
                  </span>
                </div>
                <div className="space-y-1">
                  {settingsMenuItems.map((item) => renderMenuItem(item))}
                </div>
              </div>
            </div>

            {/* Removed Dark Mode Toggle - Now scoped to Digital Portfolio feature only */}
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};

export default DigitalPortfolioSideDrawer;

// Export menu items for testing
export { mainMenuItems, settingsMenuItems };
export type { SideDrawerMenuItem };

