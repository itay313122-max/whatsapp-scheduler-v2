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
        bg: '#0A0A0F',
        surface: '#13131A',
        'surface-2': '#1C1C26',
        primary: '#6C3AE8',
        'primary-light': '#8B5CF6',
        accent: '#00F5A0',
        'text-primary': '#E8E8F0',
        'text-secondary': '#9090A8',
        border: '#2A2A3A',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #6C3AE8 0%, #4F46E5 100%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(108, 58, 232, 0.3)',
        'glow-accent': '0 0 20px rgba(0, 245, 160, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
