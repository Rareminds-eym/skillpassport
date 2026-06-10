import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { ssoLoginWithRoleCheck, redirectToRoleDashboard } from '@/features/auth/lib';
import type { UserRole } from '@/features/auth/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Label } from '@/shared/ui/Label';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/ButtonNew';
import { PASSWORD_MIN } from '@/shared/constants';

const ADMIN_ROLES: UserRole[] = ['school_admin', 'college_admin', 'university_admin'];

const LoginAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await ssoLoginWithRoleCheck(email, password, ADMIN_ROLES);

      if (!result.success) {
        toast.error(result.error || 'Login failed');
        return;
      }

      toast.success('Welcome back!');
      await redirectToRoleDashboard(result.role as UserRole, navigate);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Login Portal</h1>
          <p className="text-gray-600">Manage your institution with unified access</p>
        </div>

        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your institution dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={PASSWORD_MIN}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="link"
                  type="button"
                  className="px-0 text-sm"
                  onClick={() => navigate('/password-reset')}
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-700 hover:bg-slate-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only schools with approved status can login. If your
              registration is pending or rejected, please contact RareMinds admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginAdmin;
