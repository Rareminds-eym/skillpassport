import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CoreFeatures = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      title: 'Skill Validation Engine',
      description: 'Authenticates skills via structured assessment data.',
      icon: (
        <svg
          className="w-8 h-8 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Digital Badging & Certificates',
      description: 'Tamper-proof and shareable proof of competence.',
      icon: (
        <svg
          className="w-8 h-8 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
    {
      title: 'Analytics Dashboard',
      description: 'Visualize training ROI and identify skill gaps.',
      icon: (
        <svg
          className="w-8 h-8 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      title: 'Competenc Mapping',
      description: 'Align internal frameworks with industry standards.',
      icon: (
        <svg
          className="w-8 h-8 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
    },
    {
      title: 'Enterprise APIs',
      description: 'Integrate and scale across locations and departments.',
      icon: (
        <svg
          className="w-8 h-8 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const cardsContainer = cardsContainerRef.current;

    if (!section || !cardsContainer) return;

    // Calculate optimal scroll distance based on viewport
    const getScrollAmount = () => {
      const containerWidth = cardsContainer.scrollWidth;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 640;
      const padding = isMobile ? 100 : 200;
      const actualScrollDistance = containerWidth - viewportWidth + padding;
      
      // Apply a reduction factor to minimize bottom gap
      // Mobile needs more aggressive reduction
      const reductionFactor = isMobile ? 0.5 : 0.6;
      return actualScrollDistance * reductionFactor;
    };

    // Create horizontal scroll animation
    const scrollTween = gsap.to(cardsContainer, {
      x: () => {
        const containerWidth = cardsContainer.scrollWidth;
        const viewportWidth = window.innerWidth;
        const padding = viewportWidth < 640 ? 100 : 200;
        return -(containerWidth - viewportWidth + padding);
      },
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => {
          const scrollAmount = getScrollAmount();
          return `+=${scrollAmount}`;
        },
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-white to-gray-50 overflow-hidden py-8 sm:py-12 lg:py-16 z-10"
    >
      <div className="flex flex-col">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
            Core Features
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-600">
            Comprehensive skill management ecosystem
          </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <div
            ref={cardsContainerRef}
            className="flex gap-4 sm:gap-6 lg:gap-8"
            style={{ 
              paddingLeft: 'calc(50vw - 140px)', // Center first card for mobile (280px/2 = 140px)
            }}
          >
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card flex-shrink-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl p-5 sm:p-6 lg:p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 group"
              style={{ width: '280px', maxWidth: '90vw' }}
            >
              {/* Icon */}
              <div className="mb-4 sm:mb-6 flex items-center justify-start">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center border border-gray-200 group-hover:border-blue-300 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                  <div className="scale-75 sm:scale-90 lg:scale-100">
                    {feature.icon}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreFeatures;
