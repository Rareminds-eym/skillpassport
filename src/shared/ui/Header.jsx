import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SocialMediaLinks } from '@/shared/ui/SocialMediaLinks';
import { useAuthStore } from '@/shared/model/authStore';

gsap.registerPlugin(ScrollTrigger);

const getDashboardUrl = (role) => {
  if (!role) return '/';
  switch (role) {
    case 'learner': return '/learner/dashboard';
    case 'educator':
    case 'school_educator':
    case 'college_educator': return '/educator/dashboard';
    case 'university_admin': return '/university/dashboard';
    case 'school_admin': return '/school/dashboard';
    case 'college_admin': return '/college/dashboard';
    case 'admin':
    case 'company_admin':
    case 'owner': return '/admin/dashboard';
    case 'recruiter':
    case 'hr': return '/recruiter/dashboard';
    default: return '/';
  }
};

const HIDDEN_PATHS = [
  '/digital-pp',
  '/portfolio',
  '/passport',
  '/video-portfolio',
  '/settings/theme',
  '/settings/layout',
  '/settings/export',
  '/settings/sharing'
];

const Header = ({ hasBanner = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const location = useLocation();
  const logoRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuItemsRef = useRef([]);

  const isSubscriptionPage = useMemo(
    () => location.pathname.startsWith('/subscription/') || location.pathname === '/my-subscription',
    [location.pathname]
  );

  const shouldHideHeader = useMemo(
    () => HIDDEN_PATHS.some(path => location.pathname.startsWith(path)),
    [location.pathname]
  );

  // Subscribe to auth store changes (SSO-based, not Supabase auth)
  useEffect(() => {
    const updateAuthUser = (state) => {
      const user = state.user;
      if (user) {
        setAuthUser({ email: user.email, role: user.role });
      } else {
        setAuthUser(null);
      }
    };

    // Set initial value
    updateAuthUser(useAuthStore.getState());

    // Subscribe to changes
    const unsubscribe = useAuthStore.subscribe(updateAuthUser);
    return unsubscribe;
  }, []);

  const closeMobileMenuWithAnimation = useCallback(() => {
    const tl = gsap.timeline({
      onComplete: () => setIsMobileMenuOpen(false)
    });

    tl.to(mobileMenuItemsRef.current, {
      opacity: 0,
      y: -10,
      scale: 0.95,
      duration: 0.25,
      stagger: 0.03,
      ease: 'power2.in',
    });

    tl.to(mobileMenuRef.current, {
      height: 0,
      opacity: 0,
      scaleY: 0,
      duration: 0.3,
      ease: 'power3.in',
    }, '-=0.15');
  }, []);

  const toggleMobileMenu = useCallback(() => {
    if (isMobileMenuOpen) {
      closeMobileMenuWithAnimation();
    } else {
      setIsMobileMenuOpen(true);
    }
  }, [isMobileMenuOpen, closeMobileMenuWithAnimation]);

  useEffect(() => {
    // Navbar scroll animation - shrinks on scroll down, expands on scroll up
    const scrollTrigger = ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: () => {
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

  // Hide header on portfolio and settings pages
  if (shouldHideHeader) {
    return null;
  }

  return (
    <header className={`bg-white/80 backdrop-blur-md border-b border-gray-100 sticky z-50 shadow-sm ${hasBanner ? 'top-[36px] sm:top-[40px]' : 'top-0'}`}>
      <nav className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
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

          {/* User Info (if authenticated) - Show on subscription pages */}
          {authUser && isSubscriptionPage && (
            <div className="hidden md:flex items-center space-x-2 mr-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                {authUser.email}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                {authUser.role}
              </span>
            </div>
          )}

          {/* Action Buttons - Hide on subscription pages */}
          {!isSubscriptionPage && (
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              <SocialMediaLinks className={isMobileMenuOpen ? 'text-gray-200' : 'text-[#3C3C3B]'} />

              {authUser ? (
                <Link
                  to={getDashboardUrl(authUser.role)}
                  className="px-5 py-2.5 text-sm font-extrabold text-white border-2 border-blue-600 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-200 rounded-full hover:bg-blue-700 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 hover:shadow-md"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  {/* Signup Button */}
                  <Link
                    to="/signup"
                    className="signup-button px-5 py-2 text-sm font-extrabold text-red-600 border-2 border-red-300 rounded-full transition-all duration-200"
                  >
                    Sign Up
                  </Link>

                  {/* Login Button */}
                  <Link to="/login" className="px-5 py-2.5 text-sm font-extrabold text-white border-2 border-red-300 bg-gradient-to-r from-red-500 to-red-400 shadow-lg shadow-red-200 rounded-full hover:bg-red-600 hover:from-red-600 hover:to-red-500 transition-all duration-200 hover:shadow-md">
                    Login
                  </Link>
                </>
              )}
            </div>
          )}

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
          <div ref={mobileMenuRef} className="md:hidden py-4 space-y-2 border-t border-gray-100 overflow-hidden">
            {authUser && isSubscriptionPage && (
              <div className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {authUser.email}
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                    {authUser.role}
                  </span>
                </div>
              </div>
            )}
            {!isSubscriptionPage && (
              <div ref={(el) => (mobileMenuItemsRef.current[0] = el)} className="px-2 pt-4 space-y-3">
                {/* Mobile Login/Signup Options */}
                <div className="space-y-4">
                  {authUser ? (
                    <div>
                      <Link
                        to={getDashboardUrl(authUser.role)}
                        onClick={closeMobileMenuWithAnimation}
                        className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase px-2 tracking-wider">Sign Up</div>
                        <div className="mt-2">
                          <Link
                            to="/signup"
                            onClick={closeMobileMenuWithAnimation}
                            className="signup-button block w-full px-4 py-3 text-sm font-semibold text-center text-red-600 border-2 border-red-300 rounded-lg transition-all duration-200"
                          >
                            Create an Account
                          </Link>
                        </div>
                      </div>

                      <div>
                        <Link
                          to="/login"
                          onClick={closeMobileMenuWithAnimation}
                          className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-red-500 to-red-400 rounded-lg hover:from-red-600 hover:to-red-500 transition-all duration-200 shadow-lg"
                        >
                          Login
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;