/** @type {import('tailwindcss').Config} */
export default {
  safelist: [
    'animate-shake',
    'columns-2',
    'group',
    'bg-checkerboard',
    'bg-grid',
  ],
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./v/__common__/detail-preview.html",
    ".//**/*.{html,js,ts,jsx,tsx}",
    "./auth/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'right-light': '1px 0px 0px rgb(243, 244, 249)',
        'bottom-light': '0px 1px 0px rgb(243, 244, 249)',
        'top-light': '0px -1px 0px rgb(243, 244, 249)',
        'left-light': '-1px 0px 0px rgb(243, 244, 249)',
      },
      keyframes: {
        zoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.2)' },
        },
      },
      animation: {
        zoom: 'zoom 20s ease-in-out forwards',
        'spin-slow': 'spin 60s linear infinite',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['aria-selected'],
      textColor: ['aria-selected'],
      boxShadow: ['aria-selected'],
      scale: ['hover'],
      opacity: ['loaded'],
    },
  },
  plugins: [],
};
