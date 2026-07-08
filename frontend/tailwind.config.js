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
          DEFAULT: '#FF5E3A',
          500: '#FF2A54',
          600: '#E03D1A',
        },
        gymCoral: {
          DEFAULT: '#FF2A54',
        }
      },
      fontFamily: {
        sports: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
