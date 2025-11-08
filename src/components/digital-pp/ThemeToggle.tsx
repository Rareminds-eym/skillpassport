import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-dark-700 ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <input
        type="checkbox"
        id="switch"
        checked={theme === 'dark'}
        onChange={toggleTheme}
        className="hidden"
      />
      <div className="relative w-6 h-6">
        <Moon 
          className="moon-icon absolute inset-0 text-gray-600 transition-transform duration-500"
          style={{
            transform: theme === 'dark' ? 'rotate(360deg) scale(0)' : 'scale(1)',
            transitionDelay: theme === 'dark' ? '0ms' : '200ms'
          }}
        />
        <Sun 
          className="sun-icon absolute inset-0 text-yellow-500 transition-transform duration-500"
          style={{
            transform: theme === 'dark' ? 'scale(1) rotate(360deg)' : 'scale(0)',
            transitionDelay: theme === 'dark' ? '200ms' : '0ms'
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-3">
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;