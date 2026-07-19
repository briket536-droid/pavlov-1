/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js}'],
  theme: {
    screens: {
      xs: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        'bg-main': '#0F172A',
        'bg-alt': '#0B1224',
        gold: '#C5A059',
        'gold-hover': '#D6B26A',
        'text-primary': '#FFFFFF',
        'text-secondary': 'rgba(255,255,255,0.7)',
        border: 'rgba(255,255,255,0.1)',
        'dark-accent': '#94A3B8',
        'surface-container-low': '#1E293B',
        'surface-container-high': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        brand: '8px',
      },
    },
  },
  plugins: [],
};