import React from 'react';
import UniversitySignupForm from './components/UniversitySignupForm';
import { Link } from 'react-router-dom';

const SignupUniversity = () => {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">University Sign Up</h1>
      <UniversitySignupForm />
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login/university" className="text-blue-600 hover:text-blue-700">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default SignupUniversity;