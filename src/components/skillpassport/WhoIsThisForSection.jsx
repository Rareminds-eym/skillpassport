import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { GraduationCap, Briefcase, Target, BookOpen } from 'lucide-react';

export default function WhoIsThisForSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-24"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Who is This For?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Skill Passport is designed for students who are serious about their career
          </p>
          {/* Lottie Animation - Mobile Only */}
          <div className="lg:hidden mb-6 sm:mb-8 flex justify-center">
            <div className="w-40 h-40 sm:w-48 sm:h-48">
              <DotLottieReact
                src="https://lottie.host/8762c3c1-db94-4087-9ccc-46615033bf52/2wX4r7hVjN.lottie"
                loop
                autoplay
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Circular Orbit Layout */}
        <div className="relative max-w-5xl mx-auto">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 lg:hidden">
            {[
              { 
                icon: GraduationCap, 
                desc: 'Undergraduate & postgraduate students',
                color: 'from-blue-500 to-blue-600'
              },
              { 
                icon: Briefcase, 
                desc: 'Final-year students preparing for placements',
                color: 'from-blue-500 to-blue-600'
              },
              { 
                icon: Target, 
                desc: 'Students applying for internships or apprenticeships',
                color: 'from-blue-500 to-blue-600'
              },
              { 
                icon: BookOpen, 
                desc: 'Learners building skills beyond college curriculum',
                color: 'from-blue-500 to-blue-600'
              }
            ].map((persona, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex items-center gap-3 sm:gap-4 bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-lg"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${persona.color} rounded-full flex items-center justify-center flex-shrink-0 relative`}
                  style={{
                    boxShadow: '0 8px 30px rgba(59, 130, 246, 0.5), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 4px 8px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <persona.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white relative z-10" />
                </div>
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-bold text-gray-900">{persona.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Circular Orbit */}
          <div className="hidden lg:block relative h-[300px]">
            {/* Center Circle - Lottie Animation */}
            <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div style={{ width: '250px', height: '250px' }}>
                <DotLottieReact
                  src="https://lottie.host/8762c3c1-db94-4087-9ccc-46615033bf52/2wX4r7hVjN.lottie"
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Orbit Items */}
            {[
              { 
                icon: GraduationCap, 
                desc: 'Undergraduate & postgraduate students',
                color: 'from-blue-500 to-blue-600',
                position: 'top-[5%] right-[-5%]',
                textAlign: 'left',
                iconOrder: ''
              },
              { 
                icon: Briefcase, 
                desc: 'Final-year students preparing for placements',
                color: 'from-blue-500 to-blue-600',
                position: 'bottom-[15%] right-[8%]',
                textAlign: 'left',
                iconOrder: ''
              },
              { 
                icon: Target, 
                desc: 'Students applying for internships or apprenticeships',
                color: 'from-blue-500 to-blue-600',
                position: 'bottom-[15%] left-[8%]',
                textAlign: 'right',
                iconOrder: 'order-2'
              },
              { 
                icon: BookOpen, 
                desc: 'Learners building skills beyond college curriculum',
                color: 'from-blue-500 to-blue-600',
                position: 'top-[5%] left-[-5%]',
                textAlign: 'right',
                iconOrder: 'order-2'
              }
            ].map((persona, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`absolute ${persona.position} flex items-center gap-4`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon Circle */}
                  <div className={`w-24 h-24 bg-gradient-to-br ${persona.color} rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(59,130,246,0.5)] border-4 border-white relative ${persona.iconOrder}`}
                    style={{
                      boxShadow: '0 8px 30px rgba(59, 130, 246, 0.5), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 4px 8px rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <persona.icon className="w-10 h-10 text-white relative z-10" />
                  </div>
                  
                  {/* Info Text */}
                  <div className={`flex flex-col justify-center max-w-[220px] text-${persona.textAlign}`}>
                    <p className="text-base  text-gray-900  leading-tight">{persona.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
