/** @type {import('tailwindcss').Config} */
module.exports = {
  safelist: [
    // Colori corso/ruolo per cerchi e cover (getProfileGradient)
    'from-gray-800', 'to-gray-900', 'via-gray-900', 'to-gray-950',
    'from-amber-500', 'to-amber-600', 'via-amber-600', 'to-amber-700',
    'from-violet-500', 'to-violet-700', 'via-violet-600',
    'from-emerald-500', 'to-emerald-700', 'via-emerald-600',
    'from-sky-500', 'to-sky-700', 'via-sky-600',
    'from-pink-500', 'to-pink-700', 'via-pink-600',
    'from-rose-500', 'to-rose-700', 'via-rose-600',
    'from-indigo-500', 'to-indigo-700', 'via-indigo-600',
    'from-teal-500', 'to-teal-700', 'via-teal-600',
    'from-purple-500', 'to-purple-700', 'via-purple-600',
  ],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './types/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: '#2563eb', // Blu principale - chiaro ma non pastello
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0284c7', // Blu più scuro per gradient
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          DEFAULT: '#475569', // Grigio/blu scuro per testi
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'scroll-horizontal': 'scrollHorizontal 30s linear infinite',
      },
      maxWidth: {
        '8xl': '96rem',   // 1536px - layout principale
        '9xl': '100rem',  // 1600px - pagine larghe (evita troppo wide)
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        scrollHorizontal: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
