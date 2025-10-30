import React from 'react';
import SchoolSignupForm from './components/SchoolSignupForm';
import { Link } from 'react-router-dom';

const SignupSchool = () => {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">School Sign Up</h1>
      <SchoolSignupForm />
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login/school" className="text-blue-600 hover:text-blue-700">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default SignupSchool;