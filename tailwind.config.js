/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#080B12',
          800: '#0E121C',
          700: '#151B27',
          600: '#1E2634',
          500: '#2A3444',
        },
        volt: {
          400: '#B8FF3C',
          500: '#A3F015',
          600: '#86C90D',
        },
        surge: {
          400: '#43E9FF',
          500: '#12CFEC',
        },
        ember: {
          400: '#FF7A45',
          500: '#F2571B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(163, 240, 21, 0.45)',
      },
    },
  },
  plugins: [],
}
