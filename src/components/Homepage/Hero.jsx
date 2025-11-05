import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

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
      // Cleanup on unmount
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const scrollToNextSection = () => {
    const nextSection = document.querySelector('#next-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: scroll by viewport height
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/d/cs8h-vpx-dwt/skillpassport_home'
      });
    } else {
      // If script not loaded yet, open in new tab as fallback
      window.open('https://calendly.com/d/cs8h-vpx-dwt/skillpassport_home', '_blank');
    }
  };

  return (
    <section className="relative flex items-center min-h-screen">
      {/* Responsive background images */}
      <style>{`
        .hero-bg {
          background-image: url(/assets/HomePage/Mobile_banner.jpg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        @media (min-width: 768px) {
          .hero-bg {
            background-image: url(/assets/HomePage/Hero-bg.jpg);
          }
        }
      `}</style>
      <div className="hero-bg absolute inset-0 -z-10" />
      <div className="w-full px-6 sm:px-8 py-12 sm:py-16 lg:px-12 mt-5 sm:mt-0">
        <div className="max-w-3xl">
          {/* Main Heading */}
          <h1 className="text-black font-black mb-4 mt-20 sm:mb-8 leading-tight text-[25px] sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="block">Verified Skills.</span>
            <span className="block">Visible Workforce.</span>
            <span className="relative inline-block">
              Measurable Impact.
              <span
                className="absolute inset-x-0 -z-10 rounded"
                style={{ bottom: '4px', height: '16px', backgroundColor: '#FFD700' }}
              />
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-black font-medium mb-8 sm:mb-10 max-w-2xl text-[16px] sm:text-lg md:text-xl leading-relaxed">
            The Rareminds Skill Passport gives enterprises a single source of truth for employee
            capabilities — turning training outcomes into real-time talent intelligence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
            {/* Book a Demo group */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={openCalendly}
                className="h-9 sm:h-14 px-4 sm:px-8 rounded-full bg-[#e63b2e] text-white text-xs sm:text-base font-bold uppercase tracking-wide shadow-[0_6px_20px_rgba(230,59,46,0.4)] hover:brightness-110 transition-all"
              >
                BOOK A DEMO
              </button>
              <button
                onClick={openCalendly}
                aria-label="Open demo"
                className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-[#e63b2e] text-white shadow-[0_6px_20px_rgba(230,59,46,0.4)] flex items-center justify-center hover:brightness-110 transition-all group-hover:-translate-x-1"
              >
                <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-10deg]" style={{ strokeWidth: 2.5 }} />
              </button>
            </div>

            {/* Explore Dashboard group */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={() => navigate('/login/student')}
                className="h-9 sm:h-14 px-4 sm:px-8 rounded-full bg-white text-black text-xs sm:text-base font-bold uppercase tracking-wide border-2 border-black hover:bg-gray-50 transition-all"
              >
                EXPLORE DASHBOARD
              </button>
              <button
                onClick={() => navigate('/login/student')}
                aria-label="Open dashboard"
                className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-white text-black border-2 border-black flex items-center justify-center transition-all group-hover:-translate-x-1 group-hover:bg-black group-hover:text-white"
              >
                <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-10deg]" style={{ strokeWidth: 2.5 }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
        <button
          onClick={scrollToNextSection}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-black shadow-lg flex items-center justify-center hover:bg-gray-100 transition-all hover:scale-110"
          aria-label="Scroll to next section"
        >
          <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7 text-black" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
};

export default Hero;
