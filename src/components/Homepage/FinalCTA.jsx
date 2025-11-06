import React, { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";

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
  useEffect(() => {
    // Load Calendly CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const openCalendly = () => {
    const url = 'https://calendly.com/d/cs8h-vpx-dwt/skillpassport_home';
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section
      className="relative grid place-content-center overflow-hidden px-4 py-10"
      style={{
        backgroundImage: 'url("/assets/HomePage/Make-Every-Skill-Count_1.png")',
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {/* Primary Button - Book a Corporate Demo */}
          <button
            onClick={openCalendly}
            className="group flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:bg-gray-100 sm:px-6 sm:py-3 sm:text-base"
            aria-label="Book a Corporate Demo"
          >
            Book a Corporate Demo
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary Button - Request Enterprise Access */}
          <button
            className="rounded-full border border-black bg-transparent px-4 py-2 text-sm font-bold text-gray-900 transition-all hover:bg-white/10 sm:border-2 sm:px-6 sm:py-3 sm:text-base"
          >
            Request Enterprise Access
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
