import { ArrowUpRight, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const scrollToNextSection = () => {
    const nextSection = document.querySelector('#next-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const openBooking = () => {
    setShowBookingModal(true);
  };

  return (
    <section className="relative w-full">
      {/* Desktop Banner */}
      <img
        src="/banner-desktop6.jpg"
        alt="Rareminds Skill Passport Hero"
        className="hidden md:block w-full h-auto"
      />
      {/* Mobile Banner */}
      <img
        src="/banner-mobile3.jpg"
        alt="Rareminds Skill Passport Hero"
        className="block md:hidden w-full h-auto"
      />

      {/* Text & Buttons Overlay */}
      <div className="absolute inset-0 flex items-start pt-4 md:items-center md:pt-0">
        <div className="w-full md:w-auto px-6 sm:px-8 md:pl-16 lg:pl-24 md:ml-0">
          <div className="max-w-3xl md:max-w-xl text-left">
            {/* Welcome Text */}
            {/* <h2 className="text-black text-lg sm:text-xl md:text-3xl mb-2">Welcome To</h2> */}

            {/* Main Heading */}
            <h1 className="text-black  whitespace-nowrap font-black mb-2 sm:mb-4  text-[20px] sm:text-2xl md:text-4xl lg:text-6xl">
              {/* <span className="whitespace-nowrap mb-2">Hire Freshers, Freelancers</span><br />& Interns with Confidence */}
              Skill Passport Chronicles
            </h1>

            {/* Subheading */}
            {/* <p className="text-black font-medium mb-8 sm:mb-10 max-w-lg text-[14px] sm:text-lg md:text-xl leading-relaxed">
              Empower Candidates Verfied by Skill Passport
            </p> */}

            {/* CTA Buttons */}
            <div className="flex  mt-[80px] flex-row items-center gap-3 sm:gap-5 flex-wrap sm:flex-nowrap justify-start">
              {/* Book a Demo */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={openBooking}
                  className="h-9 sm:h-14 px-4 sm:px-8 rounded-full bg-[#e63b2e] text-white text-xs sm:text-base font-bold uppercase tracking-wide shadow-[0_6px_20px_rgba(230,59,46,0.4)] hover:brightness-110 transition-all whitespace-nowrap"
                >
                  BOOK A DEMO
                </button>
                {/* <button
                  onClick={openBooking}
                  aria-label="Open demo"
                  className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-[#e63b2e] text-white shadow-[0_6px_20px_rgba(230,59,46,0.4)] flex items-center justify-center hover:brightness-110 transition-all group-hover:-translate-x-1"
                >
                  <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-10deg]" style={{ strokeWidth: 2.5 }} />
                </button> */}
              </div>

              {/* Explore Dashboard */}
              {/* <div className="flex items-center gap-2 group">
                <button
                  onClick={() => navigate('/login/student')}
                  className="h-9 sm:h-14 px-4 sm:px-8 rounded-full bg-white text-black text-xs sm:text-base font-bold uppercase tracking-wide border-2 border-black hover:bg-gray-50 transition-all whitespace-nowrap"
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
              </div> */}
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

      {/* Zoho Bookings Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-lg w-[95vw] max-w-4xl h-[85vh] shadow-2xl">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-all"
              aria-label="Close booking modal"
            >
              <X className="w-5 h-5 text-gray-700" />
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

export default Hero;
