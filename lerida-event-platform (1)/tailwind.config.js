/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",         // <-- added to include common src/ tree
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'primary': '#8c0033',
          'dark': '#75002b',
        },
        'lerida-light': '#f3f4f6',
        'lerida-text-primary': '#1f2937',
        'lerida-text-secondary': '#6b7280',
      },
    },
  },
  plugins: [],
};
