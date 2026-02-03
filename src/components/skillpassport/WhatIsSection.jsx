import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function WhatIsSection() {
  return (
    <section id="what-is-skill-passport" className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            What is Skill Passport?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">The Problem</h3>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                Most students have skills—but no credible way to prove them.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl text-white">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">The Solution</h3>
              <ul className="space-y-2 sm:space-y-3 text-base sm:text-lg">
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-1" />
                  <span>A single digital profile of your skills</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-1" />
                  <span>Verified learning and project credentials</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-1" />
                  <span>A structured way to show what you can do, not just what you studied</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 sm:mt-10 md:mt-12 text-center"
        >
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            This is your skill identity—designed for the real world.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
