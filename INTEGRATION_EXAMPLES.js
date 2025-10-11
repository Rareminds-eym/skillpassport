/**
 * INTEGRATION GUIDE
 * How to integrate all the Supabase components into your existing app
 */

// ============================================================================
// STEP 1: Update your main App.tsx or App.jsx
// ============================================================================

/*
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';

// Import the new components
import DataMigrationTool from './components/DataMigrationTool';
import DashboardWithSupabase from './components/Students/components/DashboardWithSupabase';

// Your existing components
import Home from './pages/homepage/Home';
import LoginStudent from './pages/auth/LoginStudent';
import Register from './pages/auth/Register';

function App() {
  return (
    <SupabaseAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Existing routes *\/}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginStudent />} />
          <Route path="/register" element={<Register />} />
          
          {/* New routes *\/}
          <Route path="/migrate" element={<DataMigrationTool />} /> {/* Remove in production *\/}
          <Route path="/student/dashboard" element={<DashboardWithSupabase studentId="SP2024001" />} />
          
          {/* ... other routes *\/}
        </Routes>
      </BrowserRouter>
    </SupabaseAuthProvider>
  );
}

export default App;
*/

// ============================================================================
// STEP 2: Update Student Login Component
// ============================================================================

/*
// src/pages/auth/LoginStudent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

const LoginStudent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Student Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginStudent;
*/

// ============================================================================
// STEP 3: Update Student Register Component
// ============================================================================

/*
// src/pages/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    university: '',
    department: '',
    yearOfPassing: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          university: formData.university,
          department: formData.department,
          year_of_passing: formData.yearOfPassing,
          passport_id: `${formData.university.substring(0, 3).toUpperCase()}-${Date.now()}`,
        }
      );
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Student Registration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">University</label>
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Year of Passing</label>
            <input
              type="text"
              name="yearOfPassing"
              value={formData.yearOfPassing}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
*/

// ============================================================================
// STEP 4: Update Student Dashboard to Use Auth
// ============================================================================

/*
// src/pages/student/Dashboard.jsx
import React from 'react';
import { useSupabaseAuth, withAuth } from '../../context/SupabaseAuthContext';
import DashboardWithSupabase from '../../components/Students/components/DashboardWithSupabase';

const StudentDashboard = () => {
  const { user, userProfile, loading } = useSupabaseAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return <DashboardWithSupabase studentId={user.id} />;
};

export default withAuth(StudentDashboard);
*/

// ============================================================================
// STEP 5: Update Profile Page
// ============================================================================

/*
// src/pages/student/Profile.jsx
import React from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useStudentData } from '../../hooks/useStudentData';

const Profile = () => {
  const { user, userProfile, updateUserProfile } = useSupabaseAuth();
  const { studentData, updateEducation, addTechnicalSkill } = useStudentData(user?.id);

  const handleUpdateProfile = async (updates) => {
    await updateUserProfile(updates);
  };

  // Your profile component code...
};

export default Profile;
*/

// ============================================================================
// STEP 6: Environment Variables Check
// ============================================================================

/*
// Add this to your main.jsx or index.jsx to verify environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables!');
  console.error('Please ensure src/.env file exists with:');
  console.error('VITE_SUPABASE_URL=...');
  console.error('VITE_SUPABASE_ANON_KEY=...');
}
*/

// ============================================================================
// STEP 7: Testing Checklist
// ============================================================================

/*
TESTING CHECKLIST:

✅ Database Setup
  - [ ] Run schema.sql in Supabase
  - [ ] Verify all 9 tables created
  - [ ] Check RLS policies enabled

✅ Migration
  - [ ] Visit /migrate route
  - [ ] Click "Migrate Data"
  - [ ] Verify data in Supabase Table Editor

✅ Authentication
  - [ ] Test registration
  - [ ] Test login
  - [ ] Test logout
  - [ ] Test password reset

✅ Dashboard
  - [ ] View student data
  - [ ] Update education
  - [ ] Add skills
  - [ ] Delete records

✅ Error Handling
  - [ ] Test without internet
  - [ ] Test with invalid credentials
  - [ ] Test with missing data

✅ Performance
  - [ ] Check loading states
  - [ ] Verify data refresh
  - [ ] Test with multiple tabs
*/

// ============================================================================
// STEP 8: Production Deployment
// ============================================================================

/*
BEFORE DEPLOYING TO PRODUCTION:

1. Remove migration route from App.jsx
2. Remove DataMigrationTool component
3. Disable mock data fallback: useStudentData(id, false)
4. Set up proper authentication flow
5. Configure email templates in Supabase
6. Set up proper error logging (e.g., Sentry)
7. Add rate limiting for API calls
8. Configure CORS in Supabase if needed
9. Test all features in production environment
10. Monitor Supabase logs for errors
*/

// ============================================================================
// ADDITIONAL TIPS
// ============================================================================

/*
1. Real-time Subscriptions:
   Add to your components to listen for changes:

   useEffect(() => {
     const subscription = supabase
       .channel('student-changes')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'students' },
         (payload) => {
           console.log('Change received!', payload);
           refresh(); // Refresh your data
         }
       )
       .subscribe();

     return () => subscription.unsubscribe();
   }, []);

2. File Upload:
   For profile photos and certificates:

   const uploadFile = async (file, bucket, path) => {
     const { data, error } = await supabase.storage
       .from(bucket)
       .upload(path, file);
     
     if (error) throw error;
     return data;
   };

3. Pagination:
   For large datasets:

   const { data, error } = await supabase
     .from('opportunities')
     .select('*')
     .range(0, 9) // Get first 10 items
     .order('created_at', { ascending: false });

4. Search:
   Implement search functionality:

   const { data, error } = await supabase
     .from('opportunities')
     .select('*')
     .ilike('title', '%developer%'); // Case-insensitive search
*/

export {};
