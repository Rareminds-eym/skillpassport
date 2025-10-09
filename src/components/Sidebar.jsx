import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  UserPlus,
  FileCheck,
  User,
  ClipboardList,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { role } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Manage Users', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  const recruiterLinks = [
    { path: '/recruitment/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/recruitment/post-job', label: 'Post Job', icon: Briefcase },
    { path: '/recruitment/applicants', label: 'View Applicants', icon: UserPlus },
  ];

  const studentLinks = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/profile', label: 'My Profile', icon: User },
    { path: '/student/applied-jobs', label: 'Applied Jobs', icon: ClipboardList },
    { path: '/student/browse-jobs', label: 'Browse Jobs', icon: FileCheck },
  ];

  const links =
    role === 'admin'
      ? adminLinks
      : role === 'recruiter'
      ? recruiterLinks
      : studentLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-lg font-semibold text-gray-800">Menu</span>
          <button onClick={closeSidebar} className="text-gray-600 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
