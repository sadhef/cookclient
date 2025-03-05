/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff4d4d',
          dark: '#cc3333',
          light: '#ffeded',
        },
        secondary: {
          DEFAULT: '#ff8080',
          dark: '#e56060',
          light: '#ffe0e0',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        heading: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}