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
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from '@/shared/model/authStore';
import { useLearnerDataByEmail } from '@/entities/learner';
import { useAuthActions } from '@/shared/model/authStore';
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useEffect } from 'react';

/**
 * MobileSidebar Component - Mobile drawer version of the sidebar
 */
const MobileSidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useUser();
    const { logout } = useAuthActions();

    const userEmail = user?.email || localStorage.getItem("userEmail");
    const { learnerData } = useLearnerDataByEmail(userEmail);

    // Get user info
    const userName = learnerData?.full_name || user?.name || "R Amrutha";
    const userAvatar = learnerData?.profile_picture_url || user?.avatar;
    const userCollege = learnerData?.university_college_name || "VIT College";

    // Navigation items
    const navigationItems = [
        { id: "dashboard", label: "Dashboard", icon: HomeIcon, path: "/learner/dashboard", exists: true },
        { id: "assessment", label: "Assessment", icon: ClipboardDocumentCheckIcon, path: "/learner/assessment/platform", exists: true },
        { id: "lte", label: "Learners Transformation Engine", icon: CpuChipIcon, path: "/learner/lte", exists: false },
        { id: "passport", label: "Digital Passport", icon: IdentificationIcon, path: "/learner/digital-portfolio", exists: true },
        { id: "educators", label: "Educators Resource Studio", icon: AcademicCapIcon, path: "/learner/educators", exists: false },
        { id: "learning", label: "My Learning", icon: BookOpenIcon, path: "/learner/my-learning", exists: true },
        { id: "opportunities", label: "Opportunities", icon: BriefcaseIcon, path: "/learner/opportunities", exists: true },
        { id: "projects", label: "Projects / Internships", icon: FolderIcon, path: "/learner/projects", exists: false },
        { id: "certificates", label: "Certificates", icon: DocumentTextIcon, path: "/learner/certificates", exists: false },
        { id: "classroom", label: "My Classroom", icon: SparklesIcon, path: "/learner/my-class", exists: true },
        { id: "messages", label: "Messages", icon: ChatBubbleLeftRightIcon, path: "/learner/messages", exists: true },
        { id: "mentorship", label: "Mentorship", icon: UserGroupIcon, path: "/learner/mentorship", exists: false },
    ];

    // Close on route change
    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

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

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Mobile Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 lg:hidden transform transition-transform duration-300 ease-in-out flex flex-col">
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${active ? "text-white" : "text-gray-500"}`} />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Profile Section at Bottom */}
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
            </aside>
        </>
    );
};

export default MobileSidebar;
