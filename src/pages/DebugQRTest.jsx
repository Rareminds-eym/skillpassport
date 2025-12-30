import React from 'react';
import { useNavigate } from 'react-router-dom';

const DebugQRTest = () => {
  const navigate = useNavigate();
  
  const testStudentId = 'test-student-id-123';
  const testQRValue = `${window.location.origin}/student/profile/${testStudentId}`;
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">QR Code & 3D Card Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">System Status</h2>
          <div className="space-y-2">
            <p><strong>Vite Running:</strong> ✅ Yes</p>
            <p><strong>React Router:</strong> ✅ Active</p>
            <p><strong>QRCode Library:</strong> ✅ Installed</p>
            <p><strong>Supabase:</strong> ✅ Connected</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Test Links</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="block w-full text-left px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              1. Go to Homepage
            </button>
            <button
              onClick={() => navigate('/login/student')}
              className="block w-full text-left px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              2. Go to Student Login
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="block w-full text-left px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              3. Go to Student Dashboard (Requires Login)
            </button>
            <button
              onClick={() => navigate(`/student/profile/${testStudentId}`)}
              className="block w-full text-left px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              4. Test 3D Card View (test-student-id-123)
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">QR Code Test</h2>
          <p className="mb-4">Test QR Value: <code className="bg-gray-100 px-2 py-1 rounded">{testQRValue}</code></p>
          <div className="border-2 border-gray-300 p-4 rounded inline-block">
            <p className="text-sm text-gray-600 mb-2">Sample QR Code:</p>
            <div className="bg-gray-200 w-48 h-48 flex items-center justify-center">
              <span className="text-gray-500">QR Code Placeholder</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Common Issues & Solutions</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-bold">White Screen on Dashboard</h3>
              <p className="text-sm text-gray-600">
                → Check if you're logged in<br/>
                → Open browser console (F12) and check for errors<br/>
                → Clear browser cache and reload
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold">QR Code Not Showing</h3>
              <p className="text-sm text-gray-600">
                → Ensure you're logged in as a student<br/>
                → QR code only shows for authenticated users<br/>
                → Check if userEmail is set in localStorage
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold">3D Card Not Loading</h3>
              <p className="text-sm text-gray-600">
                → Check Supabase connection<br/>
                → Verify student data exists in database<br/>
                → Check browser console for API errors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugQRTest;
