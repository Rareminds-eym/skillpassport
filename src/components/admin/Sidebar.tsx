import {
  AcademicCapIcon,
  BanknotesIcon,
  BellIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ClipboardIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  FolderIcon,
  FolderOpenIcon,
  HomeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
  onMobileMenuClose?: () => void;
}

const Sidebar = ({ activeTab, setActiveTab, showMobileMenu, onMobileMenuClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role || 'college_admin';

  // Initialize all groups as open by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    const allGroups = [
      'students',
      'teachers',
      'academics',
      'communication',
      'finance',
      'skills', // school_admin
      'colleges',
      'courses',
      'faculty',
      'placements',
      'analytics',
      'library',
      'hr-payroll', // university_admin
      'department',
      'student',
      'examinations',
      'operations',
      'administration', // college_admin
    ];
    allGroups.forEach((group) => {
      initialState[group] = true;
    });
    return initialState;
  });

  const handleNavigation = (itemName: string, itemPath: string) => {
    setActiveTab(itemName.toLowerCase());
    if (onMobileMenuClose && showMobileMenu) onMobileMenuClose();
    navigate(itemPath);
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // ✅ Role-based Sidebar Menus
  const navGroups = useMemo(() => {
    if (role === 'school_admin') {
      return [
        {
          title: 'Student Management',
          key: 'students',
          items: [
            {
              name: 'Admissions',
              path: '/school-admin/students/admissions',
              icon: UserGroupIcon,
            },
            {
              name: 'Digital Portfolio',
              path: '/school-admin/students/digital-portfolio',
              icon: FolderIcon,
            },
            {
              name: 'Class Management',
              path: '/school-admin/classes/management',
              icon: AcademicCapIcon,
            },
            {
              name: 'Attendance & Reports',
              path: '/school-admin/students/attendance-reports',
              icon: ChartBarIcon,
            },
            {
              name: 'Assessment Results',
              path: '/school-admin/students/assessment-results',
              icon: ChartPieIcon,
            },
            {
              name: 'Verifications',
              path: '/school-admin/students/verifications',
              icon: ChartBarIcon,
            },
          ],
        },
        {
          title: 'Teacher Management',
          key: 'teachers',
          items: [
            {
              name: 'Teachers',
              path: '/school-admin/teachers/list',
              icon: UserGroupIcon,
            },
            {
              name: 'Onboarding',
              path: '/school-admin/teachers/onboarding',
              icon: AcademicCapIcon,
            },
            {
              name: 'Timetable',
              path: '/school-admin/teachers/timetable',
              icon: CalendarDaysIcon,
            },
          ],
        },
        {
          title: 'Academic Management',
          key: 'academics',
          items: [
            {
              name: 'Courses',
              path: '/school-admin/academics/browse-courses',
              icon: AcademicCapIcon,
            },
            {
              name: 'Curriculum Builder',
              path: '/school-admin/academics/curriculum',
              icon: BookOpenIcon,
            },
            {
              name: 'Lesson Plans',
              path: '/school-admin/academics/lesson-plans',
              icon: ClipboardIcon,
            },
            {
              name: 'Exams & Assessments',
              path: '/school-admin/academics/exams',
              icon: ClipboardDocumentListIcon,
            },
          ],
        },
        {
          title: 'Parent & Communication',
          key: 'communication',
          items: [
            {
              name: 'Parent Portal',
              path: '/school-admin/communication/parents',
              icon: UserGroupIcon,
            },
            {
              name: 'Message Center',
              path: '/school-admin/communication/messages',
              icon: BellIcon,
            },
            {
              name: 'Parent Communication',
              path: '/school-admin/communication/circulars',
              icon: ClipboardDocumentListIcon,
            },
            {
              name: 'Student Communication',
              path: '/school-admin/communication/messages-student',
              icon: BellIcon,
            },
          ],
        },
        {
          title: 'Finance & Infrastructure',
          key: 'finance',
          items: [
            {
              name: 'Fee Setup & Payments',
              path: '/school-admin/finance/fees',
              icon: BanknotesIcon,
            },
            {
              name: 'Library & Assets',
              path: '/school-admin/infrastructure/library',
              icon: BuildingLibraryIcon,
            },
            {
              name: 'Maintenance',
              path: '/school-admin/infrastructure/maintenance',
              icon: WrenchScrewdriverIcon,
            },
          ],
        },
        {
          title: 'Skill & Co-Curricular',
          key: 'skills',
          items: [
            {
              name: 'Clubs & Competitions',
              path: '/school-admin/skills/clubs',
              icon: TrophyIcon,
            },
            {
              name: 'Competition Certificates',
              path: '/school-admin/skills/badges',
              icon: ShieldCheckIcon,
            },
            {
              name: 'Reports',
              path: '/school-admin/skills/reports',
              icon: ChartPieIcon,
            },
          ],
        },
      ];
    }

    if (role === 'university_admin') {
      return [
        {
          title: 'Affiliated College Management',
          key: 'colleges',
          items: [
            {
              name: 'College Registration',
              path: '/university-admin/colleges/registration',
              icon: BuildingOffice2Icon,
            },
            {
              name: 'Program Allocation',
              path: '/university-admin/colleges/programs',
              icon: ClipboardDocumentListIcon,
            },
            {
              name: 'Performance Monitoring',
              path: '/university-admin/colleges/performance',
              icon: ChartBarIcon,
            },
          ],
        },
        {
          title: 'Course & Curriculum Management',
          key: 'courses',
          items: [
            // {
            //   name: "Courses",
            //   path: "/university-admin/courses",
            //   icon: BookOpenIcon,
            // },
            {
              name: 'Courses',
              path: '/university-admin/browse-courses',
              icon: BookOpenIcon,
            },
            {
              name: 'Syllabus Approval',
              path: '/university-admin/courses/syllabus',
              icon: BookOpenIcon,
            },
            {
              name: 'Course Updates',
              path: '/university-admin/courses/updates',
              icon: WrenchScrewdriverIcon,
            },
            {
              name: 'Content Repository',
              path: '/university-admin/courses/content',
              icon: FolderOpenIcon,
            },
          ],
        },
        {
          title: 'Faculty & Trainer Management',
          key: 'faculty',
          items: [
            {
              name: 'Empanelment & Assignment',
              path: '/university-admin/faculty/empanelment',
              icon: UserIcon,
            },
            {
              name: 'Feedback & Certification',
              path: '/university-admin/faculty/feedback',
              icon: ClipboardIcon,
            },
          ],
        },
        {
          title: 'Student Records',
          key: 'students',
          items: [
            {
              name: 'Enrollment & Profiles',
              path: '/university-admin/students/enrollments',
              icon: UserGroupIcon,
            },
            {
              name: 'Digital Portfolios',
              path: '/university-admin/students/digital-portfolios',
              icon: FolderOpenIcon,
            },
            {
              name: 'Assessment Results',
              path: '/university-admin/students/assessment-results',
              icon: ChartPieIcon,
            },
            {
              name: 'Continuous Assessment',
              path: '/university-admin/students/continuous-assessment',
              icon: ClipboardDocumentListIcon,
            },
            {
              name: 'Centralized Results',
              path: '/university-admin/students/results',
              icon: AcademicCapIcon,
            },
            {
              name: 'Certificate Generation',
              path: '/university-admin/students/certificates',
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: 'Examination Management',
          key: 'examinations',
          items: [
            {
              name: 'Examination Scheduling',
              path: '/university-admin/examinations',
              icon: ClipboardDocumentListIcon,
            },
            {
              name: 'Grade Calculation',
              path: '/university-admin/examinations/grades',
              icon: ChartPieIcon,
            },
            {
              name: 'Results Publishing',
              path: '/university-admin/examinations/results',
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: 'Placement & Industry Linkages',
          key: 'placements',
          items: [
            {
              name: 'Placement Readiness',
              path: '/university-admin/placements/readiness',
              icon: ChartBarIcon,
            },
            {
              name: 'Company Database',
              path: '/university-admin/placements/companies',
              icon: BriefcaseIcon,
            },
            {
              name: 'Internship Reports',
              path: '/university-admin/placements/internships',
              icon: ClipboardDocumentListIcon,
            },
            {
              name: 'MoUs & Partnerships',
              path: '/university-admin/placements/mous',
              icon: BuildingOffice2Icon,
            },
          ],
        },
        {
          title: 'Finance & Fees',
          key: 'finance',
          items: [
            {
              name: 'Fee Structures',
              path: '/university-admin/finance',
              icon: BanknotesIcon,
            },
            {
              name: 'Payment Tracking',
              path: '/university-admin/finance/payments',
              icon: CreditCardIcon,
            },
            {
              name: 'Financial Reports',
              path: '/university-admin/finance/reports',
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: 'Analytics & Compliance',
          key: 'analytics',
          items: [
            {
              name: 'District & College Reports',
              path: '/university-admin/analytics/reports',
              icon: ChartPieIcon,
            },
            {
              name: 'Scheme Compliance (TNSDC)',
              path: '/university-admin/analytics/compliance',
              icon: ChartBarIcon,
            },
            {
              name: 'OBE Tracking',
              path: '/university-admin/analytics/obe-tracking',
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: 'Library & Student Services',
          key: 'library',
          items: [
            {
              name: 'Library Management',
              path: '/university-admin/library/management',
              icon: BuildingLibraryIcon,
            },
            {
              name: 'Library Clearance',
              path: '/university-admin/library/clearance',
              icon: ShieldCheckIcon,
            },
            {
              name: 'Student Service Requests',
              path: '/university-admin/library/service-requests',
              icon: ClipboardIcon,
            },
            {
              name: 'Graduation Integration',
              path: '/university-admin/library/graduation-integration',
              icon: AcademicCapIcon,
            },
          ],
        },
        {
          title: 'HR & Payroll',
          key: 'hr-payroll',
          items: [
            {
              name: 'Faculty Lifecycle',
              path: '/university-admin/hr/faculty-lifecycle',
              icon: UserGroupIcon,
            },
            {
              name: 'Staff Management',
              path: '/university-admin/hr/staff-management',
              icon: UserIcon,
            },
            {
              name: 'Payroll Processing',
              path: '/university-admin/hr/payroll',
              icon: BanknotesIcon,
            },
            {
              name: 'Statutory Deductions',
              path: '/university-admin/hr/statutory-deductions',
              icon: CreditCardIcon,
            },
            {
              name: 'Employee Records',
              path: '/university-admin/hr/employee-records',
              icon: FolderOpenIcon,
            },
            {
              name: 'Leave Management',
              path: '/university-admin/hr/leave-management',
              icon: CalendarDaysIcon,
            },
          ],
        },
        {
          title: 'Communication & Announcements',
          key: 'communication',
          items: [
            {
              name: 'Circulars & Notices',
              path: '/university-admin/communication/circulars',
              icon: BellIcon,
            },
            {
              name: 'Training Updates',
              path: '/university-admin/communication/training',
              icon: ClipboardDocumentListIcon,
            },
          ],
        },
      ];
    }

    // Default: College Admin
    return [
      {
        title: 'Students',
        key: 'student',
        items: [
          {
            name: 'Admissions & Data',
            path: '/college-admin/students/data-management',
            icon: UserGroupIcon,
          },
          {
            name: 'Enrolled Students',
            path: '/college-admin/students/enrolled',
            icon: AcademicCapIcon,
          },
          {
            name: 'Attendance',
            path: '/college-admin/students/attendance',
            icon: ClipboardDocumentListIcon,
          },
          {
            name: 'Attendance Policies',
            path: '/college-admin/students/attendance-policies',
            icon: ClipboardDocumentListIcon,
          },

          {
            name: 'Performance',
            path: '/college-admin/students/performance',
            icon: ChartBarIcon,
          },
          {
            name: 'Assessment Results',
            path: '/college-admin/students/assessment-results',
            icon: ChartPieIcon,
          },
          {
            name: 'Digital Portfolio',
            path: '/college-admin/students/digital-portfolio',
            icon: FolderIcon,
          },
          {
            name: 'Graduation & Alumni',
            path: '/college-admin/students/graduation',
            icon: AcademicCapIcon,
          },
          {
            name: 'Verifications',
            path: '/college-admin/students/verifications',
            icon: ChartPieIcon,
          },
          {
            name: 'Communication',
            path: '/college-admin/students/communication',
            icon: BellIcon,
          },
        ],
      },
      {
        title: 'Departments & Faculty',
        key: 'department',
        items: [
          {
            name: 'Departments',
            path: '/college-admin/departments/management',
            icon: BuildingOffice2Icon,
          },
          {
            name: 'Faculty',
            path: '/college-admin/departments/educators',
            icon: UserGroupIcon,
          },
        ],
      },
      {
        title: 'Academics',
        key: 'academics',
        items: [
          {
            name: 'Courses',
            path: '/college-admin/academics/browse-courses',
            icon: AcademicCapIcon,
          },
          {
            name: 'Course Master',
            path: '/college-admin/academics/subject-courses',
            icon: AcademicCapIcon,
          },
          {
            name: 'Programs',
            path: '/college-admin/academics/programs',
            icon: AcademicCapIcon,
          },
          {
            name: 'Program & Sections',
            path: '/college-admin/academics/program-sections',
            icon: UserGroupIcon,
          },
          {
            name: 'Course Mapping',
            path: '/college-admin/departments/mapping',
            icon: WrenchScrewdriverIcon,
          },
          {
            name: 'Curriculum Builder',
            path: '/college-admin/academics/curriculum',
            icon: BookOpenIcon,
          },
          {
            name: 'Lesson Plans',
            path: '/college-admin/academics/lesson-plans',
            icon: ClipboardDocumentListIcon,
          },
          {
            name: 'Coverage Tracker',
            path: '/college-admin/academics/coverage-tracker',
            icon: ChartBarIcon,
          },
          {
            name: 'Academic Calendar',
            path: '/college-admin/academics/calendar',
            icon: CalendarDaysIcon,
          },
        ],
      },
      {
        title: 'Examinations',
        key: 'examinations',
        items: [
          {
            name: 'Exam Management',
            path: '/college-admin/examinations',
            icon: ClipboardDocumentListIcon,
          },
          {
            name: 'Grading & Assessments',
            path: '/college-admin/examinations/assessment-grading',
            icon: ChartBarIcon,
          },
          {
            name: 'Transcripts',
            path: '/college-admin/examinations/transcripts',
            icon: DocumentChartBarIcon,
          },
        ],
      },
      {
        title: 'Placements & Skills',
        key: 'placements',
        items: [
          {
            name: 'Placements',
            path: '/college-admin/placements',
            icon: BriefcaseIcon,
          },
          {
            name: 'Skill Development',
            path: '/college-admin/skill-development',
            icon: SparklesIcon,
          },
          {
            name: 'Mentors',
            path: '/college-admin/mentors',
            icon: UserIcon,
          },
        ],
      },
      {
        title: 'Operations',
        key: 'operations',
        items: [
          {
            name: 'Finance',
            path: '/college-admin/finance',
            icon: BanknotesIcon,
          },
          {
            name: 'Library',
            path: '/college-admin/library',
            icon: BuildingLibraryIcon,
          },
          {
            name: 'Events',
            path: '/college-admin/events',
            icon: CalendarDaysIcon,
          },
          {
            name: 'Circulars',
            path: '/college-admin/circulars',
            icon: BellIcon,
          },
        ],
      },
      {
        title: 'Administration',
        key: 'administration',
        items: [
          {
            name: 'User Management',
            path: '/college-admin/users',
            icon: UserGroupIcon,
          },
          {
            name: 'Reports & Analytics',
            path: '/college-admin/reports',
            icon: ChartPieIcon,
          },
        ],
      },
    ];
  }, [role]);

  // Get dashboard and settings paths based on role
  const getDashboardPath = () => {
    if (role === 'school_admin') return '/school-admin/dashboard';
    if (role === 'university_admin') return '/university-admin/dashboard';
    return '/college-admin/dashboard';
  };

  const getSettingsPath = () => {
    if (role === 'school_admin') return '/school-admin/settings';
    if (role === 'college_admin') return '/college-admin/settings';
    if (role === 'university_admin') return '/university-admin/settings';
    return '/college-admin/settings';
  };

  const dashboardPath = getDashboardPath();
  const settingsPath = getSettingsPath();

  return (
    <aside
      className={classNames(
        'h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300',
        showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-3">
        {/* Dashboard - Always visible at top */}
        <button
          onClick={() => handleNavigation('Dashboard', dashboardPath)}
          className={classNames(
            location.pathname === dashboardPath
              ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500'
              : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600',
            'group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
          )}
        >
          <HomeIcon
            className={classNames(
              location.pathname === dashboardPath
                ? 'text-indigo-600'
                : 'text-gray-400 group-hover:text-indigo-500',
              'h-5 w-5 flex-shrink-0'
            )}
          />
          <span>Dashboard</span>
        </button>

        {/* AI Counselling - university_admin only */}
        {role === 'university_admin' && (
          <button
            onClick={() => handleNavigation('AI Counselling', '/university-admin/ai-counselling')}
            className={classNames(
              location.pathname === '/university-admin/ai-counselling'
                ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600',
              'group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
            )}
          >
            <SparklesIcon
              className={classNames(
                location.pathname === '/university-admin/ai-counselling'
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-indigo-500',
                'h-5 w-5 flex-shrink-0'
              )}
            />
            <span>AI Counselling</span>
          </button>
        )}

        {/* Collapsible Groups */}
        {navGroups.map((group) => (
          <div key={group.key} className="pt-3 border-t border-gray-100">
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-indigo-600 px-2 py-2 rounded-md transition-colors"
            >
              <span>{group.title}</span>
              <ChevronDownIcon
                className={classNames(
                  'h-4 w-4 text-gray-400 transition-transform duration-300',
                  openGroups[group.key] ? 'rotate-180 text-indigo-500' : ''
                )}
              />
            </button>

            <div
              className={classNames(
                'overflow-hidden transition-all duration-500 ease-in-out',
                openGroups[group.key] ? 'max-h-auto opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="mt-1 space-y-1 pl-2 border-l border-gray-100">
                {group.items.map((item) => {
                  // Exact path matching with proper handling of nested routes
                  const currentPath = location.pathname;
                  const itemPath = item.path;

                  // Check if this is an exact match or if it's a parent path with no other longer matching paths
                  const isExactMatch = currentPath === itemPath;
                  const isParentMatch = currentPath.startsWith(itemPath + '/');

                  // Find if there's a more specific path that matches better
                  const hasMoreSpecificMatch = group.items.some(
                    (otherItem) =>
                      otherItem !== item &&
                      currentPath.startsWith(otherItem.path) &&
                      otherItem.path.length > itemPath.length
                  );

                  const isActive = isExactMatch || (isParentMatch && !hasMoreSpecificMatch);

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.name, item.path)}
                      className={classNames(
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600',
                        'group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive
                            ? 'text-indigo-600'
                            : 'text-gray-400 group-hover:text-indigo-500',
                          'h-5 w-5 flex-shrink-0'
                        )}
                      />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Audit & Reports - Single link for university_admin only */}
        {role === 'university_admin' && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => handleNavigation('Audit & Reports', '/university-admin/audit')}
              className={classNames(
                location.pathname.startsWith('/university-admin/audit')
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600',
                'group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
              )}
            >
              <DocumentChartBarIcon
                className={classNames(
                  location.pathname.startsWith('/university-admin/audit')
                    ? 'text-indigo-600'
                    : 'text-gray-400 group-hover:text-indigo-500',
                  'h-5 w-5 flex-shrink-0'
                )}
              />
              <span>Audit & Reports</span>
            </button>
          </div>
        )}

        {/* Settings - Always visible at bottom */}
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={() => handleNavigation('Settings', settingsPath)}
            className={classNames(
              location.pathname === settingsPath
                ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600',
              'group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
            )}
          >
            <Cog6ToothIcon
              className={classNames(
                location.pathname === settingsPath
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-indigo-500',
                'h-5 w-5 flex-shrink-0'
              )}
            />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      <div className="border-t border-gray-100 bg-gray-50 p-3 text-center text-xs text-gray-400">
        © 2025 SkillPassport
      </div>
    </aside>
  );
};

export default Sidebar;
