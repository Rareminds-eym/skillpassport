import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { useAuthActions } from '@/shared/model/authStore';

/**
 * Simplified header for subscription purchase flow
 * Shows only logo, user email, and logout button
 */
const SubscriptionPurchaseHeader = ({ userEmail, hasBanner = false }) => {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const isHiddenRef = useRef(false);

  const { logout } = useAuthActions();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  useEffect(() => {
    // Navbar hide on scroll down, show on scroll up
    let ticking = false;
    const scrollThreshold = 100;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const lastScrollY = lastScrollYRef.current;

        if (!headerRef.current) {
          ticking = false;
          return;
        }

        // At top — always show
        if (currentScrollY < 10) {
          if (isHiddenRef.current || currentScrollY === 0) {
            gsap.to(headerRef.current, {
              y: 0,
              duration: 0.3,
              ease: 'power2.out',
              overwrite: true
            });
            isHiddenRef.current = false;
          }
        }
        // Scrolling down past threshold — hide
        else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
          if (!isHiddenRef.current) {
            gsap.to(headerRef.current, {
              y: -100,
              duration: 0.3,
              ease: 'power2.in',
              overwrite: true
            });
            isHiddenRef.current = true;
          }
        }
        // Scrolling up — show
        else if (currentScrollY < lastScrollY) {
          if (isHiddenRef.current) {
            gsap.to(headerRef.current, {
              y: 0,
              duration: 0.3,
              ease: 'power2.out',
              overwrite: true
            });
            isHiddenRef.current = false;
          }
        }

        lastScrollYRef.current = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full z-50 shadow-sm will-change-transform ${hasBanner ? 'top-[36px] sm:top-[40px]' : 'top-0'
        }`}
    >
      <nav className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-2 min-h-[72px]">
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <img
                src="/RareMinds.webp"
                alt="RareMinds Logo"
                className="h-14 w-auto transition-all duration-300 group-hover:scale-110 origin-left"
              />
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            {/* User Email - only show if available */}
            {userEmail && (
              <div className="hidden sm:flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700">
                {userEmail}
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile: Show email below on small screens - only if available */}
        {userEmail && (
          <div className="sm:hidden pb-3">
            <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
              {userEmail}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default SubscriptionPurchaseHeader;
