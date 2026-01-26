import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const TimelineSection = () => {
  const sectionRef = useRef(null);
  const timelineLineRef = useRef(null);
  const item1Ref = useRef(null);
  const item2Ref = useRef(null);
  const item3Ref = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const timelineLine = timelineLineRef.current;
    const items = [item1Ref.current, item2Ref.current, item3Ref.current];

    if (!section || !timelineLine) return;

    // Set initial line state - hidden
    gsap.set(timelineLine, { scaleY: 0, transformOrigin: 'top' });

    // Animate timeline line fill progressively based on scroll
    gsap.to(timelineLine, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
      },
    });

    // Animate each timeline item - opacity increases smoothly as line approaches
    items.forEach((item, index) => {
      if (!item) return;

      const problemCard = item.querySelector('.problem-card');
      const solutionCard = item.querySelector('.solution-card');
      const node = item.querySelector('.timeline-node');

      // Set initial state - hidden
      gsap.set(problemCard, { opacity: 0, x: -100 });
      gsap.set(solutionCard, { opacity: 0, x: 100 });
      if (node) {
        gsap.set(node, { opacity: 0, scale: 0 });
      }

      // Problem card - fades in smoothly as you scroll (scrub with scroll)
      gsap.to(problemCard, {
        opacity: 1,
        x: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: item,
          start: 'top 80%', // Start fading in early
          end: 'top 50%', // Fully visible when line reaches it
          scrub: 1, // Smooth scrubbing tied to scroll position
        }
      });

      // Node - scales up smoothly as you scroll
      if (node) {
        gsap.to(node, {
          opacity: 1,
          scale: 1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
            end: 'top 50%',
            scrub: 1,
          }
        });
      }

      // Solution card - fades in smoothly as you scroll
      gsap.to(solutionCard, {
        opacity: 1,
        x: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: item,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1,
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Why Skill Passport Matters
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            The journey from invisible to unmissable
          </p>
        </motion.div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Central Timeline Line - Animated */}
          <div 
            ref={timelineLineRef}
            className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-purple-500 to-blue-500 transform -translate-x-1/2 hidden md:block"
            style={{ transformOrigin: 'top' }}
          />

          {/* Timeline Items */}
          <div className="space-y-12 sm:space-y-16 md:space-y-20">
            {/* Item 1 */}
            <div ref={item1Ref} className="relative">
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* Problem - Left */}
                <div className="md:text-right">
                  <div className="problem-card inline-block md:float-right bg-gradient-to-br from-gray-100 to-gray-200 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-gray-300 max-w-md"
                    style={{ filter: 'grayscale(20%)' }}>
                    <div className="flex md:flex-row-reverse items-start gap-4 md:text-right">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <X className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wide mb-2">Today's Problem</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                          Degrees are common
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="timeline-node hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-purple-400 rounded-full items-center justify-center shadow-lg z-10"
                  style={{ opacity: 0, transform: 'translate(-50%, -50%) scale(0)' }}>
                  <span className="text-purple-600 font-bold text-lg">1</span>
                </div>

                {/* Solution - Right */}
                <div className="md:text-left">
                  <div className="solution-card inline-block bg-gradient-to-br from-blue-500 to-indigo-600 p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-blue-400 max-w-md">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-blue-100 uppercase tracking-wide mb-2">Skill Passport Helps</p>
                        <p className="text-base sm:text-lg font-semibold text-white">
                          Demonstrate industry-relevant skills
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Arrow */}
              <div className="md:hidden flex justify-center my-6">
                <ArrowRight className="w-8 h-8 text-purple-400 transform rotate-90" />
              </div>
            </div>

            {/* Item 2 */}
            <div ref={item2Ref} className="relative">
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* Problem - Left */}
                <div className="md:text-right">
                  <div className="problem-card inline-block md:float-right bg-gradient-to-br from-gray-100 to-gray-200 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-gray-300 max-w-md"
                    style={{ filter: 'grayscale(20%)' }}>
                    <div className="flex md:flex-row-reverse items-start gap-4 md:text-right">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <X className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wide mb-2">Today's Problem</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                          Resumes look the same
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="timeline-node hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-purple-400 rounded-full items-center justify-center shadow-lg z-10">
                  <span className="text-purple-600 font-bold text-lg">2</span>
                </div>

                {/* Solution - Right */}
                <div className="md:text-left">
                  <div className="solution-card inline-block bg-gradient-to-br from-blue-500 to-indigo-600 p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-blue-400 max-w-md">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-blue-100 uppercase tracking-wide mb-2">Skill Passport Helps</p>
                        <p className="text-base sm:text-lg font-semibold text-white">
                          Organize learning, projects, and certifications in one place
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Arrow */}
              <div className="md:hidden flex justify-center my-6">
                <ArrowRight className="w-8 h-8 text-purple-400 transform rotate-90" />
              </div>
            </div>

            {/* Item 3 */}
            <div ref={item3Ref} className="relative">
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* Problem - Left */}
                <div className="md:text-right">
                  <div className="problem-card inline-block md:float-right bg-gradient-to-br from-gray-100 to-gray-200 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-gray-300 max-w-md"
                    style={{ filter: 'grayscale(20%)' }}>
                    <div className="flex md:flex-row-reverse items-start gap-4 md:text-right">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <X className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wide mb-2">Today's Problem</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                          Employers care about skills, not just scores
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="timeline-node hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-blue-400 rounded-full items-center justify-center shadow-lg z-10">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>

                {/* Solution - Right */}
                <div className="md:text-left">
                  <div className="solution-card inline-block bg-gradient-to-br from-blue-500 to-indigo-600 p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-blue-400 max-w-md">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-blue-100 uppercase tracking-wide mb-2">Skill Passport Helps</p>
                        <p className="text-base sm:text-lg font-semibold text-white">
                          Present yourself with clarity and confidence
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 sm:mt-20 text-center"
        >
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            This is not another course.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            This is how your skills are seen and recognized.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TimelineSection;
