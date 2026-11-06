/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fff5f7',
          100: '#ffe4ec',
          200: '#fecddc',
          300: '#fda4c0',
          400: '#fb719c',
          500: '#f43f7a',
          600: '#e11d62',
          700: '#be124e',
        },
        champagne: {
          50: '#fdfbf7',
          100: '#f9f4eb',
          200: '#f2e6d1',
          300: '#ebd7b5',
          400: '#dec08a',
          500: '#cfa861',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
