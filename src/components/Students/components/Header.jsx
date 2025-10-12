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
  const [showShareModal, setShowShareModal] = useState(false);
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
          <span className="hidden sm:inline text-xl font-bold text-red-500 ml-10 lg:ml-20">Skill Passport</span>
        </div>

        {/* Center Tabs - Desktop */}
        <nav className="hidden md:flex flex-1 justify-center items-center">
          <div className="flex space-x-8">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                localStorage.removeItem('dashboardActiveNav');
                navigate('/student/dashboard');
              }}
              className={`relative py-2 px-2 text-sm font-medium transition-all duration-200 text-black hover:text-amber-500 bg-transparent border-none outline-none ${activeTab === 'dashboard' ? 'font-semibold' : ''}`}
            >
              Dashboard
              {activeTab === 'dashboard' && (
                <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-14 h-1 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full"></span>
              )}
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'share') {
                    setShowShareModal(true);
                  } else if (tab.id === 'skills' || tab.id === 'training' || tab.id === 'experience' || tab.id === 'opportunities') {
                    localStorage.setItem('dashboardActiveNav', tab.id);
                    navigate('/student/dashboard');
                  }
                }}
                className={`relative py-2 px-2 text-sm font-medium transition-all duration-200 text-black hover:text-amber-500 bg-transparent border-none outline-none ${activeTab === tab.id ? 'font-semibold' : ''}`}
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
            className="p-2 rounded-md text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
          <DropdownMenuContent align="end" className="w-48 bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl">
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
              localStorage.removeItem('dashboardActiveNav');
              navigate('/student/dashboard');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 px-4 text-black hover:text-amber-500 font-medium ${activeTab === 'dashboard' ? 'font-semibold bg-purple-50' : ''}`}
          >
            Dashboard
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'share') {
                  setShowShareModal(true);
                } else if (tab.id === 'skills' || tab.id === 'training' || tab.id === 'experience' || tab.id === 'opportunities') {
                  localStorage.setItem('dashboardActiveNav', tab.id);
                  navigate('/student/dashboard');
                }
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-4 text-black hover:text-amber-500 font-medium ${activeTab === tab.id ? 'font-semibold bg-purple-50' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Share Passport Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in-up">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center">Share Your Skill Passport</h2>
            <div className="flex flex-col items-center space-y-4">
              {/* Web Share API button for supported devices */}
              {navigator.share ? (
                <button
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
                  onClick={() => {
                    navigator.share({
                      title: 'My Skill Passport',
                      text: 'Check out my Skill Passport!',
                      url: window.location.origin + '/student/passport',
                    });
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 6l-4-4-4 4"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v14"/></svg>
                  <span>Share via Device</span>
                </button>
              ) : null}
              {/* Share icons/links */}
              <div className="flex space-x-4">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Check out my Skill Passport: ' + window.location.origin + '/student/passport')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on WhatsApp"
                  className="text-green-600 hover:text-green-700 text-2xl"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.1 3.2 5.077 4.366.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.617h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374A9.86 9.86 0 012.1 12.045C2.073 6.507 6.659 2 12.207 2c2.654 0 5.15 1.037 7.027 2.921a9.825 9.825 0 012.924 7.016c-.003 5.538-4.589 10.045-10.157 10.045zm8.413-17.417A11.815 11.815 0 0012.207 0C5.477 0 0 5.373 0 12.045c0 2.128.557 4.195 1.613 6.021L.057 24l6.211-1.634A11.822 11.822 0 0012.207 24c6.729 0 12.207-5.373 12.207-11.955 0-3.193-1.245-6.197-3.55-8.463z"/></svg>
                </a>
                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/student/passport')}&text=${encodeURIComponent('Check out my Skill Passport!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on Telegram"
                  className="text-blue-500 hover:text-blue-700 text-2xl"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.371 0 0 5.371 0 12c0 6.627 5.371 12 12 12s12-5.373 12-12c0-6.629-5.371-12-12-12zm5.707 7.293l-2.828 10.607c-.211.789-.678.979-1.372.609l-3.797-2.803-1.834-.883c-.399-.211-.408-.399.084-.588l7.16-2.763c.312-.123.604.075.469.588l-1.153 4.66c-.084.338-.258.408-.525.252l-2.262-1.484-1.084 1.045c-.112.112-.213.217-.436.112l.155-2.197 4.004-3.617c.174-.155.338-.07.282.155z"/></svg>
                </a>
                {/* Email */}
                <a
                  href={`mailto:?subject=Check%20out%20my%20Skill%20Passport&body=Here%20is%20my%20Skill%20Passport:%20${encodeURIComponent(window.location.origin + '/student/passport')}`}
                  className="text-red-500 hover:text-red-700 text-2xl"
                  title="Share via Email"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 13.065l-11.99-7.065v14c0 1.104.896 2 2 2h19.98c1.104 0 2-.896 2-2v-14l-11.99 7.065zm11.99-9.065c0-1.104-.896-2-2-2h-19.98c-1.104 0-2 .896-2 2v.217l12 7.083 11.98-7.083v-.217z"/></svg>
                </a>
                {/* Copy Link */}
                <button
                  className="text-gray-700 hover:text-gray-900 text-2xl focus:outline-none"
                  title="Copy Link"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/student/passport');
                    alert('Link copied to clipboard!');
                  }}
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                </button>
              </div>
              {/* Fallback input for manual copy */}
              <input
                type="text"
                value={window.location.origin + '/student/passport'}
                readOnly
                className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-700 text-center mt-4"
                onFocus={e => e.target.select()}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;