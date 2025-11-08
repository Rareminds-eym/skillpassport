/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
