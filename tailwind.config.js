/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#1d8ad1',
          light: '#5378f1',
        },
        // Secondary colors  
        secondary: {
          DEFAULT: '#000000',
          red: '#e32a18',
        },
        // Neutral colors
        neutral: {
          gold: '#d4af37',
          light: '#edf2f9',
        },
        // Semantic color aliases
        success: '#10b981',
        warning: '#d4af37',
        danger: '#e32a18',
      },
    },
  },
  plugins: [],
};
