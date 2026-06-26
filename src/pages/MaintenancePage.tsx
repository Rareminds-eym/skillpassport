import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useMaintenanceStore } from '@/shared/model/maintenanceStore';

export const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const isMaintenanceMode = useMaintenanceStore(s => s.isMaintenanceMode);

  useEffect(() => {
    if (!isMaintenanceMode) {
      navigate('/', { replace: true });
    }
  }, [isMaintenanceMode, navigate]);
  return (
    <>
      <Helmet>
        <title>SkillPassport — We're Offline</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans overflow-hidden">

        {/* Headline */}
        <div className="w-full max-w-2xl px-6 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-[56px] font-normal text-[#333333] mb-16 tracking-tight drop-shadow-sm">
            We're offline!
          </h1>
        </div>

        {/* Unplugged cable SVG illustration */}
        <div className="w-full flex justify-center mb-16 overflow-hidden" aria-hidden="true">
          <svg
            width="6000"
            height="180"
            viewBox="0 0 4000 120"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 min-w-[6000px] drop-shadow-[0_8px_12px_rgba(0,196,181,0.25)]"
          >
            {/* Left wire */}
            <path d="M 0 60 C 500 150, 1000 -30, 1500 60 S 1800 100, 1918 60" stroke="#00C4B5" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 0 60 C 500 150, 1000 -30, 1500 60 S 1800 100, 1918 60" stroke="white" strokeWidth="2.5" fill="none" />

            {/* Right wire with loop */}
            <path d="M 2082 60 C 2150 60, 2110 110, 2180 110 C 2240 110, 2260 30, 2190 30 C 2140 30, 2160 60, 2220 60 C 2800 150, 3400 -30, 4000 60" stroke="#00C4B5" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 2082 60 C 2150 60, 2110 110, 2180 110 C 2240 110, 2260 30, 2190 30 C 2140 30, 2160 60, 2220 60 C 2800 150, 3400 -30, 4000 60" stroke="white" strokeWidth="2.5" fill="none" />

            {/* Left plug body */}
            <path d="M 1966 44 L 1934 44 A 16 16 0 0 0 1934 76 L 1966 76 Z" stroke="#00C4B5" strokeWidth="3" fill="white" />
            {/* Left plug face circles */}
            <circle cx="1944" cy="60" r="3.5" stroke="#00C4B5" strokeWidth="2" fill="white" />
            <circle cx="1958" cy="60" r="3.5" stroke="#00C4B5" strokeWidth="2" fill="white" />

            {/* Right plug body */}
            <path d="M 2034 44 L 2066 44 A 16 16 0 0 1 2066 76 L 2034 76 Z" stroke="#00C4B5" strokeWidth="3" fill="white" />
            {/* Right plug prongs */}
            <rect x="2020" y="52" width="14" height="4" rx="1.5" stroke="#00C4B5" strokeWidth="2.5" fill="white" />
            <rect x="2020" y="64" width="14" height="4" rx="1.5" stroke="#00C4B5" strokeWidth="2.5" fill="white" />

            {/* Sparks / disconnection lines */}
            <g>
              <path d="M 1992 42 L 1997 48 M 2000 36 L 2000 45 M 2008 42 L 2003 48" stroke="#00C4B5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 1992 78 L 1997 72 M 2000 84 L 2000 75 M 2008 78 L 2003 72" stroke="#00C4B5" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Description & Footer container */}
        <div className="w-full max-w-2xl px-6 flex flex-col items-center text-center">
          {/* Description */}
          <p className="text-[#666666] text-base md:text-[17px] leading-relaxed max-w-[620px] mb-12">
            Unfortunately the website is down for a bit of maintenance right now. We will
            be online as soon as possible. Please check again in a little while. Thank you!
          </p>

          {/* Divider */}
          <div className="w-full border-t border-gray-200 mb-6" />

          {/* Footer row */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center text-sm font-medium text-gray-500 gap-4">
            {/* Copyright */}
            <span>Copyright: Rareminds © {new Date().getFullYear()}</span>
          </div>

        </div>
      </div>
    </>
  );
};

export default MaintenancePage;
