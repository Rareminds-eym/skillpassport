import React from 'react';
import RecruiterSignupForm from '../recruitment/RecruiterSignupForm';
import { Link } from 'react-router-dom';

const SignupRecruiter = () => {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Recruiter Sign Up</h1>
      <RecruiterSignupForm />
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login/recruiter" className="text-blue-600 hover:text-blue-700">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default SignupRecruiter;