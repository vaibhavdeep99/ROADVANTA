/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Road Patrol AI Design System
        'rp': {
          'bg': '#080D18',
          'bg-secondary': '#0B1220',
          'card': '#111827',
          'card-elevated': '#172235',
          'accent': '#22D3EE',
          'accent-hover': '#06B6D4',
          'accent-muted': '#164E63',
          'success': '#34D399',
          'success-muted': '#065F46',
          'warning': '#FBBF24',
          'warning-muted': '#78350F',
          'danger': '#FB7185',
          'danger-muted': '#9F1239',
          'text': '#F8FAFC',
          'text-secondary': '#94A3B8',
          'text-muted': '#64748B',
          'border': '#263449',
          'border-light': '#334155',
        },
      },
      fontFamily: {
        'heading': ['Space Grotesk', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(38, 52, 73, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(38, 52, 73, 0.3) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.3)',
        'glow-red': '0 0 15px rgba(251, 113, 133, 0.3)',
        'glow-green': '0 0 15px rgba(52, 211, 153, 0.3)',
      },
    },
  },
  plugins: [],
}
