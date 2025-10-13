import React, { useState } from "react";
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
      <style>{`
        @keyframes pulseBar {
          0%, 100% { transform: scaleY(var(--scale)) translateZ(0); }
          50% { transform: scaleY(calc(var(--scale) * 1.1)) translateZ(0); }
        }
      `}</style>
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
                background: 'linear-gradient(to top, #E32A18, transparent)',
                '--scale': height / 100,
                transformOrigin: 'bottom',
                animation: 'pulseBar 2s ease-in-out infinite alternate',
                animationDelay: `${index * 0.1}s`,
                outline: '1px solid rgba(0, 0, 0, 0)',
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const FinalCTA = () => {
  return (
    <section
      className="relative grid place-content-center overflow-hidden px-4 py-20"
      style={{
        background: 'rgb(0, 0, 0)'
      }}
    >
      <GradientBars />
      <div className="relative z-10 flex flex-col items-center">
        {/* Main Heading */}
        <h1 className="max-w-5xl text-center text-2xl font-bold leading-snug text-white sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight">
          Make Every Skill Count.
        </h1>
        
        {/* Subheading */}
        <p className="my-6 max-w-3xl text-center text-base leading-relaxed text-gray-200 sm:text-lg md:text-xl">
          Transform your workforce intelligence today with enterprise-grade skill validation
        </p>
        
        {/* CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {/* Primary Button - Book a Corporate Demo */}
          <button
            className="group flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:bg-gray-100 sm:px-6 sm:py-3 sm:text-base"
          >
            Book a Corporate Demo
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary Button - Request Enterprise Access */}
          <button
            className="rounded-full border border-white bg-transparent px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/10 sm:border-2 sm:px-6 sm:py-3 sm:text-base"
          >
            Request Enterprise Access
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
