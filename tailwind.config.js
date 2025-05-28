import  plugin from'tailwindcss/plugin';
/**
 @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [plugin(function ({ addUtilities, theme }) {
    addUtilities({
      '.rotate-y-180': {
        transform: 'rotateY(180deg)',
      },
      '.transform-style-3d': {
        transformStyle: 'preserve-3d',
      },
      '.backface-hidden': {
        backfaceVisibility: 'hidden',
      },
      '.perspective-1000': {
        perspective: '1000px',
      },
    });
  }),],
}

