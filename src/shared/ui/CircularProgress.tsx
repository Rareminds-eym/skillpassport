import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface CircularProgressProps {
    value: number; // 0-100
    size?: number;
    color?: "green" | "blue" | "yellow" | "red";
    label?: string;
    className?: string;
    strokeWidth?: number;
    showPercentage?: boolean;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
    (
        {
            value,
            size = 120,
            color = "blue",
            label,
            className,
            strokeWidth = 8,
            showPercentage = true,
        },
        ref
    ) => {
        // Clamp value between 0 and 100
        const clampedValue = Math.min(Math.max(value, 0), 100);

        // Calculate circle properties
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (clampedValue / 100) * circumference;
        const center = size / 2;

        // Color mapping
        const colorClasses = {
            green: "text-green-500",
            blue: "text-blue-500",
            yellow: "text-yellow-500",
            red: "text-red-500",
        };

        const strokeColor = {
            green: "#10b981",
            blue: "#3b82f6",
            yellow: "#f59e0b",
            red: "#ef4444",
        };

        return (
            <div
                ref={ref}
                className={cn("relative inline-flex flex-col items-center", className)}
                role="progressbar"
                aria-valuenow={clampedValue}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label || `Progress: ${clampedValue}%`}
            >
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                    aria-hidden="true"
                >
                    {/* Background circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-gray-200"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={strokeColor[color]}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {showPercentage && (
                        <span
                            className={cn(
                                "text-2xl font-bold",
                                colorClasses[color]
                            )}
                        >
                            {Math.round(clampedValue)}%
                        </span>
                    )}
                    {label && (
                        <span className="mt-1 text-xs text-gray-600">{label}</span>
                    )}
                </div>
            </div>
        );
    }
);

CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
