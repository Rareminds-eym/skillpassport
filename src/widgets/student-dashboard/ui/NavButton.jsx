const NavButton = ({
    onClick,
    isActive,
    icon: Icon,
    label,
    dataTour,
    className = ""
}) => (
    <button
        data-tour={dataTour}
        onClick={onClick}
        className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } ${className}`}
    >
        {Icon && <Icon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />}
        <span>{label}</span>
    </button>
);

export default NavButton;
