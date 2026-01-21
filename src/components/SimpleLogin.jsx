import React, { useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/Students/components/ui/card';
import { Button } from '../components/Students/components/ui/button';
import { Input } from '../components/Students/components/ui/input';
import { Alert, AlertDescription } from '../components/Students/components/ui/alert';

const SimpleLogin = () => {
  const { signIn, signUp, loading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      let result;

      if (isSignUp) {
        // Sign up new user
        result = await signUp(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          setMessage('Check your email for verification link!');
        }
      } else {
        // Sign in existing user
        result = await signIn(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          setMessage('Login successful! Redirecting...');
          // Redirect will happen automatically via auth context
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </CardTitle>
          <p className="text-gray-600">
            {isSignUp
              ? 'Enter your email and password to create an account'
              : 'Enter your email and password to access your dashboard'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="harrishhari2006@gmail.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full"
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>

          {/* Quick test login for development */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">Development Quick Login:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail('harrishhari2006@gmail.com');
                setPassword('your-password'); // You'll need to set this
              }}
              className="w-full text-xs"
            >
              Fill Test Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleLogin;
