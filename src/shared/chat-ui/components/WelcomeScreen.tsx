import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { WelcomeConfig, QuickActionChip } from '../types';

interface WelcomeScreenProps {
  config: WelcomeConfig;
  onQuickAction: (chip: QuickActionChip) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ config, onQuickAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-bold text-gray-900 mb-4"
        >
          {config.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto"
        >
          {config.subtitle}
        </motion.p>
      </div>

      {/* Quick Action Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {config.quickActions.map((action, index) => {
          const IconComponent = action.icon as any;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickAction(action)}
              className={`${action.gradient} rounded-2xl p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md group relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform bg-black/10">
                  {typeof IconComponent === 'function' ? (
                    <IconComponent className="w-6 h-6" />
                  ) : (
                    <span className="text-2xl">{action.icon}</span>
                  )}
                </div>
                <Plus className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-semibold text-base mb-1">{action.label}</h3>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500"
      >
        💡 Click a card above or type your question below to get started
      </motion.div>
    </motion.div>
  );
};
