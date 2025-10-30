import React from 'react';
import StudentSignupForm from './components/StudentSignupForm';
import { Link } from 'react-router-dom';

const SignupStudent = () => {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Student Sign Up</h1>
      <StudentSignupForm />
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login/student" className="text-blue-600 hover:text-blue-700">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default SignupStudent;