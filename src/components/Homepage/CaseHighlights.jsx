import { Calendar, MapPin, Users, TrendingUp, Target, Lightbulb, Award, Clock, Sparkles, Zap, CheckCircle2, ArrowRight, Star, BookOpen, GitCompare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Animated Counter Component with Decimal Support
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef(null);
  const hasDecimal = end % 1 !== 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime;
          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;

            if (progress < 1) {
              const currentValue = end * progress;
              setCount(hasDecimal ? parseFloat(currentValue.toFixed(1)) : Math.floor(currentValue));
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated, hasDecimal]);

  return <span ref={counterRef}>{count}{suffix}</span>;
};

const CaseHighlights = () => {
  const [activeTab, setActiveTab] = useState('naan-mudhalvan');
  const [viewMode, setViewMode] = useState('individual'); // 'individual', 'comparison', 'timeline'
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section className="relative bg-white px-5 py-20 sm:py-32 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 border-2 border-gray-100 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 border-2 border-gray-100 rounded-full translate-x-1/2 translate-y-1/2"></div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section Header with Modern Design */}
        <div className="text-center mb-16">
          {/* Decorative line */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-px w-16 bg-black"></div>
            <span className="mx-4 text-xs font-bold tracking-widest text-gray-500 uppercase">Success Stories</span>
            <div className="h-px w-16 bg-black"></div>
          </div>

          <h2 className="font-bold mb-4 text-black leading-tight">
            Case Studies
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transforming Education And Employability Across Institutions
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 border-2 border-gray-300 rounded-full p-1">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-6 py-2 rounded-full font-semibold text-xs transition-all duration-300 ${viewMode === 'individual'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
                }`}
            >
              Individual View
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-6 py-2 rounded-full font-semibold text-xs transition-all duration-300 ${viewMode === 'comparison'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
                }`}
            >
              <GitCompare className="w-3 h-3 inline mr-1" />
              Compare
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-6 py-2 rounded-full font-semibold text-xs transition-all duration-300 ${viewMode === 'timeline'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
                }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Modern Tab Navigation (for Individual View) */}
        {viewMode === 'individual' && (
          <div className="flex justify-center mb-16">
            <div className="relative inline-flex bg-white border-2 border-black rounded-full p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Sliding Background Indicator */}
              <div
                className={`absolute top-1 bottom-1 bg-blue-600 rounded-full transition-all duration-300 ease-in-out ${activeTab === 'naan-mudhalvan' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+4px)] w-[calc(50%-4px)]'
                  }`}
              ></div>

              <button
                onClick={() => setActiveTab('naan-mudhalvan')}
                className={`relative z-10 px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'naan-mudhalvan'
                  ? 'text-white'
                  : 'text-black hover:text-gray-600'
                  }`}
              >
                Naan Mudhalvan
              </button>
              <button
                onClick={() => setActiveTab('rcu')}
                className={`relative z-10 px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'rcu'
                  ? 'text-white'
                  : 'text-black hover:text-gray-600'
                  }`}
              >
                RCU Belagavi
              </button>
            </div>
          </div>
        )}

        {/* Comparison Table View */}
        {viewMode === 'comparison' && (
          <div className="mb-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            <div className="bg-white rounded-3xl border-2 border-black  overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 bg-black/80 text-white">
                <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/20">
                  <h3 className="font-black text-base md:text-lg">Criteria</h3>
                </div>
                <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/20">
                  <h3 className="font-black text-base md:text-lg text-white">Naan Mudhalvan</h3>
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="font-black text-base md:text-lg text-white">RCU Belagavi</h3>
                </div>
              </div>

              {/* Table Rows */}
              {[
                { label: 'Students Reached', nm: '145,000+', rcu: '900' },
                { label: 'Duration', nm: '45 hrs/semester (9 weeks)', rcu: '6 days intensive' },
                { label: 'Location', nm: 'Statewide Tamil Nadu', rcu: 'Belagavi' },
                { label: 'Timeline', nm: 'Ongoing since 2023', rcu: 'Sept 22-28, 2025' },
                { label: 'Success Metric', nm: '100% program completion', rcu: '4.5/5 feedback, 82% attendance' },
                { label: 'Key Focus', nm: '4Cs Framework + Industry domains', rcu: 'Future-ready skills + Leadership' }
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-1 md:grid-cols-3 border-t-2 border-black hover:bg-gray-100 transition-colors ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  style={{
                    animation: `fadeIn 0.5s ease-out ${0.1 + idx * 0.1}s forwards`,
                    opacity: 0
                  }}
                >
                  <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r-2 border-black font-bold text-black text-sm md:text-base">{row.label}</div>
                  <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r-2 border-black text-gray-700 text-sm md:text-base">{row.nm}</div>
                  <div className="p-4 md:p-6 text-gray-700 text-sm md:text-base">{row.rcu}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="mb-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            {/* Timeline for both case studies */}
            <div className="space-y-16">
              {/* Naan Mudhalvan Timeline */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-black mb-8 flex items-center">
                  <div className="w-3 h-3 bg-amber-400 rounded-full mr-3"></div>
                  Naan Mudhalvan Journey
                </h3>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-1 bg-black"></div>

                  {/* Timeline Steps */}
                  <div className="space-y-8">
                    {[
                      { icon: Target, title: 'The Challenge', desc: 'Equip 145,000+ students across Tamil Nadu with industry-aligned, future-ready skills.' },
                      { icon: Lightbulb, title: 'Our Approach', desc: '45-hour structured training using 4Cs Learning Model over 9 weeks.' },
                      { icon: Award, title: 'Impact Achieved', desc: 'Improved confidence, job readiness, and stronger placement rates.' }
                    ].map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <div key={idx} className="relative flex items-start space-x-6 ml-0">
                          <div className="flex-shrink-0 w-16 h-16 bg-black/90 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Icon className="w-7 h-7 text-amber-400" />
                          </div>
                          <div className="flex-1 bg-white rounded-2xl p-6 border-2 border-black hover:-translate-y-1 transition-all duration-200">
                            <h4 className="font-black text-base sm:text-lg text-black mb-2">{step.title}</h4>
                            <p className="text-gray-700 text-xs sm:text-sm">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RCU Timeline */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-black mb-8 flex items-center">
                  <div className="w-3 h-3 bg-amber-400 rounded-full mr-3"></div>
                  RCU Belagavi Journey
                </h3>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-1 bg-black"></div>

                  {/* Timeline Steps */}
                  <div className="space-y-8">
                    {[
                      { icon: Target, title: 'The Challenge', desc: 'Equip 900 mixed-discipline students with confidence in public speaking, structured thinking, and job-search readiness.' },
                      { icon: Lightbulb, title: 'Our Approach', desc: '6-day intensive program blending 21st-century mindset, critical thinking, and career readiness.' },
                      { icon: Award, title: 'Impact Achieved', desc: 'Stronger stage confidence, clearer articulation, and career artifacts created in-session.' }
                    ].map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <div key={idx} className="relative flex items-start space-x-6 ml-0">
                          <div className="flex-shrink-0 w-16 h-16 bg-black rounded-full flex items-center justify-center z-10 border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Icon className="w-7 h-7 text-amber-400" />
                          </div>
                          <div className="flex-1 bg-white rounded-2xl p-6 border-2 border-black hover:-translate-y-1 transition-all duration-200">
                            <h4 className="font-black text-base sm:text-lg text-black mb-2">{step.title}</h4>
                            <p className="text-gray-700 text-xs sm:text-sm">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Case Studies */}
        {viewMode === 'individual' && activeTab === 'naan-mudhalvan' && (
          <div className="relative opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            {/* Hero Card with Background Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,215,0,0.3)] mb-8 transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(255,215,0,0.4)] hover:-translate-y-1">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(/casestudy/casestudynm.webp)'
                }}
              ></div>

              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-full"></div>

              {/* Content */}
              <div className="relative px-6 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16 z-10">
                {/* Title Section */}
                <div className="mb-8">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-full bg-amber-400/90 border border-amber-400 text-black text-pill font-bold mb-6 shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Ongoing Since 2023</span>
                  </div>
                  <h3 className="text-case-title font-black text-black mb-4 leading-tight drop-shadow-lg">
                    Rareminds ×
                    <br />
                    <span className="text-red-600">Naan Mudhalvan</span>
                  </h3>
                  <p className="text-case-subtitle text-gray-800 font-bold drop-shadow-md">
                    Empowering 145,000+ Students Across Tamil Nadu
                  </p>
                </div>

                {/* Info Pills with Modern Design */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold text-pill">Statewide Tamil Nadu</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold text-pill">45 Hrs/Semester</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-pill">9 Week Program</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid with Modern Card Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Stat Card 1 */}
              <div
                className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fadeIn 0.6s ease-out 0.1s forwards', opacity: 0 }}
              >
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-stat md:text-6xl font-black text-amber-400 mb-3">
                  <AnimatedCounter end={145} suffix="K+" />
                </div>
                <p className="text-black font-bold text-base sm:text-lg">Students Trained</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Since 2023</p>
              </div>

              {/* Stat Card 2 */}
              <div
                className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl  hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fadeIn 0.6s ease-out 0.2s forwards', opacity: 0 }}
              >
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-stat md:text-6xl font-black text-amber-400 mb-3">
                  <AnimatedCounter end={45} suffix=" Hrs" />
                </div>
                <p className="text-black font-bold text-base sm:text-lg">Per Semester</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">9 Weeks Program</p>
              </div>

              {/* Stat Card 3 */}
              <div
                className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl  hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fadeIn 0.6s ease-out 0.3s forwards', opacity: 0 }}
              >
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-stat md:text-6xl font-black text-amber-400 mb-3">
                  <AnimatedCounter end={100} suffix="%" />
                </div>
                <p className="text-black font-bold text-base sm:text-lg">Success Rate</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Active Program</p>
              </div>
            </div>

            {/* Framework & Domains with Modern Design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 4Cs Framework */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-8">
                  <div className="w-1 h-8 bg-amber-400 mr-3"></div>
                  <h4 className="text-xl font-black text-black">4Cs Framework</h4>
                </div>

                {/* Redesigned 4Cs Grid with Perfect Alignment */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Critical Thinking */}
                  <div className="group relative bg-gray-50 rounded-2xl border-2 border-black p-6 hover:bg-gray-100 hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-center justify-center h-16">
                      <span className="text-base font-black text-black text-center leading-tight">Critical Thinking</span>
                    </div>
                  </div>

                  {/* Communication */}
                  <div className="group relative bg-gray-50 rounded-2xl border-2 border-black p-6 hover:bg-gray-100 hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-center justify-center h-16">
                      <span className="text-base font-black text-black text-center leading-tight">Communication</span>
                    </div>
                  </div>

                  {/* Collaboration */}
                  <div className="group relative bg-gray-50 rounded-2xl border-2 border-black p-6 hover:bg-gray-100 hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-center justify-center h-16">
                      <span className="text-base font-black text-black text-center leading-tight">Collaboration</span>
                    </div>
                  </div>

                  {/* Creativity */}
                  <div className="group relative bg-gray-50 rounded-2xl border-2 border-black p-6 hover:bg-gray-100 hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-center justify-center h-16">
                      <span className="text-base font-black text-black text-center leading-tight">Creativity</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Domains */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-amber-400 mr-3"></div>
                  <h4 className="text-xl font-black text-black">Key Domains</h4>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {['Food Safety & Quality', 'EV & Battery Management', 'Sustainability', 'Medical Coding'].map((domain, idx) => (
                    <div key={idx} className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border-2 border-black hover:bg-gray-100 transition-colors duration-200">
                      <div className="w-7 h-7 rounded-full bg-black/80 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-black">{idx + 1}</span>
                      </div>
                      <span className="text-sm font-bold text-black">{domain}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge, Approach, Impact with Enhanced Design */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* The Challenge */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-black">The Challenge</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                  To equip Arts and Science students across Tamil Nadu with industry-aligned, future-ready skills
                  that enhance employability. The challenge was to scale a consistent, engaging, and competency-based
                  model that blends theory with application — reaching thousands of learners statewide.
                </p>
              </div>

              {/* Our Approach */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center mr-3">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-black">Our Approach</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm mb-4">
                  45 hours of structured training per semester, spread across 9 interactive weeks using the 4Cs Learning Model:
                </p>
                <ul className="space-y-2">
                  {[
                    'Critical Thinking: Case studies & analysis',
                    'Communication: Presentation & digital skills',
                    'Collaboration: Group projects & feedback',
                    'Creativity: Problem-solving & innovation'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Impact */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center mr-3">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-black">Impact</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    '145,000+ students upskilled with practical exposure',
                    'Improved confidence & job readiness',
                    'Stronger participation & placement rates'
                  ].map((impact, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700">
                      <span className="text-amber-400 font-bold text-lg">✓</span>
                      <span>{impact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* RCU Case Study */}
        {viewMode === 'individual' && activeTab === 'rcu' && (
          <div className="relative opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            {/* Hero Card with Background Image */}
            <div className="relative rounded-3xl overflow-hidden hover:-translate-y-1">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(/casestudy/casestudyrcu.webp)'
                }}
              ></div>

              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-full"></div>

              <div className="relative px-6 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16 z-10">
                <div className="mb-8">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-full bg-amber-400/90 border border-amber-400 text-black text-pill font-bold mb-6 shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span>September 2025</span>
                  </div>
                  <h3 className="text-case-title font-black text-black mb-4 leading-tight drop-shadow-lg">
                    RCU ×
                    <br />
                    <span className="text-red-600">Rareminds</span>
                  </h3>
                  <p className="text-case-subtitle text-gray-800 font-bold drop-shadow-md">
                    Future-Ready Skills & Leadership
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold text-pill">22–28 Sept 2025</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold text-pill">Belagavi</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-pill">900 Students</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-sm border border-black text-white hover:bg-black transition-colors shadow-lg">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-semibold text-pill">Arts, Science, Commerce, Mgmt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid with Modern Card Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fadeIn 0.6s ease-out 0.1s forwards', opacity: 0 }}
              >
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-stat md:text-6xl font-black text-amber-400 mb-3">
                  <AnimatedCounter end={6} suffix=" Days" />
                </div>
                <p className="text-black font-bold text-base sm:text-lg">Immersive Training</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Activity-based</p>
              </div>

              <div
                className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fadeIn 0.6s ease-out 0.2s forwards', opacity: 0 }}
              >
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-stat md:text-6xl font-black text-amber-400 mb-3">
                  <AnimatedCounter end={4.5} suffix="/5" />
                </div>
                <p className="text-black font-bold text-base sm:text-lg">Feedback Rating</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Overall satisfaction</p>
              </div>

              <div
                className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fadeIn 0.6s ease-out 0.3s forwards', opacity: 0 }}
              >
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-stat md:text-6xl font-black text-amber-400 mb-3">
                  <AnimatedCounter end={82} suffix="%" />
                </div>
                <p className="text-black font-bold text-base sm:text-lg">Attendance Rate</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Average participation</p>
              </div>
            </div>

            {/* Tangible Outputs */}
            <div className="mb-8">
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-amber-400 mr-3"></div>
                  <h4 className="text-xl font-black text-black">Tangible Outputs</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['SWOTs', 'Team Charters', 'Resume Updates', 'LinkedIn Drafts', 'SMART Action Plans'].map((output, idx) => (
                    <div key={idx} className="px-5 py-3 bg-gray-50 rounded-2xl border-2 border-black hover:bg-gray-100 transition-colors duration-200">
                      <span className="text-sm font-bold text-black">{output}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge, Approach, Impact with Enhanced Design */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* The Challenge */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black  hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-black text-black">The Challenge</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">
                  Equip a large, mixed-discipline cohort with practical future-ready skills—confidence in public
                  speaking, structured thinking, and job-search readiness—while keeping sessions engaging at scale.
                </p>
              </div>

              {/* Our Approach */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black  hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center mr-3">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-black text-black">Our Approach</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm mb-4">
                  Rareminds delivered a hands-on program blending:
                </p>
                <ul className="space-y-2">
                  {[
                    '21st-century mindset',
                    'Critical & creative thinking',
                    'Confident communication',
                    'Leadership & teamwork',
                    'Career readiness'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 text-xs mt-4 italic">
                  Bilingual (English/Kannada) and contextualized to North Karnataka opportunities.
                </p>
              </div>

              {/* Impact */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center mr-3">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-black text-black">Impact</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Stronger stage confidence',
                    'Clearer articulation of ideas',
                    'Better collaboration skills',
                    'Career artifacts created in-session',
                    'Mock interviews translated to practice'
                  ].map((impact, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="text-amber-400 font-bold text-lg">✓</span>
                      <span>{impact}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Future Focus:</p>
                  <p className="text-sm text-gray-600">Punctuality/time discipline</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default CaseHighlights;
