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
    extend: { 
      animation: {
        // انیمیشن برای حرکت گرادینت پس‌زمینه
        'gradient-flow': 'gradient-flow 15s ease infinite',
        // انیمیشن برای درخشش و تپش عنصر مرکزی لودینگ
        'aurora-pulse': 'aurora-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // انیمیشن برای ظاهر شدن متن با حرکت به بالا
        'fade-in-up': 'fade-in-up 1s ease-out forwards',
        // انیمیشن برای ورود پیام در صفحه چت
        'message-in': 'message-in 0.5s ease-out forwards',
      },
      keyframes: {
        // کی‌فریم‌های حرکت گرادینت
        'gradient-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // کی‌فریم‌های درخشش و تپش
        'aurora-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.7',
            filter: 'blur(8px) brightness(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
            opacity: '1',
            filter: 'blur(12px) brightness(1.5)',
          },
        },
        // کی‌فریم‌های ظاهر شدن متن
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        // کی‌فریم‌های انیمیشن پیام
        'message-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
      },
    },
  },
  plugins: [plugin(function ({ addUtilities }) {
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

