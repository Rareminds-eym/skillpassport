import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Mail, Phone, ArrowRight } from 'lucide-react';

export default function NeedHelpSection() {
  return (
    <section className="py-8 md:py-12 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8 lg:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Need Some Help?
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6 md:gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left Column - Responsive Animation */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-end order-1"
          >
            <div className="w-full max-w-[260px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[500px]">
              <DotLottieReact
                src="https://lottie.host/3ae3ba03-21ac-4b70-90e3-f349c2360211/wRnTObzkdE.lottie"
                loop
                autoplay
                className="w-full h-auto"
              />
            </div>
          </motion.div>

          {/* Right Column - Compact Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-3 md:space-y-4 lg:space-y-5 order-2"
          >
            {/* Email Card */}
            <motion.a
              href="mailto:marketing@rareminds.in"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group block p-5 md:p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Email Support</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-2 md:mb-3 leading-relaxed">
                    Have questions? Send us an email and we'll get back to you within 24 hours.
                  </p>
                  <div className="flex items-center gap-1.5 text-blue-600 font-medium text-sm md:text-base group-hover:gap-2 transition-all">
                    <span className="break-all">marketing@rareminds.in</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </motion.a>

            {/* WhatsApp Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="block p-5 md:p-6 bg-white rounded-2xl border-2 border-gray-200"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 md:mb-2">WhatsApp Support</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-2 md:mb-3 leading-relaxed">
                    Get instant support via WhatsApp after completing your registration.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-green-50 text-green-700 rounded-lg text-xs md:text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Available after registration
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
