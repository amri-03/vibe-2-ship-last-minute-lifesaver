/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F1EA',
        cardLinen: '#FAF8F5',
        ink: '#12131C',
        charcoal: '#5C5E6A',
        sage: '#6E826E',
        terracotta: '#D47053',
        horizon: '#668FA8',
        paperBorder: '#E5DFD3',
      },
      fontFamily: {
        lora: ['Lora', 'Georgia', 'serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
