import { BookmarkIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export const PROFILE_MENU_ITEMS = [
    {
        id: "saved-jobs",
        label: "Saved Jobs",
        icon: BookmarkIcon,
        path: "/student/saved-jobs",
        className: "text-gray-700 hover:bg-gray-50"
    },
    {
        id: "settings",
        label: "Settings",
        icon: Cog6ToothIcon,
        path: "/student/settings",
        className: "text-gray-700 hover:bg-gray-50"
    },
    {
        id: "logout",
        label: "Logout",
        icon: ArrowRightOnRectangleIcon,
        isDivider: true,
        className: "text-red-600 hover:bg-red-50"
    }
];
