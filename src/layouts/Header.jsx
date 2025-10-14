import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const location = useLocation();
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const navLinksRef = useRef(null);
  const loginBtnRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuItemsRef = useRef([]);

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

  const closeMobileMenuWithAnimation = () => {
    // Exit Animation before closing
    const tl = gsap.timeline({
      onComplete: () => setIsMobileMenuOpen(false)
    });

    // Animate items out with stagger
    tl.to(
      mobileMenuItemsRef.current,
      {
        opacity: 0,
        y: -10,
        scale: 0.95,
        duration: 0.25,
        stagger: 0.03,
        ease: 'power2.in',
      }
    );

    // Animate menu container collapsing
    tl.to(
      mobileMenuRef.current,
      {
        height: 0,
        opacity: 0,
        scaleY: 0,
        duration: 0.3,
        ease: 'power3.in',
      },
      '-=0.15'
    );
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenuWithAnimation();
    } else {
      // Open menu
      setIsMobileMenuOpen(true);
    }
  };

  useEffect(() => {
    // Navbar scroll animation - shrinks on scroll down, expands on scroll up
    let lastScrollY = window.scrollY;
    
    const scrollTrigger = ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        const scrollY = window.scrollY;
        const scrollThreshold = 100;

        if (scrollY > scrollThreshold) {
          // Scrolled down - compact mode
          gsap.to(logoRef.current, {
            scale: 0.9,
            duration: 0.3,
            ease: 'power2.out',
          });
        } else {
          // At top - expanded mode
          gsap.to(logoRef.current, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
        }

        lastScrollY = scrollY;
      },
    });

    return () => {
      scrollTrigger.kill();
    };
  }, []);

  // Mobile menu animation
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      // Entry Animation
      const tl = gsap.timeline();
      
      // Animate menu container sliding down with scale
      tl.fromTo(
        mobileMenuRef.current,
        {
          height: 0,
          opacity: 0,
          scaleY: 0,
          transformOrigin: 'top',
        },
        {
          height: 'auto',
          opacity: 1,
          scaleY: 1,
          duration: 0.5,
          ease: 'power3.out',
        }
      );

      // Stagger animate menu items with slide and fade
      tl.fromTo(
        mobileMenuItemsRef.current,
        {
          opacity: 0,
          y: -15,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'back.out(1.2)',
        },
        '-=0.3'
      );
    }
  }, [isMobileMenuOpen]);

  return (
    <header 
      ref={headerRef}
      className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm"
    >
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-4 min-h-[72px]">
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <img 
                ref={logoRef}
                src="/RareMinds.webp" 
                alt="RareMinds Logo" 
                className="h-14 w-auto transition-all duration-300 group-hover:scale-110 origin-left"
              />
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {/* Login Dropdown */}
            <div 
              ref={loginBtnRef}
              className="relative"
              onMouseEnter={() => setShowLoginDropdown(true)}
              onMouseLeave={() => setShowLoginDropdown(false)}
            >
              <button
                className="flex items-center space-x-1 px-5 py-2.5 text-sm font-extrabold text-white border-2 border-red-300 bg-gradient-to-r from-red-500  to-red-400 shadow-lg shadow-red-200 rounded-full hover:bg-red-100 transition-all duration-200 hover:shadow-md"
              >
                <span>Login</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLoginDropdown && (
                <div className="absolute top-full left-0 pt-2 w-52 z-50">
                  <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                    <Link
                      to="/login/recruiter"
                      className="block px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                      Login as Recruiter
                    </Link>
                    <div className="h-px bg-gray-100"></div>
                    <Link
                      to="/login/student"
                      className="block px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                      Login as Student
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
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
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
          <div 
            ref={mobileMenuRef}
            className="md:hidden py-4 space-y-2 border-t border-gray-100 overflow-hidden"
          >
            <div 
              ref={(el) => (mobileMenuItemsRef.current[0] = el)}
              className="px-2 pt-4 space-y-3"
            >
              {/* Mobile Login Options */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase px-2 tracking-wider">Login</div>
                <Link
                  to="/login/recruiter"
                  onClick={closeMobileMenuWithAnimation}
                  className="block w-full px-4 py-3 text-sm font-semibold text-center text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                >
                  Login as Recruiter
                </Link>
                <Link
                  to="/login/student"
                  onClick={closeMobileMenuWithAnimation}
                  className="block w-full px-4 py-3 text-sm font-semibold text-center text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                >
                  Login as Student
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
