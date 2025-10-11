import { Calendar, MapPin, Users, TrendingUp, Target, Lightbulb, Award, Clock, Sparkles, Zap, CheckCircle2, ArrowRight, Star, BookOpen } from 'lucide-react';
import { useState } from 'react';

const CaseHighlights = () => {
  const [activeTab, setActiveTab] = useState('naan-mudhalvan');
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
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black leading-tight">
            Case Studies
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transforming education and employability across institutions
          </p>
        </div>

        {/* Modern Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="relative inline-flex bg-gray-50 border-2 border-black rounded-full p-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Sliding Background Indicator */}
            <div 
              className={`absolute top-1.5 bottom-1.5 bg-black rounded-full transition-all duration-300 ease-in-out ${
                activeTab === 'naan-mudhalvan' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+6px)] w-[calc(50%-6px)]'
              }`}
            ></div>
            
            <button
              onClick={() => setActiveTab('naan-mudhalvan')}
              className={`relative z-10 px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'naan-mudhalvan'
                  ? 'text-amber-400'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              Naan Mudhalvan
            </button>
            <button
              onClick={() => setActiveTab('rcu')}
              className={`relative z-10 px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'rcu'
                  ? 'text-amber-400'
                  : 'text-black hover:text-gray-600'
              }`}
            >
              RCU Belagavi
            </button>
          </div>
        </div>

        {/* Naan Mudhalvan Case Study */}
        {activeTab === 'naan-mudhalvan' && (
          <div className="relative animate-fade-in">
            {/* Hero Card with Modern Shadow */}
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,215,0,0.3)] border-2 border-black mb-8 transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(255,215,0,0.4)] hover:-translate-y-1">
              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-full"></div>
              
              {/* Content */}
              <div className="relative px-8 py-12 md:px-12 md:py-16">
                {/* Title Section */}
                <div className="mb-8">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 text-sm font-bold mb-6">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Ongoing Since 2023</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                    Rareminds ×
                    <br />
                    <span className="text-amber-400">Naan Mudhalvan</span>
                  </h3>
                  <p className="text-xl md:text-2xl text-gray-300 font-medium">
                    Empowering 65,000+ Students Across Tamil Nadu
                  </p>
                </div>

                {/* Info Pills with Modern Design */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold text-sm">Statewide Tamil Nadu</span>
                  </div>
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold text-sm">45 Hrs/Semester</span>
                  </div>
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">9 Week Program</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid with Modern Card Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Stat Card 1 */}
              <div className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3">
                  65K+
                </div>
                <p className="text-black font-bold text-lg">Students Trained</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Since 2023</p>
              </div>

              {/* Stat Card 2 */}
              <div className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3">
                  45 Hrs
                </div>
                <p className="text-black font-bold text-lg">Per Semester</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">9 Weeks Program</p>
              </div>

              {/* Stat Card 3 */}
              <div className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3">
                  100%
                </div>
                <p className="text-black font-bold text-lg">Success Rate</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Active Program</p>
              </div>
            </div>

            {/* Framework & Domains with Modern Design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 4Cs Framework */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-amber-400 mr-3"></div>
                  <h4 className="text-xl font-black text-black">4Cs Framework</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Critical Thinking', 'Communication', 'Collaboration', 'Creativity'].map((skill, idx) => (
                    <div key={idx} className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-black hover:bg-amber-50 transition-colors duration-200">
                      <span className="text-sm font-bold text-black">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Domains */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-amber-400 mr-3"></div>
                  <h4 className="text-xl font-black text-black">Key Domains</h4>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {['Food Safety & Quality', 'EV & Battery Management', 'Sustainability', 'Medical Coding'].map((domain, idx) => (
                    <div key={idx} className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border-2 border-black hover:bg-amber-50 transition-colors duration-200">
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-sm font-black">{idx + 1}</span>
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
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-black text-black">The Challenge</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">
                  To equip Arts and Science students across Tamil Nadu with industry-aligned, future-ready skills 
                  that enhance employability. The challenge was to scale a consistent, engaging, and competency-based 
                  model that blends theory with application — reaching thousands of learners statewide.
                </p>
              </div>

              {/* Our Approach */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-black text-black">Our Approach</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm mb-4">
                  45 hours of structured training per semester, spread across 9 interactive weeks using the 4Cs Learning Model:
                </p>
                <ul className="space-y-2">
                  {[
                    'Critical Thinking: Case studies & analysis',
                    'Communication: Presentation & digital skills',
                    'Collaboration: Group projects & feedback',
                    'Creativity: Problem-solving & innovation'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Impact */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-black text-black">Impact</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    '65,000+ students upskilled with practical exposure',
                    'Improved confidence & job readiness',
                    'Stronger participation & placement rates'
                  ].map((impact, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
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
        {activeTab === 'rcu' && (
          <div className="relative animate-fade-in">
            {/* Hero Card with Modern Shadow */}
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,215,0,0.3)] border-2 border-black mb-8 transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(255,215,0,0.4)] hover:-translate-y-1">
              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-full"></div>
              
              <div className="relative px-8 py-12 md:px-12 md:py-16">
                <div className="mb-8">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 text-sm font-bold mb-6">
                    <Star className="w-4 h-4 fill-current" />
                    <span>September 2025</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                    RCU ×
                    <br />
                    <span className="text-amber-400">Rareminds</span>
                  </h3>
                  <p className="text-xl md:text-2xl text-gray-300 font-medium">
                    Future-Ready Skills & Leadership
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold text-sm">22–28 Sept 2025</span>
                  </div>
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold text-sm">Belagavi</span>
                  </div>
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">900 Students</span>
                  </div>
                  <div className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-semibold text-sm">Arts, Science, Commerce, Mgmt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid with Modern Card Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3">
                  6 Days
                </div>
                <p className="text-black font-bold text-lg">Immersive Training</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Activity-based</p>
              </div>

              <div className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3">
                  4.5/5
                </div>
                <p className="text-black font-bold text-lg">Feedback Rating</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Overall satisfaction</p>
              </div>

              <div className="group relative text-center p-8 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3">
                  82%
                </div>
                <p className="text-black font-bold text-lg">Attendance Rate</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Average participation</p>
              </div>
            </div>

            {/* Tangible Outputs */}
            <div className="mb-8">
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-amber-400 mr-3"></div>
                  <h4 className="text-xl font-black text-black">Tangible Outputs</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['SWOTs', 'Team Charters', 'Resume Updates', 'LinkedIn Drafts', 'SMART Action Plans'].map((output, idx) => (
                    <div key={idx} className="px-5 py-3 bg-gray-50 rounded-2xl border-2 border-black hover:bg-amber-50 transition-colors duration-200">
                      <span className="text-sm font-bold text-black">{output}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge, Approach, Impact with Enhanced Design */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* The Challenge */}
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
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
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
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
              <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
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
