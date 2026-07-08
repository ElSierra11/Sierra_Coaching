/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gymDark: {
          950: 'var(--gym-dark-950)',
          900: 'var(--gym-dark-900)',
          800: 'var(--gym-dark-800)',
          700: 'var(--gym-dark-700)',
        },
        gymNeon: {
          DEFAULT: '#ff5722',
          500: '#f4511e',
          600: '#e64a19',
        }
      },
      fontFamily: {
        sports: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
