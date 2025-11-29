import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loginAdmin } from '../../services/adminAuthService';
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password.trim()) {
        throw new Error('Please enter both email and password');
      }

      // DEMO CREDENTIALS - Hardcoded for testing
      const DEMO_CREDENTIALS = {
        'university@admin.com': {
          id: 'university-001',
          name: 'University',
          email: 'university@admin.com',
          role: 'university_admin',
          schoolId: 'university-001',
          schoolName: 'University',
          schoolCode: 'UNI',
        },
        'college@admin.com': {
          id: 'college-001',
          name: 'College',
          email: 'college@admin.com',
          role: 'college_admin',
          schoolId: 'college-001',
          schoolName: 'College',
          schoolCode: 'COL',
        },
        'school@admin.com': {
          id: 'school-001',
          name: 'School',
          email: 'school@admin.com',
          role: 'school_admin',
          schoolId: 'school-001',
          schoolName: 'School',
          schoolCode: 'SCH',
        },
      };

      // Check if it's a demo credential
      if (DEMO_CREDENTIALS[email.trim().toLowerCase()]) {
        const demoUser = DEMO_CREDENTIALS[email.trim().toLowerCase()];
        
        login(demoUser);

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${demoUser.name}!`,
        });

        // Route based on role
        const dashboardRoutes = {
          'university_admin': '/university-admin/dashboard',
          'college_admin': '/college-admin/dashboard',
          'school_admin': '/school-admin/dashboard',
        };
        
        navigate(dashboardRoutes[demoUser.role] || '/school-admin/dashboard');
        return;
      }

      // Query the schools table for the entered email
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (schoolError || !school) {
        throw new Error('Invalid email or school not found');
      }

      // Check if the school is approved
      if (school.approval_status !== 'approved') {
        throw new Error(
          school.approval_status === 'pending'
            ? 'Your school registration is pending approval. Please contact RareMinds admin.'
            : school.approval_status === 'rejected'
            ? `Your school registration was rejected. Reason: ${school.rejection_reason || 'Not specified'}. Please contact RareMinds admin.`
            : 'Your school account is not approved. Please contact RareMinds admin.'
        );
      }

      // Store admin data in context
      login(result.admin);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${result.admin.name}!`,
      });

      // Redirect based on admin role
      if (result.admin.role === 'college_admin') {
        navigate('/college-admin/dashboard');
      } else if (result.admin.role === 'university_admin') {
        navigate('/university-admin/dashboard');
      } else {
        navigate('/school-admin/dashboard');
      }
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

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only schools with approved status can login. 
              If your registration is pending or rejected, please contact RareMinds admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginAdmin;
