/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      colors: {
        // Semantic color aliases used in the app (Overview, etc.)
        primary: colors.indigo,
        secondary: {
          light: '#5378f1',
          DEFAULT: '#000000',
          red: '#e32a18',
        },
        // Neutral colors
        neutral: {
          gold: '#d4af37',
          light: '#edf2f9',
        },
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.rose,
      },
    },
  },
  plugins: [],
};
