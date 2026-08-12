import { BellIcon, MagnifyingGlassIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '@/shared/model/authStore';
import { useNotifications } from '@/features/notifications';
import { useLearnerDataByEmail } from '@/entities/learner';
import NotificationPanel from "./NotificationPanel";
import RareMindsLogo from '@/shared/assets/RareMindsLogo';

/**
 * NewHeader Component - Matches the design from the image
 * Features:
 * - Logo on the left
 * - Search bar in the center
 * - Notification bell and profile on the right
 * - Mobile menu button
 */
const NewHeader = ({ onMobileMenuOpen }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const user = useUser();
    const notificationRef = useRef(null);

    const userEmail = user?.email || localStorage.getItem("userEmail");
    const { unreadCount } = useNotifications(userEmail);
    const { learnerData, loading: learnerDataLoading } = useLearnerDataByEmail(userEmail);

    // Get user name and avatar
    const userName = learnerData?.full_name || user?.name || "User";
    const userAvatar = learnerData?.profile_picture_url || user?.avatar;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setActiveModal(null);
            }
        };

        if (activeModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeModal]);

    const toggleNotifications = useCallback(() => {
        setActiveModal(prev => prev === 'notifications' ? null : 'notifications');
    }, []);

    const handleSearchSubmit = useCallback((e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // TODO: Implement search functionality
            console.log("Search query:", searchQuery);
        }
    }, [searchQuery]);

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="w-full px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Left: Mobile Menu Button (no logo on desktop, sidebar has it) */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={onMobileMenuOpen}
                            className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>

                        {/* Logo - only on mobile */}
                        <div className="lg:hidden">
                            <RareMindsLogo
                                alt="RareMinds Logo"
                                className="h-8 md:h-10 w-auto object-contain cursor-pointer"
                                onClick={() => navigate('/learner/dashboard')}
                                priority
                            />
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                        <form onSubmit={handleSearchSubmit} className="w-full">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search courses, plans, skills..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right: Notifications + Profile */}
                    <div className="flex items-center space-x-4 flex-shrink-0">

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={toggleNotifications}
                                className="relative flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
                            >
                                <BellIcon className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-semibold rounded-full px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {activeModal === 'notifications' && (
                                <div className="absolute right-0 mt-2 z-50">
                                    <NotificationPanel
                                        isOpen={true}
                                        onClose={() => setActiveModal(null)}
                                        learnerEmail={userEmail}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <button
                            onClick={() => navigate('/learner/profile')}
                            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200"
                        >
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm ring-2 ring-blue-500">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="hidden lg:block text-sm font-medium text-gray-700">
                                {userName.split(' ')[0]}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden pb-3">
                    <form onSubmit={handleSearchSubmit} className="w-full">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses, plans, skills..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </header>
    );
};

export default NewHeader;
