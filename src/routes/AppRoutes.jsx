import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Loader from '../components/Loader';

import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import RecruiterLayout from '../layouts/RecruiterLayout';
import StudentLayout from '../layouts/StudentLayout';

const Home = lazy(() => import('../pages/homepage/Home'));
const About = lazy(() => import('../pages/homepage/About'));
const Contact = lazy(() => import('../pages/homepage/Contact'));

const LoginStudent = lazy(() => import('../pages/auth/LoginStudent'));
const LoginRecruiter = lazy(() => import('../pages/auth/LoginRecruiter'));
const LoginAdmin = lazy(() => import('../pages/auth/LoginAdmin'));
const Register = lazy(() => import('../pages/auth/Register'));

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const ManageUsers = lazy(() => import('../pages/admin/ManageUsers'));
const Reports = lazy(() => import('../pages/admin/Reports'));

const RecruiterDashboard = lazy(() => import('../pages/recruitment/Dashboard'));
const PostJob = lazy(() => import('../pages/recruitment/PostJob'));
const ViewApplicants = lazy(() => import('../pages/recruitment/ViewApplicants'));

const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const Profile = lazy(() => import('../pages/student/Profile'));
const AppliedJobs = lazy(() => import('../pages/student/AppliedJobs'));
const BrowseJobs = lazy(() => import('../pages/student/BrowseJobs'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login/student" element={<LoginStudent />} />
          <Route path="/login/recruiter" element={<LoginRecruiter />} />
          <Route path="/login/admin" element={<LoginAdmin />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route
          path="/recruitment/*"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="applicants" element={<ViewApplicants />} />
          <Route path="" element={<Navigate to="/recruitment/dashboard" replace />} />
        </Route>

        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="applied-jobs" element={<AppliedJobs />} />
          <Route path="browse-jobs" element={<BrowseJobs />} />
          <Route path="" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
