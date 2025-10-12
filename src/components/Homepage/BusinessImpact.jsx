import { useEffect, useRef, useState } from 'react';

const AnimatedCounter = ({ end, duration = 1200, suffix = '' }) => {
  const [value, setValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setValue(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={ref}>{value}{suffix}</span>;
};

const BusinessImpact = () => {
  const stats = [
    { value: 40, suffix: '%', description: 'reduction in manual reporting time' },
    { value: 25, suffix: '%', description: 'faster internal mobility decisions' },
    { value: 30, suffix: '%', description: 'increase in training effectiveness tracking' },
  ];

  return (
    <section className="relative bg-black text-white px-5 py-14 sm:py-20 -mt-8 sm:-mt-12 md:-mt-16 z-0">
      <div className="mx-auto max-w-7xl text-center">
        {/* Heading */}
        <h2 className="font-bold mb-4 text-white text-2xl sm:text-3xl md:text-4xl">
          Business Impact
        </h2>

        {/* Subheading */}
        <p className="text-gray-300 mb-10 text-sm sm:text-base">
          Measurable results that matter to your bottom line
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 mb-10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-400 mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p className="italic text-gray-300 text-sm sm:text-base">
          Because what gets measured — gets mastered.
        </p>
      </div>
    </section>
  );
};

export default BusinessImpact;
