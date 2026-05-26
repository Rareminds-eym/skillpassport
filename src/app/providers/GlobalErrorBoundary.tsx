import { Component, ErrorInfo, ReactNode } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('global-error-boundary');

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

function ErrorFallback({
    error,
    onReload,
    onGoHome,
}: {
    error: Error | null;
    onReload: () => void;
    onGoHome: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-3 font-sans">
            <div className="max-w-md w-full text-center">
                <div className="w-72 h-72 mx-auto mb-2">
                    <DotLottieReact
                        src="/animations/error.lottie"
                        loop
                        autoplay
                        className="w-full h-full"
                    />
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Something went wrong
                </h1>

                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    An unexpected error occurred. You can try reloading the page or going
                    back to the home page.
                </p>

                {import.meta.env.DEV && error && (
                    <pre className="text-left bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 overflow-auto max-h-40 mb-6 whitespace-pre-wrap break-words">
                        {error.message}
                        {error.stack && '\n\n' + error.stack}
                    </pre>
                )}

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onGoHome}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={onReload}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border-none rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error in component tree', error, { componentStack: errorInfo.componentStack });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    onReload={this.handleReload}
                    onGoHome={this.handleGoHome}
                />
            );
        }

        return this.props.children;
    }
}
