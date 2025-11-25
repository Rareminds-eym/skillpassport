import React, { useState, useMemo } from "react";
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
  BookOpenIcon,
  UserIcon,
  BuildingLibraryIcon,
  ClipboardIcon,
  FolderOpenIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { TrophyIcon } from "lucide-react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Sidebar = ({ activeTab, setActiveTab, showMobileMenu, onMobileMenuClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role || "college_admin";

  // Initialize all groups as open by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    const allGroups = [
      "students", "teachers", "academics", "communication", "finance", "skills", // school_admin
      "colleges", "courses", "faculty", "placements", "analytics", // university_admin
      "department", "student", "training", "events", "reports" // college_admin
    ];
    allGroups.forEach(group => {
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
    if (role === "school_admin") {
      return [
        {
          title: "Student Management",
          key: "students",
          items: [
            {
              name: "Admissions",
              path: "/school-admin/students/admissions",
              icon: UserGroupIcon,
            },
            {
              name: "Attendance & Reports",
              path: "/school-admin/students/attendance",
              icon: ChartBarIcon,
            },
          ],
        },
        {
          title: "Teacher Management",
          key: "teachers",
          items: [
            {
              name: "Teachers",
              path: "/school-admin/teachers/list",
              icon: UserGroupIcon,
            },
            {
              name: "Onboarding",
              path: "/school-admin/teachers/onboarding",
              icon: AcademicCapIcon,
            },
            {
              name: "Timetable",
              path: "/school-admin/teachers/timetable",
              icon: CalendarDaysIcon,
            },
          ],
        },
        {
          title: "Academic Management",
          key: "academics",
          items: [
            {
              name: "Curriculum Setup",
              path: "/school-admin/academics/curriculum",
              icon: BookOpenIcon,
            },
            {
              name: "Lesson Plans & Exams",
              path: "/school-admin/academics/lessons",
              icon: ClipboardIcon,
            },
            {
              name: "Grading",
              path: "/school-admin/academics/grading",
              icon: ChartBarIcon,
            },
          ],
        },
        {
          title: "Parent & Communication",
          key: "communication",
          items: [
            {
              name: "Parent Access",
              path: "/school-admin/communication/parents",
              icon: BellIcon,
            },
            {
              name: "Circulars & Feedback",
              path: "/school-admin/communication/circulars",
              icon: ClipboardDocumentListIcon,
            },
            {
              name: "Grievance Handling",
              path: "/school-admin/communication/grievances",
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: "Finance & Infrastructure",
          key: "finance",
          items: [
            {
              name: "Fee Setup & Payments",
              path: "/school-admin/finance/fees",
              icon: BanknotesIcon,
            },
            {
              name: "Library & Assets",
              path: "/school-admin/infrastructure/library",
              icon: BuildingLibraryIcon,
            },
            {
              name: "Maintenance",
              path: "/school-admin/infrastructure/maintenance",
              icon: WrenchScrewdriverIcon,
            },
          ],
        },
        {
          title: "Skill & Co-Curricular",
          key: "skills",
          items: [
            {
              name: "Clubs & Competitions",
              path: "/school-admin/skills/clubs",
              icon: TrophyIcon,
            },
            {
              name: "Skill Badges",
              path: "/school-admin/skills/badges",
              icon: ChartPieIcon,
            },
          ],
        },
      ];
    }

    if (role === "university_admin") {
      return [
        {
          title: "Affiliated College Management",
          key: "colleges",
          items: [
            {
              name: "College Registration",
              path: "/university-admin/colleges/registration",
              icon: BuildingOffice2Icon,
            },
            {
              name: "Program Allocation",
              path: "/university-admin/colleges/programs",
              icon: ClipboardDocumentListIcon,
            },
            {
              name: "Performance Monitoring",
              path: "/university-admin/colleges/performance",
              icon: ChartBarIcon,
            },
          ],
        },
        {
          title: "Course & Curriculum Management",
          key: "courses",
          items: [
            {
              name: "Syllabus Approval",
              path: "/university-admin/courses/syllabus",
              icon: BookOpenIcon,
            },
            {
              name: "Course Updates",
              path: "/university-admin/courses/updates",
              icon: WrenchScrewdriverIcon,
            },
            {
              name: "Content Repository",
              path: "/university-admin/courses/content",
              icon: FolderOpenIcon,
            },
          ],
        },
        {
          title: "Faculty & Trainer Management",
          key: "faculty",
          items: [
            {
              name: "Empanelment & Assignment",
              path: "/university-admin/faculty/empanelment",
              icon: UserIcon,
            },
            {
              name: "Feedback & Certification",
              path: "/university-admin/faculty/feedback",
              icon: ClipboardIcon,
            },
          ],
        },
        {
          title: "Student Records",
          key: "students",
          items: [
            {
              name: "Enrollment & Profiles",
              path: "/university-admin/students/enrollments",
              icon: UserGroupIcon,
            },
            {
              name: "Continuous Assessment",
              path: "/university-admin/students/continuous-assessment",
              icon: ClipboardDocumentListIcon,
            },
            {
              name: "Centralized Results",
              path: "/university-admin/students/results",
              icon: AcademicCapIcon,
            },
            {
              name: "Certificate Generation",
              path: "/university-admin/students/certificates",
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: "Placement & Industry Linkages",
          key: "placements",
          items: [
            {
              name: "Placement Readiness",
              path: "/university-admin/placements/readiness",
              icon: ChartBarIcon,
            },
            {
              name: "Company Database",
              path: "/university-admin/placements/companies",
              icon: BriefcaseIcon,
            },
            {
              name: "Internship Reports",
              path: "/university-admin/placements/internships",
              icon: ClipboardDocumentListIcon,
            },
            {
              name: "MoUs & Partnerships",
              path: "/university-admin/placements/mous",
              icon: BuildingOffice2Icon,
            },
          ],
        },
        {
          title: "Analytics & Compliance",
          key: "analytics",
          items: [
            {
              name: "District & College Reports",
              path: "/university-admin/analytics/reports",
              icon: ChartPieIcon,
            },
            {
              name: "Scheme Compliance (TNSDC)",
              path: "/university-admin/analytics/compliance",
              icon: ChartBarIcon,
            },
            {
              name: "OBE Tracking",
              path: "/university-admin/analytics/obe-tracking",
              icon: DocumentChartBarIcon,
            },
          ],
        },
        {
          title: "Communication & Announcements",
          key: "communication",
          items: [
            {
              name: "Circulars & Notices",
              path: "/university-admin/communication/circulars",
              icon: BellIcon,
            },
            {
              name: "Training Updates",
              path: "/university-admin/communication/training",
              icon: ClipboardDocumentListIcon,
            },
          ],
        },
      ];
    }

    // Default: College Admin
    return [
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
            name: "Faculty Management",
            path: "/college-admin/departments/educators",
            icon: ClipboardDocumentListIcon,
          },

          {
            name: "Course Mapping",
            path: "/college-admin/departments/mapping",
            icon: WrenchScrewdriverIcon,
          },
        ],
      },
      {
        title: "Student Lifecycle Management",
        key: "student",
        items: [
          {
            name: "Student Data & Admission",
            path: "/college-admin/students/data-management",
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
  }, [role]);

  // Get dashboard and settings paths based on role
  const getDashboardPath = () => {
    if (role === "school_admin") return "/school-admin/dashboard";
    if (role === "university_admin") return "/university-admin/dashboard";
    return "/college-admin/dashboard";
  };

  const getSettingsPath = () => {
    if (role === "school_admin") return "/school-admin/settings";
    if (role === "university_admin") return "/university-admin/settings";
    return "/college-admin/settings";
  };

  const dashboardPath = getDashboardPath();
  const settingsPath = getSettingsPath();

  return (
    <aside
      className={classNames(
        "h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300",
        showMobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-3">
        {/* Dashboard - Always visible at top */}
        <button
          onClick={() => handleNavigation("Dashboard", dashboardPath)}
          className={classNames(
            location.pathname === dashboardPath
              ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
              : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
            "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
          )}
        >
          <HomeIcon
            className={classNames(
              location.pathname === dashboardPath
                ? "text-indigo-600"
                : "text-gray-400 group-hover:text-indigo-500",
              "h-5 w-5 flex-shrink-0"
            )}
          />
          <span>Dashboard</span>
        </button>

        {/* AI Counselling - university_admin only */}
        {role === "university_admin" && (
          <button
            onClick={() => handleNavigation("AI Counselling", "/university-admin/ai-counselling")}
            className={classNames(
              location.pathname === "/university-admin/ai-counselling"
                ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
              "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
            )}
          >
            <SparklesIcon
              className={classNames(
                location.pathname === "/university-admin/ai-counselling"
                  ? "text-indigo-600"
                  : "text-gray-400 group-hover:text-indigo-500",
                "h-5 w-5 flex-shrink-0"
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

        {/* Audit & Reports - Single link for university_admin only */}
        {role === "university_admin" && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => handleNavigation("Audit & Reports", "/university-admin/audit")}
              className={classNames(
                location.pathname.startsWith("/university-admin/audit")
                  ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
                "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
              )}
            >
              <DocumentChartBarIcon
                className={classNames(
                  location.pathname.startsWith("/university-admin/audit")
                    ? "text-indigo-600"
                    : "text-gray-400 group-hover:text-indigo-500",
                  "h-5 w-5 flex-shrink-0"
                )}
              />
              <span>Audit & Reports</span>
            </button>
          </div>
        )}

        {/* Settings - Always visible at bottom */}
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={() => handleNavigation("Settings", settingsPath)}
            className={classNames(
              location.pathname === settingsPath
                ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600",
              "group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
            )}
          >
            <Cog6ToothIcon
              className={classNames(
                location.pathname === settingsPath
                  ? "text-indigo-600"
                  : "text-gray-400 group-hover:text-indigo-500",
                "h-5 w-5 flex-shrink-0"
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