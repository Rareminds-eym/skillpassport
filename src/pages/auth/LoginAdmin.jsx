import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Label } from '../../components/Students/components/ui/label';
import { Input } from '../../components/Students/components/ui/input';
import Button from '../../components/Button';

const LoginAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ===== Dummy credential-based role mapping =====
  const credentials = {
    'school@admin.com': { name: 'School Admin', role: 'school_admin' },
    'college@admin.com': { name: 'College Admin', role: 'college_admin' },
    'university@admin.com': { name: 'University Admin', role: 'university_admin' },
  };

  // ===== Dashboard path mapping =====
  const dashboardRoutes = {
    school_admin: '/school-admin/dashboard',
    college_admin: '/college-admin/dashboard',
    university_admin: '/university-admin/dashboard',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulated login logic
      const user = credentials[email];

      if (!user || password.trim() === '') {
        throw new Error('Invalid email or password');
      }

      // Call context login
      login({ name: user.name, email, role: user.role });

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${user.name}!`,
      });

      // Redirect based on role
      navigate(dashboardRoutes[user.role] || '/admin/dashboard');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'School Admin', email: 'school@admin.com', password: 'school123' },
    { role: 'College Admin', email: 'college@admin.com', password: 'college123' },
    { role: 'University Admin', email: 'university@admin.com', password: 'university123' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Login Portal</h1>
          <p className="text-gray-600">
            Manage your institution with unified access
          </p>
        </div>

        {/* Login Card */}
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
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </Label> */}
                </div>
                <Button variant="link" type="button" className="px-0 text-sm">
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

        {/* Demo Credentials */}
        <Card className="bg-slate-50 border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Demo Login Credentials
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Use these to explore different admin dashboards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border hover:bg-slate-100 transition"
              >
                <span className="font-medium">{cred.role}</span>
                <div className="flex gap-2 text-gray-500">
                  <code>{cred.email}</code>
                  <span>•</span>
                  <code>{cred.password}</code>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginAdmin;
