import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Users, TrendingUp, ArrowRight, Check, Send, X } from 'lucide-react';
import SEOHead from './SEO/SEOHead';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Custom hook for scroll animations
const useScrollAnimation = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '', isVisible }: { end: number; duration?: number; suffix?: string; isVisible: boolean }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.floor(easeOutQuart * end);
        
        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isVisible, hasAnimated, end, duration]);

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return <span>{formatNumber(count)}{suffix}</span>;
};

// Data
const stats = [
  { number: '711,000+', numericValue: 711000, suffix: '+', label: 'Learners verified', highlight: false },
  { number: '510+', numericValue: 510, suffix: '+', label: 'Institutions connected', highlight: false },
  { number: '513+', numericValue: 513, suffix: '+', label: 'Enterprises hiring', highlight: false },
  { number: '85%', numericValue: 85, suffix: '%', label: 'Reduction in screening effort', highlight: true },
  { number: '7 days', numericValue: 7, suffix: ' days', label: 'Average time-to-hire', highlight: false },
  { number: '95%', numericValue: 95, suffix: '%', label: 'Retention rate', highlight: false },
];

const howItWorks = [
  {
    step: 1,
    title: 'Skill Development',
    description: 'Learners undergo structured learning, assessments, and applied projects through verified partner institutions and training ecosystems.',
  },
  {
    step: 2,
    title: 'Skill Verification',
    description: 'Competencies are validated using multi-point evidence—performance data, assessments, project outcomes, and institutional authentication.',
  },
  {
    step: 3,
    title: 'Digital Credential Issuance',
    description: 'Verified skills are issued as a secure, tamper-proof Skill Passport—portable, permanent, and employer-trusted.',
  },
  {
    step: 4,
    title: 'Talent Deployment',
    description: 'Employers access ready-to-deploy talent pools through dashboards and hiring workflows. Screening is minimized. Deployment accelerates.',
  },
];

