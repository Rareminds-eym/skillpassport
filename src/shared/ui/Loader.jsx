import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Loader = () => {
  const location = useLocation();
  const isVideoPortfolio = location.pathname.includes('/digital-portfolio/video');

  // Don't render for video portfolio - let the page handle its own loading
  if (isVideoPortfolio) {
    return null;
  }

  // Default Loader for other pages
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;
