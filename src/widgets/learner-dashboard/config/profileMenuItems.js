// Profile menu configuration
// Icons are referenced by name to keep config layer pure (no UI imports)
export const PROFILE_MENU_ITEMS = [
    {
        id: "saved-jobs",
        label: "Saved Jobs",
        iconName: "BookmarkIcon",
        path: "/learner/saved-jobs",
        className: "text-gray-700 hover:bg-gray-50"
    },
    {
        id: "settings",
        label: "Settings",
        iconName: "Cog6ToothIcon",
        path: "/learner/settings",
        className: "text-gray-700 hover:bg-gray-50"
    },
    {
        id: "logout",
        label: "Logout",
        iconName: "ArrowRightOnRectangleIcon",
        isDivider: true,
        className: "text-red-600 hover:bg-red-50"
    }
];
