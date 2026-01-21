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

  // Check if faculty onboarding is in progress - if so, prevent redirects
  if (typeof window !== 'undefined' && window.facultyOnboardingInProgress) {
    return children;
  }

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    // Redirect to student login if path includes 'student', else default to '/'
    if (location.pathname.includes('student')) {
      return <Navigate to="/login/student" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check if user's role (or its category) is in allowed roles
  const roleCategory = getRoleCategory(role);
  const hasAccess =
    allowedRoles.length === 0 || allowedRoles.includes(role) || allowedRoles.includes(roleCategory);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
