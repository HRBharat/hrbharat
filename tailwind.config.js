/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f766e", // Teal 700
        secondary: "#0284c7", // Sky 600
        background: "#f8fafc", // Slate 50
      }
    },
  },
  plugins: [],
}