/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        prism: {
          bg: '#090D16',
          card: '#111827',
          cardElevated: '#1F2937',
          border: '#374151',
          emerald: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          rose: '#F43F5E',
          text: '#F9FAFB',
          textMuted: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
};
