import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="text-center">
        {/* Logo Placeholder */}
        <div className="w-64 h-34 bg-white rounded-lg shadow-lg mx-auto mb-8 flex items-center justify-center">
        <img
            src="/RM-logo.png"
            alt="Company Logo"
            className="w-48 h-24 object-contain"
          />
        </div>

        
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Loading...</h2>
        <p className="mt-2 text-gray-600">Please wait while we prepare your hackathon environment</p>
      </div>
    </div>
  );
};

export default Loader;