import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    className?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error for debugging
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            // Render custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div
                    className={cn(
                        "flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6",
                        this.props.className
                    )}
                    role="alert"
                    aria-live="assertive"
                >
                    <svg
                        className="mb-4 h-12 w-12 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>

                    <h3 className="mb-2 text-lg font-semibold text-red-900">
                        Something went wrong
                    </h3>

                    <p className="mb-4 text-center text-sm text-red-700">
                        {this.state.error?.message || "An unexpected error occurred"}
                    </p>

                    <button
                        onClick={this.handleReset}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        type="button"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export { ErrorBoundary };
