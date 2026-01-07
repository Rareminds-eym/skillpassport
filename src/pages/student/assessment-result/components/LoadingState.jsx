import { Sparkles } from 'lucide-react';

/**
 * Loading State Component
 * Displays while the assessment results are being generated
 */
const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                        src="/assets/HomePage/Ai Logo.png" 
                        alt="AI Logo" 
                        className="w-20 h-20 object-contain animate-pulse"
                    />
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Generating Your Report</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Our AI is analyzing your profile to create a comprehensive 4-page career report...</p>
        </div>
    </div>
);

export default LoadingState;
