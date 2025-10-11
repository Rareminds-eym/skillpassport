import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { getStudentByEmail } from '../../services/studentServiceProfile';

const LoginStudent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate that the email exists in the students table
      console.log('🔍 Validating student email:', email);
      const result = await getStudentByEmail(email);

      if (!result.success || !result.data) {
        setError('No student account found with this email. Please check your email or contact support.');
        setLoading(false);
        return;
      }

      console.log('✅ Student found, logging in...');
      // If student exists, proceed with login
      login({ name: result.data.profile.name, email, role: 'student' });
      navigate('/student/dashboard');
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Student Login</h2>
          <p className="mt-2 text-sm text-gray-600">Access your student dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="student@example.com"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Validating...' : 'Sign In'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <Link to="/login/recruiter" className="text-blue-600 hover:text-blue-500">
                Recruiter Login
              </Link>
              <span className="text-gray-400">|</span>
              <Link to="/login/admin" className="text-blue-600 hover:text-blue-500">
                Admin Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginStudent;
