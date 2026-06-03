/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#050510',
        surface:  '#0a0a1a',
        surface2: '#0f0f25',
        border:   '#1a1a3e',
        accent:   '#6366f1',
        accent2:  '#22d3ee',
        success:  '#10b981',
        warning:  '#f59e0b',
        danger:   '#ef4444',
        muted:    '#64748b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      animation: {
        'slide-in':    'slideIn 0.25s ease-out',
        'fade-up':     'fadeUp 0.3s ease-out',
        'badge-pop':   'badgePop 0.4s ease-out',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn:   { '0%': { transform: 'translateX(16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        fadeUp:    { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        badgePop:  { '0%': { transform: 'scale(0.7)', opacity: '0' }, '60%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 8px rgba(99,102,241,0.3)' }, '50%': { boxShadow: '0 0 20px rgba(99,102,241,0.6)' } },
      },
    },
  },
  plugins: [],
}
