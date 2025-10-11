import React from "react";
import { FiArrowRight } from "react-icons/fi";

const FinalCTA = () => {
  return (
    <section
      className="relative grid place-content-center overflow-hidden px-4 py-20"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 100%, #9d4edd 0%, #5a189a 25%, #240046 50%, #10002b 75%, #000000 100%)'
      }}
    >
      <div className="relative z-10 flex flex-col items-center">
        {/* Main Heading */}
        <h1 className="max-w-5xl text-center text-3xl font-bold leading-tight text-white sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight">
          Make Every Skill Count.
        </h1>
        
        {/* Subheading */}
        <p className="my-6 max-w-3xl text-center text-lg leading-relaxed text-gray-200 md:text-xl">
          Transform your workforce intelligence today with enterprise-grade skill validation
        </p>
        
        {/* CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {/* Primary Button - Book a Corporate Demo */}
          <button
            className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-black transition-all hover:bg-gray-100"
          >
            Book a Corporate Demo
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary Button - Request Enterprise Access */}
          <button
            className="rounded-full border-2 border-white bg-transparent px-6 py-3 text-base font-bold text-white transition-all hover:bg-white/10"
          >
            Request Enterprise Access
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
