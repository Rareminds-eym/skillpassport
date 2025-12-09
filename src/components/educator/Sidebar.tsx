import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  BookOpenIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon
  // Icons from Heroicons
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

  // allow both groups open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    management: true,
    learning: true,
    cocurricular: true,
  });

  const handleNavigation = (itemName: string, itemPath: string) => {
    setActiveTab(itemName.toLowerCase());
    if (onMobileMenuClose && showMobileMenu) onMobileMenuClose();
    navigate(itemPath);
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // collapsible groups
  const navGroups = [
    {
      title: "Classroom Management",
      key: "management",
      items: [
        { name: "Students", path: "/educator/students", icon: UserGroupIcon },
        { name: "Classes", path: "/educator/classes", icon: AcademicCapIcon },
        { name: "TimeTable", path: "/educator/my-timetable", icon: AcademicCapIcon },
        { name: "Mark Attendance", path: "/educator/mark-attendance", icon: ClipboardDocumentCheckIcon },
        { name: "Assessment Results", path: "/educator/assessment-results", icon: ClipboardDocumentListIcon },
        { name: "Courses", path: "/educator/courses", icon: BookOpenIcon },
      ],
    },
    {
      title: "Learning & Evaluation",
      key: "learning",
      items: [
        {
          name: "Assignments",
          path: "/educator/assignments",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Mentor Notes",
          path: "/educator/mentornotes",
          icon: PencilSquareIcon,
        },
        {
          name: "Verification",
          path: "/educator/activities",
          icon: CheckCircleIcon,
        },
      ],
    },
    {
      title: "Skill & Co-Curriculm",
      key: "cocurricular",
      items: [
        {
          name: "Clubs & Compitetion",
          path: "/educator/clubs",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "badges",
          path: "/educator/badges",
          icon: PencilSquareIcon,
        },
      ],
    },
  ];

  // single items before & after dropdowns
  const topItem = { name: "Dashboard", path: "/educator/dashboard", icon: HomeIcon };
  const aiCopilotItem = { name: "Teaching Intelligence", path: "/educator/ai-copilot", icon: SparklesIcon };
  const bottomItems = [
    { name: "Digital Portfolio", path: "/educator/digital-portfolio", icon: FolderIcon },
    { name: "Analytics", path: "/educator/analytics", icon: ChartBarIcon },
    { name: "Reports", path: "/educator/reports", icon: DocumentChartBarIcon },
    { name: "Media Manager", path: "/educator/media", icon: PhotoIcon },
    { name: "Communication", path: "/educator/communication", icon: ChatBubbleLeftRightIcon },
    { name: "Settings", path: "/educator/settings", icon: Cog6ToothIcon },
  ];

  return (
    <aside
      className={classNames(
        "h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300",
        showMobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-3">
        {/* 1️⃣ Dashboard */}
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

        {/* 🌟 Teaching Intelligence - Featured */}
        <button
          onClick={() => handleNavigation(aiCopilotItem.name, aiCopilotItem.path)}
          className={classNames(
            location.pathname.startsWith(aiCopilotItem.path)
              ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 border-l-2 border-purple-500"
              : "text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-600",
            "group w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative overflow-hidden"
          )}
        >
          <aiCopilotItem.icon
            className={classNames(
              location.pathname.startsWith(aiCopilotItem.path)
                ? "text-purple-600"
                : "text-gray-400 group-hover:text-purple-500",
              "h-5 w-5 flex-shrink-0"
            )}
          />
          <span className="whitespace-nowrap flex-1 truncate">{aiCopilotItem.name}</span>
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full flex-shrink-0">NEW</span>
        </button>

        {/* 2️⃣ Dropdowns */}
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

        {/* 3️⃣ Bottom Items */}
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

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 p-3 text-center text-xs text-gray-400">
        © 2025 RareMinds
      </div>
    </aside>
  );
};

export default Sidebar;
