import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Restricted Access Page
 * Shown to users with restricted/suspended accounts
 */
const RestrictedAccess = () => {
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">
        <img src="/restrict.svg" alt="Access Restricted" className="h-[50vh]" />

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-medium text-gray-900">
            You are not authorized
          </h1>
          <p className="text-xl text-gray-600">
            You tried to access a page you did not have prior authorization for.
          </p>
        </div>

      </div>
    </div>
  );
};

export default RestrictedAccess;
