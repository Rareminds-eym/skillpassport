/**
 * Unauthorized Page
 * Displayed when a user tries to access a resource they don't have permission for
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const message = location.state?.message || 'You do not have permission to access this page.';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
