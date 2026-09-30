import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/ButtonNew';

/**
 * Error boundary for settings sections
 * Catches errors in child components and displays a fallback UI
 * 
 * Usage:
 * <SettingsErrorBoundary section="Profile">
 *   <ProfileTab {...props} />
 * </SettingsErrorBoundary>
 */
class SettingsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Settings Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { section = 'Settings', variant = 'compact' } = this.props;
      
      // Compact variant for inline sections
      if (variant === 'compact') {
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-900 mb-1">
                  Error in {section}
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  Something went wrong loading this section. Please try again.
                </p>
                {this.state.error && (
                  <details className="mb-3">
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                      Technical details
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={this.handleReset}
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Full variant for entire page errors
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 mb-6">
                  An error occurred while loading {section}. This has been logged and we'll look into it.
                </p>
                
                {this.state.error && (
                  <details className="mb-6 text-left">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 mb-2">
                      Show error details
                    </summary>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {this.state.error.toString()}
                        {this.state.errorInfo && (
                          <>
                            {'\n\n'}
                            {this.state.errorInfo.componentStack}
                          </>
                        )}
                      </pre>
                    </div>
                  </details>
                )}

                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SettingsErrorBoundary;
