/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic color aliases used in the app (Overview, etc.)
        primary: colors.indigo,
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.rose,
      },
    },
  },
  plugins: [],
};
