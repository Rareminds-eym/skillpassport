import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Briefcase } from 'lucide-react';

const LoginRecruiter = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ name: 'Recruiter User', email, role: 'recruiter' });
    navigate('/recruitment/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Briefcase className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Recruiter Login</h2>
          <p className="mt-2 text-sm text-gray-600">Access your recruitment dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="recruiter@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500" size="lg">
            Sign In
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Need a recruiter account?{' '}
              <Link to="/contact" className="font-medium text-green-600 hover:text-green-500">
                Contact us
              </Link>
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <Link to="/login/student" className="text-green-600 hover:text-green-500">
                Student Login
              </Link>
              <span className="text-gray-400">|</span>
              <Link to="/login/admin" className="text-green-600 hover:text-green-500">
                Admin Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginRecruiter;
