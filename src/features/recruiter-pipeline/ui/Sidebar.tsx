import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  EnvelopeIcon,
  RocketLaunchIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';

const navigationItems = [
  { name: 'Overview', path: '/recruitment/overview', icon: HomeIcon },
  // { name: 'Talent Scout', path: '/recruitment/talent-scout', icon: SparklesIcon },
  // { name: 'Talent Pool', path: '/recruitment/talent-pool', icon: UsersIcon },
  {
    name: 'Requisition',
    path: '/recruitment/requisition',
    icon: BriefcaseIcon,
    subItems: [
      { name: 'Job Requisitions', path: '/recruitment/requisition' },
      { name: 'Talent Pool', path: '/recruitment/talent-pool' },
      { name: 'Applicants List', path: '/recruitment/requisition/applicants' }
    ]
  },
  { name: 'Pipelines', path: '/recruitment/pipelines', icon: RectangleStackIcon },
  { name: 'Project Hiring', path: '/recruitment/projects', icon: RocketLaunchIcon },
  { name: 'Shortlists', path: '/recruitment/shortlists', icon: BookmarkIcon },
  { name: 'Interviews', path: '/recruitment/interviews', icon: CalendarDaysIcon },
  { name: 'Offers & Decisions', path: '/recruitment/offers-decisions', icon: DocumentTextIcon },
  { name: 'Verified Work', path: '/recruitment/verified-work', icon: UsersIcon },
  { name: 'Messages', path: '/recruitment/messages', icon: EnvelopeIcon },
  { name: 'Analytics', path: '/recruitment/analytics', icon: ChartBarIcon },
  { name: 'Settings', path: '/recruitment/settings', icon: CogIcon }
];

// Admin-only navigation items
const adminNavigationItems = [
  { name: 'Admin Dashboard', path: '/recruitment/admin', icon: ShieldCheckIcon, adminOnly: true }
];

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
  unreadMessagesCount?: number;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveTab, showMobileMenu, unreadMessagesCount = 0, onClose }) => {
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { orgContext } = useOrgContext();
  const isAdmin = orgContext?.isAdmin || orgContext?.ssoRoleName === 'owner';
  const items = isAdmin ? [...adminNavigationItems, ...navigationItems] : navigationItems;
  const isCurrent = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  useEffect(() => {
    if (!showMobileMenu) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key === 'Tab') {
        const elements = drawerRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const onResize = () => { if (desktop.matches) closeRef.current(); };
    desktop.addEventListener('change', onResize);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      desktop.removeEventListener('change', onResize);
      previousFocus?.focus();
    };
  }, [showMobileMenu]);

  const renderNavigation = (mobile = false) => <nav aria-label={mobile ? 'Mobile recruitment navigation' : 'Recruitment navigation'} className="space-y-1 px-3 py-4">
    {items.map(item => {
      const subItems = 'subItems' in item ? item.subItems : undefined;
      const active = isCurrent(item.path) || !!subItems?.some(child => isCurrent(child.path));
      const expanded = openSubmenus[item.name] ?? active;
      const classes = classNames('group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500', active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900');
      const content = <><item.icon className={classNames('h-5 w-5 shrink-0', active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600')} aria-hidden="true" /><span className="flex-1 text-left">{item.name}</span>{item.name === 'Messages' && unreadMessagesCount > 0 && <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}<span className="sr-only"> unread messages</span></span>}{subItems && (expanded ? <ChevronDownIcon className="h-4 w-4" aria-hidden="true" /> : <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />)}</>;
      return <div key={item.name}>
        {subItems ? <button type="button" className={classes} aria-expanded={expanded} aria-controls={`${mobile ? 'mobile' : 'desktop'}-requisition-links`} onClick={() => setOpenSubmenus(state => ({...state, [item.name]: !expanded}))}>{content}</button> : <Link to={item.path} className={classes} aria-current={location.pathname === item.path ? 'page' : undefined} onClick={() => { setActiveTab(item.name.toLowerCase()); if (mobile) onClose(); }}>{content}</Link>}
        {subItems && expanded && <div id={`${mobile ? 'mobile' : 'desktop'}-requisition-links`} className="ml-8 mt-1 space-y-1 border-l border-gray-100 pl-2">{subItems.map(child => <Link key={child.path} to={child.path} aria-current={location.pathname === child.path ? 'page' : undefined} onClick={() => { setActiveTab(child.name.toLowerCase()); if (mobile) onClose(); }} className={classNames('flex min-h-11 items-center rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500', location.pathname === child.path ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-600 hover:bg-gray-50')}>{child.name}</Link>)}</div>}
      </div>;
    })}
  </nav>;

  return <>
    <aside className="fixed bottom-0 left-0 top-16 hidden w-64 overflow-y-auto border-r border-gray-200 bg-white md:block">{renderNavigation()}</aside>
    {showMobileMenu && <div className="fixed inset-0 z-[60] md:hidden">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} aria-hidden="true" />
      <div ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="recruiter-navigation-title" id="recruiter-mobile-navigation" className="relative flex h-full w-[min(20rem,calc(100vw-3rem))] flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4"><h2 id="recruiter-navigation-title" className="font-semibold text-gray-900">Recruitment menu</h2><button type="button" onClick={onClose} aria-label="Close navigation menu" className="rounded-lg p-3 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-500"><XMarkIcon className="h-5 w-5" aria-hidden="true" /></button></div>
        <div className="overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">{renderNavigation(true)}</div>
      </div>
    </div>}
  </>;
};

export default Sidebar;
