/**
 * Role Indicator Component
 * Visual badge showing user's recruitment role
 */

import React from 'react';
import { ShieldCheckIcon, UserIcon, EyeIcon } from '@heroicons/react/24/outline';

interface RoleIndicatorProps {
    role: 'company_admin' | 'recruiter' | 'viewer' | null;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
    role,
    size = 'md',
    showIcon = true
}) => {
    if (!role) {
        return null;
    }

    const roleConfig = {
        company_admin: {
            label: 'Admin',
            icon: ShieldCheckIcon,
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
            borderColor: 'border-purple-200',
        },
        recruiter: {
            label: 'Recruiter',
            icon: UserIcon,
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
        },
        viewer: {
            label: 'Viewer',
            icon: EyeIcon,
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200',
        },
    };

    const config = roleConfig[role];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
        </span>
    );
};
