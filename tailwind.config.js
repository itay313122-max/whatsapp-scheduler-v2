/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0a',
          surface: '#111111',
          surface2: '#1a1a1a',
          border: '#222222',
          amber: '#f59e0b',
          'amber-dim': '#b45309',
          green: '#22c55e',
          blue: '#3b82f6',
          red: '#ef4444',
          text: '#e2e8f0',
          muted: '#888888',
          faint: '#444444',
        },
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'Cascadia Code',
          'Fira Code',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
