import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getUserRole } from '../../services/roleLookupService';

/**
 * Debug page to check user roles
 * Navigate to /debug-roles to use this
 */
const DebugRoles = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const checkRoles = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message || 'Authentication failed');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Check all tables
      const checks = {
        userId,
        email: authData.user.email,
        roles: [] as any[],
      };

      // Students
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (studentData) {
        checks.roles.push({
          role: 'student',
          table: 'students',
          data: studentData,
        });
      }

      // Recruiters
      const { data: recruiterData } = await supabase
        .from('recruiters')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (recruiterData) {
        checks.roles.push({
          role: 'recruiter',
          table: 'recruiters',
          data: recruiterData,
        });
      }

      // School Educators
      const { data: educatorData } = await supabase
        .from('school_educators')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (educatorData) {
        checks.roles.push({
          role: 'educator',
          table: 'school_educators',
          data: educatorData,
        });
      }

      // Note: Removed fallback to 'educators' table as it doesn't exist
      // The system uses 'school_educators' table for all educator data

      // Users (admin roles)
      // Note: users table uses 'id' column that references auth.users(id) directly
      console.log('Checking users table for userId:', userId);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Users table result:', { userData, userError });

      if (userData && userData.role) {
        const adminRoles = ['school_admin', 'college_admin', 'university_admin'];
        if (adminRoles.includes(userData.role)) {
          checks.roles.push({
            role: userData.role,
            table: 'users',
            data: userData,
          });
        } else {
          console.log('User has role but not an admin role:', userData.role);
        }
      } else if (userData) {
        console.log('User found but no role field:', userData);
      } else {
        console.log('No user found in users table');
      }

      // Test the getUserRole function
      const roleLookupResult = await getUserRole(userId, authData.user.email || '');

      setResult({
        ...checks,
        roleLookupResult,
      });

      // Sign out
      await supabase.auth.signOut();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug User Roles</h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={checkRoles}
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Check Roles'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Results</h2>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">User ID:</p>
                  <p className="font-mono text-sm">{result.userId}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Email:</p>
                  <p className="font-mono text-sm">{result.email}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Found Roles: {result.roles.length}</h3>
                  {result.roles.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">⚠️ No roles found for this user!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.roles.map((roleInfo: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg capitalize">
                              {roleInfo.role}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {roleInfo.table}
                            </span>
                          </div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(roleInfo.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">getUserRole() Result:</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(result.roleLookupResult, null, 2)}
                    </pre>
                  </div>
                </div>

                {result.roles.length > 1 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">
                      ✅ This user has multiple roles and should see the role selection screen!
                    </p>
                  </div>
                )}

                {result.roles.length === 1 && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">
                      ℹ️ This user has a single role and will be logged in directly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugRoles;
