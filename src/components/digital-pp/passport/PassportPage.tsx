import React from 'react';
import { motion } from 'framer-motion';

interface PassportPageProps {
  children: React.ReactNode;
  pageNumber: number;
  isActive: boolean;
  className?: string;
}

const PassportPage: React.FC<PassportPageProps> = ({
  children,
  pageNumber,
  isActive,
  className = '',
}) => {
  return (
    <motion.div
      className={`w-full h-full bg-cream-100 rounded-lg shadow-lg relative ${className}`}
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{
        opacity: isActive ? 1 : 0.7,
        rotateY: 0,
        scale: isActive ? 1 : 0.95,
      }}
      transition={{ duration: 0.6 }}
      style={{
        background: 'linear-gradient(135deg, #fefcf3 0%, #f8f6f0 100%)',
        border: '1px solid #e5e3df',
      }}
    >
      {/* Page Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Page Number */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-mono">
        {pageNumber.toString().padStart(2, '0')}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};

export default PassportPage;
