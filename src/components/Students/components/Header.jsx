import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, LogOut, Settings, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../../../context/AuthContext'; // <-- Add this import

const Header = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth(); // <-- Use logout from context
  const tabs = [
    { id: 'skills', label: 'My Skills' },
    { id: 'training', label: 'My Training' },
    { id: 'experience', label: 'My Experience' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'share', label: 'Share Passport' }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-2 px-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2 min-w-[180px]">
          <img
            src="/RareMinds.webp"
            alt="RareMinds Logo"
            className="w-32 h-10 object-contain bg-white"
          />
          <span className="hidden sm:inline text-xl font-bold text-purple-700 ml-2">Skill Passport</span>
        </div>

        {/* Center Tabs - Desktop */}
        <nav className="hidden md:flex flex-1 justify-center items-center">
          <div className="flex space-x-8">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                navigate('/student/dashboard');
              }}
              className={`relative py-2 px-2 text-sm font-medium transition-all duration-200 text-purple-700 hover:text-amber-500 bg-transparent border-none outline-none ${activeTab === 'dashboard' ? 'font-semibold' : ''}`}
            >
              Dashboard
              {activeTab === 'dashboard' && (
                <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-14 h-1 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full"></span>
              )}
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-2 px-2 text-sm font-medium transition-all duration-200 text-purple-700 hover:text-amber-500 bg-transparent border-none outline-none ${activeTab === tab.id ? 'font-semibold' : ''}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-14 h-1 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Hamburger Menu - Mobile */}
        <div className="flex md:hidden items-center">
          <button
            className="p-2 rounded-md text-purple-700 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-md hover:bg-yellow-500 transition-colors">
              <User className="w-6 h-6 text-purple-700" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => {
                setActiveTab('profile');
                navigate('/student/profile');
              }}
              className="cursor-pointer"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => { logout(); navigate('/login/student'); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm px-2 pt-2 pb-3 animate-fade-in-down">
          <button
            key="dashboard"
            onClick={() => {
              setActiveTab('dashboard');
              navigate('/student/dashboard');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 px-4 text-purple-700 hover:text-amber-500 font-medium ${activeTab === 'dashboard' ? 'font-semibold bg-purple-50' : ''}`}
          >
            Dashboard
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-4 text-purple-700 hover:text-amber-500 font-medium ${activeTab === tab.id ? 'font-semibold bg-purple-50' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;