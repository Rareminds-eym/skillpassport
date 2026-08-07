import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface LoadingSkeletonProps {
    variant?: "text" | "circular" | "rectangular";
    width?: string | number;
    height?: string | number;
    count?: number;
    className?: string;
    animation?: "pulse" | "wave";
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
    (
        {
            variant = "text",
            width,
            height,
            count = 1,
            className,
            animation = "pulse",
        },
        ref
    ) => {
        // Animation classes
        const animationClass =
            animation === "wave"
                ? "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"
                : "animate-pulse bg-gray-200";

        // Variant-specific styles
        const getVariantStyles = () => {
            switch (variant) {
                case "circular":
                    return cn("rounded-full", animationClass);
                case "rectangular":
                    return cn("rounded-md", animationClass);
                case "text":
                default:
                    return cn("rounded", animationClass);
            }
        };

        // Get dimensions
        const getStyle = (): React.CSSProperties => {
            const style: React.CSSProperties = {};

            if (width !== undefined) {
                style.width = typeof width === "number" ? `${width}px` : width;
            }

            if (height !== undefined) {
                style.height = typeof height === "number" ? `${height}px` : height;
            }

            // Default dimensions based on variant
            if (!height) {
                if (variant === "text") {
                    style.height = "1rem";
                } else if (variant === "circular") {
                    style.height = width || "3rem";
                    style.width = width || "3rem";
                } else {
                    style.height = "6rem";
                }
            }

            if (!width && variant === "text") {
                style.width = "100%";
            }

            return style;
        };

        // Render single skeleton
        const renderSkeleton = (index: number) => (
            <div
                key={index}
                ref={index === 0 ? ref : undefined}
                className={cn(getVariantStyles(), className)}
                style={getStyle()}
                role="status"
                aria-label="Loading..."
                aria-busy="true"
            >
                <span className="sr-only">Loading...</span>
            </div>
        );

        // Render multiple skeletons if count > 1
        if (count > 1) {
            return (
                <div className="space-y-2">
                    {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
                </div>
            );
        }

        return renderSkeleton(0);
    }
);

LoadingSkeleton.displayName = "LoadingSkeleton";

// Preset skeleton components for common use cases
const SkeletonCard = React.forwardRef<
    HTMLDivElement,
    { className?: string }
>(({ className }, ref) => (
    <div
        ref={ref}
        className={cn("rounded-lg border border-gray-200 bg-white p-4", className)}
    >
        <LoadingSkeleton variant="rectangular" height={120} className="mb-3" />
        <LoadingSkeleton variant="text" width="60%" className="mb-2" />
        <LoadingSkeleton variant="text" width="40%" />
    </div>
));

SkeletonCard.displayName = "SkeletonCard";

const SkeletonAvatar = React.forwardRef<
    HTMLDivElement,
    { size?: number; className?: string }
>(({ size = 40, className }, ref) => (
    <LoadingSkeleton
        ref={ref}
        variant="circular"
        width={size}
        height={size}
        className={className}
    />
));

SkeletonAvatar.displayName = "SkeletonAvatar";

const SkeletonText = React.forwardRef<
    HTMLDivElement,
    { lines?: number; className?: string }
>(({ lines = 3, className }, ref) => (
    <LoadingSkeleton ref={ref} variant="text" count={lines} className={className} />
));

SkeletonText.displayName = "SkeletonText";

export { LoadingSkeleton, SkeletonCard, SkeletonAvatar, SkeletonText };
