import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Integrations', path: '/integrations' },
    { name: 'Case Studies', path: '/case-studies' },
    { name: 'Help', path: '/help' },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/RareMinds.webp" 
                alt="RareMinds Logo" 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActivePath(item.path)
                    ? 'text-gray-900 border-b-2 border-red-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Login Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setShowLoginDropdown(true)}
              onMouseLeave={() => setShowLoginDropdown(false)}
            >
              <button
                className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded hover:bg-red-50 transition-colors duration-200"
              >
                <span>Login</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLoginDropdown && (
                <div className="absolute top-full left-0 pt-2 w-48 z-50">
                  <div className="bg-white border border-gray-200 rounded-md shadow-lg">
                    <Link
                      to="/login/recruiter"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-t-md"
                    >
                      Login as Recruiter
                    </Link>
                    <Link
                      to="/login/student"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 border-t border-gray-100 rounded-b-md"
                    >
                      Login as Student
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Register Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setShowRegisterDropdown(true)}
              onMouseLeave={() => setShowRegisterDropdown(false)}
            >
              <button
                className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors duration-200"
              >
                <span>Register</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showRegisterDropdown && (
                <div className="absolute top-full left-0 pt-2 w-48 z-50">
                  <div className="bg-white border border-gray-200 rounded-md shadow-lg">
                    <Link
                      to="/register/recruiter"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-t-md"
                    >
                      Register as Recruiter
                    </Link>
                    <Link
                      to="/register/student"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 border-t border-gray-100 rounded-b-md"
                    >
                      Register as Student
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-200">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 text-sm font-medium rounded-md ${
                  isActivePath(item.path)
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-4 pt-4 space-y-3 border-t border-gray-200">
              {/* Mobile Login Options */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase px-2">Login</div>
                <Link
                  to="/login/recruiter"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-red-500 border border-red-500 rounded hover:bg-red-50"
                >
                  Login as Recruiter
                </Link>
                <Link
                  to="/login/student"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-red-500 border border-red-500 rounded hover:bg-red-50"
                >
                  Login as Student
                </Link>
              </div>

              {/* Mobile Register Options */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-gray-500 uppercase px-2">Register</div>
                <Link
                  to="/register/recruiter"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Register as Recruiter
                </Link>
                <Link
                  to="/register/student"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Register as Student
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
