import { motion } from 'framer-motion';
import { BadgeCheck, Clock, FastForward, Crown, Check } from 'lucide-react';

export default function WhatYouGetSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white relative">
      <div className="overflow-hidden px-4 sm:px-0">
        <style>{`
        .infographic-item {
          --p: 0;
          --sgn-p: calc(2 * var(--p) - 1);
          --offset-x: 100px;
          --offset-y: 12px;
          --angle: 5deg;
          --shadow-opacity: 0.5;
          
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          margin-bottom: calc(-1 * var(--offset-y));
          padding: 1.5rem 0;
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
        
        .infographic-item:first-child {
          background: linear-gradient(
            calc(var(--sgn-p) * 90deg),
            var(--c0) var(--offset-x),
            var(--c1)
          );
        }
        
        .infographic-item:nth-child(2n) {
          --p: 1;
          transform: translateX(30px);
        }
        
        .infographic-item:nth-child(2n+1) {
          transform: translateX(-30px);
        }
        
        .infographic-counter {
          grid-column: 2;
          grid-row: 1 / span 2;
          padding: 0 1.5rem;
          font-size: 4rem;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.1);
          text-align: center;
          align-self: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .infographic-icon {
          grid-row: 1 / span 2;
          padding: 0 1.5rem;
          color: #324265ff;
          display: flex;
          align-items: center;
          justify-center: center;
          align-self: center;
        }
        
        .infographic-icon svg {
          width: 5rem;
          height: 5rem;
        }
        
        .infographic-item[style*="--p: 0"] .infographic-icon {
          grid-column: 3;
        }
        
        .infographic-item[style*="--p: 1"] .infographic-icon {
          grid-column: 1;
        }
        
        .infographic-title {
          grid-row: 1;
          font-size: 1.875rem;
          font-weight: bold;
          text-transform: uppercase;
          color: #111827;
          padding: 0.25rem 12px;
          white-space: nowrap;
        }
        
        .infographic-text {
          grid-row: 2;
          font-size: 1.125rem;
          line-height: 1.75;
          color: #1f2937;
          padding: 0.25rem 12px;
        }
        
        .infographic-item[style*="--p: 0"] .infographic-title,
        .infographic-item[style*="--p: 0"] .infographic-text {
          grid-column: 1;
          text-align: left;
          padding-left: 2rem;
          padding-right: 100px;
        }
        
        .infographic-item[style*="--p: 1"] .infographic-title,
        .infographic-item[style*="--p: 1"] .infographic-text {
          grid-column: 3;
          text-align: right;
          padding-left: 100px;
          padding-right: 2rem;
        }
        
        /* Tablet Styles (768px - 1024px) */
        @media (max-width: 1024px) and (min-width: 768px) {
          .infographic-item {
            --offset-x: 70px;
            padding: 1.25rem 0;
          }
          
          .infographic-item:nth-child(2n) {
            transform: translateX(20px);
          }
          
          .infographic-item:nth-child(2n+1) {
            transform: translateX(-20px);
          }
          
          .infographic-counter {
            font-size: 3rem;
            padding: 0 8px;
          }
          
          .infographic-icon svg {
            width: 4rem;
            height: 4rem;
          }
          
          .infographic-title {
            font-size: 1.5rem;
            white-space: normal;
          }
          
          .infographic-text {
            font-size: 1rem;
          }
          
          .infographic-item[style*="--p: 0"] .infographic-title,
          .infographic-item[style*="--p: 0"] .infographic-text {
            padding-left: 1.5rem;
            padding-right: 70px;
          }
          
          .infographic-item[style*="--p: 1"] .infographic-title,
          .infographic-item[style*="--p: 1"] .infographic-text {
            padding-left: 70px;
            padding-right: 1.5rem;
          }
        }
        
        /* Mobile Styles (below 768px) */
        @media (max-width: 767px) {
          .infographic-item {
            --offset-x: 40px;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            margin-bottom: calc(-1 * var(--offset-y));
            padding: 1rem 1rem;
            gap: 0.75rem;
          }
          
          .infographic-item:nth-child(2n) {
            transform: translateX(10px);
          }
          
          .infographic-item:nth-child(2n+1) {
            transform: translateX(-10px);
          }
          
          .infographic-counter {
            display: none;
          }
          
          .infographic-icon {
            grid-column: 1;
            grid-row: 1 / span 2;
            padding: 0 1rem 0 0.5rem;
            align-self: flex-start;
            padding-top: 0.25rem;
          }
          
          .infographic-icon svg {
            width: 2.5rem;
            height: 2.5rem;
          }
          
          .infographic-title {
            grid-column: 2;
            grid-row: 1;
            font-size: 1.125rem;
            white-space: normal;
            text-align: left !important;
            padding: 0 1rem 0.25rem 0 !important;
            font-weight: 700;
          }
          
          .infographic-text {
            grid-column: 2;
            grid-row: 2;
            font-size: 0.875rem;
            text-align: left !important;
            padding: 0 1rem 0 0 !important;
            line-height: 1.5;
          }
        }
        
        /* Small Mobile (below 480px) */
        @media (max-width: 479px) {
          .infographic-item {
            --offset-x: 30px;
            padding: 0.875rem 0.75rem 0.875rem 3rem;
          }
          
          .infographic-item:nth-child(2n) {
            transform: translateX(8px);
          }
          
          .infographic-item:nth-child(2n+1) {
            transform: translateX(-8px);
          }
          
          .infographic-counter {
            font-size: 1.75rem;
            padding: 0 0.4rem;
          }
          
          .infographic-icon {
            padding: 0 0.75rem 0 0;
            margin-left: -2.25rem;
          }
          
          .infographic-icon svg {
            width: 2.25rem;
            height: 2.25rem;
          }
          
          .infographic-title {
            font-size: 1rem;
            padding: 0 0.75rem 0.25rem 0 !important;
          }
          
          .infographic-text {
            font-size: 0.8125rem;
            padding: 0 0.75rem 0 0 !important;
            line-height: 1.45;
          }
        }
      `}</style>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            What You Get After Pre-Registration
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Once you complete pre-registration, you will receive:
          </p>
        </motion.div>

        {/* Infographic Cards */}
        <div className="max-w-5xl mx-auto">
          {[
            {
              colors: ['#3B82F6', '#60A5FA'],
              Icon: BadgeCheck,
              title: 'Instant Confirmation',
              text: 'Receive immediate email confirmation with your registration details and next steps.'
            },
            {
              colors: ['#D1D5DB', '#E5E7EB'],
              Icon: Clock,
              title: 'Early Access',
              text: 'Get priority access to the Skill Passport platform before the public launch.'
            },
            {
              colors: ['#3B82F6', '#60A5FA'],
              Icon: FastForward,
              title: 'Priority Onboarding',
              text: 'Enjoy personalized onboarding support during the launch phase.'
            },
            {
              colors: ['#D1D5DB', '#E5E7EB'],
              Icon: Crown,
              title: 'Exclusive Benefits',
              text: 'Access special features and benefits available only to early users.'
            }
          ].map((item, idx) => {
            const isEven = idx % 2 === 1;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="infographic-item"
                style={{
                  '--c0': item.colors[0],
                  '--c1': item.colors[1],
                  '--p': isEven ? 1 : 0
                }}
              >
                <div className="infographic-counter">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                
                <div className="infographic-icon">
                  <item.Icon className="w-20 h-20" strokeWidth={1.5} />
                </div>
                
                <h3 className="infographic-title">
                  {item.title}
                </h3>
                
                <p className="infographic-text">
                  {item.text}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 sm:mt-16 md:mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl sm:rounded-3xl blur-xl opacity-20" />
          <div className="relative bg-gradient-to-r from-emerald-50 to-teal-50 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-2 border-emerald-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500 rounded-full mb-3 sm:mb-4">
              <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">
              No recurring charges. No hidden fees.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
              One-time payment of ₹250 for early access
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
