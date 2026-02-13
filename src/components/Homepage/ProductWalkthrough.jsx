import { useEffect, useRef, useState } from 'react';
import { Play, CheckCircle2, Sparkles, TrendingUp, Users, Award } from 'lucide-react';

const ProductWalkthrough = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          setShouldAutoplay(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const highlights = [
    {
      icon: <Award className="w-8 h-8" strokeWidth={2.5} />,
      title: "Digital Skill Cards",
      description: "Transform skills into verifiable credentials"
    },
    {
      icon: <TrendingUp className="w-8 h-8" strokeWidth={2.5} />,
      title: "Career Pathways",
      description: "Track progress from learning to employment"
    },
    {
      icon: <Users className="w-8 h-8" strokeWidth={2.5} />,
      title: "Connect with Opportunities",
      description: "Match with recruiters seeking your skills"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/30 to-white overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-100/40 to-yellow-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-100/40 to-yellow-100/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-full border-2 border-amber-200/50 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Product Walkthrough
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight">
            From Card to{' '}
            <span className="relative inline-block">
              Career
              <span
                className="absolute inset-x-0 -z-10 rounded"
                style={{ bottom: '4px', height: '16px', backgroundColor: '#FFD700' }}
              />
            </span>
          </h2>
        </div>

        {/* Video Container */}
        <div className="relative max-w-5xl mx-auto mb-0">
          {/* Decorative ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-3xl blur-2xl opacity-20 -z-10" />
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 ring-1 ring-gray-900/5">
            {/* 16:9 Aspect Ratio Container */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/E5WHb_lKgwg?autoplay=1&mute=1&loop=1&playlist=E5WHb_lKgwg&controls=1&rel=0&modestbranding=1&vq=hd1080"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 0 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductWalkthrough;
