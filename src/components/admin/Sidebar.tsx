import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  DocumentChartBarIcon,
  ChartPieIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
  onMobileMenuClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  showMobileMenu,
  onMobileMenuClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    department: true,
    student: true,
    academics: true,
    training: true,
    placements: true,
    events: true,
    reports: true,
    finance: true,
  });

  const handleNavigation = (itemName: string, itemPath: string) => {
    setActiveTab(itemName.toLowerCase());
    if (onMobileMenuClose && showMobileMenu) onMobileMenuClose();
    navigate(itemPath);
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };


  const topItem = {
    name: "Dashboard",
    path: "/college-admin/dashboard",
    icon: HomeIcon,
  };

  const navGroups = [
    {
      title: "Department Management",
      key: "department",
      items: [
        {
          name: "Department",
          path: "/college-admin/departments/management",
          icon: BuildingOffice2Icon,
        },
        {
          name: "Course Mapping",
          path: "/college-admin/departments/mapping",
          icon: WrenchScrewdriverIcon,
        }
      ],
    },
    {
      title: "Student Lifecycle Management",
      key: "student",
      items: [
        {
          name: "Student Data & Admission",
          path: "/college-admin/students/data",
          icon: UserGroupIcon,
        },
        {
          name: "Attendance Tracking",
          path: "/college-admin/students/attendance",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Performance Monitoring",
          path: "/college-admin/students/performance",
          icon: ChartBarIcon,
        },
        {
          name: "Graduation & Alumni",
          path: "/college-admin/students/graduation",
          icon: AcademicCapIcon,
        },
      ],
    },
    {
      title: "Examination Management",
      key: "academics",
      items: [
        {
          name: "Syllabus & Curriculum",
          path: "/college-admin/academics/syllabus",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Internal Assessments",
          path: "/college-admin/academics/internal-assessment",
          icon: DocumentChartBarIcon,
        },
        {
          name: "Examinations & Results",
          path: "/college-admin/academics/exams",
          icon: AcademicCapIcon,
        },
        {
          name: "Transcript Generation",
          path: "/college-admin/academics/transcripts",
          icon: ChartBarIcon,
        },
      ],
    },
    {
      title: "Training & Skill Development",
      key: "training",
      items: [
        {
          name: "Skill Course Allocation",
          path: "/college-admin/training/skill-courses",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Progress Tracking",
          path: "/college-admin/training/tracking",
          icon: ChartBarIcon,
        },
        {
          name: "Feedback & Certification",
          path: "/college-admin/training/certifications",
          icon: AcademicCapIcon,
        },
      ],
    },
    {
      title: "Placement Management",
      key: "placements",
      items: [
        {
          name: "Company Registration",
          path: "/college-admin/placements/companies",
          icon: BriefcaseIcon,
        },
        {
          name: "Job Posts & Applications",
          path: "/college-admin/placements/jobs",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Placement Analytics",
          path: "/college-admin/placements/analytics",
          icon: ChartPieIcon,
        },
      ],
    },
    {
      title: "Event Management",
      key: "events",
      items: [
        {
          name: "Event Scheduling",
          path: "/college-admin/events/schedule",
          icon: CalendarDaysIcon,
        },
        {
          name: "Circulars & Notifications",
          path: "/college-admin/events/circulars",
          icon: BellIcon,
        },
        {
          name: "Mentor Allocation & Results",
          path: "/college-admin/events/mentors",
          icon: ClipboardDocumentListIcon,
        },
      ],
    },
    {
      title: "Reports & Analytics",
      key: "reports",
      items: [
        {
          name: "Attendance Dashboard",
          path: "/college-admin/reports/attendance",
          icon: ChartPieIcon,
        },
        {
          name: "Grades & Performance",
          path: "/college-admin/reports/performance",
          icon: ChartBarIcon,
        },
        {
          name: "Placement Overview",
          path: "/college-admin/reports/placements",
          icon: DocumentChartBarIcon,
        },
      ],
    },
    {
      title: "Finance & Accounts",
      key: "finance",
      items: [
        {
          name: "Fee Tracking",
          path: "/college-admin/finance/fees",
          icon: BanknotesIcon,
        },
        {
          name: "Department Budgets",
          path: "/college-admin/finance/budgets",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Expenditure Reports",
          path: "/college-admin/finance/expenditure",
          icon: ChartBarIcon,
        },
      ],
    },
  ];

  const bottomItems = [
    {
      name: "Settings",
      path: "/college-admin/settings",
      icon: Cog6ToothIcon,
    },
  ];


  return (
    <aside
      className={classNames(
        "h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300",
        showMobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-3">
        {/* Dashboard */}
        <button
          onClick={() => handleNavigation(topItem.name, topItem.path)}
          className={classNames(
            location.pathname.startsWith(topItem.path)
              ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
              : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
            "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
          )}
        >
          <topItem.icon
            className={classNames(
              location.pathname.startsWith(topItem.path)
                ? "text-indigo-600"
                : "text-gray-400 group-hover:text-indigo-500",
              "h-5 w-5 flex-shrink-0"
            )}
          />
          <span>{topItem.name}</span>
        </button>

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
                  "h-4 w-4 text-gray-400 transition-transform duration-300",
                  openGroups[group.key] ? "rotate-180 text-indigo-500" : ""
                )}
              />
            </button>

            <div
              className={classNames(
                "overflow-hidden transition-all duration-500 ease-in-out",
                openGroups[group.key] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="mt-1 space-y-1 pl-2 border-l border-gray-100">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.name, item.path)}
                      className={classNames(
                        isActive
                          ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
                          : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
                        "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive
                            ? "text-indigo-600"
                            : "text-gray-400 group-hover:text-indigo-500",
                          "h-5 w-5 flex-shrink-0"
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

        {/* Bottom Items */}
        <div className="pt-3 border-t border-gray-100">
          {bottomItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.name, item.path)}
                className={classNames(
                  isActive
                    ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
                  "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
                )}
              >
                <item.icon
                  className={classNames(
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-400 group-hover:text-indigo-500",
                    "h-5 w-5 flex-shrink-0"
                  )}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-100 bg-gray-50 p-3 text-center text-xs text-gray-400">
        © 2025 SkillPassport
      </div>
    </aside>
  );
};

export default Sidebar;
