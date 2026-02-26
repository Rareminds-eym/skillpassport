import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Wifi, Cloud, Signal } from 'lucide-react';

export default function NetworkError() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && isRetrying) {
      window.location.reload();
    }
  }, [isOnline, isRetrying]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsRetrying(false);
      }
    }, 1000);
  };

  const handleOfflineMode = () => {
    window.location.href = '/offline-skills';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Animated GIF */}
        <div className="mb-8 flex justify-center">
          <img 
            src="/assets/HomePage/404 error page with cat.gif" 
            alt="Network Error Animation"
            className="max-w-full h-auto"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-4">
          You're Offline
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-600 font-medium mb-3">
          Your SkillPassport is safe
        </p>

        {/* Description */}
        <p className="text-base text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
          We can't reach the network right now. Check your internet connection and try again. Your progress is saved locally and will sync when you're back online.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          {/* Primary Button */}
          <button 
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 group"
          >
            <RefreshCw 
              className={`w-5 h-5 transition-transform ${isRetrying ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} 
            />
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </button>

          {/* Secondary Button */}
          <button 
            onClick={handleOfflineMode}
            className="w-full sm:w-auto py-4 px-8 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            <WifiOff className="w-5 h-5" />
            <span>View Offline Skills</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm font-medium text-slate-600">
            {isOnline ? 'Connection restored' : 'No internet connection'}
          </span>
        </div>

        {/* Footer */}
        <p className="text-sm text-slate-500 mt-8">
          Need help? Visit{' '}
          <a 
            href="https://rareminds.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            rareminds.in
          </a>
        </p>
      </div>
    </div>
  );
}
