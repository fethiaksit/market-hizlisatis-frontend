/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zeytin: {
          50: '#f2f8f3',
          100: '#e1f0e4',
          200: '#c5e2cb',
          300: '#9bccaa',
          400: '#6bb081',
          500: '#489461',
          600: '#35774c',
          700: '#2b5e3d',
          800: '#254b33',
          900: '#1f3e2b',
          950: '#0f2217',
        }
      },
      fontSize: {
        'pos-num': ['2rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'pos-total': ['2.75rem', { lineHeight: '3rem', fontWeight: '800' }],
      }
    },
  },
  plugins: [],
}
