import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle, User, BookOpen } from 'lucide-react';
import { BackgroundRippleEffect } from '../../../components/digital-pp/ui/background-ripple-effect';
import { usePortfolio } from '../../../context/PortfolioContext';

const HomePage: React.FC = () => {
  const location = useLocation();
  const { setStudent } = usePortfolio();

  useEffect(() => {
    // Set the candidate data from navigation state into PortfolioContext
    if (location.state?.candidate) {
      setStudent(location.state.candidate);
    }
  }, [location.state, setStudent]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative py-12 px-6 min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/video-bg.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Centered Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6 border border-white/30"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">For the Digital Era</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl"
          >
            Here's Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Digital Passport
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto drop-shadow-lg"
          >
            Transform boring resumes into a{' '}
            <span className="font-semibold text-blue-300">digital profile</span> that guarantees{' '}
            <span className="font-semibold text-purple-300">first impressions</span> and{' '}
            <span className="font-semibold text-pink-300">interviews</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/portfolio"
                className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-purple-700 to-pink-700 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mode Selection Section */}
      <section className="relative py-16 px-6 bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
        {/* Transparent gradient overlay at the top to distinguish from hero section */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/30 via-black/10 to-transparent dark:from-black/50 dark:via-black/20 dark:to-transparent pointer-events-none z-[1]"></div>

        {/* Background Ripple Effect - Light mode version (soft blue/purple to match gradient) */}
        <div className="block dark:hidden absolute inset-0 pointer-events-auto">
          <BackgroundRippleEffect
            rows={8}
            cols={25}
            borderColor="rgba(99, 102, 241, 0.4)" // much stronger indigo border
            fillColor="rgba(147, 197, 253, 0.25)" // highly prominent blue fill (blue-300)
          />
        </div>

        {/* Background Ripple Effect - Dark mode version (indigo theme) */}
        <div className="hidden dark:block absolute inset-0 pointer-events-auto">
          <BackgroundRippleEffect
            rows={8}
            cols={25}
            borderColor="rgba(99, 102, 241, 0.25)" // stronger indigo border for dark
            fillColor="rgba(99, 102, 241, 0.08)" // indigo fill
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Presentation Mode
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Two powerful ways to showcase your professional journey. Pick the one that suits your style.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 px-8">
            {/* Portfolio Mode Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-3xl p-8 h-full border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-2xl animate-border-glow dark:animate-none">
                {/* Badge */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center space-x-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-full mb-6"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-semibold">Modern & Dynamic</span>
                </motion.div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Portfolio Mode
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                  Create a stunning, interactive portfolio with multiple customizable layouts.
                  Perfect for showcasing your work with modern animations, color themes, and professional designs.
                </p>

                {/* Features */}
                <motion.ul
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  className="space-y-3 mb-8"
                >
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">7 unique layout options (Modern, Creative, Split-Screen, AI Persona, etc.)</span>
                  </motion.li>
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Customizable color themes and animations</span>
                  </motion.li>
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Interactive project showcases and skill displays</span>
                  </motion.li>
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Responsive design for all devices</span>
                  </motion.li>
                </motion.ul>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex justify-center"
                >
                  <Link
                    to="/portfolio"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Explore Portfolio Mode
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                  </Link>
                </motion.div>

                {/* Decorative Element */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-200 dark:bg-indigo-800 rounded-full blur-2xl"
                />
              </div>
            </motion.div>

            {/* Passport Mode Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group relative"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-3xl p-8 h-full border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-2xl animate-border-glow dark:animate-none">
                {/* Badge */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center space-x-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-full mb-6"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-semibold">Unique & Professional</span>
                </motion.div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Passport Mode
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                  Present your credentials in a traditional passport format with page-flip animations.
                  A unique and memorable way to display your professional journey and achievements.
                </p>

                {/* Features */}
                <motion.ul
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  className="space-y-3 mb-8"
                >
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Authentic passport-style design with official look</span>
                  </motion.li>
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Smooth page-flip animations (desktop & mobile)</span>
                  </motion.li>
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Organized sections: Education, Skills, Projects, Certifications</span>
                  </motion.li>
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Touch-enabled navigation for mobile devices</span>
                  </motion.li>
                </motion.ul>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex justify-center"
                >
                  <Link
                    to="/passport"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Explore Passport Mode
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                  </Link>
                </motion.div>

                {/* Decorative Element */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-200 dark:bg-indigo-800 rounded-full blur-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;