/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mc: ['"Press Start 2P"', 'monospace'],
        vt: ['"VT323"', 'monospace'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        slate: {
          850: '#141b2d',
          900: '#0f172a',
          950: '#020617',
        },
        primary: '#6366f1',
        secondary: '#a855f7',
        accent: '#facc15',
      },
      animation: {
        'glow-pulse': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.8), 0 0 60px rgba(168, 85, 247, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
