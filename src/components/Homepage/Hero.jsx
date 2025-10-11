import { ArrowUpRight } from 'lucide-react';

const Hero = () => {
  return (
    <section
      className="flex items-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/HomePage/Hero-bg.jpg)' }}
    >
      <div className="w-full px-8 py-16 lg:px-20">
        <div className="max-w-7xl">
          {/* Main Heading */}
          <h1 className="text-black font-black mb-10 leading-tight text-hero">
            <span className="block">Verified Skills.</span>
            <span className="block">Visible Workforce.</span>
            <span className="relative inline-block">
              Measurable Impact.
              <span
                className="absolute inset-x-0 -z-10 rounded"
                style={{ bottom: '6px', height: '20px', backgroundColor: '#FFD700' }}
              />
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-black font-semibold mb-12 max-w-xl text-subhero leading-relaxed">
            The Rareminds Skill Passport gives enterprises a single source of truth for employee
            capabilities — turning training outcomes into real-time talent intelligence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Book a Demo group */}
            <div className="flex items-center gap-2">
              <button
                className="h-12 px-7 rounded-full bg-[#e63b2e] text-white text-sm md:text-base font-extrabold uppercase tracking-wide shadow-[0_4px_16px_rgba(230,59,46,0.3)] hover:brightness-110"
              >
                BOOK A DEMO
              </button>
              <button
                aria-label="Open demo"
                className="w-12 h-12 rounded-full bg-[#e63b2e] text-white shadow-[0_4px_16px_rgba(230,59,46,0.3)] flex items-center justify-center hover:brightness-110"
              >
                <ArrowUpRight className="w-5 h-5" style={{ strokeWidth: 2.5 }} />
              </button>
            </div>

            {/* Explore Dashboard group */}
            <div className="flex items-center gap-2">
              <button
                className="h-12 px-7 rounded-full bg-white text-black text-sm md:text-base font-extrabold uppercase tracking-wide border-2 border-black hover:bg-gray-50"
              >
                EXPLORE DASHBOARD
              </button>
              <button
                aria-label="Open dashboard"
                className="w-12 h-12 rounded-full bg-white text-black border-2 border-black flex items-center justify-center hover:bg-gray-50"
              >
                <ArrowUpRight className="w-5 h-5" style={{ strokeWidth: 2.5 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
