import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface ProgressBarProps {
    value: number; // 0-100
    color?: "auto" | "green" | "blue" | "yellow" | "red";
    label?: string;
    height?: number;
    className?: string;
    showPercentage?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
    (
        {
            value,
            color = "auto",
            label,
            height = 8,
            className,
            showPercentage = false,
        },
        ref
    ) => {
        // Clamp value between 0 and 100
        const clampedValue = Math.min(Math.max(value, 0), 100);

        // Auto color-coding based on value ranges
        const getColor = () => {
            if (color !== "auto") return color;

            if (clampedValue > 80) return "green";
            if (clampedValue >= 60) return "yellow";
            return "red";
        };

        const finalColor = getColor();

        // Color classes for background
        const colorClasses = {
            green: "bg-green-500",
            blue: "bg-blue-500",
            yellow: "bg-yellow-500",
            red: "bg-red-500",
        };

        return (
            <div
                ref={ref}
                className={cn("w-full", className)}
                role="progressbar"
                aria-valuenow={clampedValue}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label || `Progress: ${clampedValue}%`}
            >
                {/* Label and percentage row */}
                {(label || showPercentage) && (
                    <div className="mb-2 flex items-center justify-between text-sm">
                        {label && <span className="font-medium text-gray-700">{label}</span>}
                        {showPercentage && (
                            <span className="text-gray-600">{Math.round(clampedValue)}%</span>
                        )}
                    </div>
                )}

                {/* Progress bar */}
                <div
                    className="relative w-full overflow-hidden rounded-full bg-gray-200"
                    style={{ height: `${height}px` }}
                >
                    <div
                        className={cn(
                            "h-full transition-all duration-500 ease-out",
                            colorClasses[finalColor]
                        )}
                        style={{ width: `${clampedValue}%` }}
                    />
                </div>
            </div>
        );
    }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
