import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

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
    <div className="network-error-container">
      {/* Animated Background */}
      <div className="network-error-bg">
        <div className="grain-overlay" />
        <div className="radial-glow" />
      </div>

      {/* Content */}
      <div className="network-error-content">
        {/* Animated Network Illustration */}
        <div className="network-illustration">
          <svg viewBox="0 0 200 120" className="network-svg">
            {/* Node 1 */}
            <circle cx="40" cy="60" r="8" className="node node-1" />
            
            {/* Node 2 */}
            <circle cx="100" cy="30" r="8" className="node node-2" />
            
            {/* Node 3 */}
            <circle cx="160" cy="60" r="8" className="node node-3" />
            
            {/* Node 4 */}
            <circle cx="100" cy="90" r="8" className="node node-4" />
            
            {/* Connected Lines */}
            <line x1="40" y1="60" x2="100" y2="30" className="connection connection-solid" />
            <line x1="100" y1="30" x2="160" y2="60" className="connection connection-solid" />
            <line x1="40" y1="60" x2="100" y2="90" className="connection connection-solid" />
            
            {/* Broken Connection */}
            <line x1="100" y1="90" x2="160" y2="60" className="connection connection-broken" strokeDasharray="4 4" />
            
            {/* Pulsing Disconnect Icon */}
            <g className="disconnect-icon">
              <circle cx="130" cy="75" r="12" className="disconnect-bg" />
              <path d="M125 75 L135 75 M130 70 L130 80" stroke="#E8A838" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Text Content */}
        <div className="network-error-text">
          <h1 className="network-error-title">You're Offline</h1>
          <p className="network-error-subtitle">
            Your SkillPassport is safe. We just can't reach the network right now.
          </p>
          <p className="network-error-body">
            Check your internet connection and try again. Any progress you've made is saved locally and will sync when you're back online.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="network-error-actions">
          <button 
            onClick={handleRetry}
            disabled={isRetrying}
            className="btn-primary"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="btn-icon spinning" size={18} />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="btn-icon" size={18} />
                Try Again
              </>
            )}
          </button>
          
          <button 
            onClick={handleOfflineMode}
            className="btn-secondary"
          >
            <WifiOff className="btn-icon" size={18} />
            View Offline Skills
          </button>
        </div>

        {/* Footer */}
        <p className="network-error-footer">
          Need help? Visit <a href="https://rareminds.in" target="_blank" rel="noopener noreferrer">support.rareminds.com</a>
        </p>
      </div>
    </div>
  );
}
