import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';

// Import student type detection service
import { getStudentTypeInfo } from '../../services/collegeClassService';

// Import School Components
import SchoolMyClass from '../../components/Myclass/SchoolMyClass';

// Import College Components  
import CollegeMyClass from '../../components/Myclass/CollegeMyClass';

/**
 * MyClass - Smart Router Component
 * 
 * This component intelligently routes students to the appropriate class interface
 * based on their user role (school_student vs college_student) and data availability.
 * 
 * Architecture:
 * - Single entry point for all student class interfaces
 * - Role-based routing using user.role from database
 * - Graceful fallback for students without assigned classes/programs
 * - Professional separation of concerns
 */
const MyClass: React.FC = () => {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: authLoading } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id;

  // State for student type detection
  const [studentTypeInfo, setStudentTypeInfo] = useState<{
    isCollege: boolean;
    isSchool: boolean;
    hasProgram: boolean;
    hasClass: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine student type and routing
  useEffect(() => {
    const determineStudentType = async () => {
      if (authLoading) return;
      
      if (!studentId) {
        setLoading(false);
        setError('Student information not found. Please ensure you are logged in correctly.');
        return;
      }

      try {
        setLoading(true);
        const typeInfo = await getStudentTypeInfo(studentId);
        setStudentTypeInfo(typeInfo);
        setError(null);
      } catch (err) {
        console.error('Error determining student type:', err);
        setError('Failed to load student information. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    determineStudentType();
  }, [studentId, authLoading]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your class information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Class</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No student type info
  if (!studentTypeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Setup Required</h2>
          <p className="text-gray-600">
            Your account needs to be properly configured. Please contact your administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Route to College interface
  if (studentTypeInfo.isCollege) {
    if (!studentTypeInfo.hasProgram) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Program Assignment Pending</h2>
            <p className="text-gray-600">
              You haven't been assigned to a program yet. Please contact your college administrator to complete your enrollment.
            </p>
          </div>
        </div>
      );
    }
    
    return <CollegeMyClass />;
  }

  // Route to School interface
  if (studentTypeInfo.isSchool) {
    if (!studentTypeInfo.hasClass) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Class Assignment Pending</h2>
            <p className="text-gray-600">
              You haven't been assigned to a class yet. Please contact your school administrator to complete your enrollment.
            </p>
          </div>
        </div>
      );
    }
    
    return <SchoolMyClass />;
  }

  // Fallback for unknown student types
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Type Not Recognized</h2>
        <p className="text-gray-600">
          Your account type is not recognized. Please contact support for assistance with your account setup.
        </p>
      </div>
    </div>
  );
};

export default MyClass;