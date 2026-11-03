import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  EllipsisHorizontalIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const mobileNavItems = [
  { name: 'Overview', key: 'overview', icon: HomeIcon },
  { name: 'Jobs', key: 'requisition', icon: BriefcaseIcon },
  { name: 'Pool', key: 'talent_pool', icon: UsersIcon },
  { name: 'Interviews', key: 'interviews', icon: CalendarDaysIcon },
  { name: 'More', key: 'more', icon: EllipsisHorizontalIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const MobileTabBar = ({ setActiveTab, onMoreMenuToggle, showMoreMenu = false }: { activeTab: string; setActiveTab: (tab: string) => void; onMoreMenuToggle: () => void; showMoreMenu?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleNavigation = (key: string) => {
    const routes: Record<string, string> = {
      'overview': '/recruitment/overview',
      'requisition': '/recruitment/requisition',
      'talent_pool': '/recruitment/talent-pool',
      'interviews': '/recruitment/interviews'
    };
    
    if (routes[key]) {
      navigate(routes[key]);
      setActiveTab(key);
    }
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <nav aria-label="Recruitment shortcuts" className="flex">
        {mobileNavItems.map((item) => {
          const path = `/recruitment/${item.key.replace('_', '-')}`;
          const isActive = item.key === 'more' ? showMoreMenu : location.pathname === path || location.pathname.startsWith(path + '/');
          
          return (
            <button
              key={item.name}
              type="button"
              aria-current={isActive && item.key !== 'more' ? 'page' : undefined}
              aria-expanded={item.key === 'more' ? showMoreMenu : undefined}
              aria-controls={item.key === 'more' && showMoreMenu ? 'recruiter-mobile-navigation' : undefined}
              onClick={() => {
                if (item.key === 'more') {
                  onMoreMenuToggle();
                } else {
                  handleNavigation(item.key);
                }
              }}
              className={classNames(
                'flex-1 flex flex-col items-center justify-center min-h-16 py-2 px-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
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