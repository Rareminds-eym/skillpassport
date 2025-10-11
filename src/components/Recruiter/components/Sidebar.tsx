import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BriefcaseIcon,
  UsersIcon,
  RectangleStackIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Overview', path: '/recruitment/overview', icon: HomeIcon },
  { name: 'Talent Pool', path: '/recruitment/talent-pool', icon: UsersIcon },
  { name: 'Pipelines', path: '/recruitment/pipelines', icon: RectangleStackIcon },
  { name: 'Shortlists', path: '/recruitment/shortlists', icon: BookmarkIcon },
  { name: 'Interviews', path: '/recruitment/interviews', icon: CalendarDaysIcon },
  { name: 'Offers & Decisions', path: '/recruitment/offers-decisions', icon: DocumentTextIcon },
  { name: 'Analytics', path: '/recruitment/analytics', icon: ChartBarIcon },
];

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, showMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-14 flex-1 space-y-1 px-2">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name.toLowerCase().replace(/ /g, '_'));
                    navigate(item.path);
                  }}
                  className={classNames(
                    location.pathname === item.path
                      ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex w-full items-center px-2 py-2 text-sm font-medium rounded-l-md'
                  )}
                >
                  <item.icon
                    className={classNames(
                      location.pathname === item.path
                        ? 'text-primary-500'
                        : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {showMobileMenu && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
              <div className="flex h-0 flex-1 flex-col overflow-y-auto">
                <div className="flex flex-1 flex-col pt-5 pb-4">
                  <nav className="mt-5 flex-1 space-y-1 px-2">
                    {navigationItems.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveTab(item.name.toLowerCase().replace(/ /g, '_'));
                          navigate(item.path);
                        }}
                        className={classNames(
                          location.pathname === item.path
                            ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex w-full items-center px-2 py-2 text-sm font-medium rounded-l-md'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.path
                              ? 'text-primary-500'
                              : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;