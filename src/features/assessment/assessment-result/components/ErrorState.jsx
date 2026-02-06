import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../../../components/Students/components/ui/card';
import { Button } from '../../../../components/Students/components/ui/button';

/**
 * Error State Component
 * Displays when there's an error loading assessment results
 */
const ErrorState = ({ error, onRetry, retrying, onRetake, retryAttemptCount = 0 }) => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-10 pb-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Analysis Error</h2>
                <p className="text-gray-600 mb-4">{error?.message || (typeof error === 'string' ? error : 'An unexpected error occurred')}</p>
                
                {/* Show retry attempt counter if attempts have been made */}
                {retryAttemptCount > 0 && retryAttemptCount < 3 && (
                    <p className="text-sm text-gray-500 mb-6">
                        Retry attempt {retryAttemptCount} of 3
                    </p>
                )}
                
                {/* Show max attempts message if reached */}
                {retryAttemptCount >= 3 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-orange-800">
                            Maximum retry attempts reached. Please try again later or contact support.
                        </p>
                    </div>
                )}
                
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={onRetry}
                        disabled={retrying || retryAttemptCount >= 3}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full h-12 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {retrying ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Retrying...
                            </>
                        ) : retryAttemptCount >= 3 ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Max Attempts Reached
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Try Again
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onRetake}
                        className="h-12 text-base"
                    >
                        Retake Assessment
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
);

export default ErrorState;
