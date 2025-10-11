import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from '../components/Sidebar';

const RecruiterLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className="flex-1 lg:ml-64 mt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RecruiterLayout;
