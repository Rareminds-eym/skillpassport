import React, { useEffect, useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";

const GradientBars = () => {
  const [numBars] = useState(15);

  const calculateHeight = (index, total) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;
    
    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);
    
    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div 
        className="flex h-full"
        style={{
          width: '100%',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {Array.from({ length: numBars }).map((_, index) => {
          const height = calculateHeight(index, numBars);
          return (
            <div
              key={index}
              style={{
                flex: '1 0 calc(100% / 15)',
                maxWidth: 'calc(100% / 15)',
                height: '100%',
                background: 'linear-gradient(to top, rgb(29, 138, 209), transparent)',
                '--scale': height / 100,
                transformOrigin: 'bottom',
                outline: '1px solid rgba(0, 0, 0, 0)',
                boxSizing: 'border-box',
                transform: `scaleY(${height / 100})`,
              }}
            />
          );
        })}
      </div>
      {/* White shade overlay at the top */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 30%, rgba(255, 255, 255, 0.4) 60%, transparent 100%)',
        }}
      />
    </div>
  );
};

const FinalCTA = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    // Add styles for responsive background images
    const style = document.createElement('style');
    style.textContent = `
      .final-cta-background {
        background-image: url("/assets/HomePage/Make-Every-Skill-Count_1.png");
      }
      @media (max-width: 768px) {
        .final-cta-background {
          background-image: url("/assets/HomePage/footer_banner_mobileversion.webp");
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  const openBooking = () => {
    setShowBookingModal(true);
  };

  return (
    <section
      className="relative grid place-content-center overflow-hidden px-4 py-10 final-cta-background"
      style={{
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="relative z-10 flex flex-col items-center">
        {/* Main Heading */}
        <h1 className="max-w-5xl text-center text-2xl font-bold leading-snug text-black sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight">
          Make Every Skill Count.
        </h1>
        
        {/* Subheading */}
        <p className="my-6 max-w-3xl text-center text-base leading-relaxed text-gray-900 sm:text-lg md:text-xl">
          Transform Your Workforce Intelligence Today With Enterprise-Grade Skill Validation.
        </p>
        
        {/* CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-10 lg:gap-80">
          {/* Primary Button - Book a Corporate Demo */}
          <button
            onClick={openBooking}
            className="group flex items-center justify-center gap-2 h-9 sm:h-14 px-4 sm:px-8 rounded-full bg-[#e63b2e] text-white text-xs sm:text-base font-bold uppercase tracking-wide shadow-[0_6px_20px_rgba(230,59,46,0.4)] hover:brightness-110 transition-all"
            aria-label="Book a Corporate Demo"
          > 
            Book a Corporate Demo
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary Button - Request Enterprise Access */}
          <button
            className="rounded-full border-2 border-[#288aca] bg-[#288aca]/80 text-white px-4 py-2 text-sm font-bold transition-all hover:brightness-110 sm:px-6 sm:py-3 sm:text-base"
          >
            Request Enterprise Access
          </button>
        </div>
      </div>

      {/* Zoho Bookings Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-lg w-[95vw] max-w-4xl h-[85vh] shadow-2xl">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-all"
              aria-label="Close booking modal"
            >
              <FiX className="w-5 h-5 text-gray-700" />
            </button>
            <iframe
              width="100%"
              height="100%"
              src="https://subashini-rareminds37.zohobookings.in/portal-embed#/rareminds"
              frameBorder="0"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default FinalCTA;
//