import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdf8f0',
          100: '#faf0e0',
          200: '#f5e1c0',
          300: '#eecfa0',
          400: '#e5b870',
          500: '#d9a04a',
        },
        ink: {
          900: '#1a1208',
          800: '#2d2010',
          700: '#3d2e18',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'elephant-run': 'elephantRun 2s linear infinite',
        'mouse-run': 'mouseRun 1.5s linear infinite',
        'sand-fall': 'sandFall 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        elephantRun: {
          '0%': { transform: 'translateX(-20px)' },
          '50%': { transform: 'translateX(10px)' },
          '100%': { transform: 'translateX(-20px)' },
        },
        mouseRun: {
          '0%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(-30px)' },
          '100%': { transform: 'translateX(0px)' },
        },
        sandFall: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
