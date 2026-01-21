import React from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import SimpleLogin from '../components/SimpleLogin';
import StudentDashboard from '../pages/student/Dashboard';

const AuthenticatedApp = () => {
  const { user, loading, userProfile } = useSupabaseAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show login
  if (!user) {
    return <SimpleLogin />;
  }

  // If user but no profile linked yet, show loading
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your profile...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to student data for {user.email}</p>
        </div>
      </div>
    );
  }

  // User is authenticated and profile is loaded, show dashboard
  return <StudentDashboard />;
};

export default AuthenticatedApp;
