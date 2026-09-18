/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          indigo: '#4F46E5',
          'indigo-light': '#6366F1',
          'indigo-dark': '#4338CA',
        },
        background: {
          main: '#FAFAFA',
          sidebar: '#F4F4F5',
          card: '#FFFFFF',
        },
        text: {
          primary: '#333333',
          secondary: '#6B7280',
        }
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'soft-md': '0 4px 6px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}