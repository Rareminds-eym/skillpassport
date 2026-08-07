import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        direction: "up" | "down";
    };
    subtitle?: string;
    className?: string;
    onClick?: () => void;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
    ({ title, value, icon, trend, subtitle, className, onClick }, ref) => {
        const isClickable = !!onClick;

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all",
                    isClickable && "cursor-pointer hover:shadow-md hover:border-gray-300",
                    className
                )}
                onClick={onClick}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={
                    isClickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onClick?.();
                            }
                        }
                        : undefined
                }
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                        {subtitle && (
                            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                        )}
                    </div>

                    {icon && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            {icon}
                        </div>
                    )}
                </div>

                {trend && (
                    <div className="mt-3 flex items-center">
                        <span
                            className={cn(
                                "flex items-center text-sm font-medium",
                                trend.direction === "up" ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.direction === "up" ? (
                                <svg
                                    className="mr-1 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="mr-1 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                </svg>
                            )}
                            {Math.abs(trend.value)}%
                        </span>
                        <span className="ml-2 text-sm text-gray-600">vs last period</span>
                    </div>
                )}
            </div>
        );
    }
);

StatCard.displayName = "StatCard";

export { StatCard };
