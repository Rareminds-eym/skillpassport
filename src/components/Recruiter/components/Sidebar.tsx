import React, { useState } from 'react';
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
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Overview', path: '/recruitment/overview', icon: HomeIcon },
  { name: 'Talent Pool', path: '/recruitment/talent-pool', icon: UsersIcon },
  {
    name: 'Requisition',
    path: '/recruitment/requisition',
    icon: BriefcaseIcon,
    subItems: [
      { name: 'Job Requisitions', path: '/recruitment/requisition' },
      { name: 'Applicants List', path: '/recruitment/requisition/applicants' }
    ]
  },
  { name: 'Pipelines', path: '/recruitment/pipelines', icon: RectangleStackIcon },
  { name: 'Shortlists', path: '/recruitment/shortlists', icon: BookmarkIcon },
  { name: 'Interviews', path: '/recruitment/interviews', icon: CalendarDaysIcon },
  { name: 'Offers & Decisions', path: '/recruitment/offers-decisions', icon: DocumentTextIcon },
  { name: 'Messages', path: '/recruitment/messages', icon: EnvelopeIcon },
  { name: 'Analytics', path: '/recruitment/analytics', icon: ChartBarIcon },
  { name: 'Settings', path: '/recruitment/settings', icon: CogIcon }
];

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
  unreadMessagesCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, showMobileMenu, unreadMessagesCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-14 flex-1 space-y-1 px-2">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (item.subItems) {
                        toggleSubmenu(item.name);
                      } else {
                        setActiveTab(item.name.toLowerCase().replace(/ /g, '_'));
                        navigate(item.path);
                      }
                    }}
                    className={classNames(
                      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                        ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex w-full items-center px-2 py-2 text-sm font-medium rounded-l-md'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                          ? 'text-primary-500'
                          : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.name === 'Messages' && unreadMessagesCount > 0 && (
                      <span className="ml-auto mr-2 min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                    {item.subItems && (
                      openSubmenus[item.name] ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )
                    )}
                  </button>
                  {item.subItems && openSubmenus[item.name] && (
                    <div className="ml-11 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.name}
                          onClick={() => {
                            setActiveTab(subItem.name.toLowerCase().replace(/ /g, '_'));
                            navigate(subItem.path);
                          }}
                          className={classNames(
                            location.pathname === subItem.path
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex w-full items-center px-2 py-2 text-sm rounded-l-md'
                          )}
                        >
                          {subItem.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                      <div key={item.name}>
                        <button
                          onClick={() => {
                            if (item.subItems) {
                              toggleSubmenu(item.name);
                            } else {
                              setActiveTab(item.name.toLowerCase().replace(/ /g, '_'));
                              navigate(item.path);
                            }
                          }}
                          className={classNames(
                            location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                              ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex w-full items-center px-2 py-2 text-sm font-medium rounded-l-md'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                                ? 'text-primary-500'
                                : 'text-gray-400 group-hover:text-gray-500',
                              'mr-3 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          <span className="flex-1 text-left">{item.name}</span>
                          {item.name === 'Messages' && unreadMessagesCount > 0 && (
                            <span className="ml-auto mr-2 min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                            </span>
                          )}
                          {item.subItems && (
                            openSubmenus[item.name] ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )
                          )}
                        </button>
                        {item.subItems && openSubmenus[item.name] && (
                          <div className="ml-11 mt-1 space-y-1">
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.name}
                                onClick={() => {
                                  setActiveTab(subItem.name.toLowerCase().replace(/ /g, '_'));
                                  navigate(subItem.path);
                                }}
                                className={classNames(
                                  location.pathname === subItem.path
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                  'group flex w-full items-center px-2 py-2 text-sm rounded-l-md'
                                )}
                              >
                                {subItem.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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