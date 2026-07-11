/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FBF6EE',
          100: '#F4ECE0',
          200: '#EBDFCB',
          300: '#D9CDB8',
        },
        ink: '#3a2e22',
        moss: '#2F4A3C',
        ochre: '#C8643A',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
