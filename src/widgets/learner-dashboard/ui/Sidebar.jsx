import {
    HomeIcon,
    ClipboardDocumentCheckIcon,
    CpuChipIcon,
    IdentificationIcon,
    AcademicCapIcon,
    BookOpenIcon,
    BriefcaseIcon,
    FolderIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    SparklesIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from '@/shared/model/authStore';
import { useLearnerDataByEmail } from '@/entities/learner';
import { useAuthActions } from '@/shared/model/authStore';
import bulbLogo from '@/shared/assets/bulb.png';
import RareMindsLogo from '@/shared/assets/RareMindsLogo';

/**
 * Sidebar Component - Collapsible sidebar with icons
 * Features:
 * - Navigation menu items with icons
 * - Active state highlighting
 * - Profile section at the bottom
 * - Collapsible/expandable with toggle button
 */
const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useUser();
    const { logout } = useAuthActions();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const userEmail = user?.email || localStorage.getItem("userEmail");
    const { learnerData } = useLearnerDataByEmail(userEmail);

    // Get user info
    const userName = learnerData?.full_name || user?.name || "R Amrutha";
    const userAvatar = learnerData?.profile_picture_url || user?.avatar;
    const userCollege = learnerData?.university_college_name || "VIT College";

    // Navigation items matching the image
    const navigationItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: HomeIcon,
            path: "/learner/dashboard",
            exists: true
        },
        {
            id: "assessment",
            label: "Assessment",
            icon: ClipboardDocumentCheckIcon,
            path: "/learner/assessment/platform",
            exists: true
        },
        {
            id: "lte",
            label: "Learners Transformation Engine",
            icon: CpuChipIcon,
            path: "/learner/lte",
            exists: false
        },
        {
            id: "passport",
            label: "Digital Passport",
            icon: IdentificationIcon,
            path: "/learner/digital-portfolio",
            exists: true
        },
        {
            id: "educators",
            label: "Educators Resource Studio",
            icon: AcademicCapIcon,
            path: "/learner/educators",
            exists: false
        },
        {
            id: "learning",
            label: "My Learning",
            icon: BookOpenIcon,
            path: "/learner/my-learning",
            exists: true
        },
        {
            id: "opportunities",
            label: "Opportunities",
            icon: BriefcaseIcon,
            path: "/learner/opportunities",
            exists: true
        },
        {
            id: "projects",
            label: "Projects / Internships",
            icon: FolderIcon,
            path: "/learner/projects",
            exists: false
        },
        {
            id: "certificates",
            label: "Certificates",
            icon: DocumentTextIcon,
            path: "/learner/certificates",
            exists: false
        },
        {
            id: "classroom",
            label: "My Classroom",
            icon: SparklesIcon,
            path: "/learner/my-class",
            exists: true
        },
        {
            id: "messages",
            label: "Messages",
            icon: ChatBubbleLeftRightIcon,
            path: "/learner/messages",
            exists: true
        },
        {
            id: "mentorship",
            label: "Mentorship",
            icon: UserGroupIcon,
            path: "/learner/mentorship",
            exists: false
        },
    ];

    // Check if current path matches
    const isActive = (path) => {
        if (path === "/learner/dashboard") {
            return location.pathname === "/learner/dashboard" ||
                location.pathname === "/learner" ||
                location.pathname === "/learner/";
        }
        return location.pathname.startsWith(path);
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login");
        }
    };

    return (
        <aside
            className={`hidden lg:flex bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex-col transition-all duration-300 ease-in-out z-[60] ${isCollapsed ? 'w-16' : 'w-56'
                }`}
        >
            {/* Logo Section at Top */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-center">
                {isCollapsed ? (
                    /* Collapsed: Show bulb icon */
                    <div className="flex items-center justify-center">
                        <img
                            src={bulbLogo}
                            alt="RareMinds Logo"
                            className="w-10 h-10 object-contain"
                        />
                    </div>
                ) : (
                    /* Expanded: Show full RareMinds logo */
                    <div className="flex items-center mr-auto">
                        <RareMindsLogo
                            alt="RareMinds Logo"
                            className="h-8 w-auto object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-2 px-3">
                <div className="space-y-1">
                    {navigationItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        const isDashboard = index === 0;

                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-3'
                                        } py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-gray-500"
                                        } ${isCollapsed ? '' : 'mr-3'}`} />
                                    {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

                                    {/* Toggle button inside Dashboard button */}
                                    {isDashboard && !isCollapsed && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsCollapsed(!isCollapsed);
                                            }}
                                            className="ml-2 p-1 hover:bg-blue-700 rounded transition-colors"
                                            title="Collapse sidebar"
                                        >
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </button>

                                {/* Toggle button for collapsed state - appears next to Dashboard icon */}
                                {isDashboard && isCollapsed && (
                                    <button
                                        onClick={() => setIsCollapsed(!isCollapsed)}
                                        className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md z-10"
                                        title="Expand sidebar"
                                    >
                                        <ChevronLeftIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Profile Section at Bottom */}
            {!isCollapsed && (
                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm ring-2 ring-blue-500">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {userName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                @ {userCollege}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsed Profile Section - Just Icon */}
            {isCollapsed && (
                <div className="border-t border-gray-200 p-3 flex flex-col items-center space-y-2">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt={userName}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 cursor-pointer"
                            onClick={() => navigate('/learner/profile')}
                            title={userName}
                        />
                    ) : (
                        <div
                            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-blue-500 cursor-pointer"
                            onClick={() => navigate('/learner/profile')}
                            title={userName}
                        >
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
