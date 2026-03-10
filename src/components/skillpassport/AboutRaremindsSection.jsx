import { motion } from 'framer-motion';
import { ShieldCheck, Users, Target } from 'lucide-react';
import { Sparkles } from '@/components/ui/sparkles';

export default function AboutRaremindsSection() {
  return (
    <section className="relative py-20 bg-white overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8">
            <img 
              src="/RareMinds.webp" 
              alt="Rareminds Logo" 
              className="h-12 md:h-16 mx-auto mb-6"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
            About Rareminds
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed px-4">
            Rareminds is a learning and transformation organization focused on building future-ready skills for students and professionals.
          </p>

          {/* Simple Flex List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-center gap-4 md:gap-8 lg:gap-12 text-gray-700 text-sm sm:text-base md:text-lg mt-12 md:mt-16 lg:mt-20 mb-12 md:mb-16"
          >
            <div className="flex items-start md:items-center gap-3 w-full md:w-auto">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 flex-shrink-0 mt-0.5 md:mt-0" />
              <span className="font-medium text-left">ISO 9001 & ISO 21001 Certified</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-300"></div>
            <div className="flex items-start md:items-center gap-3 w-full md:w-auto">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 flex-shrink-0 mt-0.5 md:mt-0" />
              <span className="font-medium text-left">Trusted by educational institutions and learners across India</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-300"></div>
            <div className="flex items-start md:items-center gap-3 w-full md:w-auto">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 flex-shrink-0 mt-0.5 md:mt-0" />
              <span className="font-medium text-left">Focused on applied learning, employability, and skill development</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Sparkles Background Effect - Positioned at Bottom */}
      <div className="absolute inset-0 top-2/3 pointer-events-none">
        <div className="relative h-full w-full overflow-hidden [mask-image:radial-gradient(50%_50%_at_center,white,transparent)]">
          <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_100%,#8350e8,transparent_70%)] before:opacity-40" />
          <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-gray-900/20 bg-white" />
          <Sparkles
            density={1200}
            className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%_at_center,white,transparent_85%)]"
            color="#8350e8"
          />
        </div>
      </div>
    </section>
  );
}