function AboutRareMinds() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    user_type: 'learner',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imageRotation, setImageRotation] = useState({ rotateX: 0, rotateY: 0 });

  // Scroll animation refs
  const statsRef = useScrollAnimation();
  const whatWeDoRef = useScrollAnimation();
  const howItWorksRef = useScrollAnimation();
  const scaleRef = useScrollAnimation();
  const contactRef = useScrollAnimation();

  // Timeline animation refs for Why We Exist
  const timelineSectionRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);
  const timelineItem1Ref = useRef<HTMLDivElement>(null);
  const timelineItem2Ref = useRef<HTMLDivElement>(null);
  const timelineItem3Ref = useRef<HTMLDivElement>(null);

  // Chevron card refs for How It Works
  const chevronCard1Ref = useRef<HTMLDivElement>(null);
  const chevronCard2Ref = useRef<HTMLDivElement>(null);
  const chevronCard3Ref = useRef<HTMLDivElement>(null);
  const chevronCard4Ref = useRef<HTMLDivElement>(null);

  // Hero image ref for cursor interaction
  const heroImageRef = useRef<HTMLDivElement>(null);

  // GSAP Timeline Animations for Why We Exist
  useEffect(() => {
    const section = timelineSectionRef.current;
    const timelineLine = timelineLineRef.current;
    const items = [timelineItem1Ref.current, timelineItem2Ref.current, timelineItem3Ref.current];

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

    // Animate each timeline item
    items.forEach((item) => {
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

      // Problem card - fades in smoothly as you scroll
      gsap.to(problemCard, {
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

  // GSAP Chevron Card Animations for How It Works
  useEffect(() => {
    const cards = [chevronCard1Ref.current, chevronCard2Ref.current, chevronCard3Ref.current, chevronCard4Ref.current];

    cards.forEach((card, index) => {
      if (!card) return;

      const isEven = index % 2 === 1;
      const startX = isEven ? 100 : -100;

      // Set initial state
      gsap.set(card, { opacity: 0, x: startX });

      // Animate on scroll
      gsap.to(card, {
        opacity: 1,
        x: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
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

  // Hero Image Mouse Move Effect
  useEffect(() => {
    const imageContainer = heroImageRef.current;
    if (!imageContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = imageContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 degrees
      const rotateY = ((x - centerX) / centerX) * 10;  // Max 10 degrees
      
      setImageRotation({ rotateX, rotateY });
    };

    const handleMouseLeave = () => {
      setImageRotation({ rotateX: 0, rotateY: 0 });
    };

    imageContainer.addEventListener('mousemove', handleMouseMove);
    imageContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      imageContainer.removeEventListener('mousemove', handleMouseMove);
      imageContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({ name: '', email: '', organization: '', user_type: 'learner', message: '' });
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setImageRotation({ rotateX, rotateY });
  };

  const handleImageMouseLeave = () => {
    setImageRotation({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SEOHead
        title="About Skill Passport - India's Verified Talent Infrastructure"
        description="Skill Passport is India's national skill verification and talent deployment infrastructure—built to move hiring from assumption to assurance."
        keywords="skill passport, verified talent, skill verification, talent deployment, India, hiring infrastructure"
        url="https://skillpassport.rareminds.in/about"
      />

      {/* Grain Overlay */}
      <div className="grain-overlay"></div>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 fade-in-up">
              <div className="inline-block">
                <span className="text-sm text-slate-600 uppercase tracking-widest font-semibold">
                  India's Verified Talent Infrastructure
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900" data-testid="hero-title">
                Skill Passport
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-slate-600 md:whitespace-nowrap">
                Skills verified at source. Trusted by employers. Deployed at speed.
              </p>
              <p className="text-base leading-relaxed text-slate-600 max-w-xl">
                Built to move hiring from assumption to assurance. We ensure that skills are not just claimed, but proven, portable, and immediately deployable.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a 
                  href="/register" 
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold bg-[#E94235] text-white hover:bg-[#D93025] shadow-lg shadow-red-500/30 btn-hover-lift transition-all"
                  data-testid="hero-cta-button"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#how-it-works" 
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold border-2 border-slate-200 hover:border-slate-900 transition-colors"
                  data-testid="hero-learn-more-button"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative fade-in-up delay-200">
              <div 
                className="relative rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 ease-out"
                style={{
                  transform: `perspective(1000px) rotateX(${imageRotation.rotateX}deg) rotateY(${imageRotation.rotateY}deg)`,
                  transformStyle: 'preserve-3d'
                }}
                onMouseMove={handleImageMouseMove}
                onMouseLeave={handleImageMouseLeave}
              >
                <img 
                  src="https://images.unsplash.com/photo-1761624159464-686d31623aa7?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Abstract digital network sphere"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsRef.ref}
        className={`py-24 md:py-32 px-6 md:px-12 bg-white transition-all duration-1000 ${
          statsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} 
        data-testid="stats-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Skill Passport by the Numbers
            </h2>
            <p className="text-lg text-slate-600">These aren't projections. They're live outcomes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`stats-card-bg p-8 rounded-2xl relative overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                  stat.highlight ? 'bg-[#d4af37] text-black hover:bg-[#e0ba4a]' : 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D]'
                } ${
                  statsRef.isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                data-testid={`stat-card-${index}`}
              >
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-extrabold mb-2">
                    <AnimatedCounter 
                      end={stat.numericValue} 
                      suffix={stat.suffix}
                      isVisible={statsRef.isVisible}
                      duration={2000}
                    />
                  </div>
                  <div className={`text-base ${stat.highlight ? 'opacity-80' : 'opacity-90'}`}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist Section - Timeline Design */}
      <section 
        ref={timelineSectionRef}
        className="py-24 md:py-32 px-6 md:px-12 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden" 
        data-testid="why-section"
      >
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Why We Exist
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              The disconnect between talent and opportunity in India's hiring ecosystem
            </p>
          </div>

          {/* Timeline Container */}
          <div className="relative">
            {/* Central Timeline Line */}
            <div 
              ref={timelineLineRef}
              className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-[#d4af37] to-black transform -translate-x-1/2 hidden md:block" 
            />

            {/* Timeline Items */}
            <div className="space-y-16 md:space-y-20">
              {/* Item 1 - 10M Graduates */}
              <div ref={timelineItem1Ref} className="relative">
                <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  {/* Problem - Left */}
                  <div className="md:text-right">
                    <div className="problem-card inline-block md:float-right bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-2xl shadow-lg border-2 border-gray-300 max-w-md">
                      <div className="flex md:flex-row-reverse items-start gap-4 md:text-right">
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl font-bold">10M</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">The Challenge</p>
                          <p className="text-lg font-semibold text-gray-800">
                            Graduates Every Year
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            India produces over 10 million graduates annually, creating a massive talent pool
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <div className="timeline-node hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-[#d4af37] rounded-full items-center justify-center shadow-lg z-10">
                    <span className="text-slate-900 font-bold text-lg">1</span>
                  </div>

                  {/* Solution - Right */}
                  <div className="md:text-left">
                    <div className="solution-card inline-block bg-gradient-to-br from-black to-gray-900 p-8 rounded-2xl shadow-xl border-2 border-[#d4af37] max-w-md">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-[#d4af37] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-7 h-7 text-black" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#d4af37] uppercase tracking-wide mb-2">Skill Passport Solution</p>
                          <p className="text-lg font-semibold text-white">
                            Verified Skills at Source
                          </p>
                          <p className="text-sm text-gray-300 mt-2">
                            We validate competencies through real performance data and institutional authentication
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Arrow */}
                <div className="md:hidden flex justify-center my-6">
                  <ArrowRight className="w-8 h-8 text-[#d4af37] transform rotate-90" />
                </div>
              </div>

              {/* Item 2 - 45 Days to Hire */}
              <div ref={timelineItem2Ref} className="relative">
                <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  {/* Problem - Left */}
                  <div className="md:text-right">
                    <div className="problem-card inline-block md:float-right bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-2xl shadow-lg border-2 border-gray-300 max-w-md">
                      <div className="flex md:flex-row-reverse items-start gap-4 md:text-right">
                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl font-bold">45</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">The Problem</p>
                          <p className="text-lg font-semibold text-gray-800">
                            Days to Hire
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Employers spend an average of 45 days to hire a single candidate
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <div className="timeline-node hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-[#d4af37] rounded-full items-center justify-center shadow-lg z-10">
                    <span className="text-slate-900 font-bold text-lg">2</span>
                  </div>

                  {/* Solution - Right */}
                  <div className="md:text-left">
                    <div className="solution-card inline-block bg-gradient-to-br from-black to-gray-900 p-8 rounded-2xl shadow-xl border-2 border-[#d4af37] max-w-md">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-[#d4af37] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-7 h-7 text-black" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#d4af37] uppercase tracking-wide mb-2">Skill Passport Solution</p>
                          <p className="text-lg font-semibold text-white">
                            85% Faster Screening
                          </p>
                          <p className="text-sm text-gray-300 mt-2">
                            Pre-verified talent pools reduce screening time from weeks to days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Arrow */}
                <div className="md:hidden flex justify-center my-6">
                  <ArrowRight className="w-8 h-8 text-[#d4af37] transform rotate-90" />
                </div>
              </div>

              {/* Item 3 - Trust Gap */}
              <div ref={timelineItem3Ref} className="relative">
                <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  {/* Problem - Left */}
                  <div className="md:text-right">
                    <div className="problem-card inline-block md:float-right bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-2xl shadow-lg border-2 border-gray-300 max-w-md">
                      <div className="flex md:flex-row-reverse items-start gap-4 md:text-right">
                        <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <X className="w-7 h-7 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">The Result</p>
                          <p className="text-lg font-semibold text-gray-800">
                            The Problem is Proof
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Companies over-screen, candidates get overlooked, and deployment slows down
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <div className="timeline-node hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-black rounded-full items-center justify-center shadow-lg z-10">
                    <span className="text-slate-900 font-bold text-lg">3</span>
                  </div>

                  {/* Solution - Right */}
                  <div className="md:text-left">
                    <div className="solution-card inline-block bg-gradient-to-br from-black to-gray-900 p-8 rounded-2xl shadow-xl border-2 border-[#d4af37] max-w-md">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-[#d4af37] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-7 h-7 text-black" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#d4af37] uppercase tracking-wide mb-2">Skill Passport Solution</p>
                          <p className="text-lg font-semibold text-white">
                            Trusted Digital Credentials
                          </p>
                          <p className="text-sm text-gray-300 mt-2">
                            Secure, portable, and employer-trusted skill verification that closes the trust gap
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section 
        ref={whatWeDoRef.ref}
        className={`relative bg-white px-5 py-16 sm:py-20 transition-all duration-1000 ${
          whatWeDoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="font-bold text-black mb-4 text-center text-2xl sm:text-3xl md:text-4xl">
            What We Do
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-4xl mx-auto mb-12 text-center text-sm sm:text-base md:text-lg">
            Skill Passport validates and digitises competencies into a secure, portable credential—creating a pre-verified talent layer that reduces hiring friction across the ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-neutral-950 flex items-center justify-center mb-4">
                <Users className="text-yellow-500 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-black mb-4">For Learners</h3>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Skills verified through real performance, not self-claims</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>A single, lifelong Skill Passport trusted by employers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Faster access to internships, jobs, and career mobility</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-neutral-950 flex items-center justify-center mb-4">
                <CheckCircle className="text-yellow-500 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-black mb-4">For Institutions</h3>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Real-time visibility into student skill readiness</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Outcome-linked validation beyond marks and attendance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Stronger employer trust and placement outcomes</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-neutral-950 flex items-center justify-center mb-4">
                <TrendingUp className="text-yellow-500 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-black mb-4">For Employers</h3>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Access to pre-verified talent pools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Up to 85% reduction in screening time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Faster, more confident hiring decisions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Chevron Style from Register Page */}
      <section 
        ref={howItWorksRef.ref}
        id="how-it-works" 
        className={`py-24 md:py-32 px-6 md:px-12 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden transition-all duration-1000 ${
          howItWorksRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} 
        data-testid="how-it-works-section"
      >
        <style>{`
          .chevron-card {
            --p: 0;
            --sgn-p: calc(2 * var(--p) - 1);
            --offset-x: 100px;
            --offset-y: 12px;
            --angle: 5deg;
            --shadow-opacity: 0.5;
            
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            margin-bottom: calc(-1 * var(--offset-y));
            padding: 2rem 3rem;
            position: relative;
            
            background: 
              conic-gradient(
                from calc(var(--p) * var(--angle) * -1 + var(--sgn-p) * -90deg)
                at calc(var(--p) * 100% - var(--sgn-p) * var(--offset-x)) -3px,
                hsla(0, 0%, 0%, calc((1 - var(--p)) * var(--shadow-opacity))),
                hsla(0, 0%, 0%, calc(var(--p) * var(--shadow-opacity))) var(--angle),
                transparent 0%
              ),
              linear-gradient(
                calc(var(--sgn-p) * 90deg),
                var(--c0) var(--offset-x),
                var(--c1)
              );
            
            clip-path: polygon(
              calc(var(--p) * 100%) 50%,
              calc(var(--p) * 100% - var(--sgn-p) * var(--offset-x) * 0.5) 0,
              calc((1 - var(--p)) * 100% + var(--sgn-p) * var(--offset-x)) var(--offset-y),
              calc((1 - var(--p)) * 100% + var(--sgn-p) * var(--offset-x)) calc(100% - var(--offset-y)),
              calc(var(--p) * 100% - var(--sgn-p) * var(--offset-x) * 0.5) 100%
            );
          }
          
          .chevron-card:first-child {
            background: linear-gradient(
              calc(var(--sgn-p) * 90deg),
              var(--c0) var(--offset-x),
              var(--c1)
            );
          }
          
          .chevron-card:nth-child(2n) {
            --p: 1;
            transform: translateX(30px);
          }
          
          .chevron-card:nth-child(2n) .chevron-number {
            padding-left: 5.5rem;
          }
          
          .chevron-card:nth-child(2n+1) {
            transform: translateX(-30px);
          }
          
          .chevron-card:nth-child(2n+1) .chevron-content {
            padding-right: 4rem;
          }
          
          .chevron-number {
            font-size: 4rem;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.1);
            padding: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.1em;
            min-width: 120px;
          }
          
          .chevron-content {
            padding: 0 2.5rem;
          }
          
          @media (max-width: 768px) {
            .chevron-card {
              --offset-x: 40px;
              padding: 2rem 2.5rem;
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .chevron-card:nth-child(2n) {
              transform: translateX(0);
            }
            
            .chevron-card:nth-child(2n+1) {
              transform: translateX(0);
            }
            
            .chevron-card:nth-child(2n) .chevron-number {
              padding-left: 1.5rem;
            }
            
            .chevron-number {
              font-size: 2.5rem;
              padding: 0 1rem;
              justify-content: flex-start;
            }
            
            .chevron-content {
              padding: 0 1rem;
            }
          }
        `}</style>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              How Skill Passport Works
            </h2>
          </div>
          <div className="max-w-5xl mx-auto">
            {howItWorks.map((step, index) => {
              const isEven = index % 2 === 1;
              const colors = isEven 
                ? ['#D1D5DB', '#E5E7EB'] // Gray
                : ['#2D2D2D', '#3D3D3D']; // Black/Dark Gray
              
              const cardRefs = [chevronCard1Ref, chevronCard2Ref, chevronCard3Ref, chevronCard4Ref];
              
              return (
                <div 
                  key={index}
                  ref={cardRefs[index]}
                  className="chevron-card"
                  style={{
                    '--c0': colors[0],
                    '--c1': colors[1],
                    '--p': isEven ? 1 : 0,
                  } as React.CSSProperties}
                  data-testid={`step-${index}`}
                >
                  <div className="chevron-number" style={{ 
                    color: isEven ? 'rgba(0, 0, 0, 0.2)' : 'rgba(201, 169, 97, 0.4)',
                    paddingLeft: isEven ? '3.5rem' : '2rem'
                  }}>
                    {String(step.step).padStart(2, '0')}
                  </div>
                  <div className="chevron-content">
                    <h3 className={`text-2xl md:text-3xl font-bold tracking-tight mb-3 ${isEven ? 'text-slate-900' : 'text-[#c9a961]'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-base md:text-lg leading-relaxed ${isEven ? 'text-slate-700' : 'text-gray-200'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for Scale Section - Two Column Layout with Icon */}
      <section 
        ref={scaleRef.ref}
        className={`py-24 md:py-32 px-6 md:px-12 bg-white transition-all duration-1000 ${
          scaleRef.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`} 
        data-testid="scale-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Side - Visual Card */}
            <div className="flex justify-center lg:justify-end order-2 lg:order-1">
              <div className="w-full max-w-[420px] aspect-square bg-[#F5F5F0] rounded-3xl flex flex-col items-center justify-center p-12">
                <div className="w-28 h-28 mb-8 flex items-center justify-center">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-full h-full text-gray-400"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-gray-500 text-base font-medium tracking-wide">Verified Skills</p>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black leading-[1.1]">
                Built for Scale.<br />Designed for Trust.
              </h2>
              
              <p className="text-lg md:text-xl text-gray-700 font-normal leading-relaxed">
                Skill Passport is not a platform. It is infrastructure.
              </p>
              
              {/* Bullet Points */}
              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3 text-base md:text-lg text-gray-600 leading-relaxed">
                  <span className="text-gray-400 mt-1.5 flex-shrink-0">•</span>
                  <span>An ecosystem-layer that connects learners, institutions, and employers through one shared truth: verified skill data.</span>
                </li>
                
                <li className="flex items-start gap-3 text-base md:text-lg text-gray-600 leading-relaxed">
                  <span className="text-gray-400 mt-1.5 flex-shrink-0">•</span>
                  <span>As India moves from degrees to capability-led hiring, Skill Passport powers the transition—at national scale.</span>
                </li>
              </ul>
              
              <p className="text-2xl md:text-3xl font-bold text-[#c9a961] pt-6">
                From verified to deployed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        ref={contactRef.ref}
        id="contact" 
        className={`py-24 md:py-32 px-6 md:px-12 transition-all duration-1000 ${
          contactRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} 
        data-testid="contact-section"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-600">
              Ready to transform your talent verification and deployment process?
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-900 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-slate-900 transition-colors"
                  data-testid="contact-name-input"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-slate-900 transition-colors"
                  data-testid="contact-email-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="organization" className="block text-sm font-semibold text-slate-900 mb-2">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-slate-900 transition-colors"
                data-testid="contact-organization-input"
              />
            </div>
            <div>
              <label htmlFor="user_type" className="block text-sm font-semibold text-slate-900 mb-2">
                I am a *
              </label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-slate-900 transition-colors"
                data-testid="contact-user-type-select"
              >
                <option value="learner">Learner</option>
                <option value="institution">Institution</option>
                <option value="employer">Employer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-900 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-slate-900 transition-colors resize-none"
                data-testid="contact-message-textarea"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold bg-[#E94235] text-white hover:bg-[#D93025] disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 btn-hover-lift transition-all"
              data-testid="contact-submit-button"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
              {!isSubmitting && <Send className="w-5 h-5" />}
            </button>
            {submitSuccess && (
              <div className="text-center p-4 bg-green-50 text-green-800 rounded-lg" data-testid="contact-success-message">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

export default AboutRareMinds;
