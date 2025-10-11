import React from 'react';
import {
  HomeIcon,
  UsersIcon,
  RectangleStackIcon,
  CalendarDaysIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

const mobileNavItems = [
  { name: 'Overview', key: 'overview', icon: HomeIcon },
  { name: 'Pool', key: 'talent_pool', icon: UsersIcon },
  { name: 'Pipelines', key: 'pipelines', icon: RectangleStackIcon },
  { name: 'Interviews', key: 'interviews', icon: CalendarDaysIcon },
  { name: 'More', key: 'more', icon: EllipsisHorizontalIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MobileTabBar = ({ activeTab, setActiveTab, onMoreMenuToggle }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex">
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.key;
          
          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.key === 'more') {
                  onMoreMenuToggle();
                } else {
                  setActiveTab(item.key);
                }
              }}
              className={classNames(
                'flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <item.icon
                className={classNames(
                  'h-6 w-6 mb-1',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )}
                aria-hidden="true"
              />
              <span className={classNames(
                'font-medium',
                isActive ? 'text-primary-600' : 'text-gray-500'
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileTabBar;