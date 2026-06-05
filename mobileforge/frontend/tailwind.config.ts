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
        bg: '#F8FAFF',
        surface: '#FFFFFF',
        'surface-2': '#EEF2FF',
        primary: '#6366F1',
        'primary-light': '#A5B4FC',
        accent: '#EC4899',
        'accent-sky': '#38BDF8',
        'text-primary': '#1E1B4B',
        'text-secondary': '#475569',
        'text-soft': '#94A3B8',
        border: '#E0E7FF',
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-heebo)', 'Heebo', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
        'gradient-bg': 'linear-gradient(135deg, #E0F2FE 0%, #FCE7F3 50%, #F3E8FF 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
      },
      boxShadow: {
        glow: '0 0 25px rgba(99, 102, 241, 0.35)',
        'glow-accent': '0 0 25px rgba(236, 72, 153, 0.35)',
        card: '0 4px 24px rgba(99, 102, 241, 0.08)',
        'card-hover': '0 20px 48px rgba(99, 102, 241, 0.18)',
        soft: '0 2px 12px rgba(99, 102, 241, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
