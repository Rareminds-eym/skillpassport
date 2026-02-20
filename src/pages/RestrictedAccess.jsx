import { ShieldAlert, Lock, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Restricted Access Page
 * Shown to users with restricted/suspended accounts
 */
const RestrictedAccess = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Access Restricted
            </h1>
            <p className="text-red-100 text-lg">
              Your account access has been limited
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Main Message */}
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-red-900 mb-2">
                    Account Suspended
                  </h2>
                  <p className="text-red-800 leading-relaxed">
                    Your account has been temporarily restricted. This may be due to policy violations, 
                    payment issues, or security concerns. You currently have limited access to platform features.
                  </p>
                </div>
              </div>
            </div>

            {/* What You Can Do */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                What you can do:
              </h3>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">1</span>
                  </div>
                  <p className="text-gray-700">
                    Review any outstanding payments or subscription issues
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">2</span>
                  </div>
                  <p className="text-gray-700">
                    Contact our support team to resolve the restriction
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">3</span>
                  </div>
                  <p className="text-gray-700">
                    Check your email for any notifications about your account status
                  </p>
                </li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="space-y-3">
                <a 
                  href="mailto:support@skillpassport.com"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">support@skillpassport.com</span>
                </a>
                <a 
                  href="tel:+1234567890"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">+1 (234) 567-890</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 text-sm mt-6">
          If you believe this is an error, please contact our support team immediately.
        </p>
      </div>
    </div>
  );
};

export default RestrictedAccess;
