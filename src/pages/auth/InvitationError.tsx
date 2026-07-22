import { AlertCircle, Mail, RefreshCw, LogIn } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

type ErrorType = 'already_used' | 'expired' | 'invalid' | 'org_deactivated' | 'email_mismatch' | 'unknown';

interface LocationState {
  errorType: ErrorType;
  errorMessage?: string;
  invitedEmail?: string;
  signupEmail?: string;
  orgName?: string;
}

export const InvitationError = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  const { errorType = 'unknown', errorMessage, invitedEmail, signupEmail, orgName } = state;

  const getErrorContent = () => {
    switch (errorType) {
      case 'already_used':
        return {
          title: 'Invitation Already Accepted',
          description: 'This invitation has already been used.',
          icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
          action: (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Go to Login
            </Link>
          ),
        };

      case 'expired':
        return {
          title: 'Invitation Expired',
          description: 'This invitation link has expired and can no longer be used.',
          icon: <AlertCircle className="w-16 h-16 text-orange-500" />,
          action: (
            <button
              onClick={() => {
                // TODO: Implement request new invitation
                alert('Request new invitation feature coming soon');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Request New Invitation
            </button>
          ),
        };

      case 'invalid':
        return {
          title: 'Invalid Invitation Link',
          description: 'This invitation link is not valid or has been revoked.',
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          action: (
            <div className="flex gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Sign Up Without Invitation
              </Link>
              <button
                onClick={() => {
                  // TODO: Implement contact support
                  window.open('mailto:support@example.com?subject=Invalid Invitation Link', '_blank');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          ),
        };

      case 'org_deactivated':
        return {
          title: 'Organization Deactivated',
          description: `The organization "${orgName || 'this company'}" is no longer active.`,
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          action: (
            <button
              onClick={() => {
                window.open('mailto:support@example.com?subject=Org Deactivation Issue', '_blank');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </button>
          ),
        };

      case 'email_mismatch':
        return {
          title: 'Email Mismatch',
          description: 'This invitation was sent to a different email address.',
          icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
          details: invitedEmail && signupEmail && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="text-gray-700">
                <span className="font-semibold">Invited email:</span> {invitedEmail}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-semibold">You signed up with:</span> {signupEmail}
              </p>
            </div>
          ),
          action: (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // TODO: Implement contact admin
                  alert('Contact admin feature coming soon');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Admin
              </button>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Sign Up with Correct Email
              </Link>
            </div>
          ),
        };

      default:
        return {
          title: 'Something Went Wrong',
          description: errorMessage || 'An unexpected error occurred while processing your invitation.',
          icon: <AlertCircle className="w-16 h-16 text-gray-500" />,
          action: (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Go Back
              </button>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Over
              </Link>
            </div>
          ),
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">{content.icon}</div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{content.title}</h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">{content.description}</p>

          {/* Details (if any) */}
          {content.details}

          {/* Action Buttons */}
          <div className="mt-6">{content.action}</div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <a
                href="mailto:support@example.com"
                className="text-blue-600 hover:underline font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationError;
