/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#E8711A',
        secondary: '#3A506B',
        success: '#2D8A4E',
        error: '#D32F2F',
        warning: '#F9A825',
        info: '#1976D2',
        'dark-bg': '#1C1C1E',
        'dark-surface': '#2C2C2E',
        'dark-elevated': '#3A3A3C',
        'dark-border': '#38383A',
      },
    },
  },
  plugins: [],
}
