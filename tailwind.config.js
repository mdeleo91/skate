/** @type {import('tailwindcss').Config} */
// SkateFit brand palette (Brand Style Guide v1.0):
//   Skate Teal #2DD4BF · Midnight #0F172A · Slate #1E293B · Gray #94A3B8
//   Semantic: success #22C55E · warning #F59E0B · error #EF4444 · info #3B82F6
// Token names (volt/surge/ember/ink) predate the rebrand; their values are
// the brand colors, which reskins the whole app without touching components.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0F172A', // Midnight — app background
          800: '#1E293B', // Slate — cards, panels
          700: '#293548', // inputs, tiles
          600: '#334155',
          500: '#475569',
        },
        volt: {
          // Skate Teal — primary accent
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        surge: {
          // Info blue — secondary accent (water, trend lines)
          400: '#60A5FA',
          500: '#3B82F6',
        },
        ember: {
          // Error red — alerts, destructive actions, over-budget
          400: '#F87171',
          500: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(45, 212, 191, 0.45)',
      },
    },
  },
  plugins: [],
}
