import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Map specific roles to their general category for route protection
const getRoleCategory = (role) => {
  const roleMap = {
    school_student: 'student',
    college_student: 'student',
    school_educator: 'educator',
    college_educator: 'educator',
    school_admin: 'school_admin',
    college_admin: 'college_admin',
    university_admin: 'university_admin',
    recruiter: 'recruiter',
    admin: 'admin',
  };
  return roleMap[role] || role;
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  console.log('=== ProtectedRoute DEBUG ===');
  console.log('pathname:', location.pathname);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('role from useAuth:', role);
  console.log('allowedRoles:', allowedRoles);
  console.log('loading:', loading);

  if (loading) {
    console.log('Still loading, showing Loader');
    return <Loader />;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting...');
    // Redirect to student login if path includes 'student', else default to '/'
    if (location.pathname.includes('student')) {
      return <Navigate to="/login/student" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check if user's role (or its category) is in allowed roles
  const roleCategory = getRoleCategory(role);
  console.log('roleCategory:', roleCategory);
  
  const hasAccess = allowedRoles.length === 0 || 
    allowedRoles.includes(role) || 
    allowedRoles.includes(roleCategory);
  
  console.log('hasAccess:', hasAccess);
  console.log('=== END ProtectedRoute DEBUG ===');

  if (!hasAccess) {
    console.log('No access, redirecting to /');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
