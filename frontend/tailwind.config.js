/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0a0a',
        surface: '#161616',
        surface2: '#1f1f1f',
        surface3: '#2a2a2a',
        accent: {
          DEFAULT: '#e50914',
          hover: '#f6121d',
          muted: '#5c0a10',
        },
        gold: {
          DEFAULT: '#d4af37',
          soft: '#f0d978',
          muted: '#4d3f17',
        },
        ink: {
          DEFAULT: '#ffffff',
          dim: '#b3b3b3',
          faint: '#6f6f6f',
        },
        line: '#2a2a2a',
      },
      fontFamily: {
        display: ['"Anton"', 'Impact', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.18em',
      },
      boxShadow: {
        glow: '0 0 40px rgba(229, 9, 20, 0.35)',
        goldGlow: '0 0 30px rgba(212, 175, 55, 0.25)',
      },
      backgroundImage: {
        'fade-bottom': 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.85) 18%, rgba(10,10,10,0) 60%)',
        'fade-right': 'linear-gradient(to left, #0a0a0a 0%, rgba(10,10,10,0) 35%)',
      },
    },
  },
  plugins: [],
};
